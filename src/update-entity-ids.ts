import fetch from 'node-fetch';
import fs from 'fs';
import { readFileSync, writeFileSync } from 'fs';
import dotenv from 'dotenv';

dotenv.config();

// Space IDs
const DEEDS_SPACE_ID = 'P77ioa8U9EipVASzVHBA9B';
const PERMITS_SPACE_ID = 'XPZ8fnf3DvNMRDbFgxEZi2';

// API endpoints
const API_BASE_URL = 'https://api-testnet.grc-20.thegraph.com';
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
 * Fetches entities from the GRC-20 API
 * @param spaceId The space ID to fetch entities from
 * @returns Array of entities
 */
async function fetchEntities(spaceId: string): Promise<any[]> {
  try {
    console.log(`Fetching entities from space ${spaceId}...`);
    
    // Try different API endpoints
    const endpoints = [
      `${API_BASE_URL}/space/${spaceId}/entities`,
      `${API_BASE_URL}/spaces/${spaceId}/entities`,
      `${API_BASE_URL}/v1/space/${spaceId}/entities`,
      `${API_BASE_URL}/v1/spaces/${spaceId}/entities`
    ];
    
    let entities = [];
    let success = false;
    
    for (const endpoint of endpoints) {
      try {
        console.log(`Trying endpoint: ${endpoint}`);
        const response = await fetch(endpoint);
        
        if (response.ok) {
          const data = await response.json() as any[];
          console.log(`Successfully fetched ${data.length} entities from ${endpoint}`);
          entities = data;
          success = true;
          break;
        } else {
          console.log(`Endpoint ${endpoint} returned ${response.status}: ${response.statusText}`);
        }
      } catch (error: any) {
        console.log(`Error fetching from ${endpoint}: ${error.message}`);
      }
    }
    
    if (!success) {
      console.log('All API endpoints failed. Trying to parse entity IDs from browser URLs...');
      
      // If all API endpoints fail, try to parse entity IDs from browser URLs
      // This is a fallback method that might not work in all cases
      const browserUrl = `${BROWSER_BASE_URL}/space/${spaceId}`;
      console.log(`Fetching HTML from ${browserUrl}...`);
      
      try {
        const response = await fetch(browserUrl);
        if (response.ok) {
          const html = await response.text();
          
          // Extract entity IDs from HTML
          const entityIdRegex = /\/entity\/([a-zA-Z0-9]+)/g;
          const matches = html.matchAll(entityIdRegex);
          
          const entityIds = new Set<string>();
          for (const match of matches) {
            entityIds.add(match[1]);
          }
          
          console.log(`Found ${entityIds.size} entity IDs in HTML`);
          
          // Create dummy entities with just the ID
          entities = Array.from(entityIds).map(id => ({ id }));
        } else {
          console.log(`Browser URL returned ${response.status}: ${response.statusText}`);
        }
      } catch (error: any) {
        console.log(`Error fetching from browser URL: ${error.message}`);
      }
    }
    
    return entities;
  } catch (error) {
    console.error(`Error fetching entities from space ${spaceId}:`, error);
    return [];
  }
}

/**
 * Updates the triples file with the current entity IDs
 * @param filePath Path to the triples file
 * @param entities Array of entities from the GRC-20 API
 * @returns True if the file was updated, false otherwise
 */
async function updateTriplesFile(filePath: string, entities: any[]): Promise<boolean> {
  try {
    console.log(`Updating ${filePath} with ${entities.length} entities...`);
    
    // Read the current triples file
    let triples: Entity[] = [];
    try {
      const data = readFileSync(filePath, 'utf-8');
      triples = JSON.parse(data);
      console.log(`Read ${triples.length} entities from ${filePath}`);
    } catch (error: any) {
      console.log(`Error reading ${filePath}: ${error.message}`);
      console.log('Creating new triples file...');
    }
    
    // If no entities were fetched, don't update the file
    if (entities.length === 0) {
      console.log('No entities fetched, not updating file');
      return false;
    }
    
    // Create a mapping of entity names to entity IDs
    const entityIdMap = new Map<string, string>();
    for (const entity of entities) {
      if (entity.name) {
        entityIdMap.set(entity.name, entity.id);
      }
    }
    
    // If we couldn't get entity names, we can't update the file
    if (entityIdMap.size === 0) {
      console.log('Could not get entity names, not updating file');
      return false;
    }
    
    // Update the entity IDs in the triples file
    let updatedCount = 0;
    for (const triple of triples) {
      // Find the instrument number triple
      const instrumentNumberTriple = triple.triples.find(t => 
        t.value && t.value.type === 'TEXT' && /^\d+$/.test(t.value.value)
      );
      
      if (instrumentNumberTriple) {
        const instrumentNumber = instrumentNumberTriple.value.value;
        const newEntityId = entityIdMap.get(instrumentNumber);
        
        if (newEntityId && newEntityId !== triple.entityId) {
          console.log(`Updating entity ID for ${instrumentNumber}: ${triple.entityId} -> ${newEntityId}`);
          triple.entityId = newEntityId;
          
          // Update the entityId in all triples
          for (const t of triple.triples) {
            t.entityId = newEntityId;
          }
          
          updatedCount++;
        }
      }
    }
    
    // Write the updated triples file
    writeFileSync(filePath, JSON.stringify(triples, null, 2));
    console.log(`Updated ${updatedCount} entity IDs in ${filePath}`);
    
    return updatedCount > 0;
  } catch (error) {
    console.error(`Error updating ${filePath}:`, error);
    return false;
  }
}

/**
 * Main function to update entity IDs in triples files
 */
async function updateEntityIds(): Promise<void> {
  try {
    // Update deeds triples
    console.log('\n=== Updating Deeds Entity IDs ===');
    const deedsEntities = await fetchEntities(DEEDS_SPACE_ID);
    const deedsUpdated = await updateTriplesFile('data/deeds-triples.json', deedsEntities);
    
    // Update permits triples
    console.log('\n=== Updating Permits Entity IDs ===');
    const permitsEntities = await fetchEntities(PERMITS_SPACE_ID);
    const permitsUpdated = await updateTriplesFile('data/permits-triples.json', permitsEntities);
    
    if (deedsUpdated || permitsUpdated) {
      console.log('\n✅ Entity IDs updated successfully');
    } else {
      console.log('\n❌ No entity IDs were updated');
    }
  } catch (error) {
    console.error('Error updating entity IDs:', error);
  }
}

// Execute if running directly
if (import.meta.url === new URL(import.meta.url).href) {
  updateEntityIds().catch(console.error);
}
