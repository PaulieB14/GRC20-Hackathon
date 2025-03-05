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

// We'll use the Graph and Relation classes directly instead of importing from improved-data-model.ts

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
 * Create entity operations from triples
 * 
 * @param {Array} triples The triples data
 * @returns {Array} The operations for creating entities
 */
function createEntityOpsFromTriples(triples) {
  const ops = [];
  
  for (const triple of triples) {
    const { entityId, triples: entityTriples } = triple;
    
    // Extract entity properties
    const properties = {};
    let entityName = `Entity ${entityId}`;
    
    for (const t of entityTriples) {
      const attributeId = t.attributeId || t.attribute;
      const value = t.value.value;
      
      // Use the first property as the entity name
      if (Object.keys(properties).length === 0) {
        entityName = `${attributeId}: ${value}`;
      }
      
      // Add property to entity
      properties[attributeId] = {
        type: t.value.type,
        value: value
      };
    }
    
    // Create entity
    const { ops: entityOps } = Graph.createEntity({
      name: entityName,
      properties
    });
    
    ops.push(...entityOps);
  }
  
  return ops;
}

/**
 * Publish deeds to space
 * 
 * @param {string} spaceId The space ID
 * @returns {Promise<void>} A promise that resolves when the deeds are published
 */
async function publishDeeds(spaceId) {
  console.log(`Publishing deeds to space ${spaceId}...`);
  
  // Read deed triples
  const deedsTriples = readJson(path.resolve(process.cwd(), 'data/deeds-triples.json'));
  console.log(`Read ${deedsTriples.length} deed entities`);
  
  // Create operations from triples
  const ops = createEntityOpsFromTriples(deedsTriples);
  
  // Publish deeds
  await publishOperations(spaceId, ops, "Publish deeds with property addresses");
  
  console.log(`Published ${deedsTriples.length} deeds to space ${spaceId}`);
}

/**
 * Publish permits to space
 * 
 * @param {string} spaceId The space ID
 * @returns {Promise<void>} A promise that resolves when the permits are published
 */
async function publishPermits(spaceId) {
  console.log(`Publishing permits to space ${spaceId}...`);
  
  // Read permit triples
  const permitsTriples = readJson(path.resolve(process.cwd(), 'data/permits-triples.json'));
  console.log(`Read ${permitsTriples.length} permit entities`);
  
  // Create operations from triples
  const ops = createEntityOpsFromTriples(permitsTriples);
  
  // Publish permits
  await publishOperations(spaceId, ops, "Publish permits");
  
  console.log(`Published ${permitsTriples.length} permits to space ${spaceId}`);
}

/**
 * Main function
 */
async function main() {
  try {
    // Parse command line arguments
    const args = process.argv.slice(2);
    let deedsSpaceId = process.env.DEEDS_SPACE_ID;
    let permitsSpaceId = process.env.PERMITS_SPACE_ID;
    let publishToDeeds = true;
    let publishToPermits = true;
    
    for (let i = 0; i < args.length; i++) {
      const arg = args[i];
      
      if (arg === '--deeds-space-id' && i + 1 < args.length) {
        deedsSpaceId = args[++i];
      } else if (arg === '--permits-space-id' && i + 1 < args.length) {
        permitsSpaceId = args[++i];
      } else if (arg === '--deeds-only') {
        publishToPermits = false;
      } else if (arg === '--permits-only') {
        publishToDeeds = false;
      }
    }
    
    if (!deedsSpaceId) {
      throw new Error('Deeds space ID is required. Set DEEDS_SPACE_ID in .env file or provide it with --deeds-space-id.');
    }
    
    if (!permitsSpaceId) {
      throw new Error('Permits space ID is required. Set PERMITS_SPACE_ID in .env file or provide it with --permits-space-id.');
    }
    
    console.log(`Using space IDs:`);
    console.log(`Deeds space ID: ${deedsSpaceId}`);
    console.log(`Permits space ID: ${permitsSpaceId}`);
    
    // Publish deeds
    if (publishToDeeds) {
      await publishDeeds(deedsSpaceId);
    }
    
    // Publish permits
    if (publishToPermits) {
      await publishPermits(permitsSpaceId);
    }
    
    console.log('Done!');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

// Execute the script
main().catch(console.error);
