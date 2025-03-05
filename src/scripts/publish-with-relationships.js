/**
 * Publish With Relationships Script
 * 
 * This script publishes entities with enhanced relationships to a GRC-20 space
 * using the improved data model.
 * 
 * Usage:
 *   node src/scripts/publish-with-relationships.js [--space-id <id>]
 */

import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { createWalletClient, http, defineChain } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { Graph, Relation, Ipfs } from '@graphprotocol/grc-20';

// Import the improved data model
import {
  createBaseTypes,
  createDeedProperties,
  createPermitProperties,
  createDocumentTypeEntities,
  createRecordTypeEntities,
  createStatusEntities,
  createPersonEntity,
  createDeedEntityWithRelations,
  createPermitEntityWithRelations
} from '../models/improved-data-model.js';

// Load environment variables
dotenv.config();

/**
 * Read JSON file and return object
 * 
 * @param {string} filePath The path to the JSON file
 * @returns {object} The parsed JSON object
 */
function readJson(filePath) {
  const fileContent = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(fileContent);
}

/**
 * Convert a string to sentence case (first letter capitalized, rest lowercase)
 * 
 * @param {string} str The string to convert
 * @returns {string} The string in sentence case
 */
function toSentenceCase(str) {
  if (!str || str.length === 0) return str;
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

/**
 * Publish operations to a space
 * 
 * @param {string} spaceId The space ID
 * @param {Array} ops The operations to publish
 * @param {string} description A description of the operations
 * @returns {Promise<string>} A promise that resolves to the transaction hash
 */
async function publishOperations(spaceId, ops, description) {
  console.log(`Publishing ${ops.length} operations to space ${spaceId}...`);
  
  // Get wallet private key from environment
  const privateKey = process.env.PRIVATE_KEY;
  if (!privateKey) {
    throw new Error('PRIVATE_KEY environment variable is required');
  }
  
  // Create wallet from private key
  const formattedPrivateKey = privateKey.startsWith('0x') ? privateKey : `0x${privateKey}`;
  const account = privateKeyToAccount(formattedPrivateKey);
  console.log(`Using wallet address: ${account.address}`);
  
  // Publish edit to IPFS
  console.log(`Publishing edit to IPFS...`);
  const cid = await Ipfs.publishEdit({
    name: description,
    ops: ops,
    author: account.address
  });
  
  console.log(`Published edit to IPFS with CID: ${cid}`);
  
  // Get calldata for the edit
  console.log(`Getting calldata...`);
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
  
  const { to, data } = await result.json();
  
  // Create RPC provider
  const rpcUrl = process.env.RPC_URL;
  if (!rpcUrl) {
    throw new Error('RPC_URL environment variable is required');
  }
  
  // Define GRC-20 testnet chain
  const grc20Testnet = defineChain({
    id: 19411,
    name: 'GRC-20 Testnet',
    network: 'grc20-testnet',
    nativeCurrency: {
      decimals: 18,
      name: 'Ether',
      symbol: 'ETH',
    },
    rpcUrls: {
      default: {
        http: [rpcUrl],
      },
      public: {
        http: [rpcUrl],
      },
    },
  });
  
  // Create wallet client
  const walletClient = createWalletClient({
    account,
    chain: grc20Testnet,
    transport: http(rpcUrl)
  });
  
  // Submit transaction
  console.log(`Submitting transaction...`);
  const txHash = await walletClient.sendTransaction({
    to: to,
    data: data,
    gas: 13000000n // 13 million gas
  });
  
  console.log(`Transaction submitted: ${txHash}`);
  
  return txHash;
}

/**
 * Set up ontology with improved data model
 * 
 * @param {string} spaceId The space ID
 * @returns {Promise<object>} A promise that resolves to the type IDs
 */
async function setupOntology(spaceId) {
  console.log(`Setting up ontology for space ${spaceId}...`);
  
  // Create base types
  const baseTypes = await createBaseTypes();
  
  // Publish base types
  await publishOperations(spaceId, baseTypes.ops, "Create base types");
  
  // Create deed properties
  const deedProperties = await createDeedProperties(baseTypes.deedTypeId);
  
  // Publish deed properties
  await publishOperations(spaceId, deedProperties.ops, "Create deed properties");
  
  // Create permit properties
  const permitProperties = await createPermitProperties(baseTypes.permitTypeId);
  
  // Publish permit properties
  await publishOperations(spaceId, permitProperties.ops, "Create permit properties");
  
  // Create document type entities
  const documentTypeEntities = await createDocumentTypeEntities(baseTypes.documentTypeTypeId);
  
  // Publish document type entities
  await publishOperations(spaceId, documentTypeEntities.ops, "Create document type entities");
  
  // Create record type entities
  const recordTypeEntities = await createRecordTypeEntities(baseTypes.recordTypeTypeId);
  
  // Publish record type entities
  await publishOperations(spaceId, recordTypeEntities.ops, "Create record type entities");
  
  // Create status entities
  const statusEntities = await createStatusEntities(baseTypes.statusTypeId);
  
  // Publish status entities
  await publishOperations(spaceId, statusEntities.ops, "Create status entities");
  
  return {
    ...baseTypes,
    ...deedProperties,
    ...permitProperties,
    documentTypeMap: documentTypeEntities.documentTypeMap,
    recordTypeMap: recordTypeEntities.recordTypeMap,
    statusMap: statusEntities.statusMap
  };
}

/**
 * Publish deeds with relationships
 * 
 * @param {string} spaceId The space ID
 * @param {object} typeIds The type IDs
 * @returns {Promise<void>} A promise that resolves when the deeds are published
 */
async function publishDeedsWithRelationships(spaceId, typeIds) {
  console.log(`Publishing deeds with relationships to space ${spaceId}...`);
  
  // Read deed triples
  const deedsTriples = readJson(path.resolve(process.cwd(), 'data/deeds-triples.json'));
  console.log(`Read ${deedsTriples.length} deed entities`);
  
  // Process each deed
  for (const deedTriple of deedsTriples) {
    const { entityId, triples } = deedTriple;
    
    console.log(`Processing deed ${entityId}...`);
    
    // Extract deed data from triples
    let instrumentNumber = '';
    let propertyAddress = '';
    let propertyDetails = '';
    let sellerName = '';
    let buyerName = '';
    let documentType = '';

    for (const triple of triples) {
      const attributeId = triple.attributeId || triple.attribute;
      const value = triple.value.value;

      // Map attribute IDs to deed properties
      if (attributeId === 'LuBWqZAu6pz54eiJS5mLv8') {
        instrumentNumber = value;
      } else if (attributeId === '5yDjGNQEErVNpVZ3c61Uib') {
        propertyDetails = value;
      } else if (attributeId === 'DfjyQFDy6k4dW9XaSgYttn') {
        buyerName = value;
      } else if (attributeId === 'SyaPQfHTf3uxTAqwhuMHHa') {
        sellerName = value;
      } else if (attributeId === '3UP1qvruj8SipH9scUz1EY') {
        documentType = value;
      } else if (attributeId === 'PropertyAddress') {
        propertyAddress = value;
      }
    }
    
    // Create person entities
    const { id: buyerId, ops: buyerOps } = createPersonEntity(
      typeIds.personTypeId,
      toSentenceCase(buyerName)
    );
    
    const { id: sellerId, ops: sellerOps } = createPersonEntity(
      typeIds.personTypeId,
      toSentenceCase(sellerName)
    );
    
    // Get document type ID
    let documentTypeId = '';
    for (const [docType, id] of typeIds.documentTypeMap.entries()) {
      if (docType.toUpperCase() === documentType.toUpperCase()) {
        documentTypeId = id;
        break;
      }
    }
    
    // If document type not found, use the first one
    if (!documentTypeId && typeIds.documentTypeMap.size > 0) {
      documentTypeId = typeIds.documentTypeMap.values().next().value;
    }
    
    // Create deed entity with relations
    const { id: deedId, ops: deedOps } = createDeedEntityWithRelations(
      typeIds.deedTypeId,
      instrumentNumber,
      propertyAddress || `Property for deed ${instrumentNumber}`,
      propertyDetails,
      typeIds.buyerRelationTypeId,
      buyerId,
      typeIds.sellerRelationTypeId,
      sellerId,
      typeIds.documentTypeRelationTypeId,
      documentTypeId,
      typeIds.instrumentNumberId,
      typeIds.propertyAddressId,
      typeIds.propertyDetailsId
    );
    
    // Combine all operations
    const ops = [
      ...buyerOps,
      ...sellerOps,
      ...deedOps
    ];
    
    // Publish deed with relationships
    await publishOperations(
      spaceId,
      ops,
      `Publish deed ${instrumentNumber} with relationships`
    );
    
    console.log(`Published deed ${instrumentNumber} with relationships`);
  }
}

/**
 * Publish permits with relationships
 * 
 * @param {string} spaceId The space ID
 * @param {object} typeIds The type IDs
 * @returns {Promise<void>} A promise that resolves when the permits are published
 */
async function publishPermitsWithRelationships(spaceId, typeIds) {
  console.log(`Publishing permits with relationships to space ${spaceId}...`);
  
  // Read permit triples
  const permitsTriples = readJson(path.resolve(process.cwd(), 'data/permits-triples.json'));
  console.log(`Read ${permitsTriples.length} permit entities`);
  
  // Process each permit
  for (const permitTriple of permitsTriples) {
    const { entityId, triples } = permitTriple;
    
    console.log(`Processing permit ${entityId}...`);
    
    // Extract permit data from triples
    let recordNumber = '';
    let description = '';
    let address = '';
    let projectName = '';
    let recordType = '';
    let status = '';
    
    for (const triple of triples) {
      const attributeId = triple.attributeId || triple.attribute;
      const value = triple.value.value;
      
      // Map attribute IDs to permit properties
      if (attributeId === 'LuBWqZAu6pz54eiJS5mLv8') {
        recordNumber = value;
      } else if (attributeId === 'LA1DqP5v6QAdsgLPXGF3YA') {
        description = value;
      } else if (attributeId === 'DfjyQFDy6k4dW9XaSgYttn') {
        address = value;
      } else if (attributeId === '5yDjGNQEErVNpVZ3c61Uib') {
        projectName = value;
      } else if (attributeId === 'SyaPQfHTf3uxTAqwhuMHHa') {
        recordType = value;
      } else if (attributeId === '3UP1qvruj8SipH9scUz1EY') {
        status = value;
      }
    }
    
    // Get record type ID
    let recordTypeId = '';
    for (const [recType, id] of typeIds.recordTypeMap.entries()) {
      if (recType.toUpperCase() === recordType.toUpperCase()) {
        recordTypeId = id;
        break;
      }
    }
    
    // If record type not found, use the first one
    if (!recordTypeId && typeIds.recordTypeMap.size > 0) {
      recordTypeId = typeIds.recordTypeMap.values().next().value;
    }
    
    // Get status ID
    let statusId = '';
    for (const [stat, id] of typeIds.statusMap.entries()) {
      if (stat.toUpperCase() === status.toUpperCase()) {
        statusId = id;
        break;
      }
    }
    
    // If status not found, use the first one
    if (!statusId && typeIds.statusMap.size > 0) {
      statusId = typeIds.statusMap.values().next().value;
    }
    
    // Create permit entity with relations
    const { id: permitId, ops: permitOps } = createPermitEntityWithRelations(
      typeIds.permitTypeId,
      recordNumber,
      description,
      address,
      projectName,
      typeIds.recordTypeRelationTypeId,
      recordTypeId,
      typeIds.statusRelationTypeId,
      statusId,
      typeIds.recordNumberId,
      typeIds.descriptionId,
      typeIds.addressId,
      typeIds.projectNameId
    );
    
    // Publish permit with relationships
    await publishOperations(
      spaceId,
      permitOps,
      `Publish permit ${recordNumber} with relationships`
    );
    
    console.log(`Published permit ${recordNumber} with relationships`);
  }
}

/**
 * Main function
 */
async function main() {
  try {
    // Parse command line arguments
    const args = process.argv.slice(2);
    let spaceId = process.env.DEEDS_SPACE_ID;
    
    for (let i = 0; i < args.length; i++) {
      const arg = args[i];
      
      if (arg === '--space-id' && i + 1 < args.length) {
        spaceId = args[++i];
      }
    }
    
    if (!spaceId) {
      throw new Error('Space ID is required. Set DEEDS_SPACE_ID in .env file or provide it with --space-id.');
    }
    
    console.log(`Using space ID: ${spaceId}`);
    
    // Set up ontology
    const typeIds = await setupOntology(spaceId);
    
    // Publish deeds with relationships
    await publishDeedsWithRelationships(spaceId, typeIds);
    
    // Publish permits with relationships
    await publishPermitsWithRelationships(spaceId, typeIds);
    
    console.log('Done!');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

// Execute the script
main().catch(console.error);
