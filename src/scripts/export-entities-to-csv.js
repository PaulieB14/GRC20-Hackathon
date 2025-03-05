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
  const result = await fetch(`https://api-testnet.grc-20.thegraph.com/space/${spaceId}/entities`, {
    method: "GET",
    headers: {
      "Accept": "application/json"
    }
  });
  
  if (!result.ok) {
    throw new Error(`Failed to fetch entities: ${result.statusText}`);
  }
  
  const data = await result.json();
  console.log(`Fetched ${data.entities.length} entities from space ${spaceId}`);
  
  return data.entities;
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
  const result = await fetch(`https://api-testnet.grc-20.thegraph.com/space/${spaceId}/entity/${entityId}/properties`, {
    method: "GET",
    headers: {
      "Accept": "application/json"
    }
  });
  
  if (!result.ok) {
    console.warn(`Failed to fetch properties for entity ${entityId}: ${result.statusText}`);
    return [];
  }
  
  const data = await result.json();
  console.log(`Fetched ${data.properties.length} properties for entity ${entityId}`);
  
  return data.properties;
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
  
  for (const entity of entities) {
    const entityId = entity.id;
    const entityName = entity.name || 'Unnamed Entity';
    const entityType = entity.types && entity.types.length > 0 ? entity.types[0] : 'Unknown Type';
    const browserLink = `${TESTNET_BROWSER_URL}/${spaceId}/${entityId}`;
    
    // Fetch entity properties
    const properties = await fetchEntityProperties(spaceId, entityId);
    
    if (properties.length === 0) {
      // Add a row for the entity without properties
      csvRows += `${entityId},"${entityName.replace(/"/g, '""')}","${entityType.replace(/"/g, '""')}","","","",${browserLink}\n`;
    } else {
      // Add a row for each property
      for (const property of properties) {
        const propertyId = property.id;
        const propertyName = property.name || 'Unnamed Property';
        const propertyValue = property.value ? property.value.value : '';
        
        csvRows += `${entityId},"${entityName.replace(/"/g, '""')}","${entityType.replace(/"/g, '""')}",${propertyId},"${propertyName.replace(/"/g, '""')}","${String(propertyValue).replace(/"/g, '""')}",${browserLink}\n`;
      }
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
