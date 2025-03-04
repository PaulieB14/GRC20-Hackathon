/**
 * Test IPFS Direct Script
 * 
 * This script tests the IPFS part of the GRC-20 SDK directly.
 */

import { Ipfs } from '@graphprotocol/grc-20';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * Main function
 */
async function main(): Promise<void> {
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
      author: process.env.WALLET_ADDRESS || '0x6596a3C7C2eA69D04F01F064AA4e914196BbA0a7',
    };
    
    console.log('Edit to publish:', JSON.stringify(edit, null, 2));
    
    // Publish to IPFS
    console.log('Publishing to IPFS...');
    try {
      const cid = await Ipfs.publishEdit(edit);
      console.log('Published to IPFS with CID:', cid);
    } catch (ipfsError: any) {
      console.error('Error publishing to IPFS:', ipfsError);
      console.error('Error details:', JSON.stringify(ipfsError, null, 2));
      throw new Error(`Failed to publish to IPFS: ${ipfsError.message}`);
    }
    
    console.log('Done!');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

// Execute the script
main().catch(console.error);
