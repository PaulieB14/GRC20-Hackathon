import { Ipfs } from "@graphprotocol/grc-20";
import { createPublicClient, createWalletClient, http, Chain, parseGwei } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import 'dotenv/config';
import { createGovernanceAcceptEdit } from './governance.js';
import fs from 'fs';

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

interface GovernanceAcceptOptions {
  spaceId: string;
  cid: string;
  author?: string;
}

/**
 * Creates and publishes a governance accept edit
 * @param options Options for creating the governance accept edit
 * @returns The transaction hash
 */
export async function createAndPublishGovernanceAccept(options: GovernanceAcceptOptions) {
  const { spaceId, cid } = options;
  const author = options.author || process.env.WALLET_ADDRESS;
  
  if (!author) {
    throw new Error('Author not provided and WALLET_ADDRESS not set in environment');
  }
  if (!process.env.PRIVATE_KEY) {
    throw new Error('PRIVATE_KEY not set in environment');
  }

  console.log('\n[Governance] Creating governance accept edit...');
  
  // Create the governance accept edit JSON
  const editJson = await createGovernanceAcceptEdit(spaceId, cid, author);
  
  // Save to a temporary file
  const tempFilePath = 'governance-accept-temp.json';
  fs.writeFileSync(tempFilePath, editJson);
  
  try {
    // Publish edit to IPFS
    console.log('\n[IPFS] Publishing governance accept edit...');
    const governanceCid = await Ipfs.publishEdit({
      name: `Governance Accept Edit for ${cid}`,
      ops: JSON.parse(editJson).ops,
      author: author
    });
    console.log('\n✅ [IPFS] Published governance accept edit:', { governanceCid });

    // Get calldata using API
    console.log('\n[API] Getting calldata...');
    const result = await fetch(`https://api-testnet.grc-20.thegraph.com/space/${spaceId}/edit/calldata`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify({ cid: governanceCid, network: "TESTNET" }),
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
  } finally {
    // Clean up temporary file
    if (fs.existsSync(tempFilePath)) {
      fs.unlinkSync(tempFilePath);
    }
  }
}

// Execute if running directly
if (import.meta.url === new URL(import.meta.url).href) {
  console.log('[Startup] Starting governance accept edit creation...');
  
  if (!process.env.WALLET_ADDRESS) {
    throw new Error('WALLET_ADDRESS not set in environment');
  }
  if (!process.env.SPACE_ID) {
    throw new Error('SPACE_ID not set in environment');
  }
  
  // Get CID from command line arguments
  const cid = process.argv[2];
  if (!cid) {
    throw new Error('CID not provided. Usage: node create-governance-edit.js <CID>');
  }

  createAndPublishGovernanceAccept({
    spaceId: process.env.SPACE_ID,
    cid: cid,
    author: process.env.WALLET_ADDRESS
  }).catch(error => {
    console.error('\n❌ [Error]:', error);
    process.exit(1);
  });
}
