/**
 * Create Space SDK Direct Script
 * 
 * This script creates a space using the Graph.createSpace method from the GRC-20 SDK directly,
 * following the documentation.
 */

import { Graph } from '@graphprotocol/grc-20';
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
    console.log('Creating space using Graph.createSpace...');
    
    // Get wallet address from .env
    const walletAddress = process.env.WALLET_ADDRESS;
    if (!walletAddress) {
      throw new Error('WALLET_ADDRESS not set in environment');
    }
    
    console.log(`Using wallet address: ${walletAddress}`);
    
    // Create space using the Graph.createSpace method
    console.log('Calling Graph.createSpace with parameters:');
    console.log({
      initialEditorAddress: walletAddress,
      spaceName: 'Test Space SDK Direct',
      network: 'TESTNET'
    });
    
    try {
      // Use the editorAddress and name parameters only
      const spaceId = await Graph.createSpace({
        editorAddress: walletAddress,
        name: 'Test Space SDK Direct'
        // Removed network parameter as it's not in the Params type
      });
      
      console.log(`Space created with ID: ${spaceId}`);
      
      // Update .env file with the new space ID
      updateEnvFile("TEST_SPACE_ID", spaceId.toString());
    } catch (createError: any) {
      console.error('Error creating space:', createError);
      console.error('Error details:', JSON.stringify(createError, null, 2));
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
