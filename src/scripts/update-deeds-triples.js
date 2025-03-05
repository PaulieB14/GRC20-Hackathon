/**
 * Update Deeds Triples Script
 * 
 * This script reads the property addresses from property-addresses.json,
 * updates the deeds triples with the property addresses, and saves the
 * updated triples to deeds-triples.json.
 * 
 * Usage:
 *   node src/scripts/update-deeds-triples.js
 */

import fs from 'fs';
import path from 'path';

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
 * Write object to JSON file
 * 
 * @param {string} filePath The path to the JSON file
 * @param {object} data The data to write
 */
function writeJson(filePath, data) {
  const fileContent = JSON.stringify(data, null, 2);
  fs.writeFileSync(filePath, fileContent);
}

/**
 * Update deeds triples with property addresses
 * 
 * @param {Array} deedsTriples The deeds triples data
 * @param {object} propertyAddresses The property addresses mapping
 * @returns {Array} The updated deeds triples
 */
function updateDeedsTriples(deedsTriples, propertyAddresses) {
  console.log(`Updating ${deedsTriples.length} deeds with property addresses...`);
  
  // Create a new array to hold the updated triples
  const updatedTriples = [];
  
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
      updatedTriples.push(deedTriples);
      continue;
    }
    
    // Get the property address for this instrument number
    const propertyAddress = propertyAddresses[instrumentNumber];
    if (!propertyAddress) {
      console.warn(`Warning: No property address found for instrument number ${instrumentNumber}`);
      updatedTriples.push(deedTriples);
      continue;
    }
    
    console.log(`Found property address for instrument number ${instrumentNumber}: ${propertyAddress}`);
    
    // Check if the property address is already in the triples
    let hasPropertyAddress = false;
    for (const triple of triples) {
      const attributeId = triple.attributeId || triple.attribute;
      
      // Use a new attribute ID for property address
      if (attributeId === 'PropertyAddress') {
        hasPropertyAddress = true;
        break;
      }
    }
    
    if (hasPropertyAddress) {
      console.log(`Property address already exists for deed ${entityId}`);
      updatedTriples.push(deedTriples);
      continue;
    }
    
    // Add the property address to the triples
    const updatedDeedTriples = {
      entityId,
      triples: [
        ...triples,
        {
          attributeId: 'PropertyAddress',
          entityId,
          value: {
            type: 'TEXT',
            value: propertyAddress
          }
        }
      ]
    };
    
    console.log(`Added property address to deed ${entityId}`);
    updatedTriples.push(updatedDeedTriples);
  }
  
  console.log(`Updated ${updatedTriples.length} deeds with property addresses`);
  return updatedTriples;
}

/**
 * Main function
 */
async function main() {
  try {
    // Read property addresses from file
    const propertyAddresses = readJson(path.resolve(process.cwd(), 'data/mapping/property-addresses.json'));
    console.log(`Read ${Object.keys(propertyAddresses).length} property addresses`);
    
    // Read deeds triples from file
    const deedsTriples = readJson(path.resolve(process.cwd(), 'data/deeds-triples.json'));
    console.log(`Read ${deedsTriples.length} deed entities`);
    
    // Update deeds triples with property addresses
    const updatedDeedsTriples = updateDeedsTriples(deedsTriples, propertyAddresses);
    
    // Write updated deeds triples to file
    writeJson(path.resolve(process.cwd(), 'data/deeds-triples.json'), updatedDeedsTriples);
    console.log(`Wrote ${updatedDeedsTriples.length} deed entities to data/deeds-triples.json`);
    
    console.log('Done!');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

// Execute the script
main().catch(console.error);
