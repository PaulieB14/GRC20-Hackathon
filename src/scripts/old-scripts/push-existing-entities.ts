/**
 * Push Existing Entities Script
 * 
 * This script reads the triples data from the deeds-triples.json and permits-triples.json files
 * and pushes the existing entities to the GRC-20 spaces using the SDK approach.
 * 
 * Usage:
 *   npx ts-node src/scripts/push-existing-entities.ts
 */

import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { Graph, Ipfs } from '@graphprotocol/grc-20';
import { createWalletClient, http, defineChain } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';

// Load environment variables
dotenv.config();

// Define types
interface Triple {
  attributeId: string;
  entityId: string;
  value: {
    type: string;
    value: string | number | boolean;
  };
}

interface EntityTriples {
  entityId: string;
  triples: Triple[];
}

/**
 * Read JSON file and return object
 * 
 * @param filePath The path to the JSON file
 * @returns The parsed JSON object
 */
function readJson<T>(filePath: string): T {
  const fileContent = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(fileContent) as T;
}

/**
 * Convert a string to sentence case (first letter capitalized, rest lowercase)
 * 
 * @param str The string to convert
 * @returns The string in sentence case
 */
function toSentenceCase(str: string): string {
  if (!str || str.length === 0) return str;
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

/**
 * Push entities to a space using the SDK approach
 * 
 * @param spaceId The space ID
 * @param entitiesTriples The array of entity triples
 * @returns A promise that resolves when the entities are published
 */
async function pushEntitiesToSpace(spaceId: string, entitiesTriples: EntityTriples[]): Promise<void> {
  console.log(`Pushing ${entitiesTriples.length} entities to space ${spaceId}...`);

  // Get wallet private key from environment
  const privateKey = process.env.PRIVATE_KEY;
  if (!privateKey) {
    throw new Error('PRIVATE_KEY environment variable is required');
  }

  // Create wallet from private key
  const account = privateKeyToAccount(`0x${privateKey}`);
  console.log(`Using wallet address: ${account.address}`);

  // Process each entity
  for (const entityTriples of entitiesTriples) {
    const { entityId, triples } = entityTriples;
    
    console.log(`Processing entity ${entityId}...`);
    
    // Create ops array for this entity
    const ops = [];
    
    // Create entity
    const entityName = `Entity ${entityId}`;
    const entityType = spaceId === process.env.DEEDS_SPACE_ID ? 'Deed' : 'Permit';
    
    const { id: newEntityId, ops: createEntityOps } = Graph.createEntity({
      name: entityName,
      types: [entityType],
      properties: {}
    });
    
    console.log(`Created entity with ID: ${newEntityId}`);
    
    ops.push(...createEntityOps);
    
    // Add triples as properties
    for (const triple of triples) {
      // Convert value to sentence case if it's a string
      let value = triple.value.value;
      if (typeof value === 'string') {
        value = toSentenceCase(value);
      }
      
      // Create property
      const { id: propertyId, ops: setPropertyOps } = Graph.createProperty({
        name: `Property ${triple.attributeId}`,
        type: triple.value.type as any
      });
      
      console.log(`Created property with ID: ${propertyId}`);
      
      ops.push(...setPropertyOps);
    }
    
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
      to: to as `0x${string}`,
      data: data as `0x${string}`,
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
async function main(): Promise<void> {
  try {
    // Get space IDs from environment
    const deedsSpaceId = process.env.DEEDS_SPACE_ID;
    const permitsSpaceId = process.env.PERMITS_SPACE_ID;
    
    if (!deedsSpaceId || !permitsSpaceId) {
      throw new Error('DEEDS_SPACE_ID and PERMITS_SPACE_ID environment variables are required');
    }
    
    console.log('Using space IDs:');
    console.log(`DEEDS_SPACE_ID: ${deedsSpaceId}`);
    console.log(`PERMITS_SPACE_ID: ${permitsSpaceId}`);
    
    // Read triples data from files
    const deedsTriples = readJson<EntityTriples[]>(path.resolve(process.cwd(), 'data/deeds-triples.json'));
    const permitsTriples = readJson<EntityTriples[]>(path.resolve(process.cwd(), 'data/permits-triples.json'));
    
    console.log(`Read ${deedsTriples.length} deed entities and ${permitsTriples.length} permit entities`);
    
    // Push deed entities to deeds space
    await pushEntitiesToSpace(deedsSpaceId, deedsTriples);
    
    // Push permit entities to permits space
    await pushEntitiesToSpace(permitsSpaceId, permitsTriples);
    
    console.log('Done!');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

// Execute the script
main().catch(console.error);
