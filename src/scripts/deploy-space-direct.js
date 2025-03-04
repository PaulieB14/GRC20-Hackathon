/**
 * Deploy Space Direct Script
 * 
 * This script deploys a new GRC-20 space using the correct API endpoint and transaction method.
 */

import { account } from '../utils/wallet.js';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import 'dotenv/config';

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

/**
 * Deploy a new GRC-20 space
 * 
 * @param {string} spaceName The name of the space
 * @returns {Promise<string>} A promise that resolves to the transaction hash
 */
async function deploySpace(spaceName = 'Test Space') {
  try {
    console.log(`Deploying space "${spaceName}"...`);
    console.log('Using account:', account.address);

    // Get calldata using curl
    console.log('\n[Api] Getting calldata...');
    const calldataCmd = `curl -s -X POST -H "Content-Type: application/json" -H "Accept: application/json" -d '{"network":"TESTNET","name":"${spaceName}"}' "https://api-testnet.grc-20.thegraph.com/space/create/calldata"`;
    console.log('\n[Api] Executing command:', calldataCmd);
    const calldataResponse = execSync(calldataCmd).toString();
    console.log('\n[Api] Response:', calldataResponse);
    const response = JSON.parse(calldataResponse);

    console.log('\n✅ [Api] Got calldata:', {
      to: response.to,
      dataLength: response.data.length,
      timestamp: new Date().toISOString()
    });

    // Submit transaction
    console.log('\n[Transaction] Submitting to network...');
    try {
      const hash = await account.sendTransaction({
        to: response.to,
        value: 0n,
        data: response.data
      });

      console.log('\n✅ [Transaction] Submitted:', { hash });
      
      // The space ID is derived from the transaction hash
      const spaceId = `0x${hash.slice(2, 42)}`;
      console.log(`\n[Space] Created with ID: ${spaceId}`);
      
      // Update .env file with the new space ID
      if (spaceName.toLowerCase().includes("deed")) {
        console.log(`Adding deeds_space_id=${spaceId} to .env file`);
        updateEnvFile("DEEDS_SPACE_ID", spaceId);
      } else if (spaceName.toLowerCase().includes("permit")) {
        console.log(`Adding permits_space_id=${spaceId} to .env file`);
        updateEnvFile("PERMITS_SPACE_ID", spaceId);
      } else {
        console.log(`Adding new_space_id=${spaceId} to .env file`);
        updateEnvFile("NEW_SPACE_ID", spaceId);
      }
      
      return hash;
    } catch (txError) {
      console.error('\n❌ [Transaction] Failed:', txError);
      throw txError;
    }
  } catch (error) {
    if (error instanceof Error) {
      console.error('\n❌ [Error]:', {
        error: error.message,
        name: error.name,
        stack: error.stack,
        timestamp: new Date().toISOString()
      });
    }
    throw error;
  }
}

// Execute if running directly
if (import.meta.url === new URL(import.meta.url).href) {
  // Get space name from command line arguments
  const spaceName = process.argv[2] || 'Test Space';
  
  deploySpace(spaceName).catch(error => {
    console.error('\n❌ [Error]:', error);
    process.exit(1);
  });
}

export { deploySpace };
