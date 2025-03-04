import { Ipfs, type Op } from '@graphprotocol/grc-20';
import { createPublicClient, createWalletClient, http, Chain, parseGwei } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import dotenv from 'dotenv';

dotenv.config();

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
 * Updates type names to use sentence case
 */
async function updateTypeNames(): Promise<void> {
  try {
    if (!process.env.WALLET_ADDRESS) {
      throw new Error('WALLET_ADDRESS not set in environment');
    }
    if (!process.env.PERMITS_SPACE_ID) {
      throw new Error('PERMITS_SPACE_ID not set in environment');
    }
    if (!process.env.PRIVATE_KEY) {
      throw new Error('PRIVATE_KEY not set in environment');
    }

    // Create operations to update type names
    const ops: Op[] = [];
    const { Graph } = await import('@graphprotocol/grc-20');
    
    // Create new types with correct sentence case names
    console.log('Creating new types with correct sentence case names...');
    
    // Create record type type with sentence case
    const { id: recordTypeTypeId, ops: recordTypeTypeOps } = Graph.createType({
      name: 'Record type',
      properties: [],
    });
    ops.push(...recordTypeTypeOps);
    
    // Create status type with sentence case
    const { id: statusTypeId, ops: statusTypeOps } = Graph.createType({
      name: 'Status',
      properties: [],
    });
    ops.push(...statusTypeOps);
    
    // Create record type relation type with sentence case
    const { id: recordTypeRelationTypeId, ops: recordTypeRelationTypeOps } = Graph.createType({
      name: 'Record type relation',
      properties: [],
    });
    ops.push(...recordTypeRelationTypeOps);
    
    // Create status relation type with sentence case
    const { id: statusRelationTypeId, ops: statusRelationTypeOps } = Graph.createType({
      name: 'Status relation',
      properties: [],
    });
    ops.push(...statusRelationTypeOps);
    
    console.log(`Generated ${ops.length} operations to update type names`);
    
    // Publish to IPFS
    const spaceId = process.env.PERMITS_SPACE_ID;
    const author = process.env.WALLET_ADDRESS;
    const editName = 'Update Type Names to Sentence Case';
    
    console.log('Publishing to IPFS...');
    const cid = await Ipfs.publishEdit({
      name: editName,
      ops,
      author,
    });
    console.log(`Published to IPFS with CID: ${cid}`);
    
    // Get calldata
    console.log('Getting calldata...');
    const result = await fetch(`https://api-testnet.grc-20.thegraph.com/space/${spaceId}/edit/calldata`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify({ 
        cid,
        network: "TESTNET"
      }),
    });
    
    if (!result.ok) {
      throw new Error(`Failed to get calldata: ${result.statusText}`);
    }
    
    const { to, data } = await result.json();
    
    if (!to || !data) {
      throw new Error(`Invalid response format: ${JSON.stringify(await result.json())}`);
    }
    
    console.log(`Got calldata: to=${to}, data length=${data.length}`);
    
    // Submit transaction
    console.log('Submitting transaction...');
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
    console.log('Getting nonce...');
    const nonce = await publicClient.getTransactionCount({
      address: account.address
    });
    console.log(`Using nonce: ${nonce}`);
    
    // Use gas settings from successful transaction
    const gasLimit = 13_000_000n;
    const baseGasPrice = parseGwei('0.01');
    
    // Send transaction
    console.log('Sending transaction...');
    const hash = await walletClient.sendTransaction({
      account,
      chain: grc20Testnet,
      to: to as `0x${string}`,
      data: data as `0x${string}`,
      gas: gasLimit,
      maxFeePerGas: baseGasPrice,
      maxPriorityFeePerGas: baseGasPrice,
      nonce,
      value: 0n
    });
    console.log(`Transaction submitted with hash: ${hash}`);
    
    // Wait for confirmation
    console.log('Waiting for confirmation...');
    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    console.log(`Transaction confirmed in block ${receipt.blockNumber}`);
    
    console.log('Type names updated successfully!');
  } catch (error) {
    console.error('Failed to update type names:', error);
    throw error;
  }
}

// Execute if running directly
if (import.meta.url === new URL(import.meta.url).href) {
  updateTypeNames().catch(error => {
    console.error('Failed to update type names:', error);
    process.exit(1);
  });
}
