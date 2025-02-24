import { Triple, type Op, type ValueType, type SetTripleOp } from "@graphprotocol/grc-20";
import { wallet } from "./wallet.js";
import fetch, { Response } from 'node-fetch';

type ApiResponse = {
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
 * Publishes an edit proposal to IPFS and submits it to the GRC-20 network.
 * 
 * @param options - Configuration for the publish operation
 * @returns Promise<string> - Transaction hash of the submitted edit
 * @throws {Error} If required fields are missing
 * @throws {Error} If IPFS upload fails
 * @throws {Error} If calldata retrieval fails
 * @throws {Error} If transaction submission fails
 */
export async function publish(options: PublishOptions): Promise<string> {
  try {
    // Validate required fields
    if (!options.spaceId || !options.editName || !options.author || !options.ops.length) {
      throw new Error('Missing required fields in publish options: spaceId, editName, author, and ops are required');
    }

    // Log what we're publishing
    console.log('Publishing edit proposal...', {
      name: options.editName,
      author: options.author,
      opsCount: options.ops.length,
    });

    // Step 1: Upload edit proposal to IPFS
    console.log('Uploading edit proposal to IPFS...');
    // Ensure proper formatting of ops
    const formattedOps = options.ops.map(op => {
      if (op.type === 'SET_TRIPLE') {
        return {
          type: 'SET_TRIPLE' as const,
          triple: {
            entity: op.triple.entity,
            attribute: op.triple.attribute,
            value: op.triple.value
          }
        };
      }
      return op;
    });

    const edit = {
      name: options.editName,
      author: options.author,
      ops: formattedOps
    };

    const editJson = JSON.stringify(edit);
    console.log('Edit JSON:', editJson);
    console.log('Edit JSON length:', editJson.length);

    let cid: string | undefined;
    try {
      // Try Graph's IPFS endpoint
      console.log('Trying Graph IPFS endpoint...');
      const FormData = await import('form-data');
      const formData = new FormData.default();
      formData.append('file', Buffer.from(editJson), {
        filename: 'edit.json',
        contentType: 'application/json',
      });

      const response = await Promise.race<Response>([
        fetch('https://api.thegraph.com/ipfs/api/v0/add?pin=true', {
          method: 'POST',
          headers: {
            ...formData.getHeaders(),
            'Accept': 'application/json',
          },
          body: formData as any,
        }) as Promise<Response>,
        new Promise((_, reject) => setTimeout(() => reject(new Error('Graph IPFS upload timed out (30s)')), 30000)),
      ]);

      const responseText = await response.text();
      console.log('Graph IPFS response:', responseText);

      if (!response.ok) {
        throw new Error(`Graph IPFS upload failed: ${responseText}`);
      }

      const result = JSON.parse(responseText) as { Hash: string };
      cid = result.Hash;
      console.log('Successfully uploaded to Graph IPFS with CID:', `ipfs://${cid}`);

      if (!cid) {
        throw new Error('Failed to get valid CID from any IPFS endpoint');
      }
    } catch (error: any) {
      throw new Error(`IPFS upload failed: ${error?.message || 'Unknown error'}`);
    }

    // Fetch calldata
    const apiBaseUrl = options.apiBaseUrl || 'https://api-testnet.grc-20.thegraph.com';
    console.log('Fetching calldata for space:', options.spaceId);
    const calldataController = new AbortController();
    const calldataTimeout = setTimeout(() => calldataController.abort(), 30000); // 30-second timeout
    const calldataResult = await fetch(`${apiBaseUrl}/space/${options.spaceId}/edit/calldata`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cid: cid, // Raw CID
        network: 'TESTNET',
      }),
      signal: calldataController.signal,
    }).finally(() => clearTimeout(calldataTimeout));

    console.log('Calldata fetch completed');
    console.log('Calldata response status:', calldataResult.status);
    const calldataText = await calldataResult.text();
    console.log('Calldata raw response:', calldataText);

    if (!calldataResult.ok) {
      throw new Error(`Failed to fetch calldata: ${calldataText}`);
    }

    const calldataResponse = JSON.parse(calldataText) as ApiResponse;
    if (!calldataResponse.to || !calldataResponse.data) {
      throw new Error(`Invalid calldata response: ${calldataText}`);
    }
    const { to, data } = calldataResponse;
    console.log('Successfully retrieved calldata:', { to, data });

    // Submit transaction using example repo pattern
    console.log('Submitting transaction...');
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
