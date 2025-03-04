/**
 * Check Spaces Exist Script
 * 
 * This script checks if the spaces specified in the .env file exist.
 */

import dotenv from 'dotenv';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

// Load environment variables
dotenv.config();

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
 * Main function
 */
async function main() {
  try {
    console.log('Checking if spaces exist...');
    
    // Check if deeds space exists
    const deedsSpaceId = process.env.DEEDS_SPACE_ID;
    console.log(`Checking if deeds space exists (${deedsSpaceId})...`);
    const deedsSpaceExists = await spaceExists(deedsSpaceId);
    console.log(`Deeds space exists: ${deedsSpaceExists}`);
    
    // Check if permits space exists
    const permitsSpaceId = process.env.PERMITS_SPACE_ID;
    console.log(`Checking if permits space exists (${permitsSpaceId})...`);
    const permitsSpaceExists = await spaceExists(permitsSpaceId);
    console.log(`Permits space exists: ${permitsSpaceExists}`);
    
    console.log('Done!');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

// Execute the script
main().catch(console.error);
