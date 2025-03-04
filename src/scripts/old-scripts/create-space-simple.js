/**
 * Create Space Simple Script
 * 
 * This script creates a space using the account.sendTransaction method directly,
 * following the documentation approach of sending a transaction to the zero address.
 */

import { account } from '../utils/wallet.js';

/**
 * Main function
 */
async function main() {
  try {
    console.log('Wallet configured successfully');
    console.log(`Address: ${account.address}`);
    
    // Create a space transaction
    console.log('Creating space transaction...');
    
    // The space creation transaction is a special transaction with empty data
    // The space ID will be derived from the transaction hash
    const txHash = await account.sendTransaction({
      to: "0x0000000000000000000000000000000000000000", // Zero address for space creation
      value: 0n,
      data: "0x", // Empty data for space creation
    });
    
    console.log(`Space creation transaction submitted: ${txHash}`);
    
    // The space ID is derived from the transaction hash
    const spaceId = `0x${txHash.slice(2, 42)}`;
    console.log(`Space created with ID: ${spaceId}`);
    
    console.log('Done!');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

// Execute the script
main().catch(console.error);
