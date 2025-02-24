import { type Op } from "@graphprotocol/grc-20";
import { wallet } from "./wallet.js";
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

/**
 * Publishes an edit proposal to IPFS and submits it to the GRC-20 network.
 * Following example from: https://github.com/geobrowser/grc-20-recipes/blob/main/examples/publish.ts#L15
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
      firstOp: JSON.stringify(options.ops[0], null, 2),
      lastOp: JSON.stringify(options.ops[options.ops.length - 1], null, 2),
    });

    // Step 1: Get calldata from RPC
    console.log('Getting calldata from RPC...');
    console.log('RPC URL:', process.env.RPC_URL);

    const rpcRequest = {
      jsonrpc: '2.0',
      id: 1,
      method: 'geo_edit',
      params: [{
        spaceId: options.spaceId,
        name: options.editName,
        ops: options.ops,
        timestamp: Date.now(),
        editor: options.author,
      }],
    };

    console.log('RPC request:', JSON.stringify(rpcRequest, null, 2));
    console.log('Request details:', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      bodyLength: JSON.stringify(rpcRequest).length,
    });

    const rpcResult = await fetch(process.env.RPC_URL || '', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(rpcRequest),
    });

    console.log('RPC response status:', rpcResult.status);
    console.log('RPC response headers:', rpcResult.headers.raw());
    const rpcResponseText = await rpcResult.text();
    console.log('RPC raw response:', rpcResponseText);

    if (!rpcResult.ok) {
      throw new Error(`Failed to get calldata: ${rpcResponseText}`);
    }

    const { result: { to, data } } = JSON.parse(rpcResponseText);
    console.log('Got calldata:', {
      to,
      dataLength: data.length,
      dataPrefix: data.substring(0, 10),
      dataSuffix: data.substring(data.length - 10),
    });

    // Step 2: Submit transaction using wallet
    console.log('Submitting transaction...');
    console.log('Transaction details:', {
      to,
      value: '0',
      dataLength: data.length,
    });

    console.log('Getting wallet balance...');
    const balance = await wallet.publicClient.getBalance({
      address: wallet.account.address,
    });
    console.log('Current balance:', balance.toString());

    console.log('Sending transaction...');
    const txHash = await wallet.sendTransaction({
      to: to as `0x${string}`,
      value: 0n,
      data: data as `0x${string}`,
    });

    console.log('Transaction submitted:', {
      hash: txHash,
      to,
      from: process.env.WALLET_ADDRESS,
    });

    return txHash;
  } catch (error) {
    console.error('Publish operation failed:', error);
    if (error instanceof Error) {
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack,
        cause: 'cause' in error ? error.cause : undefined,
      });
    }
    throw error;
  }
}
