import { wallet } from "./wallet.js";
import fetch from 'node-fetch';
import FormData from 'form-data';
import 'dotenv/config';
import { Graph, type Op } from "@graphprotocol/grc-20";
import { transformPermits } from "./transformPermits.js";

interface PublishOptions {
  spaceId: string;
  editName: string;
  author: string;
  ops: Op[];
  apiBaseUrl?: string;
}

interface CallDataResponse {
  to: string;
  data: string;
}

interface IpfsResponse {
  Hash: string;
  Size: string;
  Name: string;
}

async function getCallData(spaceId: string, cid: string): Promise<CallDataResponse> {
  console.log('\n[API] Getting calldata for:', { spaceId, cid });
  
  const response = await fetch(`https://api-testnet.grc-20.thegraph.com/space/${spaceId}/edit/calldata`, {
    method: "POST",
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      cid: cid,
      network: "TESTNET",
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Failed to get calldata (${response.status}): ${text}`);
  }

  const result = await response.json() as CallDataResponse;
  if (!result.to || !result.data) {
    throw new Error('Invalid calldata response');
  }

  console.log('[API] Got calldata:', { 
    to: result.to,
    dataLength: result.data.length
  });

  return result;
}

async function uploadToIpfs(name: string, ops: Op[], author: string): Promise<string> {
  console.log('\n[IPFS] Starting upload...', {
    name,
    author,
    opsCount: ops.length
  });

  try {
    // Create edit proposal
    const editProposal = {
      name,
      ops,
      author
    };

    // Convert to JSON
    const editJson = JSON.stringify(editProposal);
    console.log('[IPFS] Edit proposal size:', editJson.length, 'bytes');

    // Create form data
    const formData = new FormData();
    formData.append('file', Buffer.from(editJson), {
      filename: 'edit.json',
      contentType: 'application/json',
    });

    // Try Pinax first
    const pinaxUrl = process.env.PINAX_RPC_URL || 'geotest.rpc.pinax.network/v1/8fdc0decc9521d2d398848020d55eeb671cb8a382f980b1d/';
    const fullPinaxUrl = pinaxUrl.startsWith('http') ? pinaxUrl : `https://${pinaxUrl}`;
    console.log('[IPFS] Using Pinax gateway:', fullPinaxUrl);

    try {
      console.log('[IPFS] Uploading to Pinax...');
      const pinaxResponse = await fetch(`${fullPinaxUrl}ipfs/api/v0/add`, {
        method: 'POST',
        headers: {
          ...formData.getHeaders()
        },
        body: formData
      });

      if (!pinaxResponse.ok) {
        const text = await pinaxResponse.text();
        throw new Error(`Pinax upload failed (${pinaxResponse.status}): ${text}`);
      }

      const pinaxResult = await pinaxResponse.json() as IpfsResponse;
      if (!pinaxResult.Hash) {
        throw new Error('Missing Hash in Pinax response');
      }

      const cid = `ipfs://${pinaxResult.Hash}`;
      console.log('\n✅ [IPFS] Pinax upload successful:', { 
        cid,
        size: pinaxResult.Size,
        name: pinaxResult.Name
      });
      return cid;
    } catch (pinaxError) {
      console.error('\n❌ [IPFS] Pinax upload failed:', {
        error: (pinaxError as Error).message
      });

      // Fallback to RPC URL
      const rpcUrl = process.env.RPC_URL || 'https://rpc-geo-test-zc16z3tcvf.t.conduit.xyz/';
      console.log('[IPFS] Falling back to RPC gateway:', rpcUrl);

      console.log('[IPFS] Uploading to RPC gateway...');
      const response = await fetch(`${rpcUrl}ipfs/api/v0/add`, {
        method: 'POST',
        headers: {
          ...formData.getHeaders()
        },
        body: formData
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`RPC upload failed (${response.status}): ${text}`);
      }

      const result = await response.json() as IpfsResponse;
      if (!result.Hash) {
        throw new Error('Missing Hash in RPC response');
      }

      const cid = `ipfs://${result.Hash}`;
      console.log('\n✅ [IPFS] RPC upload successful:', { 
        cid,
        size: result.Size,
        name: result.Name
      });
      return cid;
    }
  } catch (error) {
    console.error('\n❌ [IPFS] All upload attempts failed:', {
      error: (error as Error).message,
      name: (error as Error).name,
      stack: (error as Error).stack
    });
    throw error;
  }
}

export async function publish(options: PublishOptions): Promise<string> {
  try {
    if (!options.spaceId || !options.editName || !options.author || !options.ops.length) {
      throw new Error('Missing required fields');
    }

    console.log('\n[Publish] Starting...', {
      name: options.editName,
      author: options.author,
      opsCount: options.ops.length,
    });

    // Upload to IPFS
    const cid = await uploadToIpfs(options.editName, options.ops, options.author);

    // Get calldata for the transaction
    const { to, data } = await getCallData(options.spaceId, cid);

    // Submit the transaction
    console.log('\n[Transaction] Submitting to network...');
    const txHash = await wallet.sendTransaction({
      to: to as `0x${string}`,
      value: 0n,
      data: data as `0x${string}`,
    });

    console.log('\n✅ [Transaction] Submitted:', { txHash });
    return txHash;

  } catch (error) {
    console.error('\n❌ [Publish] Failed:', {
      name: (error as Error).name,
      message: (error as Error).message,
      stack: (error as Error).stack,
      cause: (error as Error).cause
    });
    throw error;
  }
}

// Execute if running directly
if (import.meta.url === new URL(import.meta.url).href) {
  console.log('[Startup] Beginning execution...');
  
  try {
    if (!process.env.WALLET_ADDRESS) {
      throw new Error('WALLET_ADDRESS not set in environment');
    }
    if (!process.env.SPACE_ID) {
      throw new Error('SPACE_ID not set in environment');
    }

    // Transform permits to operations
    console.log('\n[Transform] Starting permit transformation...');
    transformPermits()
      .then(async (ops) => {
        console.log(`[Transform] Generated ${ops.length} operations`);

        // Publish permits to IPFS and submit transaction
        console.log('\n[Publish] Starting publishing process...');
        const txHash = await publish({
          spaceId: process.env.SPACE_ID!,
          editName: 'Add Building Permits',
          author: process.env.WALLET_ADDRESS!,
          ops
        });
        
        console.log('\n✅ [Main] Process completed:', { txHash });
        process.exit(0);
      })
      .catch((error) => {
        console.error('\n❌ [Main] Process failed:', {
          error: {
            name: error.name,
            message: error.message,
            stack: error.stack,
            cause: error.cause
          }
        });
        process.exit(1);
      });
  } catch (error) {
    console.error('\n❌ [Main] Process failed:', {
      error: {
        name: (error as Error).name,
        message: (error as Error).message,
        stack: (error as Error).stack,
        cause: (error as Error).cause
      }
    });
    process.exit(1);
  }
}
