/**
 * Update Space Curl Script
 * 
 * This script updates an existing space by publishing a simple edit to IPFS
 * and then using curl to submit the transaction.
 * 
 * Usage:
 *   node src/scripts/update-space-curl.js <space-id>
 */

import { Ipfs } from '@graphprotocol/grc-20';
import { account } from '../utils/wallet.js';
// Note: TypeScript will compile this to the correct path
import dotenv from 'dotenv';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

// Load environment variables
dotenv.config();

/**
 * Update a GRC-20 space
 * 
 * @param {string} spaceId The ID of the space to update
 * @returns {Promise<string>} A promise that resolves to the transaction hash
 */
async function updateSpace(spaceId) {
  try {
    console.log(`Updating space ${spaceId}...`);
    
    // Step 1: Create a simple edit
    console.log('\n[Edit] Creating a simple edit...');
    const timestamp = new Date().toISOString();
    const edit = {
      name: `Test Edit ${timestamp}`,
      ops: [
        {
          type: 'CREATE_ENTITY',
          id: `test-entity-${Date.now()}`,
          name: `Test Entity ${timestamp}`,
          types: ['test-type'],
        },
      ],
      author: account.address,
    };
    
    console.log('[Edit] Edit to publish:', JSON.stringify(edit, null, 2));
    
    // Step 2: Publish to IPFS
    console.log('\n[IPFS] Publishing to IPFS...');
    let cid;
    try {
      cid = await Ipfs.publishEdit(edit);
      console.log('[IPFS] Published to IPFS with CID:', cid);
    } catch (ipfsError) {
      console.error('[IPFS] Error publishing to IPFS:', ipfsError);
      console.error('[IPFS] Error details:', JSON.stringify(ipfsError, null, 2));
      throw new Error(`Failed to publish to IPFS: ${ipfsError.message}`);
    }
    
    // Step 3: Get calldata using curl
    console.log('\n[API] Getting calldata...');
    
    // Create a temporary JSON file for the request body
    const tempJsonPath = path.resolve(process.cwd(), 'temp-request.json');
    const requestBody = {
      cid: cid,
      network: "TESTNET"
    };
    fs.writeFileSync(tempJsonPath, JSON.stringify(requestBody));
    
    // Get calldata using curl with the JSON file
    const calldataCmd = `curl -s -X POST -H "Content-Type: application/json" -H "Accept: application/json" -d @${tempJsonPath} "https://api-testnet.grc-20.thegraph.com/space/${spaceId}/edit/calldata"`;
    console.log('[API] Executing command:', calldataCmd);
    
    let calldataResponse;
    try {
      calldataResponse = execSync(calldataCmd).toString();
      console.log('[API] Response:', calldataResponse);
    } catch (error) {
      console.error('[API] Error getting calldata:', error.message);
      // Clean up the temporary file
      fs.unlinkSync(tempJsonPath);
      throw new Error(`Failed to get calldata: ${error.message}`);
    }
    
    // Clean up the temporary file
    fs.unlinkSync(tempJsonPath);
    
    // Parse the response
    const response = JSON.parse(calldataResponse);
    
    if (response.error) {
      throw new Error(`API error: ${JSON.stringify(response.error)}`);
    }
    
    const { to, data } = response;
    
    if (!to || !data) {
      throw new Error(`Invalid response format: ${JSON.stringify(response)}`);
    }
    
    console.log('[API] Got calldata:', {
      to,
      dataLength: data.length
    });
    
    // Step 4: Submit transaction using curl
    console.log('\n[Transaction] Submitting transaction...');
    
    // Get the private key from .env
    const privateKey = process.env.PRIVATE_KEY;
    const walletAddress = process.env.WALLET_ADDRESS;
    const rpcUrl = process.env.RPC_URL;
    
    if (!privateKey || !walletAddress || !rpcUrl) {
      throw new Error('PRIVATE_KEY, WALLET_ADDRESS, and RPC_URL must be set in .env file');
    }
    
    console.log('[Transaction] Using wallet address:', walletAddress);
    console.log('[Transaction] Using RPC URL:', rpcUrl);
    
    // Get the nonce
    console.log('[Transaction] Getting nonce...');
    const nonceCmd = `curl -s -X POST -H "Content-Type: application/json" --data '{"jsonrpc":"2.0","method":"eth_getTransactionCount","params":["${walletAddress}", "latest"],"id":1}' ${rpcUrl}`;
    
    let nonceResponse;
    try {
      nonceResponse = execSync(nonceCmd).toString();
      console.log('[Transaction] Nonce response:', nonceResponse);
    } catch (error) {
      console.error('[Transaction] Error getting nonce:', error.message);
      throw new Error(`Failed to get nonce: ${error.message}`);
    }
    
    // Parse the nonce response
    const nonceData = JSON.parse(nonceResponse);
    
    if (nonceData.error) {
      throw new Error(`Nonce error: ${JSON.stringify(nonceData.error)}`);
    }
    
    const nonce = nonceData.result;
    console.log('[Transaction] Using nonce:', nonce);
    
    // Create a temporary JSON file for the transaction
    const tempTxPath = path.resolve(process.cwd(), 'temp-tx.json');
    const txBody = {
      jsonrpc: "2.0",
      method: "eth_sendTransaction",
      params: [{
        from: walletAddress,
        to: to,
        data: data,
        gas: "0xC65D40", // 13,000,000
        gasPrice: "0x2540BE400", // 10 gwei
        nonce: nonce
      }],
      id: 1
    };
    fs.writeFileSync(tempTxPath, JSON.stringify(txBody));
    
    // Send transaction using curl
    const sendTxCmd = `curl -s -X POST -H "Content-Type: application/json" -d @${tempTxPath} "${rpcUrl}"`;
    console.log('[Transaction] Executing command:', sendTxCmd);
    
    let sendTxResponse;
    try {
      sendTxResponse = execSync(sendTxCmd).toString();
      console.log('[Transaction] Response:', sendTxResponse);
    } catch (error) {
      console.error('[Transaction] Error sending transaction:', error.message);
      // Clean up the temporary file
      fs.unlinkSync(tempTxPath);
      throw new Error(`Failed to send transaction: ${error.message}`);
    }
    
    // Clean up the temporary file
    fs.unlinkSync(tempTxPath);
    
    // Parse the response
    const txResult = JSON.parse(sendTxResponse);
    
    if (txResult.error) {
      throw new Error(`Transaction error: ${JSON.stringify(txResult.error)}`);
    }
    
    const txHash = txResult.result;
    console.log('[Transaction] Submitted with hash:', txHash);
    
    return txHash;
  } catch (error) {
    console.error('Error updating space:', error);
    throw error;
  }
}

/**
 * Main function
 */
async function main() {
  try {
    // Get the space ID from command line arguments or .env
    const args = process.argv.slice(2);
    let spaceId = args[0];
    
    if (!spaceId) {
      // Try to get from .env
      if (process.env.DEEDS_SPACE_ID) {
        spaceId = process.env.DEEDS_SPACE_ID;
        console.log(`Using DEEDS_SPACE_ID from .env: ${spaceId}`);
      } else if (process.env.PERMITS_SPACE_ID) {
        spaceId = process.env.PERMITS_SPACE_ID;
        console.log(`Using PERMITS_SPACE_ID from .env: ${spaceId}`);
      } else {
        throw new Error('Space ID is required. Provide it as a command line argument or set DEEDS_SPACE_ID or PERMITS_SPACE_ID in .env file.');
      }
    }
    
    // Update the space
    const txHash = await updateSpace(spaceId);
    console.log(`\nSpace ${spaceId} updated successfully!`);
    console.log(`Transaction hash: ${txHash}`);
    
    console.log('\nDone!');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

// Execute the script
main().catch(console.error);
