import { type Op } from "@graphprotocol/grc-20";
import { wallet } from "./wallet.js";
import fetch from 'node-fetch';

type SpaceInfo = {
  address: `0x${string}`;
  // Add other fields as needed
};

type PublishOptions = {
  spaceId: string;
  editName: string;
  author: string;
  ops: Op[];
};

export async function publish(options: PublishOptions) {
  const { spaceId, editName, author, ops } = options;

  try {
    // Prepare transaction data
    console.log('Publishing edit...');
    const data = "0x" + Buffer.from(JSON.stringify({
      name: editName,
      ops,
      timestamp: Date.now(),
      editor: author
    })).toString('hex');

    // Send transaction using wallet client
    const txHash = await wallet.sendTransaction({
      to: `0x${spaceId}` as `0x${string}`,
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
