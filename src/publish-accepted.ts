import { createPublicClient, createWalletClient, http, Chain, parseGwei } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import 'dotenv/config';
import { getLatestAcceptedEdit } from './governance.js';

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
}

/**
 * Publishes the latest accepted edit to the blockchain
 * This function fetches the latest governance-accepted edit CID and publishes it
 */
export async function publish(options: PublishOptions) {
  const { spaceId, editName = 'Republish Accepted Edits' } = options;
  const author = options.author || process.env.WALLET_ADDRESS;
  
  if (!author) {
    throw new Error('Author not provided and WALLET_ADDRESS not set in environment');
  }
  if (!process.env.PRIVATE_KEY) {
    throw new Error('PRIVATE_KEY not set in environment');
  }

  // Fetch latest accepted edit
  console.log('\n[Fetch] Checking for latest accepted edit...');
  const cid = await getLatestAcceptedEdit(spaceId);
  if (!cid) {
    throw new Error('No accepted edit found to republish.');
  }
  
  // Get calldata using API
  console.log('\n[API] Getting calldata...');
  const result = await fetch(`https://api-testnet.grc-20.thegraph.com/space/${spaceId}/edit/calldata`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Accept": "application/json" },
    body: JSON.stringify({ cid: cid, network: "TESTNET" }),
  });

  if (!result.ok) {
    const text = await result.text();
    throw new Error(`Failed to get calldata: ${result.statusText}\n${text}`);
  }

  const responseData = await result.json();
  const { to, data } = responseData;

  if (!to || !data) {
    throw new Error(`Invalid response format: ${JSON.stringify(responseData)}`);
  }

  console.log('\n✅ [API] Got calldata:', { to, dataLength: data.length });

  // Submit transaction
  console.log('\n[Transaction] Submitting to network...');
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

  const nonce = await publicClient.getTransactionCount({ address: account.address });

  const gasLimit = 13_000_000n;
  const baseGasPrice = parseGwei('0.01');

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
}

// Execute if running directly
if (import.meta.url === new URL(import.meta.url).href) {
  console.log('[Startup] Starting publish-accepted...');
  
  if (!process.env.WALLET_ADDRESS) {
    throw new Error('WALLET_ADDRESS not set in environment');
  }
  if (!process.env.SPACE_ID) {
    throw new Error('SPACE_ID not set in environment');
  }

  publish({
    spaceId: process.env.SPACE_ID,
    author: process.env.WALLET_ADDRESS
  }).catch(error => {
    console.error('\n❌ [Error]:', error);
    process.exit(1);
  });
}
