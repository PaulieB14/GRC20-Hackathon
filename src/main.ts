import { Triple, type Op } from "@graphprotocol/grc-20";
import { publish } from "./publish.js";
import { readFileSync } from "fs";
import { wallet } from "./wallet.js";
import 'dotenv/config';

type Triple = {
  attributeId: string;
  entityId: string;
  value: {
    type: string;
    value: string;
  };
};

type Entity = {
  entityId: string;
  triples: Triple[];
};

// Use the deployed space ID
const SPACE_ID = "7gzF671tq5JTZ13naG4tnr";

async function waitForConfirmation(txHash: `0x${string}`) {
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

    // Convert to SET_TRIPLE operations using Triple.make
    const permitOps = permitTriples.flatMap(permit => 
      permit.triples.map(triple => Triple.make({
        entityId: permit.entityId,
        attributeId: triple.attributeId,
        value: {
          type: 'TEXT',
          value: triple.value.value
        }
      }))
    );

    // Publish permits
    console.log('Publishing permits...');
    const permitTxHash = await publish({
      spaceId: SPACE_ID as string,
      author: wallet.account.address,
      editName: "Add Building Permits",
      ops: permitOps,
    });
    console.log("Permits transaction hash:", permitTxHash);

    // Wait for confirmation
    await waitForConfirmation(permitTxHash);

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
