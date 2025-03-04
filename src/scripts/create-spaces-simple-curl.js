/**
 * Create Spaces Simple Curl Script
 * 
 * This script creates spaces for Property deeds and Property permits using curl commands.
 */

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
 * Create a new GRC-20 space
 * 
 * @param {string} spaceName The name of the space
 * @returns {Promise<string>} A promise that resolves to the space ID
 */
async function createSpace(spaceName) {
  try {
    console.log(`Creating space "${spaceName}"...`);
    
    // Create a temporary JSON file for the request body
    const tempJsonPath = path.resolve(process.cwd(), 'temp-request.json');
    const requestBody = {
      network: "TESTNET",
      name: spaceName
    };
    fs.writeFileSync(tempJsonPath, JSON.stringify(requestBody));
    
    // Get calldata using curl with the JSON file
    console.log('\n[Api] Getting calldata...');
    const calldataCmd = `curl -s -X POST -H "Content-Type: application/json" -H "Accept: application/json" -d @${tempJsonPath} "https://api-testnet.grc-20.thegraph.com/space/create/calldata"`;
    console.log('\n[Api] Executing command:', calldataCmd);
    const calldataResponse = execSync(calldataCmd).toString();
    console.log('\n[Api] Response:', calldataResponse);
    
    // Clean up the temporary file
    fs.unlinkSync(tempJsonPath);
    
    // Parse the response
    const response = JSON.parse(calldataResponse);
    
    console.log('\n✅ [Api] Got calldata:', {
      to: response.to,
      dataLength: response.data.length,
      timestamp: new Date().toISOString()
    });
    
    // Create a temporary JSON file for the transaction
    const tempTxPath = path.resolve(process.cwd(), 'temp-tx.json');
    const txBody = {
      jsonrpc: "2.0",
      method: "eth_sendTransaction",
      params: [{
        from: process.env.WALLET_ADDRESS,
        to: response.to,
        data: response.data,
        gas: "0x7A120", // 500000
        gasPrice: "0x2540BE400" // 10 gwei
      }],
      id: 1
    };
    fs.writeFileSync(tempTxPath, JSON.stringify(txBody));
    
    // Send transaction using curl
    console.log('\n[Transaction] Sending transaction...');
    const sendTxCmd = `curl -s -X POST -H "Content-Type: application/json" -d @${tempTxPath} "${process.env.RPC_URL}"`;
    console.log('\n[Transaction] Executing command:', sendTxCmd);
    const sendTxResponse = execSync(sendTxCmd).toString();
    console.log('\n[Transaction] Response:', sendTxResponse);
    
    // Clean up the temporary file
    fs.unlinkSync(tempTxPath);
    
    // Parse the response
    const txResult = JSON.parse(sendTxResponse);
    
    if (txResult.error) {
      throw new Error(`Transaction failed: ${JSON.stringify(txResult.error)}`);
    }
    
    const txHash = txResult.result;
    console.log('\n✅ [Transaction] Submitted:', { txHash });
    
    // The space ID is derived from the transaction hash
    const spaceId = `0x${txHash.slice(2, 42)}`;
    console.log(`\n[Space] Created with ID: ${spaceId}`);
    
    return spaceId;
  } catch (error) {
    console.error('\n❌ [Error]:', error);
    throw error;
  }
}

/**
 * Main function
 */
async function main() {
  try {
    // Create deeds space
    console.log('Creating Property Deeds space...');
    const deedsSpaceId = await createSpace('Property Deeds');
    console.log(`Property Deeds space created with ID: ${deedsSpaceId}`);
    updateEnvFile('DEEDS_SPACE_ID', deedsSpaceId);
    
    // Create permits space
    console.log('Creating Property Permits space...');
    const permitsSpaceId = await createSpace('Property Permits');
    console.log(`Property Permits space created with ID: ${permitsSpaceId}`);
    updateEnvFile('PERMITS_SPACE_ID', permitsSpaceId);
    
    console.log('Done!');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

// Execute the script
main().catch(console.error);
