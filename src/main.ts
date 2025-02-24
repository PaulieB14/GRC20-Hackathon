import { readFileSync } from 'fs';
import { Triple, type Op, type ValueType } from "@graphprotocol/grc-20";
import { publish } from "./publish.js";
import { wallet } from "./wallet.js";
import 'dotenv/config';

// Configuration
const SPACE_ID = process.env.SPACE_ID || "0x4E0dB2b307B284d3380842dB7889212f4C5C95B7";
const DATA_FILE = process.env.DATA_FILE || 'data/permits-triples.json';
const EDIT_NAME = 'Add Building Permits';
const EXPLORER_BASE_URL = 'https://sepolia.etherscan.io/tx/';

interface LocalTriple {
  entity: string;
  attribute: string;
  value: {
    type: ValueType;
    value: string;
  };
}

interface Entity {
  entityId: string;
  triples: LocalTriple[];
}

async function main() {
  try {
    // Validate setup
    if (!wallet?.account?.address) {
      throw new Error('Wallet not initialized or address missing');
    }
    if (!SPACE_ID) {
      throw new Error('SPACE_ID is not defined');
    }

    // Read and validate data
    console.log('Reading transformed data from:', DATA_FILE);
    const permitTriples = JSON.parse(readFileSync(DATA_FILE, 'utf-8')) as Entity[];
    if (!Array.isArray(permitTriples) || permitTriples.length === 0) {
      throw new Error('Invalid or empty data in permits-triples.json');
    }

    // Convert to SET_TRIPLE operations
    const permitOps: Op[] = permitTriples.flatMap(permit =>
      permit.triples.map(triple => ({
        type: 'SET_TRIPLE' as const,
        triple: {
          entity: triple.entity,
          attribute: triple.attribute,
          value: {
            type: 'TEXT',
            value: triple.value.value,
          },
        },
      }))
    );

    // Publish permits
    console.log('Publishing permits...', { opsCount: permitOps.length });
    const txHash = await publish({
      spaceId: SPACE_ID,
      author: wallet.account.address,
      editName: EDIT_NAME,
      ops: permitOps,
    });

    console.log('Transaction successful!');
    console.log('Transaction hash:', txHash);
    console.log('Check it out at:', `${EXPLORER_BASE_URL}${txHash}`);

  } catch (error) {
    console.error('Failed to publish data:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    process.exit(1);
  }
}

main();
