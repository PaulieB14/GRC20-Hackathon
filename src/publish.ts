import { type Op } from "@graphprotocol/grc-20";
import { wallet } from "./wallet.js";

type PublishOptions = {
  spaceId: string;
  editName: string;
  author: string;
  ops: Op[];
};

export async function publish(options: PublishOptions) {
  const { spaceId, editName, author, ops } = options;

  try {
    // Publish directly to the space contract
    console.log('Publishing edit...');
    const request = {
      jsonrpc: "2.0",
      id: 1,
      method: "geo_edit",
      params: [{
        spaceId,
        name: editName,
        ops,
        timestamp: Date.now(),
        editor: author
      }]
    };
    console.log('Request:', JSON.stringify(request, null, 2));

    const result = await fetch(`https://rpc-geo-test-zc16z3tcvf.t.conduit.xyz`, {
      method: "POST",
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(request),
    });

    const responseText = await result.text();
    console.log('Response:', responseText);

    const response = JSON.parse(responseText);
    if (response.error) {
      throw new Error(`Failed to publish edit: ${JSON.stringify(response.error)}`);
    }

    if (!response.result || !response.result.to || !response.result.data) {
      throw new Error(`Invalid response format: ${responseText}`);
    }

    const { result: { to, data } } = response;
    console.log('Got transaction data:', { to, data });

    // Send the transaction to publish the edit
    console.log('Sending transaction...');
    const txHash = await wallet.sendTransaction({
      to: to as `0x${string}`,
      value: 0n,
      data: data as `0x${string}`
    });
    console.log('Transaction sent:', txHash);

    return txHash;
  } catch (error) {
    console.error('Failed to publish edit:', error);
    throw error;
  }
}