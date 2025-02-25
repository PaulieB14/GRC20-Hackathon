import { type Op } from "@graphprotocol/grc-20";
import { publish } from "./publish.js";
import { wallet } from "./wallet.js";
import { transformPermits } from "./transformPermits.js";
import 'dotenv/config';

// Configuration
const SPACE_ID = process.env.SPACE_ID || "0x4E0dB2b307B284d3380842dB7889212f4C5C95B7"; // Use a valid GRC-20 space ID
const EDIT_NAME = 'Add Building Permits';
const EXPLORER_BASE_URL = 'https://sepolia.etherscan.io/tx/';

async function main() {
  try {
    // Validate setup
    if (!wallet?.account?.address) {
      throw new Error('Wallet not initialized or address missing');
    }
    if (!SPACE_ID) {
      throw new Error('SPACE_ID is not defined');
    }

    // Transform permits into operations
    console.log('Transforming permits...');
    const permitOps = await transformPermits();
    
    console.log('Publishing permits...', { opsCount: permitOps.length });
    const txHash = await publish({
      spaceId: SPACE_ID,
      author: wallet.account.address,
      editName: EDIT_NAME,
      ops: permitOps,
      // No additional options needed
    });

    console.log('Transaction hash:', txHash);
    console.log('Explorer URL:', `${EXPLORER_BASE_URL}${txHash}`);
  } catch (error) {
    console.error('Main failed:', {
      message: (error as Error).message, // Assert error as Error type
      stack: (error as Error).stack || 'No stack trace available',
    });
    process.exit(1); // Exit with error, but log stack for debugging
  }
}

main();
