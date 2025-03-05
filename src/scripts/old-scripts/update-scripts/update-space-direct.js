/**
 * Update Space Direct Script
 * 
 * This script updates an existing space using direct curl commands.
 * 
 * Usage:
 *   node src/scripts/update-space-direct.js [deeds|permits]
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import 'dotenv/config';

/**
 * Update a space with a simple test entity
 * 
 * @param {string} spaceId The space ID to update
 * @returns {Promise<string>} A promise that resolves to the transaction hash
 */
async function updateSpace(spaceId) {
  try {
    console.log(`Updating space ${spaceId}...`);
    
    // Get wallet address and private key from .env
    const walletAddress = process.env.WALLET_ADDRESS;
    const privateKey = process.env.PRIVATE_KEY;
    const rpcUrl = process.env.RPC_URL;
    
    if (!walletAddress || !privateKey || !rpcUrl) {
      throw new Error('WALLET_ADDRESS, PRIVATE_KEY, and RPC_URL must be set in .env file');
    }
    
    console.log('Using wallet address:', walletAddress);
    console.log('Using RPC URL:', rpcUrl);
    
    // Step 1: Create a simple edit
    console.log('\n[Edit] Creating a simple edit...');
    const timestamp = new Date().toISOString();
    const edit = {
      name: `Test Update ${timestamp}`,
      ops: [
        {
          type: 'CREATE_ENTITY',
          id: `test-entity-${Date.now()}`,
          name: `Test Entity ${timestamp}`,
          types: ['test-type'],
        }
      ],
      author: walletAddress
    };
    
    // Write edit to temporary file
    const editPath = path.resolve(process.cwd(), 'temp-edit.json');
    fs.writeFileSync(editPath, JSON.stringify(edit, null, 2));
    console.log(`Created temporary edit file at ${editPath}`);
    
    // Step 2: Publish to IPFS
    console.log('\n[IPFS] Publishing to IPFS...');
    const ipfsCmd = `curl -s -X POST -F "file=@${editPath}" "https://api.thegraph.com/ipfs/api/v0/add?stream-channels=true&progress=false"`;
    console.log(`Executing command: ${ipfsCmd}`);
    
    let ipfsResponse;
    try {
      ipfsResponse = execSync(ipfsCmd).toString();
      console.log('\n[IPFS] Response:', ipfsResponse);
    } catch (error) {
      console.error('\n[IPFS] Error:', error.message);
      // Clean up the temporary file
      fs.unlinkSync(editPath);
      throw new Error(`Failed to publish to IPFS: ${error.message}`);
    }
    
    // Clean up the temporary file
    fs.unlinkSync(editPath);
    
    // Parse the IPFS response
    const { Hash } = JSON.parse(ipfsResponse);
    const cid = `ipfs://${Hash}`;
    console.log('\n✅ [IPFS] Published edit:', { cid });
    
    // Step 3: Get calldata
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
    
    console.log('\n✅ [API] Got calldata:', {
      to,
      dataLength: data.length
    });
    
    // Step 4: Submit transaction
    console.log('\n[Transaction] Submitting transaction...');
    
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
    // Get the space type from command line arguments
    const args = process.argv.slice(2);
    const spaceType = args[0] || 'deeds';
    
    let spaceId;
    if (spaceType === 'permits') {
      spaceId = process.env.PERMITS_SPACE_ID;
      console.log(`Using PERMITS_SPACE_ID: ${spaceId}`);
    } else {
      spaceId = process.env.DEEDS_SPACE_ID;
      console.log(`Using DEEDS_SPACE_ID: ${spaceId}`);
    }

    if (!spaceId) {
      throw new Error(`${spaceType.toUpperCase()}_SPACE_ID not set in environment`);
    }

    // Update the space
    const txHash = await updateSpace(spaceId);
    console.log(`\n✅ [Success] Updated ${spaceType} space ${spaceId}`);
    console.log(`Transaction hash: ${txHash}`);
    
    console.log('\nDone!');
  } catch (error) {
    console.error('\n❌ [Error]:', error);
    process.exit(1);
  }
}

// Execute if running directly
if (import.meta.url === new URL(import.meta.url).href) {
  main().catch(console.error);
}
