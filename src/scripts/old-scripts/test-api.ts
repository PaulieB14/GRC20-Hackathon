/**
 * Test API Script
 * 
 * This script tests the GRC-20 API directly.
 */

import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * Main function
 */
async function main(): Promise<void> {
  try {
    // Get space IDs from environment variables
    const deedsSpaceId = process.env.DEEDS_SPACE_ID || '';
    const permitsSpaceId = process.env.PERMITS_SPACE_ID || '';
    
    console.log('Space IDs:');
    console.log('DEEDS_SPACE_ID:', deedsSpaceId);
    console.log('PERMITS_SPACE_ID:', permitsSpaceId);
    
    // Check if deeds space exists
    console.log(`\nChecking if deeds space exists (${deedsSpaceId})...`);
    const deedsSpaceExists = await checkSpaceExists(deedsSpaceId);
    console.log(`Deeds space exists: ${deedsSpaceExists}`);
    
    // Check if permits space exists
    console.log(`\nChecking if permits space exists (${permitsSpaceId})...`);
    const permitsSpaceExists = await checkSpaceExists(permitsSpaceId);
    console.log(`Permits space exists: ${permitsSpaceExists}`);
    
    console.log('\nDone!');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

/**
 * Check if a space exists
 * 
 * @param spaceId The space ID to check
 * @returns A promise that resolves to true if the space exists, false otherwise
 */
async function checkSpaceExists(spaceId: string): Promise<boolean> {
  try {
    console.log(`Checking if space ${spaceId} exists...`);
    
    // Try to get calldata for a dummy edit to see if the space exists
    const dummyCid = 'ipfs://QmTest123';
    
    const result = await fetch(`https://api-testnet.grc-20.thegraph.com/space/${spaceId}/edit/calldata`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify({ 
        cid: dummyCid,
        network: "TESTNET"
      }),
    });
    
    console.log(`Response status: ${result.status}`);
    
    // If we get a 404, the space doesn't exist
    if (result.status === 404) {
      console.log(`Space ${spaceId} does not exist (404)`);
      return false;
    }
    
    // If we get a 500 with a specific error message, the space doesn't exist
    if (result.status === 500) {
      const text = await result.text();
      console.log(`Response text: ${text}`);
      
      if (text.includes("Could not find space with id")) {
        console.log(`Space ${spaceId} does not exist (500 with error message)`);
        return false;
      }
    }
    
    // Otherwise, assume the space exists
    console.log(`Space ${spaceId} exists`);
    return true;
  } catch (error) {
    console.error(`Error checking if space exists:`, error);
    return false;
  }
}

// Execute the script
main().catch(console.error);
