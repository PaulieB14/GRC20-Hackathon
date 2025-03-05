/**
 * Update Space Viem Script
 * 
 * This script updates an existing space using the viem library.
 * 
 * Usage:
 *   npx ts-node src/scripts/update-space-viem.ts [deeds|permits]
 */

import { Ipfs } from "@graphprotocol/grc-20";
import { createPublicClient, createWalletClient, http, Chain, parseGwei } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import 'dotenv/config';
import { type Op } from "@graphprotocol/grc-20";
import { SpaceIds } from '../config/constants.js';

const grc20Testnet = {
  id: 19411,
  name: 'Geogenesis Testnet',
  network: 'geogenesis-testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'ETH',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: { http: ['https://rpc-geo-test-zc16z3tcvf.t.conduit.xyz/'] },
    public: { http: ['https://rpc-geo-test-zc16z3tcvf.t.conduit.xyz/'] },
  }
} as const satisfies Chain;

interface PublishOptions {
  spaceId: string;
  editName?: string;
  author?: string;
  ops?: Op[];
}

/**
 * Create a simple test entity operation
 * 
 * @returns An array of operations
 */
function createTestOps(): Op[] {
  const timestamp = new Date().toISOString();
  return [
    {
      type: 'CREATE_ENTITY',
      id: `test-entity-${Date.now()}`,
      name: `Test Entity ${timestamp}`,
      types: ['test-type'],
    } as unknown as Op
  ];
}

/**
 * Publish operations to a space
 * 
 * @param options The publish options
 * @returns A promise that resolves to the transaction hash
 */
export async function publish(options: PublishOptions) {
  const { spaceId, editName = `Test Update ${new Date().toISOString()}` } = options;
  const author = options.author || process.env.WALLET_ADDRESS;
  const ops = options.ops || createTestOps();
  
  if (!author) {
    throw new Error('Author not provided and WALLET_ADDRESS not set in environment');
  }

  if (!process.env.PRIVATE_KEY) {
    throw new Error('PRIVATE_KEY not set in environment');
  }

  console.log(`\n[Publish] Publishing to space ${spaceId}...`);
  console.log(`[Publish] Edit name: ${editName}`);
  console.log(`[Publish] Author: ${author}`);
  console.log(`[Publish] Operations: ${ops.length}`);

  try {
    // Publish edit to IPFS using Graph SDK
    console.log('\n[IPFS] Publishing edit...');
    const cid = await Ipfs.publishEdit({
      name: editName,
      ops: ops,
      author: author
    });
    console.log('\n✅ [IPFS] Published edit:', { cid });

    // Get calldata using API
    console.log('\n[API] Getting calldata...');
    const result = await fetch(`https://api-testnet.grc-20.thegraph.com/space/${spaceId}/edit/calldata`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify({ 
        cid: cid,
        network: "TESTNET"
      }),
    });

    if (!result.ok) {
      const text = await result.text();
      throw new Error(`Failed to get calldata: ${result.statusText}\n${text}`);
    }

    let responseData;
    try {
      responseData = await result.json();
    } catch (error) {
      const text = await result.text();
      throw new Error(`Failed to parse JSON response: ${error}\n${text}`);
    }

    const { to, data } = responseData;

    if (!to || !data) {
      throw new Error(`Invalid response format: ${JSON.stringify(responseData)}`);
    }

    console.log('\n✅ [API] Got calldata:', {
      to,
      dataLength: data.length,
      timestamp: new Date().toISOString()
    });

    // Submit transaction
    console.log('\n[Transaction] Submitting to network...');
    try {
      const account = privateKeyToAccount(process.env.PRIVATE_KEY as `0x${string}`);
      
      const publicClient = createPublicClient({
        chain: grc20Testnet,
        transport: http()
      });

      const walletClient = createWalletClient({
        account,
        chain: grc20Testnet,
        transport: http()
      });

      // Get nonce
      console.log('\n[Transaction] Getting nonce...');
      const nonce = await publicClient.getTransactionCount({
        address: account.address
      });
      console.log('Nonce:', nonce);

      // Use gas settings from successful transaction
      const gasLimit = 13_000_000n; // Same as previous successful tx
      const baseGasPrice = parseGwei('0.01'); // Same as previous successful tx

      // Send transaction
      console.log('\n[Transaction] Sending transaction...');
      const hash = await walletClient.sendTransaction({
        chain: grc20Testnet,
        to: to as `0x${string}`,
        data: data as `0x${string}`,
        gas: gasLimit,
        maxFeePerGas: baseGasPrice,
        maxPriorityFeePerGas: baseGasPrice,
        nonce,
        value: 0n
      });
      console.log('\n✅ [Transaction] Submitted:', { hash });

      // Wait for confirmation
      console.log('\n[Transaction] Waiting for confirmation...');
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      console.log('\n✅ [Transaction] Confirmed:', receipt);

      return hash;
    } catch (txError) {
      console.error('\n❌ [Transaction] Failed:', txError);
      throw txError;
    }
  } catch (error) {
    console.error('\n❌ [Publish] Failed:', error);
    throw error;
  }
}

/**
 * Main function
 */
async function main() {
  try {
    console.log('[Startup] Starting...');
    
    if (!process.env.WALLET_ADDRESS) {
      throw new Error('WALLET_ADDRESS not set in environment');
    }

    // Get the space type from command line arguments
    const args = process.argv.slice(2);
    const spaceType = args[0] || 'deeds';
    
    let spaceId: string;
    if (spaceType === 'permits') {
      spaceId = process.env.PERMITS_SPACE_ID || SpaceIds.PERMITS;
      console.log(`Using PERMITS_SPACE_ID: ${spaceId}`);
    } else {
      spaceId = process.env.DEEDS_SPACE_ID || SpaceIds.DEEDS;
      console.log(`Using DEEDS_SPACE_ID: ${spaceId}`);
    }

    if (!spaceId) {
      throw new Error(`${spaceType.toUpperCase()}_SPACE_ID not set in environment`);
    }

    const hash = await publish({
      spaceId,
      author: process.env.WALLET_ADDRESS,
      editName: `Update ${spaceType} space ${new Date().toISOString()}`
    });

    console.log(`\n✅ [Success] Updated ${spaceType} space ${spaceId}`);
    console.log(`Transaction hash: ${hash}`);
    
    console.log('\nDone!');
  } catch (error) {
    console.error('\n❌ [Error]:', error);
    process.exit(1);
  }
}

// Execute if running directly
if (import.meta.url === new URL(import.meta.url).href) {
  main().catch(console.error);
}
