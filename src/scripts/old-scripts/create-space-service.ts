/**
 * Create Space Service Script
 * 
 * This script creates a space using the TransactionService directly.
 */

import { TransactionService } from '../services/transaction-service.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * Main function
 */
async function main() {
  try {
    console.log('Creating spaces using TransactionService...');
    
    // Create deeds space
    console.log('\nCreating deeds space...');
    try {
      const deedsSpaceId = await TransactionService.createSpace('Deeds Space');
      console.log(`Deeds space created with ID: ${deedsSpaceId}`);
    } catch (deedsError) {
      console.error('Error creating deeds space:', deedsError);
    }
    
    // Create permits space
    console.log('\nCreating permits space...');
    try {
      const permitsSpaceId = await TransactionService.createSpace('Permits Space');
      console.log(`Permits space created with ID: ${permitsSpaceId}`);
    } catch (permitsError) {
      console.error('Error creating permits space:', permitsError);
    }
    
    console.log('\nDone!');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

// Execute the script
main().catch(console.error);
