/**
 * Update Space Curl Simple Script
 * 
 * This script updates an existing space using curl commands.
 * 
 * Usage:
 *   node src/scripts/update-space-curl-simple.js [deeds|permits]
 */

import { account } from "../utils/wallet.js";
import { execSync } from 'child_process';
import 'dotenv/config';
import fs from 'fs';
import path from 'path';

/**
 * Update a space with a simple test entity
 * 
 * @param {string} spaceId The space ID to update
 * @returns {Promise<string>} A promise that resolves to the transaction hash
 */
async function updateSpace(spaceId) {
  try {
    console.log(`Updating space ${spaceId}...`);
    console.log('Using account:', account.address);

    // Create test edit JSON
    console.log('\n[IPFS] Creating edit file...');
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
      author: account.address
    };
    
    // Write edit to temporary file
    const editPath = path.resolve(process.cwd(), 'temp-edit.json');
    fs.writeFileSync(editPath, JSON.stringify(edit, null, 2));
    console.log(`Created temporary edit file at ${editPath}`);

    // Publish edit to IPFS
    console.log('\n[IPFS] Publishing edit...');
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

    // Get calldata using curl
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
      dataLength: data.length,
      timestamp: new Date().toISOString()
    });

    // Submit transaction
    console.log('\n[Transaction] Submitting to network...');
    try {
      const hash = await account.sendTransaction({
        to: to,
        value: 0n,
        data: data
      });

      console.log('\n✅ [Transaction] Submitted:', { hash });
      return hash;
    } catch (txError) {
      console.error('\n❌ [Transaction] Failed:', txError);
      throw txError;
    }
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
