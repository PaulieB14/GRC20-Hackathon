import { Ipfs, Graph, Relation } from "@graphprotocol/grc-20";
import { createPublicClient, createWalletClient, http, parseGwei } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { parse } from "csv-parse/sync";
import fetch from 'node-fetch';

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

async function publishAndGenerateUrls() {
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
    
    // Read permits from CSV
    console.log('Reading permits from CSV...');
    const permits = readPermits();
    console.log(`Read ${permits.length} permits from CSV`);
    
    // Create operations for GRC20
    console.log('Creating operations...');
    const ops = createOperations(permits);
    console.log(`Created ${ops.length} operations`);
    
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
    
    // Extract entity IDs from the operations
    console.log('\n[Extract] Extracting entity IDs from operations...');
    const entityData = extractEntityIds(ops, permits);
    
    // Save entity IDs to file
    fs.writeFileSync('data/current-entity-ids.json', JSON.stringify(entityData, null, 2));
    console.log(`Saved entity IDs to data/current-entity-ids.json`);
    
    // Generate CSV files with URLs
    console.log('\n[Generate] Generating CSV files with URLs...');
    generateCsvFiles(entityData, spaceId, permits);
    
    console.log('\n✅ Process completed successfully!');
    console.log('Generated files:');
    console.log('- current-entity-urls.csv: All entities with their IDs and URLs');
    console.log('- current-permit-entities.csv: Full permit information with current entity IDs and URLs');
    console.log('- current-permit-entities-simple.csv: Simplified version with just addresses, entity IDs, and URLs');
    
    return hash;
  } catch (error) {
    console.error('\n❌ [Error]:', error);
    throw error;
  }
}

function readPermits() {
  try {
    const csvData = fs.readFileSync('data/permits.csv', 'utf-8');
    
    const records = parse(csvData, {
      columns: true,
      skip_empty_lines: true,
    });

    return records.map((record) => ({
      recordNumber: record['Record Number'],
      description: record['Description'],
      recordType: record['Record Type'],
      address: record['Address'],
      projectName: record['Project Name'],
      status: record['Status'],
    }));
  } catch (error) {
    console.error('Failed to read permits:', error);
    throw error;
  }
}

function createOperations(permits) {
  const ops = [];
  
  // Create properties for permit fields
  const { id: recordNumberPropertyId, ops: recordNumberOps } = Graph.createProperty({
    type: 'TEXT',
    name: 'Record number'
  });
  ops.push(...recordNumberOps);

  const { id: descriptionPropertyId, ops: descriptionOps } = Graph.createProperty({
    type: 'TEXT',
    name: 'Description'
  });
  ops.push(...descriptionOps);

  const { id: addressPropertyId, ops: addressOps } = Graph.createProperty({
    type: 'TEXT',
    name: 'Address'
  });
  ops.push(...addressOps);

  const { id: projectNamePropertyId, ops: projectNameOps } = Graph.createProperty({
    type: 'TEXT',
    name: 'Project name'
  });
  ops.push(...projectNameOps);

  // Create entity types
  const { id: permitTypeId, ops: permitTypeOps } = Graph.createType({
    name: 'Building permit',
    properties: [
      recordNumberPropertyId,
      descriptionPropertyId,
      addressPropertyId,
      projectNamePropertyId
    ]
  });
  ops.push(...permitTypeOps);

  // Create record type entity type
  const { id: recordTypeTypeId, ops: recordTypeTypeOps } = Graph.createType({
    name: 'Record type',
    properties: []
  });
  ops.push(...recordTypeTypeOps);

  // Create status entity type
  const { id: statusTypeId, ops: statusTypeOps } = Graph.createType({
    name: 'Status',
    properties: []
  });
  ops.push(...statusTypeOps);

  // Create relation types
  const { id: hasRecordTypeRelationTypeId, ops: hasRecordTypeRelationTypeOps } = Graph.createType({
    name: 'Record type relation',
    properties: []
  });
  ops.push(...hasRecordTypeRelationTypeOps);

  const { id: hasStatusRelationTypeId, ops: hasStatusRelationTypeOps } = Graph.createType({
    name: 'Status relation',
    properties: []
  });
  ops.push(...hasStatusRelationTypeOps);

  // Create record type entities
  console.log('Creating record type entities...');
  const recordTypeMap = new Map();
  const uniqueRecordTypes = [...new Set(permits.map(p => p.recordType))];
  for (const recordType of uniqueRecordTypes) {
    if (!recordType) continue;
    
    const { id: recordTypeEntityId, ops: recordTypeEntityOps } = Graph.createEntity({
      name: recordType,
      types: [recordTypeTypeId],
      properties: {},
    });
    ops.push(...recordTypeEntityOps);
    recordTypeMap.set(recordType, recordTypeEntityId);
  }

  // Create status entities
  console.log('Creating status entities...');
  const statusMap = new Map();
  const uniqueStatuses = [...new Set(permits.map(p => p.status))];
  for (const status of uniqueStatuses) {
    if (!status) continue;
    
    const { id: statusEntityId, ops: statusEntityOps } = Graph.createEntity({
      name: status,
      types: [statusTypeId],
      properties: {},
    });
    ops.push(...statusEntityOps);
    statusMap.set(status, statusEntityId);
  }

  // Create permit entities and store their IDs
  const permitEntities = [];
  for (const permit of permits) {
    // Use a more meaningful name for the permit entity
    const permitName = permit.description.length < 60 ? 
      permit.description : `Permit #${permit.recordNumber}`;
    
    const { id: permitId, ops: permitOps } = Graph.createEntity({
      name: permitName,
      types: [permitTypeId],
      properties: {
        [recordNumberPropertyId]: {
          type: 'TEXT',
          value: permit.recordNumber,
        },
        [descriptionPropertyId]: {
          type: 'TEXT',
          value: permit.description,
        },
        [addressPropertyId]: {
          type: 'TEXT',
          value: permit.address,
        },
        [projectNamePropertyId]: {
          type: 'TEXT',
          value: permit.projectName,
        },
      },
    });
    ops.push(...permitOps);
    
    // Create record type relation if record type exists
    if (permit.recordType && recordTypeMap.has(permit.recordType)) {
      const recordTypeRelationOp = Relation.make({
        fromId: permitId,
        relationTypeId: hasRecordTypeRelationTypeId,
        toId: recordTypeMap.get(permit.recordType),
      });
      ops.push(recordTypeRelationOp);
    }
    
    // Create status relation if status exists
    if (permit.status && statusMap.has(permit.status)) {
      const statusRelationOp = Relation.make({
        fromId: permitId,
        relationTypeId: hasStatusRelationTypeId,
        toId: statusMap.get(permit.status),
      });
      ops.push(statusRelationOp);
    }
    
    permitEntities.push({
      id: permitId,
      name: permitName,
      recordNumber: permit.recordNumber,
      description: permit.description,
      recordType: permit.recordType,
      address: permit.address,
      projectName: permit.projectName,
      status: permit.status
    });
  }
  
  return ops;
}

function extractEntityIds(ops, permits) {
  // Log the first few operations to see their structure
  console.log('First 5 operations:');
  for (let i = 0; i < Math.min(5, ops.length); i++) {
    console.log(`Operation ${i}:`, JSON.stringify(ops[i], null, 2));
  }
  
  // Find all unique operation types
  const opTypes = new Set();
  for (const op of ops) {
    opTypes.add(op.type);
  }
  console.log('Operation types:', Array.from(opTypes));
  
  // Find the permit type ID, record type type ID, and status type ID
  let permitTypeId = null;
  let recordTypeTypeId = null;
  let statusTypeId = null;
  
  // Look for CREATE_TYPE operations
  const createTypeOps = ops.filter(op => op.type === 'CREATE_TYPE');
  console.log('CREATE_TYPE operations:', createTypeOps.length);
  
  for (const op of createTypeOps) {
    console.log('CREATE_TYPE operation:', JSON.stringify(op, null, 2));
    if (op.name === 'Building permit') {
      permitTypeId = op.id;
    } else if (op.name === 'Record type') {
      recordTypeTypeId = op.id;
    } else if (op.name === 'Status') {
      statusTypeId = op.id;
    }
  }
  
  console.log('Type IDs:', {
    permitTypeId,
    recordTypeTypeId,
    statusTypeId
  });
  
  // Now find all entities with these types
  const permitEntities = [];
  const recordTypeEntities = [];
  const statusEntities = [];
  
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
  
  return {
    permitEntities,
    recordTypeEntities,
    statusEntities
  };
}

function generateCsvFiles(entityData, spaceId, permits) {
  // Create a CSV file with entity IDs and URLs
  const csvHeader = 'Type,Name,Entity ID,URL';
  const csvRows = [];
  
  // Add permit entities
  for (const entity of entityData.permitEntities) {
    const url = `https://geogenesis-git-feat-testnet-geo-browser.vercel.app/space/${spaceId}/${entity.id}`;
    csvRows.push(`Permit,"${entity.name}",${entity.id},${url}`);
  }
  
  // Add record type entities
  for (const entity of entityData.recordTypeEntities) {
    const url = `https://geogenesis-git-feat-testnet-geo-browser.vercel.app/space/${spaceId}/${entity.id}`;
    csvRows.push(`Record Type,"${entity.name}",${entity.id},${url}`);
  }
  
  // Add status entities
  for (const entity of entityData.statusEntities) {
    const url = `https://geogenesis-git-feat-testnet-geo-browser.vercel.app/space/${spaceId}/${entity.id}`;
    csvRows.push(`Status,"${entity.name}",${entity.id},${url}`);
  }
  
  const csvContent = [csvHeader, ...csvRows].join('\n');
  fs.writeFileSync('current-entity-urls.csv', csvContent);
  console.log(`Generated current-entity-urls.csv with ${csvRows.length} entities`);
  
  // Also create a simplified version with just address, entity ID, and URL for permit entities
  if (entityData.permitEntities.length > 0) {
    // Create an array to store the permit data
    const permitData = [];
    
    // Process each permit
    for (let i = 0; i < Math.min(permits.length, entityData.permitEntities.length); i++) {
      const permit = permits[i];
      const entity = entityData.permitEntities[i];
      
      // Generate the URL for the entity
      const url = `https://geogenesis-git-feat-testnet-geo-browser.vercel.app/space/${spaceId}/${entity.id}`;
      
      // Add the permit data to the array
      permitData.push({
        address: permit.address,
        recordNumber: permit.recordNumber,
        recordType: permit.recordType,
        status: permit.status,
        projectName: permit.projectName,
        entityId: entity.id,
        url
      });
    }
    
    // Sort the permit data by address
    permitData.sort((a, b) => a.address.localeCompare(b.address));
    
    // Create the CSV content
    const csvHeader = 'Address,Record Number,Record Type,Status,Project Name,Entity ID,URL';
    const csvRows = permitData.map(permit => 
      `"${permit.address}","${permit.recordNumber}","${permit.recordType}","${permit.status}","${permit.projectName}","${permit.entityId}","${permit.url}"`
    );
    
    const csvContent = [csvHeader, ...csvRows].join('\n');
    
    // Write the CSV file
    fs.writeFileSync('current-permit-entities.csv', csvContent);
    
    console.log(`Generated current-permit-entities.csv with ${permitData.length} permits`);
    
    // Also create a simplified version with just address, entity ID, and URL
    const simpleCsvHeader = 'Address,Entity ID,URL';
    const simpleCsvRows = permitData.map(permit => 
      `"${permit.address}","${permit.entityId}","${permit.url}"`
    );
    
    const simpleCsvContent = [simpleCsvHeader, ...simpleCsvRows].join('\n');
    
    // Write the simplified CSV file
    fs.writeFileSync('current-permit-entities-simple.csv', simpleCsvContent);
    
    console.log(`Generated current-permit-entities-simple.csv with ${permitData.length} permits`);
    
    // Copy the CSV files to the desktop
    try {
      const homedir = process.env.HOME || process.env.USERPROFILE;
      const desktopPath = `${homedir}/Desktop`;
      
      fs.copyFileSync('current-permit-entities.csv', `${desktopPath}/current-permit-entities.csv`);
      fs.copyFileSync('current-permit-entities-simple.csv', `${desktopPath}/current-permit-entities-simple.csv`);
      
      console.log(`Copied CSV files to desktop: ${desktopPath}`);
    } catch (error) {
      console.error('Error copying CSV files to desktop:', error);
    }
  }
}

// Execute if running directly
publishAndGenerateUrls().catch(error => {
  console.error('\n❌ [Error]:', error);
  process.exit(1);
});
