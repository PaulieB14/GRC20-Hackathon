/**
 * Log Info Script
 * 
 * This script logs information about the environment.
 */

import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * Main function
 */
function main() {
  try {
    console.log('Logging environment information...');
    
    // Log environment variables
    console.log('Environment variables:');
    console.log('DEEDS_SPACE_ID:', process.env.DEEDS_SPACE_ID);
    console.log('PERMITS_SPACE_ID:', process.env.PERMITS_SPACE_ID);
    console.log('WALLET_ADDRESS:', process.env.WALLET_ADDRESS);
    console.log('RPC_URL:', process.env.RPC_URL);
    console.log('CHAIN_ID:', process.env.CHAIN_ID);
    
    console.log('Done!');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

// Execute the script
main();
