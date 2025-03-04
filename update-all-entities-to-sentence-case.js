// This script updates all entity names to use sentence case
import { Ipfs } from '@graphprotocol/grc-20';
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

/**
 * Converts a string to sentence case (first letter capitalized, rest lowercase)
 * Handles hyphenated words by keeping the hyphen and lowercasing the letter after it
 */
function toSentenceCase(str) {
  if (!str || typeof str !== 'string') return str;
  
  // Split by hyphens to handle hyphenated words
  const parts = str.split('-');
  
  // Process each part
  const processedParts = parts.map((part, index) => {
    // For the first part or if it's a single character, capitalize first letter
    if (index === 0 || part.length === 1) {
      return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
    }
    // For subsequent parts in a hyphenated word, lowercase everything
    return part.toLowerCase();
  });
  
  // Join back with hyphens
  return processedParts.join('-');
}

/**
 * Reads entity data from various sources and collects entities that need to be updated
 */
function collectEntities() {
  const entities = new Map();
  
  // Read entity-ids-with-urls.csv
  try {
    if (fs.existsSync('entity-ids-with-urls.csv')) {
      const data = fs.readFileSync('entity-ids-with-urls.csv', 'utf8');
      const lines = data.split('\n').filter(line => line.trim() !== '');
      
      // Skip header line
      for (let i = 1; i < lines.length; i++) {
        const parts = lines[i].split(',');
        if (parts.length >= 3) {
          const type = parts[0];
          const name = parts[1].replace(/"/g, ''); // Remove quotes
          const id = parts[2];
          
          // Check if name needs to be updated to sentence case
          const sentenceCaseName = toSentenceCase(name);
          if (name !== sentenceCaseName) {
            entities.set(id, {
              id,
              originalName: name,
              newName: sentenceCaseName,
              type
            });
          }
        }
      }
    }
  } catch (error) {
    console.error('Error reading entity-ids-with-urls.csv:', error);
  }
  
  // Read sentence-case-entities.csv
  try {
    if (fs.existsSync('sentence-case-entities.csv')) {
      const data = fs.readFileSync('sentence-case-entities.csv', 'utf8');
      const lines = data.split('\n').filter(line => line.trim() !== '');
      
      // Skip header lines
      for (let i = 2; i < lines.length; i++) {
        const parts = lines[i].split(',');
        if (parts.length >= 3) {
          const type = parts[0];
          const name = parts[1].replace(/"/g, ''); // Remove quotes
          const id = parts[2];
          
          // Check if name needs to be updated to sentence case
          const sentenceCaseName = toSentenceCase(name);
          if (name !== sentenceCaseName && !entities.has(id)) {
            entities.set(id, {
              id,
              originalName: name,
              newName: sentenceCaseName,
              type
            });
          }
        }
      }
    }
  } catch (error) {
    console.error('Error reading sentence-case-entities.csv:', error);
  }
  
  // Read data/permits-triples.json
  try {
    if (fs.existsSync('data/permits-triples.json')) {
      const data = fs.readFileSync('data/permits-triples.json', 'utf8');
      const permitsTriples = JSON.parse(data);
      
      for (const entity of permitsTriples) {
        const entityId = entity.entityId;
        
        // Find name-related triples
        const nameTriples = entity.triples.filter(triple => 
          triple.attribute === 'LA1DqP5v6QAdsgLPXGF3YA' || // Project name
          triple.attribute === 'SyaPQfHTf3uxTAqwhuMHHa' || // Record type
          triple.attribute === '3UP1qvruj8SipH9scUz1EY'    // Status
        );
        
        for (const triple of nameTriples) {
          const name = triple.value.value;
          const sentenceCaseName = toSentenceCase(name);
          
          if (name !== sentenceCaseName) {
            // For triples, we need to store the attribute ID as well
            if (!entities.has(`${entityId}-${triple.attribute}`)) {
              entities.set(`${entityId}-${triple.attribute}`, {
                entityId,
                attributeId: triple.attribute,
                originalName: name,
                newName: sentenceCaseName,
                type: 'Triple'
              });
            }
          }
        }
      }
    }
  } catch (error) {
    console.error('Error reading data/permits-triples.json:', error);
  }
  
  // Read data/grc20-deeds-triples.json
  try {
    if (fs.existsSync('data/grc20-deeds-triples.json')) {
      const data = fs.readFileSync('data/grc20-deeds-triples.json', 'utf8');
      const deedsTriples = JSON.parse(data);
      
      for (const entity of deedsTriples) {
        const entityId = entity.entityId;
        
        // Find name-related triples in deeds
        const nameTriples = entity.triples.filter(triple => 
          triple.attributeId === 'nameId' || 
          triple.attributeId === 'typeId'
        );
        
        for (const triple of nameTriples) {
          if (triple.value && triple.value.value) {
            const name = triple.value.value;
            const sentenceCaseName = toSentenceCase(name);
            
            if (name !== sentenceCaseName) {
              // For triples, we need to store the attribute ID as well
              if (!entities.has(`${entityId}-${triple.attributeId}`)) {
                entities.set(`${entityId}-${triple.attributeId}`, {
                  entityId,
                  attributeId: triple.attributeId,
                  originalName: name,
                  newName: sentenceCaseName,
                  type: 'DeedTriple'
                });
              }
            }
          }
        }
      }
    }
  } catch (error) {
    console.error('Error reading data/grc20-deeds-triples.json:', error);
  }
  
  return Array.from(entities.values());
}

/**
 * Updates entity names to sentence case
 */
async function updateEntityNamesToSentenceCase() {
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
    
    // Collect entities that need to be updated
    console.log('Collecting entities that need to be updated...');
    const entitiesToUpdate = collectEntities();
    console.log(`Found ${entitiesToUpdate.length} entities that need to be updated to sentence case`);
    
    // Create a CSV report of entities to be updated
    const csvContent = ['Type,Original Name,New Name,Entity ID'].concat(
      entitiesToUpdate.map(entity => 
        `${entity.type},"${entity.originalName}","${entity.newName}",${entity.id || entity.entityId}`
      )
    ).join('\n');
    
    fs.writeFileSync('entities-to-update.csv', csvContent);
    console.log('Saved list of entities to update to entities-to-update.csv');
    
    // Create operations to update entity names
    const ops = [];
    
    for (const entity of entitiesToUpdate) {
      if (entity.type === 'Triple' || entity.type === 'DeedTriple') {
        // For triples, we update the value of the triple
        ops.push({
          type: "SET_TRIPLE",
          triple: {
            attribute: entity.attributeId,
            entity: entity.entityId,
            value: {
              type: "TEXT",
              value: entity.newName
            }
          }
        });
        
        console.log(`Will update triple: Entity ${entity.entityId}, Attribute ${entity.attributeId} from "${entity.originalName}" to "${entity.newName}"`);
      } else {
        // For entities, we update the entity name
        ops.push({
          path: ['entity', entity.id, 'name'],
          value: entity.newName
        });
        
        console.log(`Will update entity ${entity.id} name from "${entity.originalName}" to "${entity.newName}"`);
      }
    }
    
    if (ops.length === 0) {
      console.log('No entities need to be updated. Exiting.');
      return;
    }
    
    // Save operations to a file for reference
    fs.writeFileSync('sentence-case-ops.json', JSON.stringify(ops, null, 2));
    console.log(`Generated ${ops.length} operations to update entity names to sentence case`);
    
    // Create the edit data
    const editData = {
      name: "Update All Entity Names to Sentence Case",
      ops: ops,
      author: process.env.WALLET_ADDRESS
    };
    
    // Publish to IPFS
    console.log('Publishing to IPFS...');
    const cid = await Ipfs.publishEdit(editData);
    console.log(`Published to IPFS with CID: ${cid}`);
    
    // Get calldata
    console.log('Getting calldata...');
    const spaceId = process.env.PERMITS_SPACE_ID;
    const result = await fetch(`https://api-testnet.grc-20.thegraph.com/space/${spaceId}/edit/calldata`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify({
        cid,
        network: "TESTNET",
      }),
    });
    
    if (!result.ok) {
      throw new Error(`Failed to get calldata: ${result.statusText}`);
    }
    
    const { to, data } = await result.json();
    console.log(`Got calldata: to=${to} data length=${data.length}`);
    
    // Save calldata to a file
    fs.writeFileSync('calldata.json', JSON.stringify({ to, data }, null, 2));
    
    // Submit transaction
    console.log('Submitting transaction...');
    const account = privateKeyToAccount(process.env.PRIVATE_KEY);
    
    const publicClient = createPublicClient({
      chain: grc20Testnet,
      transport: http(),
    });
    
    const walletClient = createWalletClient({
      account,
      chain: grc20Testnet,
      transport: http(),
    });
    
    // Get nonce
    console.log('Getting nonce...');
    const nonce = await publicClient.getTransactionCount({
      address: account.address,
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
      to: to,
      data: data,
      gas: gasLimit,
      maxFeePerGas: baseGasPrice,
      maxPriorityFeePerGas: baseGasPrice,
      nonce,
      value: 0n,
    });
    console.log(`Transaction submitted with hash: ${hash}`);
    
    // Wait for confirmation
    console.log('Waiting for confirmation...');
    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    console.log(`Transaction confirmed in block ${receipt.blockNumber}`);
    
    console.log('Entity names updated to sentence case successfully!');
    
    // Save the updated entity names to a CSV file
    const updatedCsvContent = ['Type,Name,Entity ID,URL'].concat(
      entitiesToUpdate.map(entity => {
        const id = entity.id || entity.entityId;
        const url = `https://geogenesis-git-feat-testnet-geo-browser.vercel.app/space/${spaceId}/${id}`;
        return `${entity.type},"${entity.newName}",${id},${url}`;
      })
    ).join('\n');
    
    fs.writeFileSync('updated-sentence-case-entities.csv', updatedCsvContent);
    console.log(`Updated entity names saved to updated-sentence-case-entities.csv`);
  } catch (error) {
    console.error('Failed to update entity names:', error);
    process.exit(1);
  }
}

// Execute the function
updateEntityNamesToSentenceCase();
