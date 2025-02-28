#!/usr/bin/env node

// Simple script to create a governance accept edit JSON file
const fs = require('fs');
require('dotenv').config();

console.log('Starting simple governance accept script...');

// Check command line arguments
const cid = process.argv[2];
console.log('CID argument:', cid);
if (!cid) {
  console.error('Error: CID not provided');
  console.error('Usage: node simple-governance-accept.js <CID>');
  process.exit(1);
}

// Check environment variables
const spaceId = process.env.SPACE_ID;
const author = process.env.WALLET_ADDRESS;
console.log('Environment variables:', { spaceId, author });

if (!spaceId) {
  console.error('Error: SPACE_ID not set in environment');
  process.exit(1);
}

if (!author) {
  console.error('Error: WALLET_ADDRESS not set in environment');
  process.exit(1);
}

console.log(`\n[Governance] Creating governance accept edit for CID: ${cid}`);

// Create the governance edit JSON
const edit = {
  name: "Governance Accept Edit",
  author: author,
  description: `Governance acceptance of edit with CID: ${cid}`,
  ops: [
    {
      type: "SET_TRIPLE",
      triple: {
        entity: spaceId,
        attribute: "acceptedEdit",
        value: { type: "TEXT", value: cid }
      }
    }
  ],
  network: "TESTNET"
};

console.log('Created edit:', JSON.stringify(edit, null, 2));

// Save to a file
const outputFilePath = 'governance-accept-output.json';
fs.writeFileSync(outputFilePath, JSON.stringify(edit, null, 2));
console.log(`\nSaved edit to file: ${outputFilePath}`);
console.log('Script execution completed');
