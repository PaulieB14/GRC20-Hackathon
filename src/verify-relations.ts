/**
 * Verify Relations
 * 
 * This script verifies that the relations were successfully added to the knowledge graph.
 * It first lists all entities in the space, then checks the relations for one of them.
 */

import fetch from 'node-fetch';
import * as dotenv from 'dotenv';

dotenv.config();

const SPACE_ID = process.env.SPACE_ID;

interface PropertyValue {
  type: string;
  value: string;
}

interface Properties {
  [key: string]: PropertyValue;
}

interface Relation {
  type: string;
  from: string;
  to: string;
}

interface EntityResponse {
  id: string;
  name?: string;
  relations?: Relation[];
  properties?: Properties;
}

/**
 * Lists all entities in the space
 */
async function listEntities() {
  try {
    console.log(`Listing entities in space ${SPACE_ID}...`);
    
    // Query the GRC-20 API to get all entities in the space
    const response = await fetch(`https://api-testnet.grc-20.thegraph.com/space/${SPACE_ID}/entities`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to get entities: ${response.statusText}`);
    }
    
    const entities = await response.json() as any[];
    console.log(`Found ${entities.length} entities in space ${SPACE_ID}`);
    
    // Log the first 10 entities
    console.log('\nFirst 10 entities:');
    entities.slice(0, 10).forEach((entity, index) => {
      console.log(`${index + 1}. ID: ${entity.id}, Name: ${entity.name || 'N/A'}`);
    });
    
    // Return the first entity ID to check for relations
    if (entities.length > 0) {
      return entities[0].id;
    }
    
    return null;
  } catch (error) {
    console.error('Error listing entities:', error);
    return null;
  }
}

/**
 * Verifies relations for a specific entity
 * @param entityId The ID of the entity to check
 */
async function verifyRelations(entityId: string) {
  try {
    console.log(`\nVerifying relations for entity ${entityId} in space ${SPACE_ID}...`);
    
    // Query the GRC-20 API to get the entity and its relations
    const response = await fetch(`https://api-testnet.grc-20.thegraph.com/space/${SPACE_ID}/entity/${entityId}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to get entity: ${response.statusText}`);
    }
    
    const data = await response.json() as EntityResponse;
    console.log('Entity data:', JSON.stringify(data, null, 2));
    
    // Check if the entity has relations
    if (data.relations && data.relations.length > 0) {
      console.log(`\nFound ${data.relations.length} relations for entity ${entityId}:`);
      
      // Log each relation
      data.relations.forEach((relation, index) => {
        console.log(`\nRelation ${index + 1}:`);
        console.log(`  Type: ${relation.type}`);
        console.log(`  From: ${relation.from}`);
        console.log(`  To: ${relation.to}`);
      });
      
      console.log('\nRelations were successfully added to the knowledge graph!');
    } else {
      console.log(`\nNo relations found for entity ${entityId}.`);
      console.log('The relations may not have been added successfully, or the API may not be returning relations.');
    }
    
    // Check if the entity has properties
    if (data.properties && Object.keys(data.properties).length > 0) {
      console.log(`\nFound ${Object.keys(data.properties).length} properties for entity ${entityId}:`);
      
      // Log each property
      Object.entries(data.properties).forEach(([key, value]) => {
        console.log(`  ${key}: ${value.value}`);
      });
    } else {
      console.log(`\nNo properties found for entity ${entityId}.`);
    }
    
  } catch (error) {
    console.error('Error verifying relations:', error);
  }
}

// Run the verification function
async function main() {
  try {
    // First list all entities
    const entityId = await listEntities();
    
    // Then verify relations for the first entity
    if (entityId) {
      await verifyRelations(entityId);
    } else {
      console.log('No entities found to verify relations.');
    }
  } catch (error) {
    console.error('Error in main function:', error);
  }
}

main().catch(console.error);
