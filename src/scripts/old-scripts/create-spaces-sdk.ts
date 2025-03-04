/**
 * Create Spaces SDK Script
 * 
 * This script creates spaces using the Graph.createSpace method from the GRC-20 SDK.
 */

import { Graph } from '@graphprotocol/grc-20';
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
    
    // Create deeds space using direct transaction
    console.log('\nCreating deeds space...');
    const deedsTxHash = await account.sendTransaction({
      to: "0x0000000000000000000000000000000000000000", // Zero address for space creation
      value: 0n,
      data: "0x", // Empty data for space creation
    });
    console.log(`Deeds space creation transaction submitted: ${deedsTxHash}`);
    
    // The space ID is derived from the transaction hash
    const deedsSpaceId = `0x${deedsTxHash.slice(2, 42)}`;
    console.log(`Deeds space created with ID: ${deedsSpaceId}`);
    
    // Update .env file with the new deeds space ID
    updateEnvFile("DEEDS_SPACE_ID", deedsSpaceId);
    
    // Create permits space using direct transaction
    console.log('\nCreating permits space...');
    const permitsTxHash = await account.sendTransaction({
      to: "0x0000000000000000000000000000000000000000", // Zero address for space creation
      value: 0n,
      data: "0x", // Empty data for space creation
    });
    console.log(`Permits space creation transaction submitted: ${permitsTxHash}`);
    
    // The space ID is derived from the transaction hash
    const permitsSpaceId = `0x${permitsTxHash.slice(2, 42)}`;
    console.log(`Permits space created with ID: ${permitsSpaceId}`);
    
    // Update .env file with the new permits space ID
    updateEnvFile("PERMITS_SPACE_ID", permitsSpaceId);
    
    console.log('\nDone!');
    console.log('New space IDs:');
    console.log('DEEDS_SPACE_ID:', deedsSpaceId);
    console.log('PERMITS_SPACE_ID:', permitsSpaceId);
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
