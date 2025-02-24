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
    console.log('Converting to JSON...');
    console.log('Input data:', {
      name: options.editName,
      author: options.author,
      opsCount: options.ops.length,
      firstOp: options.ops[0]
    });

    // Map operations with detailed logging
    console.log('Mapping operations...');
    const mappedOps = options.ops.map((op, index) => {
      if (op.type === 'SET_TRIPLE') {
        const setTripleOp = op as SetTripleOp;
        console.log(`Processing op ${index}:`, {
          type: setTripleOp.type,
          entity: setTripleOp.triple.entity,
          attribute: setTripleOp.triple.attribute,
          valueType: setTripleOp.triple.value.type,
          valueLength: setTripleOp.triple.value.value.length
        });
        return {
          type: setTripleOp.type,
          triple: {
            entity: setTripleOp.triple.entity,
            attribute: setTripleOp.triple.attribute,
            value: {
              type: setTripleOp.triple.value.type,
              value: setTripleOp.triple.value.value
            }
          }
        };
      }
      console.log(`Skipping non-SET_TRIPLE op ${index}:`, op.type);
      return op;
    });

    // Create edit data
    const editData = {
      name: options.editName,
      author: options.author,
      ops: mappedOps
    };

    // Convert to JSON with replacer function for detailed logging
    const editJson = JSON.stringify(editData, (key, value) => {
      if (key === 'ops') {
        console.log('Stringifying ops array:', {
          length: value.length,
          firstOp: value[0]
        });
      }
      return value;
    }, 2);

    // Log JSON details
    console.log('JSON structure:', {
      totalLength: editJson.length,
      hasCommas: editJson.includes(','),
      firstOpIndex: editJson.indexOf('"type":"SET_TRIPLE"'),
      lastOpIndex: editJson.lastIndexOf('"type":"SET_TRIPLE"')
    });
    console.log('JSON length:', editJson.length);
    console.log('JSON payload:', editJson);
    console.log('JSON length:', editJson.length);

    let cid: string | undefined;
    try {
      // Verify JSON structure
      try {
        JSON.parse(editJson);
        console.log('JSON structure verified');
      } catch (error: any) {
        console.error('JSON parse error:', error);
        throw new Error(`Invalid JSON structure: ${error?.message || 'Unknown error'}`);
      }

      // Try direct JSON upload first
      console.log('Attempting direct JSON upload...');
      try {
        const directResponse = await fetch('https://api.thegraph.com/ipfs/api/v0/add?pin=true', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: editJson
        });

        if (directResponse.ok) {
          const directResult = await directResponse.json() as { Hash?: string };
          if (directResult?.Hash) {
            cid = directResult.Hash;
            console.log('Direct upload successful with CID:', `ipfs://${cid}`);
            // Continue with the rest of the function instead of returning
          } else {
            console.log('Direct upload response missing Hash:', directResult);
          }
        } else {
          console.log('Direct upload failed with status:', directResponse.status);
        }
      } catch (error) {
        console.error('Direct upload failed:', error);
      }

      // If direct upload didn't work, try form data upload
      if (!cid) {
        // Fall back to form data upload if direct upload fails
        console.log('Direct upload failed, trying form data...');
        const FormData = await import('form-data');
        const formData = new FormData.default();
        formData.append('file', Buffer.from(editJson), {
          filename: 'edit.json',
          contentType: 'application/json',
        });

        // Log request details
        console.log('Request details:');
        console.log('- URL:', 'https://api.thegraph.com/ipfs/api/v0/add?pin=true');
        console.log('- Method: POST');
        console.log('- Headers:', formData.getHeaders());
        console.log('- Content length:', editJson.length);

        // Make request with timeout
        console.log('Making form data IPFS request...');
        const fetchPromise = fetch('https://api.thegraph.com/ipfs/api/v0/add?pin=true', {
          method: 'POST',
          headers: {
            ...formData.getHeaders(),
            'Accept': 'application/json',
          },
          body: formData as any,
        });

        const timeoutPromise = new Promise<never>((_, reject) => {
          const timeoutId = setTimeout(() => {
            console.log('Timeout triggered, rejecting promise...');
            reject(new Error('Graph IPFS upload timed out (30s)'));
          }, 30000);
          return () => clearTimeout(timeoutId);
        });

        const response = await Promise.race<Response>([
          fetchPromise,
          timeoutPromise,
        ]).catch(error => {
          console.error('Graph IPFS fetch error:', error);
          throw new Error(`IPFS fetch failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        });
        console.log('After Graph IPFS fetch...');

        const responseText = await response.text();
        console.log('Graph IPFS response:', responseText);

        if (!response.ok) {
          throw new Error(`Graph IPFS upload failed: ${responseText}`);
        }

        let result;
        try {
          result = JSON.parse(responseText) as { Hash: string };
        } catch (error: any) {
          throw new Error(`Failed to parse IPFS response: ${error?.message || 'Unknown error'}`);
        }
        cid = result.Hash;
        console.log('Successfully uploaded to Graph IPFS with CID:', `ipfs://${cid}`);

        if (!cid) {
          throw new Error('Failed to get valid CID from any IPFS endpoint');
        }
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
        cid: `ipfs://${cid}`, // CID with ipfs:// prefix
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
