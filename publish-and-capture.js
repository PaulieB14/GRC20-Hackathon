import { Ipfs } from "@graphprotocol/grc-20";
import { createPublicClient, createWalletClient, http, parseGwei } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import fs from 'fs';
import path from 'path';
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
  },
};

async function publishAndCapture() {
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

    const spaceId = process.env.PERMITS_SPACE_ID;
    
    // Import the transformPermits module
    console.log('\n[Transform] Getting ops from transformPermits...');
    const transformPermitsModule = await import('./dist-test/core/transformPermits.js');
    const ops = await transformPermitsModule.transformPermits();
    
    if (!ops) {
      throw new Error('Failed to transform permits to ops');
    }
    console.log('\n✅ [Transform] Got ops:', { count: ops.length });
    
    // Extract entity IDs directly from the ops
    console.log('\n[Extract] Extracting entity IDs from ops...');
    
    // We'll extract the permit entities directly from the transformation output
    // The transformPermits function logs the created permit entities
    const permitEntities = [];
    const recordTypeEntities = [];
    const statusEntities = [];
    
    // Find the permit type ID, record type type ID, and status type ID
    let permitTypeId = null;
    let recordTypeTypeId = null;
    let statusTypeId = null;
    
    for (const op of ops) {
      if (op.type === 'CREATE_TYPE') {
        if (op.name === 'Building permit') {
          permitTypeId = op.id;
        } else if (op.name === 'Record type') {
          recordTypeTypeId = op.id;
        } else if (op.name === 'Status') {
          statusTypeId = op.id;
        }
      }
    }
    
    console.log('Type IDs:', {
      permitTypeId,
      recordTypeTypeId,
      statusTypeId
    });
    
    // Now find all entities with these types
    for (const op of ops) {
      if (op.type === 'CREATE_ENTITY') {
        const entityId = op.id;
        const entityName = op.name;
        const entityTypes = op.types || [];
        
        if (permitTypeId && entityTypes.includes(permitTypeId)) {
          permitEntities.push({
            id: entityId,
            name: entityName
          });
        } else if (recordTypeTypeId && entityTypes.includes(recordTypeTypeId)) {
          recordTypeEntities.push({
            id: entityId,
            name: entityName
          });
        } else if (statusTypeId && entityTypes.includes(statusTypeId)) {
          statusEntities.push({
            id: entityId,
            name: entityName
          });
        }
      }
    }
    
    console.log('Found entities:', {
      permits: permitEntities.length,
      recordTypes: recordTypeEntities.length,
      statuses: statusEntities.length
    });
    
    // Save the entity IDs to a file
    const entityData = {
      permitEntities: permitEntities.map(e => e.id),
      recordTypeEntities: recordTypeEntities.map(e => e.id),
      statusEntities: statusEntities.map(e => e.id)
    };
    
    fs.writeFileSync('data/current-entity-ids.json', JSON.stringify(entityData, null, 2));
    console.log(`Saved ${permitEntities.length} permit entities, ${recordTypeEntities.length} record type entities, and ${statusEntities.length} status entities to data/current-entity-ids.json`);
    
    // Create a CSV file with entity IDs and URLs
    const csvHeader = 'Type,Name,Entity ID,URL';
    const csvRows = [];
    
    // Add permit entities
    for (const entity of permitEntities) {
      const url = `https://geogenesis-git-feat-testnet-geo-browser.vercel.app/space/${spaceId}/${entity.id}`;
      csvRows.push(`Permit,"${entity.name}",${entity.id},${url}`);
    }
    
    // Add record type entities
    for (const entity of recordTypeEntities) {
      const url = `https://geogenesis-git-feat-testnet-geo-browser.vercel.app/space/${spaceId}/${entity.id}`;
      csvRows.push(`Record Type,"${entity.name}",${entity.id},${url}`);
    }
    
    // Add status entities
    for (const entity of statusEntities) {
      const url = `https://geogenesis-git-feat-testnet-geo-browser.vercel.app/space/${spaceId}/${entity.id}`;
      csvRows.push(`Status,"${entity.name}",${entity.id},${url}`);
    }
    
    const csvContent = [csvHeader, ...csvRows].join('\n');
    fs.writeFileSync('current-entity-urls.csv', csvContent);
    console.log(`Generated current-entity-urls.csv with ${csvRows.length} entities`);
    
    // Publish edit to IPFS using Graph SDK
    console.log('\n[IPFS] Publishing edit...');
    const cid = await Ipfs.publishEdit({
      name: 'Add GRC20 Building Permits with Relations',
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
    
    // No need to query the API anymore, we already have the entity IDs

    return hash;
  } catch (error) {
    console.error('\n❌ [Error]:', error);
    throw error;
  }
}

// Execute if running directly
publishAndCapture().catch(error => {
  console.error('\n❌ [Error]:', error);
  process.exit(1);
});
