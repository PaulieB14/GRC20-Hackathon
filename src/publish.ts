import { Triple, type Op, type ValueType, type SetTripleOp } from "@graphprotocol/grc-20";
import { wallet } from "./wallet.js";
import fetch from 'node-fetch';

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

    // Step 1: Upload to IPFS
    console.log('Publishing edit proposal...', {
      name: options.editName,
      author: options.author,
      opsCount: options.ops.length,
    });

    // Log first op for debugging
    if (process.env.DEBUG) {
      console.log('Sample op:', JSON.stringify(options.ops[0], null, 2));
    }

    const editProposal = {
      name: options.editName,
      author: options.author,
      ops: options.ops,
    };

    // Log edit proposal for debugging
    console.log('Edit proposal:', JSON.stringify(editProposal, null, 2));

    // Upload to IPFS as JSON
    const editJson = JSON.stringify(editProposal);
    const blob = new Blob([editJson], { type: 'application/json' });
    const formData = new FormData();
    formData.append('file', blob);

    console.log('Sending to IPFS endpoint...');
    const apiBaseUrl = options.apiBaseUrl || 'https://api-testnet.grc-20.thegraph.com';
    const ipfsResponse = await fetch(`${apiBaseUrl}/ipfs/upload-edit`, {
      method: 'POST',
      body: formData,
    });

    if (!ipfsResponse.ok) {
      throw new Error(`IPFS upload failed: ${await ipfsResponse.text()}`);
    }

    interface IpfsResponse {
      cid: string;
    }
    const ipfsResult = await ipfsResponse.json() as IpfsResponse;
    console.log('IPFS raw response:', ipfsResult);
    const cid = ipfsResult.cid;
    if (!cid || typeof cid !== 'string') {
      throw new Error(`Invalid IPFS response: Missing or invalid CID - ${JSON.stringify(ipfsResult)}`);
    }
    const fullCid = `ipfs://${cid}`;
    console.log('IPFS CID:', fullCid);

    // Step 2: Fetch calldata
    console.log('Fetching calldata...');
    const calldataResult = await fetch(`${apiBaseUrl}/space/${options.spaceId}/edit/calldata`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cid, // Send raw CID without ipfs:// prefix
        network: 'TESTNET',
      }),
    });

    if (!calldataResult.ok) {
      throw new Error(`Failed to fetch calldata: ${await calldataResult.text()}`);
    }

    const calldataResponse = await calldataResult.json() as ApiResponse;
    if (!calldataResponse.to || !calldataResponse.data) {
      throw new Error(`Invalid calldata response: ${JSON.stringify(calldataResponse)}`);
    }
    const { to, data } = calldataResponse;
    console.log('Successfully retrieved calldata:', { to, data });

    // Step 3: Send transaction
    console.log('Submitting transaction...');
    const txHash = await wallet.sendTransaction({
      to: to as `0x${string}`,
      value: 0n,
      data: data as `0x${string}`,
    });
    console.log('Transaction submitted successfully:', txHash);

    return txHash;
  } catch (error) {
    console.error('Publish operation failed:', error);
    throw error;
  }
}