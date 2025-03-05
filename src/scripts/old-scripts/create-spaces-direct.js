/**
 * Create Spaces Direct Script
 * 
 * This script creates spaces for Property deeds and Property permits and updates the .env file directly.
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
 * Deploy a new GRC-20 space
 * 
 * @param {string} spaceName The name of the space
 * @returns {Promise<string>} A promise that resolves to the space ID
 */
async function deploySpace(spaceName) {
  try {
    console.log(`Deploying space "${spaceName}"...`);
    
    // Get calldata using curl
    console.log('\n[Api] Getting calldata...');
    // Make sure there's a comma between "TESTNET" and "name"
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

    // Submit transaction using curl
    console.log('\n[Transaction] Submitting to network...');
    
    // Get nonce
    console.log('\n[Transaction] Getting nonce...');
    const nonceCmd = `curl -s -X POST -H "Content-Type: application/json" -d '{"jsonrpc":"2.0","method":"eth_getTransactionCount","params":["${process.env.WALLET_ADDRESS}","latest"],"id":1}' "${process.env.RPC_URL}"`;
    const nonceResponse = execSync(nonceCmd).toString();
    const nonce = JSON.parse(nonceResponse).result;
    console.log('Nonce:', nonce);

    // Use fixed gas values for testing
    const gasLimit = '0x7A120'; // 500000
    const gasPrice = '0x2540BE400'; // 10 gwei

    // Create raw transaction
    const rawTx = {
      to: response.to,
      data: response.data,
      gasLimit,
      gasPrice,
      nonce,
      chainId: process.env.CHAIN_ID ? parseInt(process.env.CHAIN_ID) : 19411, // Default to GRC-20 testnet chain ID
      value: '0x0',
    };

    // Sign transaction using ethers.js
    console.log('\n[Transaction] Signing transaction...');
    const { Wallet } = await import('ethers');
    const wallet = new Wallet(process.env.PRIVATE_KEY);
    const signedTx = await wallet.signTransaction(rawTx);
    console.log('Signed transaction:', signedTx);

    // Send transaction
    console.log('\n[Transaction] Sending transaction...');
    const sendTxCmd = `curl -s -X POST -H "Content-Type: application/json" -d '{"jsonrpc":"2.0","method":"eth_sendRawTransaction","params":["${signedTx}"],"id":1}' "${process.env.RPC_URL}"`;
    const sendTxResponse = execSync(sendTxCmd).toString();
    console.log('\n[Transaction] Raw response:', sendTxResponse);
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
    const deedsSpaceId = await deploySpace('Property Deeds');
    console.log(`Property Deeds space created with ID: ${deedsSpaceId}`);
    updateEnvFile('DEEDS_SPACE_ID', deedsSpaceId);
    
    // Create permits space
    console.log('Creating Property Permits space...');
    const permitsSpaceId = await deploySpace('Property Permits');
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
