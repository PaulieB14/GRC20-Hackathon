/**
 * Generate Browser Links Script
 * 
 * This script generates browser links for the entities in the triples data.
 * 
 * Usage:
 *   node src/scripts/generate-browser-links.js [--output <path>]
 */

import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Define the testnet browser URL
const TESTNET_BROWSER_URL = 'https://geogenesis-git-feat-testnet-geo-browser.vercel.app/space';

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
 * Generate browser links for entities
 * 
 * @param {string} spaceId The space ID
 * @param {Array} entities The array of entities
 * @param {string} type The entity type (Deed or Permit)
 * @returns {Array} The array of entity links
 */
function generateEntityLinks(spaceId, entities, type) {
  return entities.map(entity => {
    const entityId = entity.entityId;
    
    // Extract a name from the triples
    let name = `${type} ${entityId}`;
    let identifier = '';
    
    // Find the identifier property (instrument number for deeds, record number for permits)
    for (const triple of entity.triples) {
      const attributeId = triple.attributeId || triple.attribute;
      const value = triple.value.value;
      
      if (attributeId === 'LuBWqZAu6pz54eiJS5mLv8') {
        identifier = value;
        name = `${type} ${value}`;
        break;
      }
    }
    
    // Generate browser link
    const browserLink = `${TESTNET_BROWSER_URL}/${spaceId}/${entityId}`;
    
    return {
      entityId,
      name,
      identifier,
      type,
      browserLink
    };
  });
}

/**
 * Write entity links to CSV
 * 
 * @param {Array} entityLinks The array of entity links
 * @param {string} outputPath The output file path
 */
function writeEntityLinksToCsv(entityLinks, outputPath) {
  // Create CSV header
  const csvHeader = 'Entity ID,Name,Identifier,Type,Browser Link\n';
  
  // Create CSV rows
  const csvRows = entityLinks.map(link => 
    `${link.entityId},"${link.name.replace(/"/g, '""')}","${link.identifier.replace(/"/g, '""')}","${link.type}",${link.browserLink}`
  ).join('\n');
  
  // Write CSV to file
  fs.writeFileSync(outputPath, csvHeader + csvRows);
  
  console.log(`Wrote ${entityLinks.length} entity links to ${outputPath}`);
}

/**
 * Main function
 */
async function main() {
  try {
    // Parse command line arguments
    const args = process.argv.slice(2);
    let outputPath = path.resolve(process.cwd(), 'data/entity-links.csv');
    
    for (let i = 0; i < args.length; i++) {
      const arg = args[i];
      
      if (arg === '--output' && i + 1 < args.length) {
        outputPath = path.resolve(process.cwd(), args[++i]);
      }
    }
    
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
    const deedsTriples = readJson(path.resolve(process.cwd(), 'data/deeds-triples.json'));
    const permitsTriples = readJson(path.resolve(process.cwd(), 'data/permits-triples.json'));
    
    console.log(`Read ${deedsTriples.length} deed entities and ${permitsTriples.length} permit entities`);
    
    // Generate entity links
    const deedLinks = generateEntityLinks(deedsSpaceId, deedsTriples, 'Deed');
    const permitLinks = generateEntityLinks(permitsSpaceId, permitsTriples, 'Permit');
    
    // Combine all entity links
    const allLinks = [...deedLinks, ...permitLinks];
    
    // Create output directory if it doesn't exist
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // Write entity links to CSV
    writeEntityLinksToCsv(allLinks, outputPath);
    
    console.log('Done!');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

// Execute the script
main().catch(console.error);
