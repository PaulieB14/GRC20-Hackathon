/**
 * Create and Publish Script
 * 
 * This script creates spaces and publishes data to them.
 */

import { TransactionService } from '../services/transaction-service.js';
import { SpaceIds } from '../config/constants.js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
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
    
    // Step 1: Create spaces
    console.log('Creating spaces...');
    
    // Create deeds space
    console.log('Creating deeds space...');
    const deedsSpaceId = await TransactionService.createSpace('Deeds Space');
    console.log(`Deeds space created with ID: ${deedsSpaceId}`);
    
    // Create permits space
    console.log('Creating permits space...');
    const permitsSpaceId = await TransactionService.createSpace('Permits Space');
    console.log(`Permits space created with ID: ${permitsSpaceId}`);
    
    // Step 2: Set up ontology
    console.log('Setting up ontology...');
    
    // TODO: Add ontology setup code
    
    // Step 3: Publish deeds
    console.log('Publishing deeds...');
    
    // Execute the publish-deeds script as a child process
    console.log('Running publish-deeds script...');
    const { execSync } = await import('child_process');
    execSync('npm run publish-deeds', { stdio: 'inherit' });
    
    // Step 4: Publish permits
    console.log('Publishing permits...');
    
    // Execute the publish-permits script as a child process
    console.log('Running publish-permits script...');
    execSync('npm run publish-permits', { stdio: 'inherit' });
    
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
