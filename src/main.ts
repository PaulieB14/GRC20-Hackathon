import { readFileSync } from 'fs';
import { Triple, type Op } from "@graphprotocol/grc-20";
import { publish, type PublishResult } from "./publish.js";
import { wallet } from "./wallet.js";
import 'dotenv/config';

type LocalTriple = {
  attributeId: string;
  entityId: string;
  value: {
    type: string;
    value: string;
  };
};

type Entity = {
  entityId: string;
  triples: LocalTriple[];
};

// Use the deployed space ID from testnet
const SPACE_ID = "0x4E0dB2b307B284d3380842dB7889212f4C5C95B7" as `0x${string}`;

async function waitForConfirmation(txHash: PublishResult['txHash']) {
  console.log(`Waiting for confirmation of transaction: ${txHash}`);
  while (true) {
    const receipt = await wallet.publicClient.getTransactionReceipt({ hash: txHash });
    if (receipt && receipt.blockNumber) {
      console.log(`Transaction ${txHash} confirmed in block ${receipt.blockNumber}`);
      break;
    }
    console.log(`Transaction ${txHash} not yet confirmed, waiting...`);
    await new Promise(resolve => setTimeout(resolve, 5000)); // Wait for 5 seconds before checking again
  }
}

async function main() {
  try {
    // Read the transformed data
    console.log('Reading transformed data...');
    const permitTriples = JSON.parse(readFileSync('data/permits-triples.json', 'utf-8')) as Entity[];

    // Log raw triples before conversion
    console.log('First raw triple:', permitTriples[0].triples[0]);

    // Convert to SET_TRIPLE operations using Triple.make
    const permitOps = permitTriples.flatMap(permit => 
      permit.triples.map(triple => {
        const op = Triple.make({
          entityId: permit.entityId,
          attributeId: triple.attributeId,
          value: {
            type: 'TEXT',
            value: triple.value.value
          }
        });
        console.log('Triple.make input:', {
          entityId: permit.entityId,
          attributeId: triple.attributeId,
          value: {
            type: 'TEXT',
            value: triple.value.value
          }
        });
        console.log('Triple.make output:', op);
        return op;
      })
    );

    // Publish permits
    console.log('Publishing permits...');
    const publishResult = await publish({
      spaceId: SPACE_ID as string,
      author: wallet.account.address,
      editName: "Add Building Permits",
      ops: permitOps,
      network: "TESTNET" // Since we're using api-testnet endpoint
    });
    console.log("IPFS CID:", publishResult.ipfsCid);
    console.log("Transaction hash:", publishResult.txHash);

    // Wait for confirmation
    await waitForConfirmation(publishResult.txHash);

  } catch (error) {
    console.error('Failed to publish data:', error);
    process.exit(1);
  }
}

// Execute if running directly
if (import.meta.url === new URL(import.meta.url).href) {
  main()
    .then(() => process.exit(0))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
}
