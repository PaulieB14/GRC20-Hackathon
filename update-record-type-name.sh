#!/bin/bash

# This script updates the name of the "Record Type" entity to "Record type"

# Read the environment variables
source .env

# Create a temporary JSON file with the operations
cat > temp-record-type-ops.json << EOL
{
  "name": "Update Record Type Name to Sentence Case",
  "ops": [
    {
      "path": ["entity", "G7HaDAL1djja2vvw86M6Ez", "name"],
      "value": "Record type"
    }
  ],
  "author": "${WALLET_ADDRESS}"
}
EOL

echo "Created temporary operations file"

# Create a Node.js script to publish the edit
cat > publish-record-type-name.js << EOL
import { Ipfs } from '@graphprotocol/grc-20';
import { createPublicClient, createWalletClient, http, parseGwei } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const grc20Testnet = {
  id: 19411,
  name: 'Geogenesis Testnet',
  network: 'geogenesis-testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'ETH',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: { http: ['https://rpc-geo-test-zc16z3tcvf.t.conduit.xyz/'] },
    public: { http: ['https://rpc-geo-test-zc16z3tcvf.t.conduit.xyz/'] },
  }
};

async function publishRecordTypeName() {
  try {
    // Read the operations from the temporary file
    const editData = JSON.parse(fs.readFileSync('temp-record-type-ops.json', 'utf-8'));
    
    // Publish to IPFS
    console.log('Publishing to IPFS...');
    const cid = await Ipfs.publishEdit(editData);
    console.log(\`Published to IPFS with CID: \${cid}\`);
    
    // Get calldata
    console.log('Getting calldata...');
    const spaceId = process.env.PERMITS_SPACE_ID;
    const result = await fetch(\`https://api-testnet.grc-20.thegraph.com/space/\${spaceId}/edit/calldata\`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify({ 
        cid,
        network: "TESTNET"
      }),
    });
    
    if (!result.ok) {
      throw new Error(\`Failed to get calldata: \${result.statusText}\`);
    }
    
    const { to, data } = await result.json();
    console.log(\`Got calldata: to=\${to}, data length=\${data.length}\`);
    
    // Submit transaction
    console.log('Submitting transaction...');
    const account = privateKeyToAccount(process.env.PRIVATE_KEY);
    
    const publicClient = createPublicClient({
      chain: grc20Testnet,
      transport: http()
    });
    
    const walletClient = createWalletClient({
      account,
      chain: grc20Testnet,
      transport: http()
    });
    
    // Get nonce
    console.log('Getting nonce...');
    const nonce = await publicClient.getTransactionCount({
      address: account.address
    });
    console.log(\`Using nonce: \${nonce}\`);
    
    // Use gas settings from successful transaction
    const gasLimit = 13_000_000n;
    const baseGasPrice = parseGwei('0.01');
    
    // Send transaction
    console.log('Sending transaction...');
    const hash = await walletClient.sendTransaction({
      account,
      chain: grc20Testnet,
      to: to,
      data: data,
      gas: gasLimit,
      maxFeePerGas: baseGasPrice,
      maxPriorityFeePerGas: baseGasPrice,
      nonce,
      value: 0n
    });
    console.log(\`Transaction submitted with hash: \${hash}\`);
    
    // Wait for confirmation
    console.log('Waiting for confirmation...');
    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    console.log(\`Transaction confirmed in block \${receipt.blockNumber}\`);
    
    console.log('Record Type name updated successfully!');
    
    // Clean up temporary files
    fs.unlinkSync('temp-record-type-ops.json');
  } catch (error) {
    console.error('Failed to update Record Type name:', error);
    process.exit(1);
  }
}

publishRecordTypeName();
EOL

echo "Created publish script"

# Run the Node.js script
echo "Running publish script..."
node --experimental-modules publish-record-type-name.js

# Clean up
rm publish-record-type-name.js

echo "Done!"
