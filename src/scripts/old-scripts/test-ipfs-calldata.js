/**
 * Test IPFS Calldata Script
 * 
 * This script tests the IPFS part of the GRC-20 SDK and then tries to get calldata for a hardcoded space ID.
 */

import { Ipfs } from '@graphprotocol/grc-20';
import { account } from '../utils/wallet.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * Main function
 */
async function main() {
  try {
    console.log('Testing IPFS publishing...');
    
    // Create a simple edit
    const edit = {
      name: 'Test Edit',
      ops: [
        {
          type: 'CREATE_ENTITY',
          id: 'test-entity-1',
          name: 'Test Entity 1',
          types: ['test-type-1'],
        } as any, // Type assertion to bypass type checking
      ],
      author: account.address,
    };
    
    console.log('Edit to publish:', JSON.stringify(edit, null, 2));
    
    // Publish to IPFS
    console.log('Publishing to IPFS...');
    let cid;
    try {
      cid = await Ipfs.publishEdit(edit);
      console.log('Published to IPFS with CID:', cid);
    } catch (ipfsError) {
      console.error('Error publishing to IPFS:', ipfsError);
      console.error('Error details:', JSON.stringify(ipfsError, null, 2));
      throw new Error(`Failed to publish to IPFS: ${ipfsError.message}`);
    }
    
    // Try to get calldata for different space IDs
    const spaceIds = [
      'V7hIHTqL8wL6EIpwvZE1cT', // From .env
      'Q0kVTfpsKXYrf35qv6vgp4', // From .env
      '0x1234567890123456789012345678901234567890', // Random
      '0x0000000000000000000000000000000000000000', // Zero address
    ];
    
    for (const spaceId of spaceIds) {
      console.log(`\nTrying to get calldata for space ${spaceId}...`);
      
      try {
        const result = await fetch(`https://api-testnet.grc-20.thegraph.com/space/${spaceId}/edit/calldata`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json"
          },
          body: JSON.stringify({ 
            cid: cid,
            network: "TESTNET"
          }),
        });
        
        console.log(`Response status: ${result.status}`);
        
        if (!result.ok) {
          const text = await result.text();
          console.log(`Response text: ${text}`);
          console.log(`Failed to get calldata for space ${spaceId}: ${result.statusText}`);
          continue;
        }
        
        const responseData = await result.json();
        console.log(`Got calldata for space ${spaceId}:`, responseData);
      } catch (error) {
        console.error(`Error getting calldata for space ${spaceId}:`, error);
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
