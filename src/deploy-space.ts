import { wallet } from "./wallet.js";
import { type Op } from "@graphprotocol/grc-20";

type DeploySpaceOptions = {
  spaceName: string;
  initialEditorAddress: string;
};

export async function deploySpace(options: DeploySpaceOptions): Promise<string> {
  const { spaceName, initialEditorAddress } = options;

  try {
    // Deploy space using RPC
    console.log('Deploying space...');
    const request = {
      jsonrpc: "2.0",
      id: 1,
      method: "eth_sendTransaction",
      params: [{
        from: initialEditorAddress,
        to: "0x1234567890123456789012345678901234567890", // Replace with actual factory address
        data: "0x" + Buffer.from(JSON.stringify({
          name: spaceName,
          initialEditorAddress: initialEditorAddress,
        })).toString('hex'),
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
      throw new Error(`Failed to deploy space: ${JSON.stringify(response.error)}`);
    }

    if (!response.result) {
      throw new Error(`Invalid response format: ${responseText}`);
    }

    // Wait for transaction receipt
    const txHash = response.result;
    console.log('Transaction hash:', txHash);

    // Get space ID from event logs
    const receipt = await wallet.publicClient.waitForTransactionReceipt({ hash: txHash as `0x${string}` });
    console.log('Transaction receipt:', receipt);

    const spaceId = receipt.logs[0].topics[1];
    if (!spaceId) {
      throw new Error('Failed to get space ID from transaction receipt');
    }

    console.log('Space deployed:', spaceId);
    return spaceId;
  } catch (error) {
    console.error('Failed to deploy space:', error);
    throw error;
  }
}
