import { createPublicClient, createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { sepolia } from 'viem/chains';
import dotenv from 'dotenv';

dotenv.config();

if (!process.env.RPC_URL) {
  console.error("No RPC URL configured. Set RPC_URL in .env file.");
  process.exit(1);
}

// Define GEO testnet chain
const geoTestnet = {
  ...sepolia,
  id: 0x1a99, // GEO testnet chain ID (6809)
  name: 'GEO Testnet',
  network: 'geo-testnet',
  rpcUrls: {
    default: { http: ['https://rpc-geo-test-zc16z3tcvf.t.conduit.xyz'] },
    public: { http: ['https://rpc-geo-test-zc16z3tcvf.t.conduit.xyz'] },
  },
};

if (!process.env.PRIVATE_KEY) {
  console.error("No wallet configured. Set PRIVATE_KEY in .env file.");
  process.exit(1);
}

const account = privateKeyToAccount(process.env.PRIVATE_KEY as `0x${string}`);
const transport = http('https://rpc-geo-test-zc16z3tcvf.t.conduit.xyz');

const publicClient = createPublicClient({
  chain: geoTestnet,
  transport
});

const walletClient = createWalletClient({
  account,
  chain: geoTestnet,
  transport
});

export const wallet = {
  account,
  publicClient,
  walletClient,
  async sendTransaction(tx: { to: `0x${string}`; value: bigint; data: `0x${string}` }) {
    console.log('Sending transaction:', tx);
    const hash = await walletClient.sendTransaction(tx);
    console.log('Transaction hash:', hash);
    return hash;
  }
};

// Execute if running directly
if (import.meta.url === new URL(import.meta.url).href) {
  console.log('Wallet configured successfully');
  console.log('Address:', account.address);
  
  // Get balance
  publicClient.getBalance({ address: account.address })
    .then(balance => {
      console.log('Balance:', balance);
      process.exit(0);
    })
    .catch(error => {
      console.error('Failed to get balance:', error);
      process.exit(1);
    });
}
