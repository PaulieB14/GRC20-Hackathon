/**
 * Create Space Network Script
 * 
 * This script creates a space using the Graph.createSpace method with different network parameters.
 */

import { Graph } from '@graphprotocol/grc-20';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * Main function
 */
async function main() {
  try {
    console.log('Creating space...');
    
    // Get wallet address from .env
    const walletAddress = process.env.WALLET_ADDRESS;
    console.log(`Using wallet address: ${walletAddress}`);
    
    // Try different network parameters
    const networks = ['TESTNET', 'testnet', 'MAINNET', 'mainnet'];
    
    for (const network of networks) {
      console.log(`\nTrying network: ${network}`);
      
      try {
        console.log('Calling Graph.createSpace...');
        console.log('Parameters:', {
          initialEditorAddress: walletAddress,
          spaceName: `Test Space (${network})`,
          network: network
        });
        
        const spaceId = await Graph.createSpace({
          initialEditorAddress: walletAddress,
          spaceName: `Test Space (${network})`,
          network: network
        });
        
        console.log(`Space created with ID: ${spaceId}`);
        break; // Stop if successful
      } catch (createError) {
        console.error(`Error creating space with network=${network}:`, createError.message);
      }
    }
    
    console.log('\nDone!');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

// Execute the script
main().catch(console.error);
