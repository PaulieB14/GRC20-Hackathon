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

async function submitGovernanceTx() {
  try {
    // Get transaction details from command line arguments
    const to = process.argv[2];
    const data = process.argv[3];
    
    if (!to || !data) {
      console.error('Usage: node dist/submit-governance-tx.js <to> <data>');
      process.exit(1);
    }
    
    if (!process.env.PRIVATE_KEY) {
      throw new Error('PRIVATE_KEY not set in environment');
    }
    
    if (!process.env.WALLET_ADDRESS) {
      throw new Error('WALLET_ADDRESS not set in environment');
    }
    
    console.log('Submitting governance transaction...');
    
    const account = privateKeyToAccount(process.env.PRIVATE_KEY as `0x${string}`);
    console.log('Using account:', account.address);
    console.log('To:', to);
    console.log('Data length:', data.length);
    
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
  } catch (error) {
    console.error('\n❌ [Error]:', error);
    process.exit(1);
  }
}

// Execute if running directly
if (import.meta.url === new URL(import.meta.url).href) {
  submitGovernanceTx().catch(error => {
    console.error('\n❌ [Error]:', error);
    process.exit(1);
  });
}
