import { wallet } from "./wallet.js";
import fetch from 'node-fetch';
import 'dotenv/config';

interface CallDataResponse {
  to: string;
  data: string;
}

async function publishData(spaceId: string, cid: string) {
  console.log('\n[Test] Publishing data...', { spaceId, cid });

  try {
    console.log('[Test] Fetching calldata...');
    const result = await fetch(`https://testnet.grc-20.thegraph.com/space/${spaceId}/edit/calldata`, {
      method: "POST",
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        cid,
        network: "TESTNET",
      }),
      // Add timeout
      signal: AbortSignal.timeout(10000)
    }).catch(error => {
      if (error.name === 'AbortError') {
        throw new Error('Request timed out after 10 seconds');
      }
      throw error;
    });

    if (!result.ok) {
      const text = await result.text();
      console.error('[Test] Response details:', {
        status: result.status,
        statusText: result.statusText,
        headers: Object.fromEntries(result.headers.entries()),
        body: text,
        url: result.url,
        timestamp: new Date().toISOString()
      });
      throw new Error(`Failed to get calldata (${result.status}): ${text}`);
    }

    const response = await result.json() as CallDataResponse;
    console.log('[Test] Got calldata:', { 
      to: response.to, 
      dataLength: response.data.length,
      timestamp: new Date().toISOString()
    });

    console.log('[Test] Submitting transaction...');
    const txResult = await wallet.sendTransaction({
      to: response.to as `0x${string}`,
      value: 0n,
      data: response.data as `0x${string}`,
    });

    console.log('\n✅ [Test] Transaction submitted:', txResult);
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        console.error('\n❌ [Test] Request timed out after 10 seconds');
      } else {
        console.error('\n❌ [Test] Failed:', {
          error: error.message,
          name: error.name,
          stack: error.stack,
          timestamp: new Date().toISOString()
        });
      }
    }
    process.exit(1);
  }
}

// Test with our space ID
if (!process.env.SPACE_ID) {
  throw new Error('SPACE_ID not set in environment');
}

console.log('[Test] Starting test...');
publishData(
  process.env.SPACE_ID,
  "ipfs://bafkreiabnc3kdcomwn2ismqqkkglj4sxme6a6mdzb2z6xf7ecaldjc7klm"
);
