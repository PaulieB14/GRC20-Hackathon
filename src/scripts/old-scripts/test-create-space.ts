/**
 * Test Create Space Script
 * 
 * This script tests creating a space using the GRC-20 SDK directly.
 */

import { account } from '../utils/wallet.js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load environment variables
dotenv.config();

/**
 * Main function
 */
async function main(): Promise<void> {
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
    
    // Update .env file with the new space ID
    updateEnvFile("TEST_SPACE_ID", spaceId);
    
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
function updateEnvFile(key: string, value: string): void {
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
