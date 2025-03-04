#!/bin/bash
set -e

# Get the space ID from the .env file
PERMITS_SPACE_ID=$(grep PERMITS_SPACE_ID .env | cut -d '=' -f2)

# Publish the operations to IPFS
echo "Publishing to IPFS..."
IPFS_CID=$(node --input-type=module -e "
import fs from 'fs';
import { publish } from './dist-test/core/publish.js';

async function run() {
  const ops = JSON.parse(fs.readFileSync('temp-ops.json', 'utf-8'));
  const cid = await publish(ops);
  console.log(cid);
}

run().catch(console.error);
")

echo "Published to IPFS with CID: ${IPFS_CID}"

# Get the calldata for the transaction
echo "Getting calldata..."
node --input-type=module -e "
import fs from 'fs';
import { getCalldata } from './dist-test/utils/server.js';

async function run() {
  const spaceId = process.env.PERMITS_SPACE_ID;
  const cid = process.argv[1];
  
  const calldata = await getCalldata(spaceId, cid);
  
  fs.writeFileSync('calldata.json', JSON.stringify(calldata, null, 2));
  console.log('Got calldata: to=' + calldata.to + ' data length=' + calldata.data.length);
}

run().catch(console.error);
" "${IPFS_CID}"

# Submit the transaction
echo "Submitting transaction..."
node --input-type=module -e "
import fs from 'fs';
import { submitTransaction } from './dist-test/submit-transaction.js';

async function run() {
  const calldata = JSON.parse(fs.readFileSync('calldata.json', 'utf-8'));
  
  const txHash = await submitTransaction(calldata.to, calldata.data);
  console.log('Transaction submitted with hash: ' + txHash);
  
  console.log('Waiting for confirmation...');
  const receipt = await waitForConfirmation(txHash);
  console.log('Transaction confirmed in block ' + receipt.blockNumber);
}

async function waitForConfirmation(txHash) {
  const { account } = await import('./dist-test/utils/wallet.js');
  const provider = account.provider;
  
  return new Promise((resolve, reject) => {
    provider.once(txHash, (receipt) => {
      resolve(receipt);
    });
    
    setTimeout(() => {
      reject(new Error('Transaction confirmation timeout'));
    }, 60000);
  });
}

run().catch(console.error);
"
