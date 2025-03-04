/**
 * Update All Entities
 *
 * This script updates all entity IDs in the triples files and working-deed-ids.json.
 * It uses Puppeteer to capture entity IDs from the GRC-20 browser and updates the local files.
 */
import puppeteer from 'puppeteer';
import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config();
// Space IDs from .env file
const DEEDS_SPACE_ID = process.env.DEEDS_SPACE_ID || 'P77ioa8U9EipVASzVHBA9B';
const PERMITS_SPACE_ID = process.env.PERMITS_SPACE_ID || 'XPZ8fnf3DvNMRDbFgxEZi2';
// Browser URL
const BROWSER_BASE_URL = 'https://geogenesis-git-feat-testnet-geo-browser.vercel.app';
// File paths
const DEEDS_TRIPLES_PATH = 'data/deeds-triples.json';
const PERMITS_TRIPLES_PATH = 'data/permits-triples.json';
const WORKING_DEED_IDS_PATH = 'data/working-deed-ids.json';
/**
 * Captures entity IDs from the GRC-20 browser
 * @param spaceId The space ID to capture entities from
 * @param identifierPropertyName The name of the property that uniquely identifies entities (e.g., "Instrument Number" for deeds)
 * @returns A map of identifier values to entity IDs
 */
async function captureEntityIds(spaceId, identifierPropertyName) {
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
        // Visit each entity page and extract the entity ID and identifier
        for (const link of entityLinks) {
            const href = await link.evaluate((el) => el.getAttribute('href'));
            if (!href)
                continue;
            const entityId = href.split('/').pop();
            if (!entityId)
                continue;
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
            const identifierValue = await page.evaluate((el) => {
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
    }
    catch (error) {
        console.error(`Error capturing entity IDs from space ${spaceId}:`, error);
        return entityMap;
    }
    finally {
        await browser.close();
    }
}
/**
 * Updates the deeds triples file with the captured entity IDs
 * @param filePath Path to the triples file
 * @param entityMap Map of identifier values to entity IDs
 * @returns A list of updated entity IDs
 */
function updateDeedsTriples(filePath, entityMap) {
    try {
        console.log(`Updating ${filePath} with ${entityMap.size} entity IDs...`);
        // Read the current triples file
        let triples = [];
        try {
            const data = fs.readFileSync(filePath, 'utf-8');
            triples = JSON.parse(data);
            console.log(`Read ${triples.length} entities from ${filePath}.`);
        }
        catch (error) {
            console.log(`Error reading ${filePath}: ${error instanceof Error ? error.message : String(error)}`);
            console.log('Creating new triples file...');
            return [];
        }
        // If no entities were captured, don't update the file
        if (entityMap.size === 0) {
            console.log('No entities captured, not updating file.');
            return [];
        }
        // Update the entity IDs in the triples file
        let updatedCount = 0;
        const updatedEntityIds = [];
        for (const entity of triples) {
            // Find the instrument number triple
            const instrumentNumberTriple = entity.triples.find(t => t.value && t.value.type === 'TEXT' && /^\d+$/.test(t.value.value));
            if (instrumentNumberTriple) {
                const instrumentNumber = instrumentNumberTriple.value.value;
                const newEntityId = entityMap.get(instrumentNumber);
                if (newEntityId && newEntityId !== entity.entityId) {
                    console.log(`Updating entity ID for ${instrumentNumber}: ${entity.entityId} -> ${newEntityId}`);
                    entity.entityId = newEntityId;
                    // Update the entityId in all triples
                    for (const t of entity.triples) {
                        if (t.entityId) {
                            t.entityId = newEntityId;
                        }
                    }
                    updatedCount++;
                }
                // Add the entity ID to the list of updated entity IDs
                updatedEntityIds.push(entity.entityId);
            }
        }
        // Write the updated triples file
        fs.writeFileSync(filePath, JSON.stringify(triples, null, 2));
        console.log(`Updated ${updatedCount} entity IDs in ${filePath}.`);
        return updatedEntityIds;
    }
    catch (error) {
        console.error(`Error updating ${filePath}:`, error);
        return [];
    }
}
/**
 * Updates the permits triples file with the captured entity IDs
 * @param filePath Path to the triples file
 * @param entityMap Map of identifier values to entity IDs
 * @returns True if the file was updated, false otherwise
 */
function updatePermitsTriples(filePath, entityMap) {
    try {
        console.log(`Updating ${filePath} with ${entityMap.size} entity IDs...`);
        // Read the current triples file
        let triples = [];
        try {
            const data = fs.readFileSync(filePath, 'utf-8');
            triples = JSON.parse(data);
            console.log(`Read ${triples.length} entities from ${filePath}.`);
        }
        catch (error) {
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
            // Find the record number triple
            const recordNumberTriple = entity.triples.find(t => t.value && t.value.type === 'TEXT' &&
                (t.value.value.includes('-') || /^[A-Z]+-\d+-\d+/.test(t.value.value)));
            if (recordNumberTriple) {
                const recordNumber = recordNumberTriple.value.value;
                const newEntityId = entityMap.get(recordNumber);
                if (newEntityId && newEntityId !== entity.entityId) {
                    console.log(`Updating entity ID for ${recordNumber}: ${entity.entityId} -> ${newEntityId}`);
                    entity.entityId = newEntityId;
                    // Update the entityId in all triples
                    for (const t of entity.triples) {
                        if (t.entity) {
                            t.entity = newEntityId;
                        }
                    }
                    updatedCount++;
                }
            }
        }
        // Write the updated triples file
        fs.writeFileSync(filePath, JSON.stringify(triples, null, 2));
        console.log(`Updated ${updatedCount} entity IDs in ${filePath}.`);
        return updatedCount > 0;
    }
    catch (error) {
        console.error(`Error updating ${filePath}:`, error);
        return false;
    }
}
/**
 * Updates the working deed IDs file with the captured entity IDs
 * @param filePath Path to the working deed IDs file
 * @param entityIds List of entity IDs
 * @returns True if the file was updated, false otherwise
 */
function updateWorkingDeedIds(filePath, entityIds) {
    try {
        console.log(`Updating ${filePath} with ${entityIds.length} entity IDs...`);
        // Write the updated working deed IDs file
        fs.writeFileSync(filePath, JSON.stringify(entityIds, null, 2));
        console.log(`Updated ${entityIds.length} entity IDs in ${filePath}.`);
        return true;
    }
    catch (error) {
        console.error(`Error updating ${filePath}:`, error);
        return false;
    }
}
/**
 * Main function to update all entity IDs
 */
async function updateAllEntities() {
    try {
        // Capture deed entity IDs
        console.log('\n=== Capturing Deed Entity IDs ===');
        const deedEntityMap = await captureEntityIds(DEEDS_SPACE_ID, 'Instrument Number');
        const updatedDeedEntityIds = updateDeedsTriples(DEEDS_TRIPLES_PATH, deedEntityMap);
        // Update working deed IDs
        console.log('\n=== Updating Working Deed IDs ===');
        const workingDeedIdsUpdated = updateWorkingDeedIds(WORKING_DEED_IDS_PATH, updatedDeedEntityIds);
        // Capture permit entity IDs
        console.log('\n=== Capturing Permit Entity IDs ===');
        const permitEntityMap = await captureEntityIds(PERMITS_SPACE_ID, 'Record Number');
        const permitsUpdated = updatePermitsTriples(PERMITS_TRIPLES_PATH, permitEntityMap);
        if (updatedDeedEntityIds.length > 0 || permitsUpdated || workingDeedIdsUpdated) {
            console.log('\n✅ Entity IDs updated successfully.');
        }
        else {
            console.log('\n❌ No entity IDs were updated.');
        }
    }
    catch (error) {
        console.error('Error updating entity IDs:', error);
    }
}
// Execute if this file is run directly
if (import.meta.url === new URL(import.meta.url).href) {
    updateAllEntities().catch(console.error);
}
