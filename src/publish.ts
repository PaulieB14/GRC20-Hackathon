import { type Op } from "@graphprotocol/grc-20";
import { wallet } from "./wallet.js";
import { Ipfs } from "@graphprotocol/grc-20";
import fetch from 'node-fetch';
import 'dotenv/config';

type PublishOptions = {
  /** The ID of the space to publish to */
  spaceId: string;
  /** Name of the edit proposal */
  editName: string;
  /** Author of the edit proposal */
  author: string;
  /** Array of operations to include in the proposal */
  ops: Op[];
};

type IpfsResponse = {
  Hash: string;
  Size: string;
  Name: string;
};

type CallDataResponse = {
  to: string;
  data: string;
};

/**
 * Publishes an edit proposal to IPFS and submits it to the GRC-20 network.
 * 
 * @param options - Configuration for the publish operation
 * @returns Promise<string> - Transaction hash of the submitted edit
 */
export async function publish(options: PublishOptions): Promise<string> {
  try {
    console.log('Starting publish operation...');
    console.log('Environment:', {
      RPC_URL: process.env.RPC_URL,
      WALLET_ADDRESS: process.env.WALLET_ADDRESS,
      SPACE_ID: process.env.SPACE_ID,
    });

    // Validate required fields
    if (!options.spaceId || !options.editName || !options.author || !options.ops.length) {
      throw new Error('Missing required fields in publish options: spaceId, editName, author, and ops are required');
    }

    console.log('Publishing edit proposal...', {
      name: options.editName,
      author: options.author,
      opsCount: options.ops.length,
      spaceId: options.spaceId,
    });

    // Log edit data details
    console.log('Edit data:', {
      name: options.editName,
      author: options.author,
      opsCount: options.ops.length,
      firstOp: options.ops[0],
      lastOp: options.ops[options.ops.length - 1],
    });

    // Step 1: Publish edit to IPFS
    console.log('Publishing edit to IPFS...');
    const editData = {
      name: options.editName,
      ops: options.ops,
      author: options.author,
      timestamp: Date.now(),
    };

    const ipfsResult = await fetch('https://api.thegraph.com/ipfs/api/v0/add?pin=true', {
      method: 'POST',
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      body: JSON.stringify(editData),
    });

    if (!ipfsResult.ok) {
      throw new Error(`Failed to upload to IPFS: ${await ipfsResult.text()}`);
    }

    const ipfsResponse = (await ipfsResult.json()) as IpfsResponse;
    const ipfsCid = `ipfs://${ipfsResponse.Hash}`;
    console.log('Successfully published to IPFS:', ipfsCid);

    // Step 2: Get calldata from API
    console.log('Getting calldata from API...');
    const result = await fetch(`https://api-testnet.grc-20.thegraph.com/space/${options.spaceId}/edit/calldata`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        cid: ipfsCid,
        network: 'TESTNET',
      }),
    });

    if (!result.ok) {
      throw new Error(`Failed to get calldata: ${await result.text()}`);
    }

    const callDataResponse = (await result.json()) as CallDataResponse;
    console.log('Got calldata:', callDataResponse);

    // Step 3: Submit transaction using wallet
    console.log('Submitting transaction...');
    const txHash = await wallet.sendTransaction({
      to: callDataResponse.to as `0x${string}`,
      value: 0n,
      data: callDataResponse.data as `0x${string}`,
    });

    console.log('Transaction submitted:', {
      hash: txHash,
      to: callDataResponse.to,
      from: process.env.WALLET_ADDRESS,
    });

    return txHash;
  } catch (error) {
    console.error('Publish operation failed:', error);
    if (error instanceof Error) {
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      if ('cause' in error) {
        console.error('Error cause:', error.cause);
      }
    }
    throw error;
  }
}
