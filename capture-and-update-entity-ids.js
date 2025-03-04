// capture-and-update-entity-ids.js
import fs from 'fs';
import puppeteer from 'puppeteer';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

dotenv.config();

// Get the current file's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Space IDs from .env file
const DEEDS_SPACE_ID = process.env.DEEDS_SPACE_ID || 'P77ioa8U9EipVASzVHBA9B';

// Browser URL
const BROWSER_BASE_URL = 'https://geogenesis-git-feat-testnet-geo-browser.vercel.app';

/**
 * Captures entity IDs from the GRC-20 browser
 * @param spaceId The space ID to capture entities from
 * @returns A map of instrument numbers to entity IDs
 */
async function captureEntityIds(spaceId) {
  console.log(`Capturing entity IDs from space ${spaceId}...`);
  
  const entityMap = new Map();
  const browser = await puppeteer.launch({ headless: false });
  
  try {
    const page = await browser.newPage();
    
    // Navigate to the space
    const spaceUrl = `${BROWSER_BASE_URL}/space/${spaceId}`;
    console.log(`Navigating to ${spaceUrl}...`);
    await page.goto(spaceUrl, { waitUntil: 'networkidle2' });
    
    // Wait for the space to load
    await page.waitForSelector('body', { timeout: 10000 });
    
    // Check if there's content
    const noContentElement = await page.$('text/There\'s no content here yet');
    if (noContentElement) {
      console.log('No content found in the space.');
      return entityMap;
    }
    
    // Find all entity links
    const entityLinks = await page.$$('a[href*="/entity/"]');
    console.log(`Found ${entityLinks.length} entity links.`);
    
    // Visit each entity page and extract the entity ID and instrument number
    for (const link of entityLinks) {
      const href = await link.evaluate((el) => el.getAttribute('href'));
      if (!href) continue;
      
      const entityId = href.split('/').pop();
      if (!entityId) continue;
      
      // Navigate to the entity page
      const entityUrl = `${BROWSER_BASE_URL}${href}`;
      console.log(`Navigating to ${entityUrl}...`);
      await page.goto(entityUrl, { waitUntil: 'networkidle2' });
      
      // Find the instrument number property
      const instrumentElement = await page.$('text/Instrument Number');
      if (!instrumentElement) {
        console.log(`Could not find Instrument Number property for entity ${entityId}.`);
        continue;
      }
      
      // Get the value of the instrument number property
      const instrumentNumber = await page.evaluate((el) => {
        const valueElement = el.nextElementSibling;
        return valueElement && valueElement.textContent ? valueElement.textContent.trim() : null;
      }, instrumentElement);
      
      if (!instrumentNumber) {
        console.log(`Could not find value for Instrument Number property for entity ${entityId}.`);
        continue;
      }
      
      console.log(`Found entity ${entityId} with Instrument Number = ${instrumentNumber}.`);
      entityMap.set(instrumentNumber, entityId);
    }
    
    return entityMap;
  } catch (error) {
    console.error(`Error capturing entity IDs from space ${spaceId}:`, error);
    return entityMap;
  } finally {
    await browser.close();
  }
}

/**
 * Updates the entity-id-mapping.json file with the captured entity IDs
 * @param instrumentToEntityMap Map of instrument numbers to entity IDs
 * @returns True if the file was updated, false otherwise
 */
function updateEntityIdMapping(instrumentToEntityMap) {
  try {
    console.log(`Updating entity-id-mapping.json with ${instrumentToEntityMap.size} entity IDs...`);
    
    // Read the current entity-id-mapping.json file
    let idMapping = {};
    try {
      const data = fs.readFileSync(path.join(__dirname, 'data', 'entity-id-mapping.json'), 'utf-8');
      idMapping = JSON.parse(data);
      console.log(`Read ${Object.keys(idMapping).length} mappings from entity-id-mapping.json.`);
    } catch (error) {
      console.log(`Error reading entity-id-mapping.json: ${error.message}`);
      console.log('Creating new entity-id-mapping.json file...');
    }
    
    // Read the deeds-triples.json file to get the old entity IDs
    let deedsData = [];
    try {
      const data = fs.readFileSync(path.join(__dirname, 'data', 'deeds-triples.json'), 'utf-8');
      deedsData = JSON.parse(data);
      console.log(`Read ${deedsData.length} entities from deeds-triples.json.`);
    } catch (error) {
      console.error(`Error reading deeds-triples.json: ${error.message}`);
      return false;
    }
    
    // Create a mapping of instrument numbers to old entity IDs
    const instrumentToOldEntityMap = new Map();
    for (const entity of deedsData) {
      const instrumentTriple = entity.triples.find(
        triple => triple.attributeId === 'LuBWqZAu6pz54eiJS5mLv8'
      );
      
      if (instrumentTriple) {
        const instrumentNumber = instrumentTriple.value.value;
        instrumentToOldEntityMap.set(instrumentNumber, entity.entityId);
      }
    }
    
    // Update the entity ID mapping
    let updatedCount = 0;
    const newIdMapping = { ...idMapping };
    
    for (const [instrumentNumber, newEntityId] of instrumentToEntityMap.entries()) {
      const oldEntityId = instrumentToOldEntityMap.get(instrumentNumber);
      
      if (oldEntityId) {
        // Check if the mapping has changed
        if (idMapping[oldEntityId] !== newEntityId) {
          console.log(`Updating mapping for ${oldEntityId}: ${idMapping[oldEntityId] || 'undefined'} -> ${newEntityId}`);
          newIdMapping[oldEntityId] = newEntityId;
          updatedCount++;
        }
      }
    }
    
    // Write the updated entity ID mapping
    fs.writeFileSync(path.join(__dirname, 'data', 'entity-id-mapping.json'), JSON.stringify(newIdMapping, null, 2));
    console.log(`Updated ${updatedCount} entity ID mappings in entity-id-mapping.json.`);
    
    // Create a log entry for auditing
    const logEntry = {
      timestamp: new Date().toISOString(),
      action: 'capture-and-update-entity-ids',
      mappingsUpdated: updatedCount,
      newMappings: newIdMapping
    };
    
    // Append to log file
    const logFilePath = path.join(__dirname, 'data', 'entity-updates.log');
    let logs = [];
    try {
      if (fs.existsSync(logFilePath)) {
        logs = JSON.parse(fs.readFileSync(logFilePath, 'utf8'));
      }
    } catch (error) {
      console.error(`Error reading log file: ${error.message}`);
    }
    
    logs.push(logEntry);
    fs.writeFileSync(logFilePath, JSON.stringify(logs, null, 2));
    console.log(`Log entry added to ${logFilePath}`);
    
    return updatedCount > 0;
  } catch (error) {
    console.error(`Error updating entity-id-mapping.json:`, error);
    return false;
  }
}

/**
 * Main function to capture entity IDs and update the entity ID mapping
 */
async function main() {
  try {
    // Capture deed entity IDs
    console.log('\n=== Capturing Deed Entity IDs ===');
    const instrumentToEntityMap = await captureEntityIds(DEEDS_SPACE_ID);
    
    if (instrumentToEntityMap.size === 0) {
      console.log('No entity IDs captured. Exiting...');
      return;
    }
    
    // Update the entity ID mapping
    const updated = updateEntityIdMapping(instrumentToEntityMap);
    
    if (updated) {
      console.log('\n✅ Entity ID mapping updated successfully.');
    } else {
      console.log('\n❌ No entity ID mappings were updated.');
    }
  } catch (error) {
    console.error('Error capturing and updating entity IDs:', error);
  }
}

// Execute the main function
main().catch(console.error);
