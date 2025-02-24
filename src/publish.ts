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

    // Upload to IPFS
    const editProposal = {
      name: options.editName,
      author: options.author,
      ops: options.ops,
    };

    // Log edit proposal for debugging
    console.log('Edit proposal:', JSON.stringify(editProposal, null, 2));

    // Format ops for IPFS
    const formattedOps = editProposal.ops.map(op => {
      if (op.type === 'SET_TRIPLE') {
        const setTripleOp = op as SetTripleOp;
        const triple = Triple.make({
          entityId: setTripleOp.triple.entity,
          attributeId: setTripleOp.triple.attribute,
          value: {
            type: 'TEXT' as const,
            value: setTripleOp.triple.value.value,
          },
        });
        console.log('Created triple:', JSON.stringify(triple, null, 2));
        return {
          type: 'SET_TRIPLE' as const,
          triple: triple.triple,
        } as SetTripleOp;
      }
      return op;
    });

    // Create edit proposal
    const edit = {
      name: editProposal.name,
      author: editProposal.author,
      ops: formattedOps,
    };

    console.log('Attempting IPFS upload with edit:', JSON.stringify(edit, null, 2));

    // Upload to IPFS directly
    let ipfsResponse;
    try {
      // Ensure proper JSON formatting with commas
      const editJson = JSON.stringify({
        name: edit.name,
        author: edit.author,
        ops: edit.ops.map(op => {
          if (op.type === 'SET_TRIPLE') {
            const setTripleOp = op as SetTripleOp;
            return {
              type: op.type,
              triple: {
                attribute: setTripleOp.triple.attribute,
                entity: setTripleOp.triple.entity,
                value: setTripleOp.triple.value
              }
            };
          }
          return op;
        })
      });
      console.log('Sending JSON:', JSON.stringify(JSON.parse(editJson), null, 2));

      ipfsResponse = await fetch('https://api-testnet.grc-20.thegraph.com/ipfs/upload-edit', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: editJson,
      });

      if (!ipfsResponse.ok) {
        const errorText = await ipfsResponse.text();
        console.error('IPFS upload failed with status:', ipfsResponse.status);
        console.error('Error response:', errorText);
        throw new Error(`IPFS upload failed: ${errorText}`);
      }
    } catch (error) {
      console.error('IPFS upload error:', error);
      throw error;
    }

    let ipfsResult;
    try {
      ipfsResult = await ipfsResponse.json() as unknown;
    } catch (error) {
      console.error('Failed to parse IPFS response:', error);
      throw new Error('Failed to parse IPFS response as JSON');
    }
    if (!ipfsResult || typeof ipfsResult !== 'object') {
      throw new Error('Invalid IPFS response: Expected object');
    }

    const ipfsData = ipfsResult as Record<string, unknown>;
    if (!ipfsData.cid || typeof ipfsData.cid !== 'string') {
      throw new Error('Invalid IPFS response: Missing or invalid CID');
    }

    const cid = ipfsData.cid;

    console.log('Successfully uploaded to IPFS with CID:', cid);

    // Step 2: Get calldata
    const apiBaseUrl = options.apiBaseUrl || 'https://api-testnet.grc-20.thegraph.com';
    const calldataUrl = `${apiBaseUrl}/space/${options.spaceId}/edit/calldata`;
    console.log('Fetching calldata from:', calldataUrl);
    
    const result = await fetch(calldataUrl, {
      method: "POST",
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        cid,
        network: "TESTNET",
      }),
    });

    if (!result.ok) {
      throw new Error(`Failed to fetch calldata: ${await result.text()}`);
    }

    // Validate API response
    const response = await result.json() as unknown;
    if (!response || typeof response !== 'object') {
      throw new Error('Invalid API response: Expected object');
    }

    const apiResponse = response as Record<string, unknown>;
    if (!apiResponse.to || typeof apiResponse.to !== 'string') {
      throw new Error('Invalid API response: Missing or invalid "to" field');
    }
    if (!apiResponse.data || typeof apiResponse.data !== 'string') {
      throw new Error('Invalid API response: Missing or invalid "data" field');
    }

    const { to, data } = apiResponse as ApiResponse;
    console.log('Successfully retrieved calldata');

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
