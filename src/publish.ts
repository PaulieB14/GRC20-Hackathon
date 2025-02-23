import { type Op, Ipfs } from "@graphprotocol/grc-20";
import { EditProposal } from "@graphprotocol/grc-20/proto";
import { wallet } from "./wallet.js";
import fetch from 'node-fetch';
import { Micro } from 'effect';
import 'dotenv/config';



// Debug log Ipfs module
console.log('Ipfs module:', {
  publishEdit: typeof Ipfs.publishEdit,
  hasEndpoint: 'endpoint' in Ipfs,
  keys: Object.keys(Ipfs)
});

type ApiResponse = {
  to: string;
  data: string;
};

export type PublishResult = {
  ipfsCid: string;
  txHash: `0x${string}`;
};

type PublishOptions = {
  spaceId: string;
  editName: string;
  author: string;
  ops: Op[];
  network?: "TESTNET" | "MAINNET";
};

export async function publish(options: PublishOptions) {
  const { spaceId, editName, author, ops, network = "MAINNET" } = options;

  try {
    // Step 1: Publish edit to IPFS
    console.log('Publishing edit to IPFS...');
    let cid: string;
    try {
      // Log detailed info about the ops
      console.log('Ops to publish:', {
        count: ops.length,
        firstOp: ops[0],
        allOps: ops
      });

      console.log('Calling Ipfs.publishEdit with:', {
        name: editName,
        author: author
      });

      // Use Ipfs.publishEdit with custom fetch
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30000);

      try {
        // Create protobuf encoded edit
        const edit = EditProposal.encode({
          name: editName,
          ops: ops,
          author: author
        });

        // Create form data with encoded edit
        const blob = new Blob([edit], { type: 'application/octet-stream' });
        const formData = new FormData();
        formData.append('file', blob);

        // Upload using Effect's Micro utility
        const upload = Micro.gen(function* () {
          const result = yield* Micro.tryPromise({
            try: () =>
              fetch('https://api-testnet.grc-20.thegraph.com/ipfs/upload-edit', {
                method: 'POST',
                body: formData,
              }),
            catch: error => {
              console.error('IPFS upload error:', error);
              throw new Error(`Could not upload edit to IPFS: ${error}`);
            },
          });

          const maybeCid = yield* Micro.tryPromise({
            try: async () => {
              const json = await result.json() as { cid?: string };
              if (!json?.cid) {
                throw new Error('Invalid response format from IPFS');
              }
              return json.cid;
            },
            catch: error => {
              console.error('IPFS response parse error:', error);
              throw new Error(`Could not parse response from IPFS: ${error}`);
            },
          });

          if (!maybeCid?.startsWith('ipfs://')) {
            throw new Error('Invalid CID format returned from IPFS');
          }

          return maybeCid;
        });

        cid = await Micro.runPromise(upload);
        clearTimeout(timeout);
        console.log('Edit published to IPFS:', cid);
        console.log('Edit published to IPFS:', cid);
      } catch (error) {
        clearTimeout(timeout);
        throw error;
      }
    } catch (error) {
      console.error('Failed to publish to IPFS:', error instanceof Error ? error.stack : error);
      throw error;
    }

    // Step 2: Get calldata from GRC-20 API
    console.log('Getting calldata from API...');
    let address: string;
    let calldata: string;
    try {
      const result = await fetch(`https://api-testnet.grc-20.thegraph.com/space/${spaceId}/edit/calldata`, {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          cid: cid,
          network: network,
        }),
      });

      if (!result.ok) {
        const errorText = await result.text();
        throw new Error(`API request failed (${result.status}): ${errorText}`);
      }

      const response = (await result.json()) as ApiResponse;
      address = response.to;
      calldata = response.data;
    } catch (error) {
      console.error('Failed to get calldata from API:', error);
      throw error;
    }

    // Step 3: Send transaction using wallet client
    console.log('Publishing edit onchain...');
    let txHash: `0x${string}`;
    try {
      txHash = await wallet.sendTransaction({
        to: address as `0x${string}`,
        value: 0n,
        data: calldata as `0x${string}`
      });
      console.log('Transaction sent:', txHash);
    } catch (error) {
      console.error('Failed to send transaction:', error);
      throw error;
    }

    const publishResult: PublishResult = {
      ipfsCid: cid,
      txHash: txHash
    };
    return publishResult;
  } catch (error) {
    console.error('Failed to publish edit:', error);
    throw error;
  }
}
