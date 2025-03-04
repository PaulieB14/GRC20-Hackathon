/**
 * Deploy and Publish Script
 * 
 * This script deploys spaces for Property deeds and Property Permits and pushes data.
 * It ensures spaces exist, sets up the ontology, and publishes the data.
 * 
 * Usage:
 *   npx ts-node src/scripts/deploy-and-publish.ts
 */

import { TransactionService } from '../services/transaction-service.js';
import { OntologyService } from '../services/ontology-service.js';
import { SpaceIds } from '../config/constants.js';
import dotenv from 'dotenv';
import { account } from '../utils/wallet.js';
import { execSync } from 'child_process';

// Load environment variables
dotenv.config();

/**
 * Main function
 */
async function main(): Promise<void> {
  try {
    console.log('Starting deployment and publishing process...');
    console.log('Wallet configured successfully');
    console.log(`Address: ${account.address}`);
    
    // Add debug logs
    console.log('Debug: SpaceIds.DEEDS =', SpaceIds.DEEDS);
    console.log('Debug: SpaceIds.PERMITS =', SpaceIds.PERMITS);
    console.log('Debug: process.env.DEEDS_SPACE_ID =', process.env.DEEDS_SPACE_ID);
    console.log('Debug: process.env.PERMITS_SPACE_ID =', process.env.PERMITS_SPACE_ID);
    
    // Step 1: Ensure spaces exist
    console.log('\n=== STEP 1: ENSURING SPACES EXIST ===');
    
    // Check if deeds space exists
    const deedsSpaceId = process.env.DEEDS_SPACE_ID || SpaceIds.DEEDS;
    console.log(`Checking if deeds space exists (${deedsSpaceId})...`);
    const deedsSpaceExists = await TransactionService.spaceExists(deedsSpaceId);
    
    let actualDeedsSpaceId = deedsSpaceId;
    if (!deedsSpaceExists) {
      console.log('Deeds space does not exist. Creating it...');
      actualDeedsSpaceId = await TransactionService.createSpace('Deeds Space');
      console.log(`Deeds space created with ID: ${actualDeedsSpaceId}`);
    } else {
      console.log('Deeds space exists.');
    }
    
    // Check if permits space exists
    const permitsSpaceId = process.env.PERMITS_SPACE_ID || SpaceIds.PERMITS;
    console.log(`Checking if permits space exists (${permitsSpaceId})...`);
    const permitsSpaceExists = await TransactionService.spaceExists(permitsSpaceId);
    
    let actualPermitsSpaceId = permitsSpaceId;
    if (!permitsSpaceExists) {
      console.log('Permits space does not exist. Creating it...');
      actualPermitsSpaceId = await TransactionService.createSpace('Permits Space');
      console.log(`Permits space created with ID: ${actualPermitsSpaceId}`);
    } else {
      console.log('Permits space exists.');
    }
    
    // Step 2: Set up ontology
    console.log('\n=== STEP 2: SETTING UP ONTOLOGY ===');
    console.log('Setting up ontology for deeds space...');
    await OntologyService.setupDeedOntology(actualDeedsSpaceId);
    
    console.log('Setting up ontology for permits space...');
    await OntologyService.setupPermitOntology(actualPermitsSpaceId);
    
    // Step 3: Publish deeds
    console.log('\n=== STEP 3: PUBLISHING DEEDS ===');
    console.log('Running publish-deeds script...');
    execSync(`npx ts-node src/scripts/publish-deeds.ts --space-id ${actualDeedsSpaceId}`, { stdio: 'inherit' });
    
    // Step 4: Publish permits
    console.log('\n=== STEP 4: PUBLISHING PERMITS ===');
    console.log('Running publish-permits script...');
    execSync(`npx ts-node src/scripts/publish-permits.ts --space-id ${actualPermitsSpaceId}`, { stdio: 'inherit' });
    
    console.log('\n=== DEPLOYMENT AND PUBLISHING COMPLETE ===');
    console.log(`Deeds space ID: ${actualDeedsSpaceId}`);
    console.log(`Permits space ID: ${actualPermitsSpaceId}`);
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
