import { Ipfs, type Op } from "@graphprotocol/grc-20";
import { wallet } from "./wallet.js";
import fetch from 'node-fetch';

type CalldataResponse = {
  to: string;
  data: string;
};

type PublishOptions = {
  /** The ID of the space to publish to */
  spaceId: string;
  /** Name of the edit proposal */
  editName: string;
  /** Author of the edit proposal */
  author: string;
  /** Array of operations to include in the proposal */
  ops: Op[];
  /** Optional override for API endpoint */
  apiBaseUrl?: string;
};

/**
 * Publishes an edit proposal to IPFS and submits it to the GRC-20 network using the SDK.
 * 
 * @param options - Configuration for the publish operation
 * @returns Promise<string> - Transaction hash of the submitted edit
 */
export async function publish(options: PublishOptions): Promise<string> {
  try {
    // Validate required fields
    if (!options.spaceId || !options.editName || !options.author || !options.ops.length) {
      throw new Error('Missing required fields in publish options: spaceId, editName, author, and ops are required');
    }

    console.log('Publishing edit proposal...', {
      name: options.editName,
      author: options.author,
      opsCount: options.ops.length,
    });

    // Use SDK to publish edit to IPFS
    const cid = await Ipfs.publishEdit({
      name: options.editName,
      ops: options.ops,
      author: options.author,
    });

    console.log('Successfully published to IPFS:', cid);

    // Fetch calldata using the new API
    const apiBaseUrl = options.apiBaseUrl || 'https://api-testnet.grc-20.thegraph.com';
    const calldataResult = await fetch(`${apiBaseUrl}/space/${options.spaceId}/edit/calldata`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cid,
        network: 'TESTNET',
      }),
    });

    if (!calldataResult.ok) {
      throw new Error(`Failed to fetch calldata: ${await calldataResult.text()}`);
    }

    const { to, data } = await calldataResult.json() as CalldataResponse;
    console.log('Successfully retrieved calldata');

    // Submit transaction
    const txResult = await wallet.sendTransaction({
      to: to as `0x${string}`,
      value: 0n,
      data: data as `0x${string}`,
    });
    console.log('Transaction submitted successfully:', txResult);

    return txResult;
  } catch (error) {
    console.error('Publish operation failed:', error);
    throw error;
  }
}
