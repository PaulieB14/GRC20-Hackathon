/**
 * Create Space Minimal Script
 * 
 * This script creates a space using the account.sendTransaction method directly.
 */

import { account } from '../utils/wallet.js';
import { execSync } from 'child_process';

/**
 * Main function
 */
async function main() {
  try {
    console.log('Wallet configured successfully');
    console.log(`Address: ${account.address}`);
    
    // Create a space transaction
    console.log('Creating space transaction...');
    
    // Use execSync to run commands directly
    console.log('Getting nonce...');
    const nonceCmd = `curl -s -X POST -H "Content-Type: application/json" -d '{"jsonrpc":"2.0","method":"eth_getTransactionCount","params":["${account.address}","latest"],"id":1}' "${process.env.RPC_URL}"`;
    const nonceResponse = execSync(nonceCmd).toString();
    console.log('Nonce response:', nonceResponse);
    
    // The space creation transaction is a special transaction with empty data
    // The space ID will be derived from the transaction hash
    console.log('Sending transaction...');
    try {
      const txHash = await account.sendTransaction({
        to: "0x0000000000000000000000000000000000000000", // Zero address for space creation
        value: 0n,
        data: "0x", // Empty data for space creation
      });
      
      console.log(`Space creation transaction submitted: ${txHash}`);
      
      // The space ID is derived from the transaction hash
      const spaceId = `0x${txHash.slice(2, 42)}`;
      console.log(`Space created with ID: ${spaceId}`);
    } catch (txError) {
      console.error('Transaction error:', txError);
      console.error('Error details:', JSON.stringify(txError, null, 2));
    }
    
    console.log('Done!');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

// Execute the script
main().catch(console.error);
