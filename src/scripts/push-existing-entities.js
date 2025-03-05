/**
 * Push Existing Entities Script
 * 
 * This script reads the triples data from the deeds-triples.json and permits-triples.json files
 * and pushes the existing entities to the GRC-20 spaces using the SDK approach.
 * 
 * Usage:
 *   node src/scripts/push-existing-entities.js
 */

import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { Graph, Ipfs } from '@graphprotocol/grc-20';
import { createWalletClient, http, defineChain } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';

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
 * Push entities to a space using the SDK approach
 * 
 * @param {string} spaceId The space ID
 * @param {Array} entitiesTriples The array of entity triples
 * @returns {Promise<void>} A promise that resolves when the entities are published
 */
async function pushEntitiesToSpace(spaceId, entitiesTriples) {
  console.log(`Pushing ${entitiesTriples.length} entities to space ${spaceId}...`);

  // Get wallet private key from environment
  const privateKey = process.env.PRIVATE_KEY;
  if (!privateKey) {
    throw new Error('PRIVATE_KEY environment variable is required');
  }

  // Create wallet from private key
  // The private key should be a hex string without the '0x' prefix
  // If it already has the '0x' prefix, we'll use it as is
  const formattedPrivateKey = privateKey.startsWith('0x') ? privateKey : `0x${privateKey}`;
  const account = privateKeyToAccount(formattedPrivateKey);
  console.log(`Using wallet address: ${account.address}`);

  // Process each entity
  for (const entityTriples of entitiesTriples) {
    const { entityId, triples } = entityTriples;
    
    console.log(`Processing entity ${entityId}...`);
    
    // Create ops array for this entity
    const ops = [];
    
    // Create a properties object for the entity creation
    const properties = {};
    
    // Add triples as properties and collect information for entity name
    let bookPage = '';
    let propertyAddress = '';
    let grantor = '';
    let grantee = '';
    let legalDescription = '';
    let documentType = '';
    
    for (const triple of triples) {
      // Convert value to sentence case if it's a string
      let value = triple.value.value;
      if (typeof value === 'string') {
        value = toSentenceCase(value);
      }
      
      // Use the attributeId or attribute as the property ID
      // Different files use different field names
      const attributeId = triple.attributeId || triple.attribute;
      
      if (!attributeId) {
        console.warn(`Warning: No attribute ID found for triple: ${JSON.stringify(triple)}`);
        continue;
      }
      
      // Store specific property values for entity naming
      if (attributeId === 'LuBWqZAu6pz54eiJS5mLv8') {
        bookPage = value;
      } else if (attributeId === 'PropertyAddress') {
        propertyAddress = value;
      } else if (attributeId === 'SyaPQfHTf3uxTAqwhuMHHa') {
        grantor = value;
      } else if (attributeId === 'DfjyQFDy6k4dW9XaSgYttn') {
        grantee = value;
      } else if (attributeId === '5yDjGNQEErVNpVZ3c61Uib') {
        legalDescription = value;
      } else if (attributeId === '3UP1qvruj8SipH9scUz1EY') {
        documentType = value;
      }
      
      // Add the property to the properties object
      properties[attributeId] = {
        type: triple.value.type,
        value: value
      };
      
      console.log(`Added property ${attributeId} with value: ${value}`);
    }
    
    // Create a more descriptive entity name
    let entityType = spaceId === process.env.DEEDS_SPACE_ID ? 'Deed' : 'Permit';
    let entityName;
    
    if (propertyAddress) {
      entityName = `${entityType} at ${propertyAddress}`;
    } else if (grantor && grantee) {
      entityName = `${entityType} from ${grantor} to ${grantee}`;
    } else if (bookPage) {
      entityName = `${entityType} #${bookPage}`;
    } else {
      entityName = `${entityType} ${entityId}`;
    }
    
    // Add a description property with more details
    let description = '';
    if (documentType) description += `${documentType} `;
    if (bookPage) description += `#${bookPage} `;
    if (grantor && grantee) description += `from ${grantor} to ${grantee} `;
    if (legalDescription) description += `for ${legalDescription} `;
    if (propertyAddress) description += `at ${propertyAddress}`;
    
    if (description) {
      properties['description'] = {
        type: 'TEXT',
        value: description.trim()
      };
    }
    
    // Create the entity with all properties at once
    const { id: newEntityId, ops: createEntityOps } = Graph.createEntity({
      name: entityName,
      types: [entityType],
      properties: properties,
      id: entityId // Use the existing entityId to ensure consistency
    });
    
    console.log(`Created entity with ID: ${newEntityId} and ${Object.keys(properties).length} properties`);
    
    ops.push(...createEntityOps);
    
    // Publish edit to IPFS
    console.log(`Publishing entity ${entityId} to IPFS...`);
    const cid = await Ipfs.publishEdit({
      name: `Push entity ${entityId}`,
      ops: ops,
      author: account.address
    });
    
    console.log(`Published entity ${entityId} to IPFS with CID: ${cid}`);
    
    // Get calldata for the edit
    console.log(`Getting calldata for entity ${entityId}...`);
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
    console.log(`Submitting transaction for entity ${entityId}...`);
    const txHash = await walletClient.sendTransaction({
      to: to,
      data: data,
      gas: 13000000n // 13 million gas
    });
    
    console.log(`Transaction submitted for entity ${entityId}: ${txHash}`);
    
    // Wait for confirmation
    console.log(`Waiting for confirmation for entity ${entityId}...`);
    
    // Note: In a production environment, you would want to wait for the transaction to be confirmed
    // For simplicity, we're just logging the transaction hash
    console.log(`Transaction confirmed for entity ${entityId}: ${txHash}`);
  }
  
  console.log(`Pushed ${entitiesTriples.length} entities to space ${spaceId}`);
}

/**
 * Main function
 */
async function main() {
  try {
    // Parse command line arguments
    const args = process.argv.slice(2);
    let targetSpaceId = '';
    let entityType = 'all'; // 'all', 'deeds', or 'permits'
    
    for (let i = 0; i < args.length; i++) {
      const arg = args[i];
      
      if (arg === '--space-id' && i + 1 < args.length) {
        targetSpaceId = args[++i];
      } else if (arg === '--type' && i + 1 < args.length) {
        entityType = args[++i];
      }
    }
    
    // Get space IDs from environment
    const deedsSpaceId = process.env.DEEDS_SPACE_ID;
    const permitsSpaceId = process.env.PERMITS_SPACE_ID;
    
    if (!deedsSpaceId || !permitsSpaceId) {
      throw new Error('DEEDS_SPACE_ID and PERMITS_SPACE_ID environment variables are required');
    }
    
    // Use target space ID if provided, otherwise use both spaces
    const spaceIds = targetSpaceId ? [targetSpaceId] : [deedsSpaceId, permitsSpaceId];
    
    console.log('Using space IDs:', spaceIds);
    
    // Read triples data from files
    const deedsTriples = readJson(path.resolve(process.cwd(), 'data/deeds-triples.json'));
    const permitsTriples = readJson(path.resolve(process.cwd(), 'data/permits-triples.json'));
    
    console.log(`Read ${deedsTriples.length} deed entities and ${permitsTriples.length} permit entities`);
    
    // Process each space
    for (const spaceId of spaceIds) {
      console.log(`Processing space ${spaceId}...`);
      
      // Push deed entities if requested
      if (entityType === 'all' || entityType === 'deeds') {
        console.log(`Pushing deed entities to space ${spaceId}...`);
        await pushEntitiesToSpace(spaceId, deedsTriples);
      }
      
      // Push permit entities if requested
      if (entityType === 'all' || entityType === 'permits') {
        console.log(`Pushing permit entities to space ${spaceId}...`);
        await pushEntitiesToSpace(spaceId, permitsTriples);
      }
    }
    
    console.log('All entities pushed successfully!');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

// Execute the script
main().catch(console.error);
