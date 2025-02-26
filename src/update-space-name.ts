import { Ipfs, type Op } from "@graphprotocol/grc-20";
import { createPublicClient, createWalletClient, http, Chain, parseGwei } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import 'dotenv/config';

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

async function updateSpaceName() {
  try {
    if (!process.env.PRIVATE_KEY) {
      throw new Error('PRIVATE_KEY not set in environment');
    }

    const account = privateKeyToAccount(process.env.PRIVATE_KEY as `0x${string}`);
    console.log('Using account:', account.address);

    // Create op to update the space name
    const ops: Op[] = [
      {
        type: "SET_TRIPLE",
        triple: {
          entity: process.env.SPACE_ID!,
          attribute: "6DTMg1CPEnP1THATPe7xDi", // Name attribute ID
          value: {
            type: "TEXT",
            value: "Building Permits"
          }
        }
      }
    ];

    // Publish edit to IPFS
    console.log('\n[IPFS] Publishing edit...');
    const cid = await Ipfs.publishEdit({
      name: 'Update Space Name',
      ops: ops,
      author: account.address
    });
    console.log('\n✅ [IPFS] Published edit:', { cid });

    // Get calldata for the edit
    console.log('\n[API] Getting calldata...');
    const result = await fetch(`https://api-testnet.grc-20.thegraph.com/space/${process.env.SPACE_ID}/edit/calldata`, {
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
      const gasLimit = 13_000_000n; // Same as publish.ts
      const baseGasPrice = parseGwei('0.01'); // Same as publish.ts

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
    if (error instanceof Error) {
      console.error('\n❌ [Error]:', {
        error: error.message,
        name: error.name,
        stack: error.stack,
        timestamp: new Date().toISOString()
      });
    }
    throw error;
  }
}

// Execute if running directly
if (import.meta.url === new URL(import.meta.url).href) {
  if (!process.env.SPACE_ID) {
    throw new Error('SPACE_ID not set in environment');
  }
  
  updateSpaceName().catch(error => {
    console.error('\n❌ [Error]:', error);
    process.exit(1);
  });
}
