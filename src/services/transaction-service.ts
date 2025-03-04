/**
 * Transaction Service
 * 
 * This file provides services for submitting transactions to the GRC-20 spaces.
 */

import { account } from '../utils/wallet.js';
import { EntityOp } from '../core/graph.js';

/**
 * Transaction Service
 * 
 * Provides services for submitting transactions to the GRC-20 spaces.
 */
export class TransactionService {
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

    // Encode operations as JSON
    const data = JSON.stringify(ops);
    
    // Submit transaction
    const txHash = await account.sendTransaction({
      to: spaceId,
      value: 0n,
      data,
    });

    console.log(`Transaction submitted: ${txHash}`);
    return txHash;
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
}
