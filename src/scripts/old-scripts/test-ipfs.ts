/**
 * Test IPFS Script
 * 
 * This script tests publishing to IPFS using the GRC-20 SDK.
 */

import { Graph } from '@graphprotocol/grc-20';
import { account } from '../utils/wallet.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Print out environment for debugging
console.log('Environment variables:');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('PRIVATE_KEY:', process.env.PRIVATE_KEY ? '(set)' : '(not set)');
console.log('WALLET_ADDRESS:', process.env.WALLET_ADDRESS);
console.log('NETWORK:', process.env.NETWORK);
console.log('RPC_URL:', process.env.RPC_URL);
console.log('CHAIN_ID:', process.env.CHAIN_ID);

console.log('Wallet configured successfully');
console.log(`Address: ${account.address}`);

// Create a simple property
console.log('Creating a test property...');
const propertyResult = Graph.createProperty({
  name: 'Test Property',
  type: 'TEXT',
});

console.log('Property created:');
console.log('ID:', propertyResult.id);
console.log('Ops:', JSON.stringify(propertyResult.ops, null, 2));

// Exit after 5 seconds to prevent hanging
setTimeout(() => {
  console.log('Exiting after timeout');
  process.exit(0);
}, 5000);
