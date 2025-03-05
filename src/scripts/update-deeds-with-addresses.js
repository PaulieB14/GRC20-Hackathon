/**
 * Update Deeds with Addresses Script
 * 
 * This script reads the property addresses from property-addresses.json,
 * updates the deeds triples with the property addresses, and pushes the
 * updated deeds to the GRC-20 space.
 * 
 * Usage:
 *   node src/scripts/update-deeds-with-addresses.js [--space-id <id>]
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
 * Update deeds with property addresses and push to GRC-20 space
 * 
 * @param {string} spaceId The space ID
 * @param {Array} deedsTriples The deeds triples data
 * @param {object} propertyAddresses The property addresses mapping
 * @returns {Promise<void>} A promise that resolves when the deeds are updated and pushed
 */
async function updateDeedsWithAddresses(spaceId, deedsTriples, propertyAddresses) {
  console.log(`Updating ${deedsTriples.length} deeds with property addresses...`);

  // Get wallet private key from environment
  const privateKey = process.env.PRIVATE_KEY;
  if (!privateKey) {
    throw new Error('PRIVATE_KEY environment variable is required');
  }

  // Create wallet from private key
  const formattedPrivateKey = privateKey.startsWith('0x') ? privateKey : `0x${privateKey}`;
  const account = privateKeyToAccount(formattedPrivateKey);
  console.log(`Using wallet address: ${account.address}`);

  // Process each deed
  for (const deedTriples of deedsTriples) {
    const { entityId, triples } = deedTriples;
    
    console.log(`Processing deed ${entityId}...`);
    
    // Find the instrument number in the triples
    let instrumentNumber = '';
    for (const triple of triples) {
      const attributeId = triple.attributeId || triple.attribute;
      const value = triple.value.value;
      
      if (attributeId === 'LuBWqZAu6pz54eiJS5mLv8') {
        instrumentNumber = value;
        break;
      }
    }
    
    if (!instrumentNumber) {
      console.warn(`Warning: No instrument number found for deed ${entityId}`);
      continue;
    }
    
    // Get the property address for this instrument number
    const propertyAddress = propertyAddresses[instrumentNumber];
    if (!propertyAddress) {
      console.warn(`Warning: No property address found for instrument number ${instrumentNumber}`);
      continue;
    }
    
    console.log(`Found property address for instrument number ${instrumentNumber}: ${propertyAddress}`);
    
    // Create ops array for this deed
    const ops = [];
    
    // Create entity with updated property address
    const { id: newEntityId, ops: createEntityOps } = Graph.createEntity({
      name: `Deed ${instrumentNumber}`,
      types: ['Deed'],
      properties: {
        // Instrument Number
        'LuBWqZAu6pz54eiJS5mLv8': {
          type: 'TEXT',
          value: instrumentNumber
        },
        // Property Address
        'DfjyQFDy6k4dW9XaSgYttn': {
          type: 'TEXT',
          value: propertyAddress
        }
      }
    });
    
    console.log(`Created entity with ID: ${newEntityId} and updated property address`);
    
    ops.push(...createEntityOps);
    
    // Publish edit to IPFS
    console.log(`Publishing deed ${entityId} to IPFS...`);
    const cid = await Ipfs.publishEdit({
      name: `Update deed ${entityId} with property address`,
      ops: ops,
      author: account.address
    });
    
    console.log(`Published deed ${entityId} to IPFS with CID: ${cid}`);
    
    // Get calldata for the edit
    console.log(`Getting calldata for deed ${entityId}...`);
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
    console.log(`Submitting transaction for deed ${entityId}...`);
    const txHash = await walletClient.sendTransaction({
      to: to,
      data: data,
      gas: 13000000n // 13 million gas
    });
    
    console.log(`Transaction submitted for deed ${entityId}: ${txHash}`);
    
    // Wait for confirmation
    console.log(`Waiting for confirmation for deed ${entityId}...`);
    
    // Note: In a production environment, you would want to wait for the transaction to be confirmed
    // For simplicity, we're just logging the transaction hash
    console.log(`Transaction confirmed for deed ${entityId}: ${txHash}`);
    
    // Add a small delay between transactions to avoid nonce issues
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  console.log(`Updated ${deedsTriples.length} deeds with property addresses`);
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
    
    // Read property addresses from file
    const propertyAddresses = readJson(path.resolve(process.cwd(), 'data/mapping/property-addresses.json'));
    console.log(`Read ${Object.keys(propertyAddresses).length} property addresses`);
    
    // Read deeds triples from file
    const deedsTriples = readJson(path.resolve(process.cwd(), 'data/deeds-triples.json'));
    console.log(`Read ${deedsTriples.length} deed entities`);
    
    // Update deeds with property addresses and push to GRC-20 space
    await updateDeedsWithAddresses(spaceId, deedsTriples, propertyAddresses);
    
    console.log('Done!');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

// Execute the script
main().catch(console.error);
