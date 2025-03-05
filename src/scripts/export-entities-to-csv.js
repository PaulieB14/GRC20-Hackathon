/**
 * Export Entities to CSV Script
 * 
 * This script exports all entities from the GRC-20 spaces to a CSV file,
 * including links to view them on the testnet browser.
 * 
 * Usage:
 *   node src/scripts/export-entities-to-csv.js [--space-id <id>] [--output <path>]
 */

import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { createPublicClient, http, defineChain } from 'viem';

// Load environment variables
dotenv.config();

// Define the testnet browser URL
const TESTNET_BROWSER_URL = 'https://geogenesis-git-feat-testnet-geo-browser.vercel.app/space';

/**
 * Fetch all entities from a space
 * 
 * @param {string} spaceId The space ID
 * @returns {Promise<Array>} A promise that resolves to an array of entities
 */
async function fetchEntities(spaceId) {
  console.log(`Fetching entities from space ${spaceId}...`);
  
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
  
  // Create public client
  const publicClient = createPublicClient({
    chain: grc20Testnet,
    transport: http(rpcUrl)
  });
  
  // Fetch entities from the GRC-20 API
  console.log(`Fetching from: https://api-testnet.grc-20.thegraph.com/space/${spaceId}/entities`);
  try {
    const result = await fetch(`https://api-testnet.grc-20.thegraph.com/space/${spaceId}/entities`, {
      method: "GET",
      headers: {
        "Accept": "application/json"
      }
    });
    
    if (!result.ok) {
      const errorText = await result.text();
      throw new Error(`Failed to fetch entities: ${result.status} ${result.statusText} - ${errorText}`);
    }
    
    const data = await result.json();
    console.log(`Fetched ${data.entities ? data.entities.length : 0} entities from space ${spaceId}`);
    
    return data.entities || [];
  } catch (error) {
    console.error(`Error fetching entities: ${error.message}`);
    
    // Try alternative API endpoint format
    console.log("Trying alternative API endpoint...");
    const altResult = await fetch(`https://api-testnet.grc-20.thegraph.com/spaces/${spaceId}/entities`, {
      method: "GET",
      headers: {
        "Accept": "application/json"
      }
    });
    
    if (!altResult.ok) {
      throw new Error(`Failed to fetch entities from alternative endpoint: ${altResult.status} ${altResult.statusText}`);
    }
    
    const altData = await altResult.json();
    console.log(`Fetched ${altData.entities ? altData.entities.length : 0} entities from alternative endpoint`);
    
    return altData.entities || [];
  }
  
}

/**
 * Fetch entity properties
 * 
 * @param {string} spaceId The space ID
 * @param {string} entityId The entity ID
 * @returns {Promise<Array>} A promise that resolves to an array of properties
 */
async function fetchEntityProperties(spaceId, entityId) {
  console.log(`Fetching properties for entity ${entityId}...`);
  
  // Fetch entity properties from the GRC-20 API
  try {
    console.log(`Fetching properties from: https://api-testnet.grc-20.thegraph.com/space/${spaceId}/entity/${entityId}/properties`);
    const result = await fetch(`https://api-testnet.grc-20.thegraph.com/space/${spaceId}/entity/${entityId}/properties`, {
      method: "GET",
      headers: {
        "Accept": "application/json"
      }
    });
    
    if (!result.ok) {
      const errorText = await result.text();
      console.warn(`Failed to fetch properties for entity ${entityId}: ${result.status} ${result.statusText} - ${errorText}`);
      
      // Try alternative API endpoint
      console.log("Trying alternative API endpoint for properties...");
      const altResult = await fetch(`https://api-testnet.grc-20.thegraph.com/spaces/${spaceId}/entities/${entityId}/properties`, {
        method: "GET",
        headers: {
          "Accept": "application/json"
        }
      });
      
      if (!altResult.ok) {
        console.warn(`Failed to fetch properties from alternative endpoint: ${altResult.status} ${altResult.statusText}`);
        return [];
      }
      
      const altData = await altResult.json();
      console.log(`Fetched ${altData.properties ? altData.properties.length : 0} properties from alternative endpoint`);
      return altData.properties || [];
    }
    
    const data = await result.json();
    console.log(`Fetched ${data.properties ? data.properties.length : 0} properties for entity ${entityId}`);
    
    return data.properties || [];
  } catch (error) {
    console.error(`Error fetching properties: ${error.message}`);
    return [];
  }
}

/**
 * Export entities to CSV
 * 
 * @param {string} spaceId The space ID
 * @param {Array} entities The array of entities
 * @param {string} outputPath The output file path
 * @returns {Promise<void>} A promise that resolves when the CSV is exported
 */
async function exportEntitiesToCsv(spaceId, entities, outputPath) {
  console.log(`Exporting ${entities.length} entities to CSV...`);
  
  // Create CSV header
  const csvHeader = 'Entity ID,Entity Name,Entity Type,Property ID,Property Name,Property Value,Browser Link\n';
  
  // Create CSV rows
  let csvRows = '';
  
  // Process entities in batches to avoid overwhelming the API
  const batchSize = 5;
  for (let i = 0; i < entities.length; i += batchSize) {
    const batch = entities.slice(i, i + batchSize);
    console.log(`Processing batch ${Math.floor(i / batchSize) + 1} of ${Math.ceil(entities.length / batchSize)}...`);
    
    // Process entities in parallel within each batch
    const batchPromises = batch.map(async (entity) => {
      const entityId = entity.id;
      const entityName = entity.name || 'Unnamed Entity';
      const entityType = entity.types && entity.types.length > 0 ? entity.types[0] : 'Unknown Type';
      const browserLink = `${TESTNET_BROWSER_URL}/${spaceId}/${entityId}`;
      
      // Fetch entity properties
      const properties = await fetchEntityProperties(spaceId, entityId);
      
      let entityRows = '';
      if (properties.length === 0) {
        // Add a row for the entity without properties
        entityRows += `${entityId},"${entityName.replace(/"/g, '""')}","${entityType.replace(/"/g, '""')}","","","",${browserLink}\n`;
      } else {
        // Add a row for each property
        for (const property of properties) {
          const propertyId = property.id || '';
          const propertyName = property.name || 'Unnamed Property';
          const propertyValue = property.value ? property.value.value : '';
          
          entityRows += `${entityId},"${entityName.replace(/"/g, '""')}","${entityType.replace(/"/g, '""')}",${propertyId},"${propertyName.replace(/"/g, '""')}","${String(propertyValue).replace(/"/g, '""')}",${browserLink}\n`;
        }
      }
      
      return entityRows;
    });
    
    // Wait for all entities in the batch to be processed
    const batchResults = await Promise.all(batchPromises);
    
    // Add batch results to CSV rows
    for (const result of batchResults) {
      csvRows += result;
    }
    
    // Add a small delay between batches to avoid rate limiting
    if (i + batchSize < entities.length) {
      console.log('Waiting before processing next batch...');
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  // Write CSV to file
  fs.writeFileSync(outputPath, csvHeader + csvRows);
  
  console.log(`Exported ${entities.length} entities to ${outputPath}`);
}

/**
 * Main function
 */
async function main() {
  try {
    // Parse command line arguments
    const args = process.argv.slice(2);
    let spaceId = process.env.DEEDS_SPACE_ID;
    let outputPath = path.resolve(process.cwd(), 'data/entities.csv');
    
    for (let i = 0; i < args.length; i++) {
      const arg = args[i];
      
      if (arg === '--space-id' && i + 1 < args.length) {
        spaceId = args[++i];
      } else if (arg === '--output' && i + 1 < args.length) {
        outputPath = path.resolve(process.cwd(), args[++i]);
      }
    }
    
    if (!spaceId) {
      throw new Error('Space ID is required. Set DEEDS_SPACE_ID in .env file or provide it with --space-id.');
    }
    
    console.log(`Using space ID: ${spaceId}`);
    console.log(`Output path: ${outputPath}`);
    
    // Create output directory if it doesn't exist
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // Fetch entities from the space
    const entities = await fetchEntities(spaceId);
    
    // Export entities to CSV
    await exportEntitiesToCsv(spaceId, entities, outputPath);
    
    console.log('Done!');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

// Execute the script
main().catch(console.error);
