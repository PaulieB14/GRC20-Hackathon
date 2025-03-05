/**
 * Create Space Complete Script
 * 
 * This script creates a space using the complete approach from the documentation:
 * 1. Create a transaction to the zero address
 * 2. Wait for confirmation
 * 3. Derive the space ID from the transaction hash
 */

import { createPublicClient, createWalletClient, http, Chain, parseGwei } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import 'dotenv/config';
import fs from 'fs';
import path from 'path';

// Define the GRC-20 Testnet chain
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

/**
 * Update the .env file with a new variable
 * 
 * @param key The environment variable key
 * @param value The environment variable value
 */
function updateEnvFile(key, value) {
  try {
    const envPath = path.resolve(process.cwd(), '.env');
    
    let envContent = '';
    
    // Read existing .env file if it exists
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf8');
    }
    
    // Check if the key already exists
    const regex = new RegExp(`^${key}=.*`, 'm');
    
    if (regex.test(envContent)) {
      // Replace existing key
      envContent = envContent.replace(regex, `${key}=${value}`);
    } else {
      // Add new key
      envContent += `\n${key}=${value}`;
    }
    
    // Write to .env file
    fs.writeFileSync(envPath, envContent.trim());
    console.log(`Updated ${key} in .env file`);
  } catch (error) {
    console.error(`Failed to update .env file:`, error);
  }
}

/**
 * Create a space
 * 
 * @param {string} spaceName The name of the space
 * @returns {Promise<string>} A promise that resolves to the space ID
 */
async function createSpace(spaceName) {
  console.log(`[Space] Creating space "${spaceName}"...`);
  
  if (!process.env.PRIVATE_KEY) {
    throw new Error('PRIVATE_KEY not set in environment');
  }
  
  if (!process.env.WALLET_ADDRESS) {
    throw new Error('WALLET_ADDRESS not set in environment');
  }
  
  try {
    // Set up clients
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
    console.log('[Transaction] Getting nonce...');
    const nonce = await publicClient.getTransactionCount({
      address: account.address
    });
    console.log('Nonce:', nonce);
    
    // Use gas settings
    const gasLimit = 100_000n; // Space creation should be simple
    const baseGasPrice = parseGwei('0.01');
    
    // Send transaction to zero address with empty data
    console.log('[Transaction] Sending transaction to zero address...');
    const hash = await walletClient.sendTransaction({
      chain: grc20Testnet,
      to: '0x0000000000000000000000000000000000000000', // Zero address for space creation
      data: '0x', // Empty data for space creation
      gas: gasLimit,
      maxFeePerGas: baseGasPrice,
      maxPriorityFeePerGas: baseGasPrice,
      nonce,
      value: 0n
    });
    console.log('[Transaction] Submitted:', { hash });
    
    // Wait for confirmation
    console.log('[Transaction] Waiting for confirmation...');
    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    console.log('[Transaction] Confirmed:', receipt);
    
    // The space ID is derived from the transaction hash
    const spaceId = `0x${hash.slice(2, 42)}`;
    console.log(`[Space] Created with ID: ${spaceId}`);
    
    // Update .env file with the new space ID
    if (spaceName.toLowerCase().includes("deed")) {
      console.log(`Adding DEEDS_SPACE_ID=${spaceId} to .env file`);
      updateEnvFile("DEEDS_SPACE_ID", spaceId);
    } else if (spaceName.toLowerCase().includes("permit")) {
      console.log(`Adding PERMITS_SPACE_ID=${spaceId} to .env file`);
      updateEnvFile("PERMITS_SPACE_ID", spaceId);
    } else {
      console.log(`Adding NEW_SPACE_ID=${spaceId} to .env file`);
      updateEnvFile("NEW_SPACE_ID", spaceId);
    }
    
    return spaceId;
  } catch (error) {
    console.error('[Error]:', error);
    throw error;
  }
}

// Execute if running directly
if (import.meta.url === new URL(import.meta.url).href) {
  console.log('[Startup] Starting...');
  
  // Get space name from command line arguments
  const spaceName = process.argv[2] || 'Test Space';
  
  createSpace(spaceName).catch(error => {
    console.error('[Error]:', error);
    process.exit(1);
  });
}

export { createSpace };
