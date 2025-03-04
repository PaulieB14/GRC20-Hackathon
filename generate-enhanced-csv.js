/**
 * Generate Enhanced CSV
 * 
 * This script reads the input CSV files (deeds or permits) and generates enhanced CSV files
 * that include all the original columns plus the entity ID and URL.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createReadStream } from 'fs';
import { createObjectCsvWriter } from 'csv-writer';
import csv from 'csv-parser';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const config = {
  deeds: {
    inputFile: path.join(__dirname, 'data', 'GRC20_Deeds.csv'),
    mappingFile: path.join(__dirname, 'data', 'entity-ids.json'),
    outputFile: path.join(__dirname, 'data', 'enhanced-deeds.csv'),
    spaceId: 'P77ioa8U9EipVASzVHBA9B',
    idField: 'InstrumentNumber'
  },
  permits: {
    inputFile: path.join(__dirname, 'data', 'permits.csv'),
    mappingFile: path.join(__dirname, 'data', 'permit-entity-ids.json'),
    outputFile: path.join(__dirname, 'data', 'enhanced-permits.csv'),
    spaceId: 'XPZ8fnf3DvNMRDbFgxEZi2',
    idField: 'Record Number'
  }
};

/**
 * Generate entity URL
 * 
 * @param {string} spaceId The space ID
 * @param {string} entityId The entity ID
 * @returns {string} The entity URL
 */
function generateEntityUrl(spaceId, entityId) {
  return `https://geogenesis-git-feat-testnet-geo-browser.vercel.app/space/${spaceId}/${entityId}`;
}

/**
 * Load entity mappings from file
 * 
 * @param {string} mappingFile The mapping file path
 * @returns {Object} The entity mappings
 */
function loadEntityMappings(mappingFile) {
  try {
    if (fs.existsSync(mappingFile)) {
      const data = fs.readFileSync(mappingFile, 'utf8');
      const mappings = JSON.parse(data);
      console.log(`Loaded ${Object.keys(mappings).length} entity mappings from ${mappingFile}`);
      return mappings;
    }
  } catch (error) {
    console.error(`Error loading entity mappings from ${mappingFile}:`, error);
  }
  return {};
}

/**
 * Process CSV file and generate enhanced CSV
 * 
 * @param {string} type The type of data to process ('deeds' or 'permits')
 */
async function processCSV(type) {
  const { inputFile, mappingFile, outputFile, spaceId, idField } = config[type];
  
  // Load entity mappings
  const entityMappings = loadEntityMappings(mappingFile);
  
  // Read input CSV
  const records = [];
  
  await new Promise((resolve, reject) => {
    createReadStream(inputFile)
      .pipe(csv())
      .on('data', (data) => {
        records.push(data);
      })
      .on('end', () => {
        console.log(`Read ${records.length} records from ${inputFile}`);
        resolve();
      })
      .on('error', (error) => {
        reject(error);
      });
  });
  
  // Determine headers from the first record
  const headers = Object.keys(records[0] || {});
  
  // Create CSV writer
  const csvWriter = createObjectCsvWriter({
    path: outputFile,
    header: [
      ...headers.map(header => ({ id: header, title: header })),
      { id: 'entityId', title: 'Entity ID' },
      { id: 'entityUrl', title: 'Entity URL' }
    ]
  });
  
  // Enhance records with entity ID and URL
  const enhancedRecords = records.map(record => {
    const id = record[idField];
    const entityId = entityMappings[id];
    const entityUrl = entityId ? generateEntityUrl(spaceId, entityId) : '';
    
    return {
      ...record,
      entityId: entityId || '',
      entityUrl: entityUrl
    };
  });
  
  // Write enhanced CSV
  await csvWriter.writeRecords(enhancedRecords);
  
  console.log(`Generated enhanced CSV at ${outputFile}`);
}

/**
 * Main function
 */
async function main() {
  const type = process.argv[2];
  
  if (!type || (type !== 'deeds' && type !== 'permits' && type !== 'all')) {
    console.log('Usage: node generate-enhanced-csv.js [deeds|permits|all]');
    process.exit(1);
  }
  
  if (type === 'deeds' || type === 'all') {
    await processCSV('deeds');
  }
  
  if (type === 'permits' || type === 'all') {
    await processCSV('permits');
  }
  
  console.log('Done!');
}

// Run the script
main().catch(error => {
  console.error('Error:', error);
  process.exit(1);
});
