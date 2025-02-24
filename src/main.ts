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

interface Entity {
  entityId: string;
  triples: {
    entity: string;
    attribute: string;
    value: {
      type: ValueType;
      value: string;
    };
  }[];
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

    const entities = JSON.parse(readFileSync(DATA_FILE, 'utf-8')) as Entity[];
    const permitOps: Op[] = entities.flatMap(permit =>
      permit.triples.map(triple => ({
        type: 'SET_TRIPLE' as const,
        triple: {
          entity: triple.entity,
          attribute: triple.attribute,
          value: triple.value,
        },
      }))
    );

    console.log('Publishing permits...', { opsCount: permitOps.length });
    const txHash = await publish({
      spaceId: SPACE_ID,
      author: wallet.account.address,
      editName: EDIT_NAME,
      ops: permitOps,
    });

    console.log('Transaction hash:', txHash);
    console.log('Explorer URL:', `${EXPLORER_BASE_URL}${txHash}`);
  } catch (error) {
    console.error('Main failed:', error);
    process.exit(1);
  }
}

main();
