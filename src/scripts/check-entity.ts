/**
 * Check Entity Script
 * 
 * This script checks if an entity exists on the GRC-20 network.
 * 
 * Usage:
 *   npx ts-node src/scripts/check-entity.ts [--space-id <id>] [--entity-id <id>]
 */

import { SpaceIds } from '../config/constants.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * Check if an entity exists on the GRC-20 network
 * 
 * @param spaceId The space ID
 * @param entityId The entity ID
 * @returns A promise that resolves to true if the entity exists, false otherwise
 */
async function checkEntity(spaceId: string, entityId: string): Promise<boolean> {
  try {
    const url = `https://geogenesis-git-feat-testnet-geo-browser.vercel.app/space/${spaceId}/${entityId}`;
    console.log(`Checking entity at ${url}...`);
    
    // Use the global fetch API
    const response = await fetch(url);
    
    console.log(`Response status: ${response.status}`);
    
    // Check if the response is a success
    if (response.status === 200) {
      // Try to parse the response body as text
      const text = await response.text();
      
      // Check if the response body contains an error message
      if (text.includes('not found') || text.includes('error')) {
        console.log(`Entity does not exist at ${url} (response contains error message)`);
        return false;
      } else {
        console.log(`Entity exists at ${url}`);
        return true;
      }
    } else {
      console.log(`Entity does not exist at ${url} (status: ${response.status})`);
      return false;
    }
  } catch (error) {
    console.error('Error checking entity:', error);
    return false;
  }
}

/**
 * Main function
 */
async function main(): Promise<void> {
  try {
    // Parse command line arguments
    const args = process.argv.slice(2);
    let spaceId = SpaceIds.DEEDS;
    let entityId = 'deed-2025035356'; // Default entity ID
    
    for (let i = 0; i < args.length; i++) {
      const arg = args[i];
      
      if (arg === '--space-id' && i + 1 < args.length) {
        spaceId = args[++i];
      } else if (arg === '--entity-id' && i + 1 < args.length) {
        entityId = args[++i];
      }
    }
    
    if (!spaceId) {
      throw new Error('Space ID is required. Set DEEDS_SPACE_ID in .env file or provide it with --space-id.');
    }
    
    if (!entityId) {
      throw new Error('Entity ID is required. Provide it with --entity-id.');
    }
    
    console.log(`Using space ID: ${spaceId}`);
    console.log(`Using entity ID: ${entityId}`);
    
    // Check if the entity exists
    const exists = await checkEntity(spaceId, entityId);
    
    if (exists) {
      console.log('Entity exists on the GRC-20 network.');
    } else {
      console.log('Entity does not exist on the GRC-20 network.');
      console.log('This could be because:');
      console.log('1. The data has not been indexed yet by the GRC-20 network');
      console.log('2. The mock implementation in the TransactionService does not actually publish to the GRC-20 network');
      console.log('3. The space ID or entity ID is incorrect');
    }
    
    console.log('Done!');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

// Execute the script
main().catch(console.error);
