import { Ipfs } from "@graphprotocol/grc-20";
import { createPublicClient, createWalletClient, http, Chain, parseGwei } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import 'dotenv/config';
import { type Op } from "@graphprotocol/grc-20";

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

/**
 * Publishes GRC20 deeds data to the knowledge graph
 */
export async function publishGRC20Deeds() {
  try {
    if (!process.env.WALLET_ADDRESS) {
      throw new Error('WALLET_ADDRESS not set in environment');
    }
    if (!process.env.SPACE_ID) {
      throw new Error('SPACE_ID not set in environment');
    }
    if (!process.env.PRIVATE_KEY) {
      throw new Error('PRIVATE_KEY not set in environment');
    }

    const spaceId = process.env.SPACE_ID;
    const author = process.env.WALLET_ADDRESS;
    const editName = 'Add GRC20 Property Deeds';

    // Import the transformGRC20Deeds module
    console.log('\n[Transform] Getting ops from transformGRC20Deeds...');
    const transformGRC20DeedsModule = await import('./transformGRC20Deeds.js');
    const ops = await transformGRC20DeedsModule.transformDeeds();
    
    if (!ops) {
      throw new Error('Failed to transform GRC20 deeds to ops');
    }
    console.log('\n✅ [Transform] Got ops:', { count: ops.length });

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
    console.error('\n❌ [Error]:', error);
    throw error;
  }
}

// Execute if running directly
if (import.meta.url === new URL(import.meta.url).href) {
  console.log('[Startup] Starting GRC20 deeds publication...');
  
  publishGRC20Deeds().catch(error => {
    console.error('\n❌ [Error]:', error);
    process.exit(1);
  });
}
