import { wallet } from "./wallet.js";
import { execSync } from 'child_process';
import 'dotenv/config';
import { type Op } from "@graphprotocol/grc-20";

interface PublishOptions {
  spaceId: string;
  editName?: string;
  author?: string;
  ops?: Op[];
}

export async function publish(options: PublishOptions) {
  try {
    const { spaceId, editName = 'Add Building Permits' } = options;
    const author = options.author || process.env.WALLET_ADDRESS;
    
    if (!author) {
      throw new Error('Author not provided and WALLET_ADDRESS not set in environment');
    }

    // Create edit proposal and get CID using curl
    console.log('\n[IPFS] Getting CID...');
    const ipfsCmd = `cat data/permits-triples.json | jq -c '{"name":"${editName}","ops":.,"author":"${author}"}' > edit.json && curl -s -X POST -F "file=@edit.json" "https://api.thegraph.com/ipfs/api/v0/add?stream-channels=true&progress=false" | jq -r .Hash`;
    const hash = execSync(ipfsCmd).toString().trim();
    const cid = `ipfs://${hash}`;
    console.log('\n✅ [IPFS] Got CID:', { cid });

    // Then get calldata using curl
    console.log('\n[API] Getting calldata...');
    const calldataCmd = `curl -s -m 30 -X POST -H "Content-Type: application/json" -H "Accept: */*" -d '{"cid":"${cid}","network":"TESTNET"}' "https://api-testnet.grc-20.thegraph.com/space/${spaceId}/edit/calldata"`;
    const calldataResponse = execSync(calldataCmd).toString();
    console.log('\n[API] Response text:', calldataResponse);
    const response = JSON.parse(calldataResponse);

    console.log('\n✅ [API] Got calldata:', {
      to: response.to,
      dataLength: response.data.length,
      timestamp: new Date().toISOString()
    });

    // Get gas price
    const gasPrice = await wallet.publicClient.getGasPrice();
    console.log('\n[Transaction] Gas price:', gasPrice);

    // Get nonce
    const nonce = await wallet.publicClient.getTransactionCount({
      address: wallet.account.address,
    });
    console.log('\n[Transaction] Nonce:', nonce);

    // Submit transaction
    console.log('\n[Transaction] Submitting to network...');
    console.log('\n[Transaction] Details:', {
      to: response.to,
      data: response.data,
      gasPrice: gasPrice,
      nonce: nonce,
      timestamp: new Date().toISOString()
    });

    try {
      const txHash = await wallet.walletClient.sendTransaction({
        account: wallet.account,
        to: response.to as `0x${string}`,
        value: 0n,
        data: response.data as `0x${string}`,
        gas: 0x98430dn, // Use exact gas estimate
        gasPrice: gasPrice,
        nonce: nonce,
      });

      console.log('\n✅ [Transaction] Submitted:', { txHash });

      // Wait for transaction to be confirmed
      console.log('\n[Transaction] Waiting for confirmation...');
      const receipt = await wallet.publicClient.waitForTransactionReceipt({ hash: txHash });
      console.log('\n✅ [Transaction] Confirmed:', {
        blockNumber: receipt.blockNumber,
        blockHash: receipt.blockHash,
        status: receipt.status,
      });

      return txHash;
    } catch (txError) {
      console.error('\n❌ [Transaction] Failed:', {
        error: txError instanceof Error ? txError.message : txError,
        name: txError instanceof Error ? txError.name : 'Unknown',
        stack: txError instanceof Error ? txError.stack : undefined,
        timestamp: new Date().toISOString()
      });
      throw txError;
    }
  } catch (error) {
    if (error instanceof Error) {
      console.error('\n❌ [Error]:', {
        error: error.message,
        name: error.name,
        stack: error.stack,
        timestamp: new Date().toISOString()
      });
    }
    throw error;
  }
}

// Execute if running directly
if (import.meta.url === new URL(import.meta.url).href) {
  console.log('[Startup] Starting...');
  
  if (!process.env.WALLET_ADDRESS) {
    throw new Error('WALLET_ADDRESS not set in environment');
  }
  if (!process.env.SPACE_ID) {
    throw new Error('SPACE_ID not set in environment');
  }

  publish({
    spaceId: 'XPZ8fnf3DvNMRDbFgxEZi2',
    editName: 'Add Building Permits',
    author: process.env.WALLET_ADDRESS
  }).catch(error => {
    console.error('\n❌ [Error]:', error);
    process.exit(1);
  });
}
