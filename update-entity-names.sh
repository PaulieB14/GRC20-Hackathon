#!/bin/bash

# This script is a workaround since we're having issues with the TypeScript types
# It will directly use the Ipfs.publishEdit API to update entity names

# Read the environment variables
source .env

# Create a temporary JSON file with the operations
cat > temp-entity-names-ops.json << EOL
{
  "name": "Update GRC20 Property Deed Entity Names",
  "ops": [
    {
      "path": ["entity", "7tzYRxS8QES1fQQLoUpc8U", "name"],
      "value": "2025035356"
    },
    {
      "path": ["entity", "PbuL6TM19rdkFoEh31VyQq", "name"],
      "value": "2025035363"
    },
    {
      "path": ["entity", "GXSWc9tEJp5iP1idJDyuYC", "name"],
      "value": "2025035367"
    },
    {
      "path": ["entity", "QQ2Cb5L4yNTUfva7aEXYdk", "name"],
      "value": "2025035368"
    },
    {
      "path": ["entity", "JUtVFrszpHccyEQPkURtUj", "name"],
      "value": "2025035369"
    },
    {
      "path": ["entity", "JSvDqnQxpXqdVYDm3G9Zyy", "name"],
      "value": "2025035383"
    },
    {
      "path": ["entity", "YB7z9V1fXtBv1LU5kpY2i8", "name"],
      "value": "2025035390"
    },
    {
      "path": ["entity", "4a2Y9zUyeknUBCu8afhyds", "name"],
      "value": "2025035391"
    },
    {
      "path": ["entity", "8b6w38q92qaxvbvgrvJPNh", "name"],
      "value": "2025035398"
    }
  ],
  "author": "${WALLET_ADDRESS}"
}
EOL

echo "Created temporary operations file"

# Create a Node.js script to publish the edit
cat > publish-entity-names.js << EOL
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

async function publishEntityNames() {
  try {
    // Read the operations from the temporary file
    const editData = JSON.parse(fs.readFileSync('temp-entity-names-ops.json', 'utf-8'));
    
    // Publish to IPFS
    console.log('Publishing to IPFS...');
    const cid = await Ipfs.publishEdit(editData);
    console.log(\`Published to IPFS with CID: \${cid}\`);
    
    // Get calldata
    console.log('Getting calldata...');
    const spaceId = process.env.SPACE_ID;
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
    
    console.log('Entity names updated successfully!');
    
    // Clean up temporary files
    fs.unlinkSync('temp-entity-names-ops.json');
  } catch (error) {
    console.error('Failed to update entity names:', error);
    process.exit(1);
  }
}

publishEntityNames();
EOL

echo "Created publish script"

# Run the Node.js script
echo "Running publish script..."
node --experimental-modules publish-entity-names.js

# Clean up
rm publish-entity-names.js

echo "Done!"
