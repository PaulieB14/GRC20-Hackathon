/**
 * Transaction Service
 * 
 * This service handles blockchain transactions for the GRC-20 space.
 */

import { account } from '../utils/wallet.js';
import { EntityOp } from '../core/graph.js';
import { Ipfs } from '@graphprotocol/grc-20';
import { createPublicClient, createWalletClient, http, Chain, parseGwei } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load environment variables
dotenv.config();

// Define the GRC-20 testnet chain
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
} as const satisfies Chain;

/**
 * Transaction Service
 * 
 * Provides services for submitting transactions to the GRC-20 spaces.
 */
export class TransactionService {
  /**
   * Create a new GRC-20 space
   * 
   * @param name The name of the space
   * @returns A promise that resolves to the space ID
   */
  static async createSpace(name: string): Promise<string> {
    console.log(`Creating space "${name}"...`);
    
    try {
      // Import the deploySpace function dynamically to avoid circular dependencies
      // @ts-ignore - Ignore TypeScript error for missing type definitions
      const { deploySpace } = await import('../scripts/old-scripts/deploy-space-direct.js');
      
      // Deploy the space using the deploySpace function
      const hash = await deploySpace(name);
      
      // The space ID is derived from the transaction hash
      const spaceId = `0x${hash.slice(2, 42)}`;
      console.log(`Space created with ID: ${spaceId}`);
      
      return spaceId;
    } catch (error) {
      console.error('Failed to create space:', error);
      throw error;
    }
  }

  /**
   * Submit operations to a GRC-20 space
   * 
   * @param spaceId The space ID
   * @param ops The operations to submit
   * @returns The transaction hash
   */
  static async submitOperations(spaceId: string, ops: EntityOp[]): Promise<string> {
    if (!spaceId) {
      throw new Error('Space ID is required');
    }

    if (!ops || ops.length === 0) {
      throw new Error('Operations are required');
    }

    console.log(`Submitting ${ops.length} operations to space ${spaceId}...`);

    try {
      // Step 1: Publish to IPFS using the GRC-20 SDK
      console.log("[IPFS] Publishing edit...");
      console.log(`[IPFS] Operations count: ${ops.length}`);
      console.log(`[IPFS] Author address: ${account.address}`);
      console.log(`[IPFS] First few operations:`, JSON.stringify(ops.slice(0, 3), null, 2));
      
      let cid: string;
      try {
        // Use real IPFS publishing
        console.log("[IPFS] Publishing to IPFS...");
        cid = await Ipfs.publishEdit({
          name: `Batch of ${ops.length} operations`,
          ops: ops as any, // Type conversion needed due to SDK differences
          author: account.address
        });
        console.log(`[IPFS] Published edit with CID: ${cid}`);
      } catch (ipfsError: any) {
        console.error("[IPFS] Error publishing to IPFS:", ipfsError);
        console.error("[IPFS] Error details:", JSON.stringify(ipfsError, null, 2));
        throw new Error(`Failed to publish to IPFS: ${ipfsError.message}`);
      }

      // Step 2: Get calldata from the GRC-20 API
      console.log("[API] Getting calldata...");
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

      if (!result.ok) {
        const text = await result.text();
        throw new Error(`Failed to get calldata: ${result.statusText}\n${text}`);
      }

      const responseData = await result.json();
      const { to, data } = responseData;

      if (!to || !data) {
        throw new Error(`Invalid response format: ${JSON.stringify(responseData)}`);
      }

      console.log(`[API] Got calldata for address: ${to}`);

      // Step 3: Submit transaction to the GRC-20 network
      console.log("[Transaction] Submitting to network...");
      
      if (!process.env.PRIVATE_KEY) {
        throw new Error('PRIVATE_KEY not set in environment');
      }

      const privateKey = process.env.PRIVATE_KEY as `0x${string}`;
      const viemAccount = privateKeyToAccount(privateKey);
      
      const publicClient = createPublicClient({
        chain: grc20Testnet,
        transport: http()
      });

      const walletClient = createWalletClient({
        account: viemAccount,
        chain: grc20Testnet,
        transport: http()
      });

      // Get nonce
      console.log("[Transaction] Getting nonce...");
      const nonce = await publicClient.getTransactionCount({
        address: viemAccount.address
      });
      console.log(`Nonce: ${nonce}`);

      // Use gas settings from successful transaction
      const gasLimit = 13_000_000n;
      const baseGasPrice = parseGwei('0.01');

      // Send transaction
      console.log("[Transaction] Sending transaction...");
      const hash = await walletClient.sendTransaction({
        chain: grc20Testnet,
        to: to as `0x${string}`,
        data: data as `0x${string}`,
        gas: gasLimit,
        maxFeePerGas: baseGasPrice,
        maxPriorityFeePerGas: baseGasPrice,
        nonce,
        value: 0n
      });
      console.log(`[Transaction] Submitted with hash: ${hash}`);

      // Wait for confirmation
      console.log("[Transaction] Waiting for confirmation...");
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      console.log(`[Transaction] Confirmed in block: ${receipt.blockNumber}`);

      return hash;
    } catch (error: any) {
      console.error("Error submitting operations:", error);
      
      // Instead of falling back to mock implementation, throw the error
      // so it can be fixed and real transactions can be published
      throw new Error(`Failed to submit operations to GRC-20 network: ${error.message}`);
    }
  }

  /**
   * Submit a batch of operations to a GRC-20 space
   * 
   * @param spaceId The space ID
   * @param opsBatches The batches of operations to submit
   * @param batchSize The maximum number of operations per batch
   * @returns The transaction hashes
   */
  static async submitOperationBatches(
    spaceId: string,
    opsBatches: EntityOp[][],
    batchSize: number = 100
  ): Promise<string[]> {
    if (!spaceId) {
      throw new Error('Space ID is required');
    }

    if (!opsBatches || opsBatches.length === 0) {
      throw new Error('Operation batches are required');
    }

    console.log(`Submitting ${opsBatches.length} batches to space ${spaceId}...`);

    const txHashes: string[] = [];

    for (let i = 0; i < opsBatches.length; i++) {
      const batch = opsBatches[i];
      console.log(`Submitting batch ${i + 1}/${opsBatches.length} with ${batch.length} operations...`);
      
      const txHash = await this.submitOperations(spaceId, batch);
      txHashes.push(txHash);
      
      // Wait a bit between batches to avoid nonce issues
      if (i < opsBatches.length - 1) {
        console.log('Waiting 2 seconds before submitting next batch...');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    return txHashes;
  }

  /**
   * Split operations into batches
   * 
   * @param ops The operations to split
   * @param batchSize The maximum number of operations per batch
   * @returns The batches of operations
   */
  static splitIntoBatches(ops: EntityOp[], batchSize: number = 100): EntityOp[][] {
    if (!ops || ops.length === 0) {
      return [];
    }

    const batches: EntityOp[][] = [];
    
    for (let i = 0; i < ops.length; i += batchSize) {
      batches.push(ops.slice(i, i + batchSize));
    }

    return batches;
  }
  
  /**
   * Check if a space exists
   * 
   * @param spaceId The space ID to check
   * @returns A promise that resolves to true if the space exists, false otherwise
   */
  static async spaceExists(spaceId: string): Promise<boolean> {
    try {
      console.log(`Checking if space ${spaceId} exists...`);
      
      // Try to get calldata for a dummy edit to see if the space exists
      const dummyCid = 'ipfs://QmTest123';
      
      const result = await fetch(`https://api-testnet.grc-20.thegraph.com/space/${spaceId}/edit/calldata`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({ 
          cid: dummyCid,
          network: "TESTNET"
        }),
      });
      
      // If we get a 404, the space doesn't exist
      if (result.status === 404) {
        console.log(`Space ${spaceId} does not exist`);
        return false;
      }
      
      // If we get a 500 with a specific error message, the space doesn't exist
      if (result.status === 500) {
        const text = await result.text();
        if (text.includes("Could not find space with id")) {
          console.log(`Space ${spaceId} does not exist`);
          return false;
        }
      }
      
      // Otherwise, assume the space exists
      console.log(`Space ${spaceId} exists`);
      return true;
    } catch (error) {
      console.error(`Error checking if space exists:`, error);
      return false;
    }
  }

  /**
   * Update the .env file with a new variable
   * 
   * @param key The environment variable key
   * @param value The environment variable value
   */
  private static updateEnvFile(key: string, value: string): void {
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
}
