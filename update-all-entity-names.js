// This script updates all entity names to use sentence case
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
  },
};

// Define the entities to update
const entitiesToUpdate = [
  {
    id: 'G7HaDAL1djja2vvw86M6Ez',
    name: 'Record type',
    description: 'Record Type entity updated to sentence case'
  },
  {
    id: 'PZQKkodWQTZ3rT2wDM8tYr',
    name: 'Type',
    description: 'Type entity updated to sentence case'
  }
];

async function updateEntityNames() {
  try {
    // Create operations to update entity names
    const ops = entitiesToUpdate.map(entity => ({
      path: ['entity', entity.id, 'name'],
      value: entity.name
    }));

    // Create the edit data
    const editData = {
      name: "Update Entity Names to Sentence Case",
      ops: ops,
      author: process.env.WALLET_ADDRESS
    };

    // Publish to IPFS
    console.log('Publishing to IPFS...');
    const cid = await Ipfs.publishEdit(editData);
    console.log(`Published to IPFS with CID: ${cid}`);

    // Get calldata
    console.log('Getting calldata...');
    const spaceId = process.env.PERMITS_SPACE_ID;
    const result = await fetch(`https://api-testnet.grc-20.thegraph.com/space/${spaceId}/edit/calldata`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify({
        cid,
        network: "TESTNET",
      }),
    });

    if (!result.ok) {
      throw new Error(`Failed to get calldata: ${result.statusText}`);
    }

    const { to, data } = await result.json();
    console.log(`Got calldata: to=${to} data length=${data.length}`);

    // Submit transaction
    console.log('Submitting transaction...');
    const account = privateKeyToAccount(process.env.PRIVATE_KEY);

    const publicClient = createPublicClient({
      chain: grc20Testnet,
      transport: http(),
    });

    const walletClient = createWalletClient({
      account,
      chain: grc20Testnet,
      transport: http(),
    });

    // Get nonce
    console.log('Getting nonce...');
    const nonce = await publicClient.getTransactionCount({
      address: account.address,
    });
    console.log(`Using nonce: ${nonce}`);

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
      value: 0n,
    });
    console.log(`Transaction submitted with hash: ${hash}`);

    // Wait for confirmation
    console.log('Waiting for confirmation...');
    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    console.log(`Transaction confirmed in block ${receipt.blockNumber}`);

    console.log('Entity names updated successfully!');
    
    // Save the entity IDs and URLs to a CSV file
    fs.writeFileSync('updated-entity-urls.csv', 'Type,Name,Entity ID,URL\n');
    
    for (const entity of entitiesToUpdate) {
      const url = `https://geogenesis-git-feat-testnet-geo-browser.vercel.app/space/${spaceId}/${entity.id}`;
      fs.appendFileSync('updated-entity-urls.csv', `Entity Type,${entity.name},${entity.id},${url}\n`);
      console.log(`Entity ID: ${entity.id}, Name: ${entity.name}, URL: ${url}`);
    }
    
    console.log(`Entity IDs and URLs saved to updated-entity-urls.csv`);
    
    // Copy the CSV file to the desktop for easier access
    fs.copyFileSync('updated-entity-urls.csv', `${process.env.HOME}/Desktop/updated-entity-urls.csv`);
    console.log(`A copy has also been placed on your desktop: ${process.env.HOME}/Desktop/updated-entity-urls.csv`);
    
  } catch (error) {
    console.error('Failed to update entity names:', error);
    process.exit(1);
  }
}

updateEntityNames();
