/**
 * Ensure Spaces Script
 * 
 * This script checks if the spaces exist and creates them if they don't.
 */

import { TransactionService } from '../services/transaction-service.js';
import { SpaceIds } from '../config/constants.js';
import dotenv from 'dotenv';
import { account } from '../utils/wallet.js';

// Load environment variables
dotenv.config();

/**
 * Main function
 */
async function main(): Promise<void> {
  try {
    console.log('Wallet configured successfully');
    console.log(`Address: ${account.address}`);
    
    // Check if deeds space exists
    const deedsSpaceId = process.env.DEEDS_SPACE_ID || SpaceIds.DEEDS;
    console.log(`Checking if deeds space exists (${deedsSpaceId})...`);
    const deedsSpaceExists = await TransactionService.spaceExists(deedsSpaceId);
    
    if (!deedsSpaceExists) {
      console.log('Deeds space does not exist. Creating it...');
      const newDeedsSpaceId = await TransactionService.createSpace('Deeds Space');
      console.log(`Deeds space created with ID: ${newDeedsSpaceId}`);
    } else {
      console.log('Deeds space exists.');
    }
    
    // Check if permits space exists
    const permitsSpaceId = process.env.PERMITS_SPACE_ID || SpaceIds.PERMITS;
    console.log(`Checking if permits space exists (${permitsSpaceId})...`);
    const permitsSpaceExists = await TransactionService.spaceExists(permitsSpaceId);
    
    if (!permitsSpaceExists) {
      console.log('Permits space does not exist. Creating it...');
      const newPermitsSpaceId = await TransactionService.createSpace('Permits Space');
      console.log(`Permits space created with ID: ${newPermitsSpaceId}`);
    } else {
      console.log('Permits space exists.');
    }
    
    console.log('Done!');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

// Execute the script
if (import.meta.url === new URL(import.meta.url).href) {
  main().catch(console.error);
}
