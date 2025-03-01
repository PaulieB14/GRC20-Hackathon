/**
 * Capture Entity IDs
 * 
 * This script captures entity IDs from the GRC-20 browser after publishing.
 * It uses Puppeteer to scrape the entity IDs from the browser and updates the local triples files.
 */

import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

// Space IDs from .env file
const DEEDS_SPACE_ID = process.env.DEEDS_SPACE_ID || 'P77ioa8U9EipVASzVHBA9B';
const PERMITS_SPACE_ID = process.env.PERMITS_SPACE_ID || 'XPZ8fnf3DvNMRDbFgxEZi2';

// Browser URL
const BROWSER_BASE_URL = 'https://geogenesis-git-feat-testnet-geo-browser.vercel.app';

interface Triple {
  attributeId: string;
  entityId: string;
  value: {
    type: string;
    value: string;
  };
}

interface Entity {
  entityId: string;
  triples: Triple[];
}

/**
 * Captures entity IDs from the GRC-20 browser
 * @param spaceId The space ID to capture entities from
 * @param identifierPropertyName The name of the property that uniquely identifies entities (e.g., "Instrument Number" for deeds)
 * @returns A map of identifier values to entity IDs
 */
async function captureEntityIds(spaceId: string, identifierPropertyName: string): Promise<Map<string, string>> {
  console.log(`Capturing entity IDs from space ${spaceId}...`);
  
  const entityMap = new Map<string, string>();
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
    
    // Visit each entity page and extract the entity ID and identifier
    for (const link of entityLinks) {
      const href = await link.evaluate((el: Element) => el.getAttribute('href'));
      if (!href) continue;
      
      const entityId = href.split('/').pop();
      if (!entityId) continue;
      
      // Navigate to the entity page
      const entityUrl = `${BROWSER_BASE_URL}${href}`;
      console.log(`Navigating to ${entityUrl}...`);
      await page.goto(entityUrl, { waitUntil: 'networkidle2' });
      
      // Find the identifier property
      const identifierElement = await page.$(`text/${identifierPropertyName}`);
      if (!identifierElement) {
        console.log(`Could not find ${identifierPropertyName} property for entity ${entityId}.`);
        continue;
      }
      
      // Get the value of the identifier property
      const identifierValue = await page.evaluate((el: Element) => {
        const valueElement = el.nextElementSibling;
        return valueElement && valueElement.textContent ? valueElement.textContent.trim() : null;
      }, identifierElement);
      
      if (!identifierValue) {
        console.log(`Could not find value for ${identifierPropertyName} property for entity ${entityId}.`);
        continue;
      }
      
      console.log(`Found entity ${entityId} with ${identifierPropertyName} = ${identifierValue}.`);
      entityMap.set(identifierValue, entityId);
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
 * Updates the triples file with the captured entity IDs
 * @param filePath Path to the triples file
 * @param entityMap Map of identifier values to entity IDs
 * @param identifierPropertyName The name of the property that uniquely identifies entities
 * @returns True if the file was updated, false otherwise
 */
function updateTriplesFile(filePath: string, entityMap: Map<string, string>, identifierPropertyName: string): boolean {
  try {
    console.log(`Updating ${filePath} with ${entityMap.size} entity IDs...`);
    
    // Read the current triples file
    let triples: Entity[] = [];
    try {
      const data = fs.readFileSync(filePath, 'utf-8');
      triples = JSON.parse(data);
      console.log(`Read ${triples.length} entities from ${filePath}.`);
    } catch (error) {
      console.log(`Error reading ${filePath}: ${error instanceof Error ? error.message : String(error)}`);
      console.log('Creating new triples file...');
      return false;
    }
    
    // If no entities were captured, don't update the file
    if (entityMap.size === 0) {
      console.log('No entities captured, not updating file.');
      return false;
    }
    
    // Update the entity IDs in the triples file
    let updatedCount = 0;
    for (const entity of triples) {
      // Find the identifier triple
      const identifierTriple = entity.triples.find(t => {
        // For deeds, the identifier is the instrument number
        if (identifierPropertyName === 'Instrument Number') {
          return t.value && t.value.type === 'TEXT' && /^\d+$/.test(t.value.value);
        }
        // For permits, the identifier is the record number
        if (identifierPropertyName === 'Record Number') {
          return t.value && t.value.type === 'TEXT' && t.value.value.includes('-');
        }
        return false;
      });
      
      if (identifierTriple) {
        const identifierValue = identifierTriple.value.value;
        const newEntityId = entityMap.get(identifierValue);
        
        if (newEntityId && newEntityId !== entity.entityId) {
          console.log(`Updating entity ID for ${identifierValue}: ${entity.entityId} -> ${newEntityId}`);
          entity.entityId = newEntityId;
          
          // Update the entityId in all triples
          for (const t of entity.triples) {
            t.entityId = newEntityId;
          }
          
          updatedCount++;
        }
      }
    }
    
    // Write the updated triples file
    fs.writeFileSync(filePath, JSON.stringify(triples, null, 2));
    console.log(`Updated ${updatedCount} entity IDs in ${filePath}.`);
    
    return updatedCount > 0;
  } catch (error) {
    console.error(`Error updating ${filePath}:`, error);
    return false;
  }
}

/**
 * Main function to capture entity IDs and update triples files
 */
async function main() {
  try {
    // Capture deed entity IDs
    console.log('\n=== Capturing Deed Entity IDs ===');
    const deedEntityMap = await captureEntityIds(DEEDS_SPACE_ID, 'Instrument Number');
    const deedsUpdated = updateTriplesFile('data/deeds-triples.json', deedEntityMap, 'Instrument Number');
    
    // Capture permit entity IDs
    console.log('\n=== Capturing Permit Entity IDs ===');
    const permitEntityMap = await captureEntityIds(PERMITS_SPACE_ID, 'Record Number');
    const permitsUpdated = updateTriplesFile('data/permits-triples.json', permitEntityMap, 'Record Number');
    
    if (deedsUpdated || permitsUpdated) {
      console.log('\n✅ Entity IDs updated successfully.');
    } else {
      console.log('\n❌ No entity IDs were updated.');
    }
  } catch (error) {
    console.error('Error capturing entity IDs:', error);
  }
}

// Execute if this file is run directly
// In ES modules, we can check if this is the main module by comparing import.meta.url
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}
