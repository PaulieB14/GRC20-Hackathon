#!/usr/bin/env node

// Simple script to create a governance accept edit
const fs = require('fs');
const { execSync } = require('child_process');
require('dotenv').config();

// Create a log file
const logFile = 'governance-accept.log';
fs.writeFileSync(logFile, 'Starting governance accept script...\n');

function log(message) {
  fs.appendFileSync(logFile, message + '\n');
}

log('Starting governance accept script...');

// Check command line arguments
const cid = process.argv[2];
log('CID argument: ' + cid);
if (!cid) {
  log('Error: CID not provided');
  log('Usage: node governance-accept.js <CID>');
  process.exit(1);
}

// Check environment variables
const spaceId = process.env.SPACE_ID;
const author = process.env.WALLET_ADDRESS;
log('Environment variables: ' + JSON.stringify({ spaceId, author }));

if (!spaceId) {
  log('Error: SPACE_ID not set in environment');
  process.exit(1);
}

if (!author) {
  log('Error: WALLET_ADDRESS not set in environment');
  process.exit(1);
}

log(`\n[Governance] Creating governance accept edit for CID: ${cid}`);

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

log('Created edit: ' + JSON.stringify(edit, null, 2));

// Save to a temporary file
const tempFilePath = 'governance-accept-temp.json';
fs.writeFileSync(tempFilePath, JSON.stringify(edit, null, 2));
log('Saved edit to temporary file: ' + tempFilePath);

try {
  // Publish edit to IPFS
  log('\n[IPFS] Publishing governance accept edit...');
  const ipfsCmd = `curl -s -X POST -F "file=@${tempFilePath}" "https://api.thegraph.com/ipfs/api/v0/add?stream-channels=true&progress=false"`;
  log('IPFS command: ' + ipfsCmd);
  
  try {
    const ipfsResponse = execSync(ipfsCmd).toString();
    log('\n[IPFS] Response: ' + ipfsResponse);
    const { Hash } = JSON.parse(ipfsResponse);

    const governanceCid = `ipfs://${Hash}`;
    log('\n✅ [IPFS] Published governance accept edit: ' + JSON.stringify({ governanceCid }));

    // Get calldata using API
    log('\n[API] Getting calldata...');
    const calldataCmd = `curl -s -X POST -H "Content-Type: application/json" -H "Accept: application/json" -d '{"cid":"${governanceCid}","network":"TESTNET"}' "https://api-testnet.grc-20.thegraph.com/space/${spaceId}/edit/calldata"`;
    log('\n[API] Executing command: ' + calldataCmd);
    
    try {
      const calldataResponse = execSync(calldataCmd).toString();
      log('\n[API] Response: ' + calldataResponse);
  
      // Fix JSON response if needed
      let responseData;
      try {
        responseData = JSON.parse(calldataResponse);
        log('Parsed response data: ' + JSON.stringify(responseData));
      } catch (e) {
        log('Error parsing JSON response: ' + e.message);
        // Try to fix common JSON formatting issues
        const fixedJson = calldataResponse
          .replace(/"to":"([^"]*)""data"/, '"to":"$1","data"')
          .replace(/}""id":/, '},"id":');
        log('Fixed JSON: ' + fixedJson);
        responseData = JSON.parse(fixedJson);
        log('Parsed fixed response data: ' + JSON.stringify(responseData));
      }

      const { to, data } = responseData;

      if (!to || !data) {
        throw new Error(`Invalid response format: ${JSON.stringify(responseData)}`);
      }

      log('\n✅ [API] Got calldata: ' + JSON.stringify({
        to,
        dataLength: data.length
      }));

      // Print transaction details
      log('\n[Transaction] Transaction details:');
      log(`To: ${to}`);
      log(`Data: ${data}`);
      log(`\nTo send this transaction, you can use the test-nonce.sh script or another method to sign and send the transaction.`);
    } catch (calldataError) {
      log('\n❌ [API Error]: ' + calldataError.message);
      if (calldataError.stdout) log('stdout: ' + calldataError.stdout.toString());
      if (calldataError.stderr) log('stderr: ' + calldataError.stderr.toString());
    }
  } catch (ipfsError) {
    log('\n❌ [IPFS Error]: ' + ipfsError.message);
    if (ipfsError.stdout) log('stdout: ' + ipfsError.stdout.toString());
    if (ipfsError.stderr) log('stderr: ' + ipfsError.stderr.toString());
  }
} catch (error) {
  log('\n❌ [Error]: ' + error.message);
  if (error.stack) log('Stack: ' + error.stack);
  process.exit(1);
} finally {
  // Clean up temporary file
  if (fs.existsSync(tempFilePath)) {
    try {
      fs.unlinkSync(tempFilePath);
      log('Cleaned up temporary file: ' + tempFilePath);
    } catch (cleanupError) {
      log('Error cleaning up temporary file: ' + cleanupError.message);
    }
  }
  
  log('Script execution completed');
}
