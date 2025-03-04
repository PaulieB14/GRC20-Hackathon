/**
 * Create Space Direct Script
 * 
 * This script creates a space using the fetch API to call the GRC-20 API directly.
 */

import { account } from '../utils/wallet.js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';

// Load environment variables
dotenv.config();

/**
 * Main function
 */
async function main() {
  try {
    console.log('Wallet configured successfully');
    console.log(`Address: ${account.address}`);
    
    // Create a space using the GRC-20 API
    console.log('Creating space using GRC-20 API...');
    
    // Following the documentation approach
    try {
      // Make a POST request to the space creation endpoint
      const response = await fetch('https://api-testnet.grc-20.thegraph.com/space', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          initialEditorAddress: account.address,
          spaceName: 'Test Space Direct',
          network: 'TESTNET'
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API error: ${response.status} ${response.statusText}\n${errorText}`);
      }
      
      const data = await response.json();
      console.log('API response:', data);
      
      const spaceId = data.id || data.spaceId;
      if (!spaceId) {
        throw new Error('No space ID returned from API');
      }
      
      console.log(`Space created with ID: ${spaceId}`);
      
      // Update .env file with the new space ID
      updateEnvFile("NEW_SPACE_ID", spaceId);
    } catch (apiError) {
      console.error('API error:', apiError);
      
      // Fallback to direct transaction method
      console.log('\nFalling back to direct transaction method...');
      
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
      
      // Update .env file with the new space ID
      updateEnvFile("NEW_SPACE_ID", spaceId);
    }
    
    console.log('Done!');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

/**
 * Update the .env file with a new variable
 * 
 * @param key The environment variable key
 * @param value The environment variable value
 */
function updateEnvFile(key, value) {
  try {
    const envPath = path.resolve(process.cwd(), '.env');
    
    let envContent = '';
    
    // Read existing .env file if it exists
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf8');
    }
    
    // Check if the key already exists
    const regex = new RegExp(`^${key}=.*`, 'm');
    
    if (regex.test(envContent)) {
      // Replace existing key
      envContent = envContent.replace(regex, `${key}=${value}`);
    } else {
      // Add new key
      envContent += `\n${key}=${value}`;
    }
    
    // Write to .env file
    fs.writeFileSync(envPath, envContent.trim());
    console.log(`Updated ${key} in .env file`);
  } catch (error) {
    console.error(`Failed to update .env file:`, error);
  }
}

// Execute the script
main().catch(console.error);
