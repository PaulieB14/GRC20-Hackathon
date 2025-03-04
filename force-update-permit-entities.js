// This script forces updates to the permit entities in GRC20 using the hard-coded permit entities
import { Ipfs } from "@graphprotocol/grc-20";
import { createPublicClient, createWalletClient, http, parseGwei } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

// Import the hard-coded permit entities
import { permitEntities } from './hard-coded-permit-entities.js';

// GRC20 Testnet configuration
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
  },
};

async function forceUpdatePermitEntities() {
  try {
    // Check for required environment variables
    if (!process.env.WALLET_ADDRESS) {
      throw new Error('WALLET_ADDRESS not set in environment');
    }
    if (!process.env.PERMITS_SPACE_ID) {
      throw new Error('PERMITS_SPACE_ID not set in environment');
    }
    if (!process.env.PRIVATE_KEY) {
      throw new Error('PRIVATE_KEY not set in environment');
    }

    const spaceId = process.env.PERMITS_SPACE_ID;
    
    // Read the permits-triples.json file to get the current triples
    const permitsTriples = JSON.parse(fs.readFileSync('data/permits-triples.json', 'utf-8'));
    
    // Create operations to update the entities
    const ops = [];
    
    // For each permit entity, create an operation to update its name
    for (const permitEntity of permitEntities) {
      const entityId = permitEntity.entityId;
      
      // Find the corresponding entity in the permits-triples.json file
      const entity = permitsTriples.find(e => e.entityId === entityId);
      
      if (entity) {
        // Create an operation to update the entity name
        ops.push({
          type: 'UPDATE_ENTITY',
          id: entityId,
          name: `${permitEntity.recordType} - ${permitEntity.recordNumber}`
        });
        
        console.log(`Will update entity ${entityId} name to "${permitEntity.recordType} - ${permitEntity.recordNumber}"`);
      } else {
        console.log(`Entity ${entityId} not found in permits-triples.json`);
      }
    }
    
    // Save the operations to a file for reference
    fs.writeFileSync('force-update-ops.json', JSON.stringify(ops, null, 2));
    console.log(`Generated ${ops.length} operations to force update permit entities`);
    
    // Publish the operations to IPFS
    console.log('\n[IPFS] Publishing edit...');
    const cid = await Ipfs.publishEdit({
      name: 'Force Update Permit Entities',
      ops: ops,
      author: process.env.WALLET_ADDRESS
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

    const { to, data } = await result.json();
    console.log('\n✅ [API] Got calldata:', {
      to,
      dataLength: data.length
    });

    // Save the calldata to a file for reference
    fs.writeFileSync('force-update-calldata.json', JSON.stringify({ to, data }, null, 2));

    // Submit transaction
    console.log('\n[Transaction] Submitting to network...');
    const account = privateKeyToAccount(process.env.PRIVATE_KEY);
    
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
    const gasLimit = 13_000_000n;
    const baseGasPrice = parseGwei('0.01');

    // Send transaction
    console.log('\n[Transaction] Sending transaction...');
    const hash = await walletClient.sendTransaction({
      account,
      chain: grc20Testnet,
      to: to,
      data: data,
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
    
    console.log('\nPermit entities force updated successfully!');
    
    return hash;
  } catch (error) {
    console.error('\n❌ [Error]:', error);
    throw error;
  }
}

// Execute if running directly
if (import.meta.url === `file://${process.argv[1]}`) {
  forceUpdatePermitEntities().catch(error => {
    console.error('\n❌ [Error]:', error);
    process.exit(1);
  });
}

export { forceUpdatePermitEntities };
