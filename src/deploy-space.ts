import { wallet } from "./wallet.js";
import { type Op } from "@graphprotocol/grc-20";

type DeploySpaceOptions = {
  spaceName: string;
  initialEditorAddress: string;
};

async function main() {
  const spaceName = "Pinellas County Building Permits";
  const initialEditorAddress = wallet.account.address;

  try {
    console.log('Deploying space...');
    const spaceId = await deploySpace({
      spaceName,
      initialEditorAddress,
    });
    console.log('Space deployed:', spaceId);
    return spaceId;
  } catch (error) {
    console.error('Failed to deploy space:', error);
    throw error;
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

export async function deploySpace(options: DeploySpaceOptions): Promise<string> {
  const { spaceName, initialEditorAddress } = options;

  try {
    // Deploy space using RPC
    console.log('Deploying space with name:', spaceName);
    const txHash = await wallet.walletClient.sendTransaction({
      to: "0x4E0dB2b307B284d3380842dB7889212f4C5C95B7", // GRC-20 Factory Address
      data: ("0x" + Buffer.from(JSON.stringify({
        name: spaceName,
        initialEditorAddress: initialEditorAddress,
      })).toString('hex')) as `0x${string}`,
      value: 0n,
    });
    console.log('Transaction hash:', txHash);

    // Get space ID from event logs
    const receipt = await wallet.publicClient.waitForTransactionReceipt({ hash: txHash });
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
