/**
 * Check and Update Script
 * 
 * This script checks if the spaces exist and prints out the space IDs.
 * It can also update the spaces if requested.
 * 
 * Usage:
 *   node src/scripts/check-and-update.js [--update]
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import 'dotenv/config';

/**
 * Check if a space exists
 * 
 * @param {string} spaceId The space ID to check
 * @returns {Promise<boolean>} A promise that resolves to true if the space exists, false otherwise
 */
async function spaceExists(spaceId) {
  try {
    console.log(`Checking if space ${spaceId} exists...`);
    
    // Try to get calldata for a dummy edit to see if the space exists
    const dummyCid = 'ipfs://QmTest123';
    
    // Create a temporary JSON file for the request body
    const tempJsonPath = path.resolve(process.cwd(), 'temp-request.json');
    const requestBody = {
      cid: dummyCid,
      network: "TESTNET"
    };
    fs.writeFileSync(tempJsonPath, JSON.stringify(requestBody));
    
    const cmd = `curl -s -X POST -H "Content-Type: application/json" -H "Accept: application/json" -d @${tempJsonPath} "https://api-testnet.grc-20.thegraph.com/space/${spaceId}/edit/calldata"`;
    console.log('Executing command:', cmd);
    
    try {
      const response = execSync(cmd).toString();
      
      // Clean up the temporary file
      fs.unlinkSync(tempJsonPath);
      console.log('Response:', response);
      
      // Parse the response
      const responseObj = JSON.parse(response);
      
      // Check if the response contains an error
      if (responseObj.error) {
        console.log(`Space does not exist: ${responseObj.reason}`);
        return false;
      }
      
      // If we get a valid response without an error, the space exists
      return true;
    } catch (error) {
      console.error('Error:', error.message);
      return false;
    }
  } catch (error) {
    console.error(`Error checking if space exists:`, error);
    return false;
  }
}

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
    
    // Step 1: Create a simple edit with proper triples
    console.log('\n[Edit] Creating a simple edit...');
    const timestamp = new Date().toISOString();
    
    // Determine which triples to use based on the space ID
    const isDeeds = spaceId === process.env.DEEDS_SPACE_ID;
    const isPermits = spaceId === process.env.PERMITS_SPACE_ID;
    
    // Generate a unique entity ID
    const entityId = `${isDeeds ? 'deed' : 'permit'}-record-${Date.now()}`;
    
    // Create the edit object
    let edit;
    
    if (isDeeds) {
      // Load deed triples from file
      const deedsTriples = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), 'data/deeds-triples.json'), 'utf8'));
      const deedTriple = deedsTriples[0]; // Use the first deed triple as a template
      
      // Update the entity ID in all triples and convert values to sentence case
      const updatedTriples = deedTriple.triples.map(triple => {
        // Convert text values to sentence case
        if (triple.value && triple.value.type === "TEXT" && typeof triple.value.value === 'string') {
          // Convert to sentence case (first letter uppercase, rest lowercase)
          const originalValue = triple.value.value;
          const sentenceCaseValue = originalValue.charAt(0).toUpperCase() + originalValue.slice(1).toLowerCase();
          
          return {
            ...triple,
            entityId: entityId,
            value: {
              ...triple.value,
              value: sentenceCaseValue
            }
          };
        }
        
        // For non-text values or if value structure is different
        return {
          ...triple,
          entityId: entityId
        };
      });
      
      edit = {
        name: `Deed Update ${timestamp}`,
        ops: [
          {
            type: 'CREATE_ENTITY',
            id: entityId,
            name: `Deed Record ${timestamp}`,
            types: ['Deed'],
            triples: updatedTriples
          }
        ],
        author: walletAddress
      };
    } else if (isPermits) {
      // Load permit triples from file
      const permitsTriples = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), 'data/permits-triples.json'), 'utf8'));
      const permitTriple = permitsTriples[0]; // Use the first permit triple as a template
      
      // Update the entity ID in all triples and convert values to sentence case
      const updatedTriples = permitTriple.triples.map(triple => {
        // Convert text values to sentence case
        if (triple.value && triple.value.type === "TEXT" && typeof triple.value.value === 'string') {
          // Convert to sentence case (first letter uppercase, rest lowercase)
          const originalValue = triple.value.value;
          const sentenceCaseValue = originalValue.charAt(0).toUpperCase() + originalValue.slice(1).toLowerCase();
          
          return {
            ...triple,
            entity: entityId,
            value: {
              ...triple.value,
              value: sentenceCaseValue
            }
          };
        }
        
        // For non-text values or if value structure is different
        return {
          ...triple,
          entity: entityId
        };
      });
      
      edit = {
        name: `Permit Update ${timestamp}`,
        ops: [
          {
            type: 'CREATE_ENTITY',
            id: entityId,
            name: `Permit Record ${timestamp}`,
            types: ['Permit'],
            triples: updatedTriples
          }
        ],
        author: walletAddress
      };
    } else {
      // Default edit for other spaces
      edit = {
        name: `Update ${timestamp}`,
        ops: [
          {
            type: 'CREATE_ENTITY',
            id: entityId,
            name: `Record ${timestamp}`,
            types: ['Record'],
            triples: [
              {
                subject: entityId,
                predicate: 'created at',
                object: timestamp
              }
            ]
          }
        ],
        author: walletAddress
      };
    }
    
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
    
    // Step 4: Submit transaction using curl with local signing
    console.log('\n[Transaction] Submitting transaction...');
    
    // Import ethers for signing
    const { Wallet } = await import('ethers');
    
    // Create wallet from private key
    const wallet = new Wallet(privateKey);
    
    // Use fixed gas values for testing
    const gasLimit = '0xC65D40'; // 13,000,000
    const gasPrice = '0x3B9ACA00'; // 1 gwei
    
    console.log('\n[Transaction] Using fixed gas values:', {
      gasLimit,
      gasPrice,
    });
    
    // Get nonce
    console.log('\n[Transaction] Getting nonce...');
    const nonceCmd = `curl -s -X POST -H "Content-Type: application/json" -d '{"jsonrpc":"2.0","method":"eth_getTransactionCount","params":["${walletAddress}","latest"],"id":1}' "${rpcUrl}"`;
    const nonceResponse = execSync(nonceCmd).toString();
    const nonce = JSON.parse(nonceResponse).result;
    console.log('Nonce:', nonce);
    
    // Create raw transaction
    const rawTx = {
      to: to,
      data: data,
      gasLimit,
      gasPrice,
      nonce,
      chainId: 19411, // GRC-20 testnet chain ID
      value: '0x0',
    };
    
    // Sign transaction
    console.log('\n[Transaction] Signing transaction...');
    const signedTx = await wallet.signTransaction(rawTx);
    console.log('Signed transaction:', signedTx);
    
    // Send transaction
    console.log('\n[Transaction] Sending transaction...');
    const sendTxCmd = `curl -s -X POST -H "Content-Type: application/json" -d '{"jsonrpc":"2.0","method":"eth_sendRawTransaction","params":["${signedTx}"],"id":1}' "${rpcUrl}"`;
    const sendTxResponse = execSync(sendTxCmd).toString();
    console.log('\n[Transaction] Raw response:', sendTxResponse);
    const txResult = JSON.parse(sendTxResponse);
    
    if (txResult.error) {
      throw new Error(`Transaction failed: ${JSON.stringify(txResult.error)}`);
    }
    
    const txHash = txResult.result;
    console.log('\n✅ [Transaction] Submitted:', { txHash });
    
    // Wait for confirmation
    console.log('\n[Transaction] Waiting for confirmation...');
    let confirmed = false;
    let attempts = 0;
    const maxAttempts = 30;
    
    while (!confirmed && attempts < maxAttempts) {
      const receiptCmd = `curl -s -X POST -H "Content-Type: application/json" -d '{"jsonrpc":"2.0","method":"eth_getTransactionReceipt","params":["${txHash}"],"id":1}' "${rpcUrl}"`;
      const receiptResponse = execSync(receiptCmd).toString();
      const receipt = JSON.parse(receiptResponse).result;
      
      if (receipt) {
        console.log('\n✅ [Transaction] Confirmed:', receipt);
        confirmed = true;
      } else {
        attempts++;
        console.log(`\n[Transaction] Waiting... (attempt ${attempts}/${maxAttempts})`);
        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
      }
    }
    
    if (!confirmed) {
      throw new Error('Transaction confirmation timeout');
    }
    
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
    console.log('Checking spaces...');
    
    // Get space IDs from .env
    const deedsSpaceId = process.env.DEEDS_SPACE_ID;
    const permitsSpaceId = process.env.PERMITS_SPACE_ID;
    
    console.log('DEEDS_SPACE_ID:', deedsSpaceId);
    console.log('PERMITS_SPACE_ID:', permitsSpaceId);
    
    // Check if deeds space exists
    if (deedsSpaceId) {
      const deedsExists = await spaceExists(deedsSpaceId);
      console.log(`Deeds space exists: ${deedsExists}`);
    } else {
      console.log('DEEDS_SPACE_ID not set in .env file');
    }
    
    // Check if permits space exists
    if (permitsSpaceId) {
      const permitsExists = await spaceExists(permitsSpaceId);
      console.log(`Permits space exists: ${permitsExists}`);
    } else {
      console.log('PERMITS_SPACE_ID not set in .env file');
    }
    
    // Check if update is requested
    const args = process.argv.slice(2);
    const shouldUpdate = args.includes('--update');
    
    if (shouldUpdate) {
      console.log('\nUpdating spaces...');
      
      // Update deeds space
      if (deedsSpaceId) {
        console.log('\nUpdating deeds space...');
        const deedsTxHash = await updateSpace(deedsSpaceId);
        console.log(`Deeds space updated with transaction hash: ${deedsTxHash}`);
      }
      
      // Update permits space
      if (permitsSpaceId) {
        console.log('\nUpdating permits space...');
        const permitsTxHash = await updateSpace(permitsSpaceId);
        console.log(`Permits space updated with transaction hash: ${permitsTxHash}`);
      }
    }
    
    console.log('\nDone!');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

// Execute the script
main().catch(console.error);
