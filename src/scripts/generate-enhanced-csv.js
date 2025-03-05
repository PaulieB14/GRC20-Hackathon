/**
 * Generate Enhanced CSV Script
 * 
 * This script reads the original CSV files (GRC20_Deeds.csv and permits.csv),
 * matches them with entity IDs, and adds links to the GRC-20 browser.
 * 
 * Usage:
 *   node src/scripts/generate-enhanced-csv.js [--output <path>]
 */

import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { parse as parseCsv } from 'csv-parse/sync';
import { stringify as stringifyCsv } from 'csv-stringify/sync';

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
 * Read CSV file and return array of objects
 * 
 * @param {string} filePath The path to the CSV file
 * @returns {Array} The parsed CSV data
 */
function readCsv(filePath) {
  const fileContent = fs.readFileSync(filePath, 'utf8');
  return parseCsv(fileContent, {
    columns: true,
    skip_empty_lines: true
  });
}

/**
 * Generate enhanced CSV for deeds
 * 
 * @param {Array} deedsData The original deeds CSV data
 * @param {Array} deedsTriples The deeds triples data
 * @param {string} spaceId The space ID
 * @returns {Array} The enhanced deeds data
 */
function generateEnhancedDeedsData(deedsData, deedsTriples, spaceId) {
  // Create a map of instrument numbers to entity IDs
  const instrumentToEntityMap = new Map();
  
  console.log('Mapping instrument numbers to entity IDs...');
  for (const entity of deedsTriples) {
    let instrumentNumber = '';
    
    // Find the instrument number in the triples
    for (const triple of entity.triples) {
      const attributeId = triple.attributeId || triple.attribute;
      const value = triple.value.value;
      
      if (attributeId === 'LuBWqZAu6pz54eiJS5mLv8') {
        instrumentNumber = value;
        console.log(`Found instrument number ${instrumentNumber} for entity ${entity.entityId}`);
        break;
      }
    }
    
    if (instrumentNumber) {
      instrumentToEntityMap.set(instrumentNumber, entity.entityId);
      console.log(`Mapped instrument number ${instrumentNumber} to entity ID ${entity.entityId}`);
    }
  }
  
  console.log('Instrument to entity map:', Object.fromEntries(instrumentToEntityMap));
  
  // Add entity ID and link to each deed
  console.log('Adding entity IDs and browser links to deeds...');
  return deedsData.map(deed => {
    const instrumentNumber = deed['InstrumentNumber'];
    console.log(`Looking up entity ID for instrument number ${instrumentNumber}`);
    
    const entityId = instrumentToEntityMap.get(instrumentNumber) || '';
    const browserLink = entityId ? `${TESTNET_BROWSER_URL}/${spaceId}/${entityId}` : '';
    
    console.log(`Instrument number ${instrumentNumber} -> Entity ID ${entityId}`);
    
    return {
      ...deed,
      'Entity ID': entityId,
      'Browser Link': browserLink
    };
  });
}

/**
 * Generate enhanced CSV for permits
 * 
 * @param {Array} permitsData The original permits CSV data
 * @param {Array} permitsTriples The permits triples data
 * @param {string} spaceId The space ID
 * @returns {Array} The enhanced permits data
 */
function generateEnhancedPermitsData(permitsData, permitsTriples, spaceId) {
  // Create a map of record numbers to entity IDs
  const recordToEntityMap = new Map();
  
  console.log('Mapping record numbers to entity IDs...');
  for (const entity of permitsTriples) {
    let recordNumber = '';
    
    // Find the record number in the triples
    for (const triple of entity.triples) {
      const attributeId = triple.attributeId || triple.attribute;
      const value = triple.value.value;
      
      if (attributeId === 'LuBWqZAu6pz54eiJS5mLv8') {
        recordNumber = value;
        console.log(`Found record number ${recordNumber} for entity ${entity.entityId}`);
        break;
      }
    }
    
    if (recordNumber) {
      recordToEntityMap.set(recordNumber, entity.entityId);
      console.log(`Mapped record number ${recordNumber} to entity ID ${entity.entityId}`);
    }
  }
  
  console.log('Record to entity map:', Object.fromEntries(recordToEntityMap));
  
  // Print all column names to debug
  if (permitsData.length > 0) {
    console.log('Permit CSV columns:', Object.keys(permitsData[0]));
  }
  
  // Add entity ID and link to each permit
  console.log('Adding entity IDs and browser links to permits...');
  return permitsData.map(permit => {
    // Try different column name formats
    const recordNumber = permit['Record Number""'] || 
                         permit['Record Number'] || 
                         permit['RecordNumber'] || 
                         Object.values(permit).find(val => 
                           typeof val === 'string' && 
                           /^(BR|BC|EBP)-[A-Z]+-\d+-\d+/.test(val)
                         );
    
    console.log(`Looking up entity ID for record number ${recordNumber}`);
    
    const entityId = recordToEntityMap.get(recordNumber) || '';
    const browserLink = entityId ? `${TESTNET_BROWSER_URL}/${spaceId}/${entityId}` : '';
    
    console.log(`Record number ${recordNumber} -> Entity ID ${entityId}`);
    
    return {
      ...permit,
      'Entity ID': entityId,
      'Browser Link': browserLink
    };
  });
}

/**
 * Write data to CSV file
 * 
 * @param {Array} data The data to write
 * @param {string} outputPath The output file path
 */
function writeToCsv(data, outputPath) {
  const csvContent = stringifyCsv(data, { header: true });
  fs.writeFileSync(outputPath, csvContent);
  console.log(`Wrote ${data.length} rows to ${outputPath}`);
}

/**
 * Main function
 */
async function main() {
  try {
    // Parse command line arguments
    const args = process.argv.slice(2);
    let outputDir = path.resolve(process.cwd(), 'data/enhanced');
    
    for (let i = 0; i < args.length; i++) {
      const arg = args[i];
      
      if (arg === '--output' && i + 1 < args.length) {
        outputDir = path.resolve(process.cwd(), args[++i]);
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
    
    // Read triples data
    const deedsTriples = readJson(path.resolve(process.cwd(), 'data/deeds-triples.json'));
    const permitsTriples = readJson(path.resolve(process.cwd(), 'data/permits-triples.json'));
    
    console.log(`Read ${deedsTriples.length} deed entities and ${permitsTriples.length} permit entities`);
    
    // Read original CSV data
    const deedsData = readCsv(path.resolve(process.cwd(), 'data/input/GRC20_Deeds.csv'));
    const permitsData = readCsv(path.resolve(process.cwd(), 'data/input/permits.csv'));
    
    console.log(`Read ${deedsData.length} deed records and ${permitsData.length} permit records from CSV`);
    
    // Generate enhanced data
    const enhancedDeedsData = generateEnhancedDeedsData(deedsData, deedsTriples, deedsSpaceId);
    const enhancedPermitsData = generateEnhancedPermitsData(permitsData, permitsTriples, permitsSpaceId);
    
    // Create output directory if it doesn't exist
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // Write enhanced data to CSV
    writeToCsv(enhancedDeedsData, path.join(outputDir, 'enhanced-deeds.csv'));
    writeToCsv(enhancedPermitsData, path.join(outputDir, 'enhanced-permits.csv'));
    
    console.log('Done!');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

// Execute the script
main().catch(console.error);
