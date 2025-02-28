#!/usr/bin/env node

// Simple script to submit a transaction using curl commands
import { execSync } from 'child_process';
import { Wallet } from 'ethers';
import 'dotenv/config';

async function submitTransaction() {
  try {
    // Get transaction details from command line arguments
    const to = process.argv[2];
    const data = process.argv[3];
    
    if (!to || !data) {
      console.error('Usage: node submit-tx-curl.js <to> <data>');
      process.exit(1);
    }
    
    if (!process.env.PRIVATE_KEY) {
      console.error('Error: PRIVATE_KEY not set in environment');
      process.exit(1);
    }
    
    if (!process.env.WALLET_ADDRESS) {
      console.error('Error: WALLET_ADDRESS not set in environment');
      process.exit(1);
    }
    
    if (!process.env.RPC_URL) {
      console.error('Error: RPC_URL not set in environment');
      process.exit(1);
    }
    
    console.log('Submitting transaction...');
    console.log('Using account:', process.env.WALLET_ADDRESS);
    console.log('To:', to);
    console.log('Data length:', data.length);
    
    // Create wallet
    const wallet = new Wallet(process.env.PRIVATE_KEY);
    
    // Use fixed gas values for testing
    const gasLimit = '0xc65000'; // 13,000,000
    const gasPrice = '0x989680'; // 10000000 (block base fee)
    
    console.log('\n[Transaction] Using fixed gas values:', {
      gasLimit,
      gasPrice
    });

    // Get nonce
    console.log('\n[Transaction] Getting nonce...');
    const nonceCmd = `curl -s -X POST -H "Content-Type: application/json" -d '{"jsonrpc":"2.0","method":"eth_getTransactionCount","params":["${process.env.WALLET_ADDRESS}","latest"],"id":1}' "${process.env.RPC_URL}"`;
    const nonceResponse = execSync(nonceCmd).toString();
    const nonce = JSON.parse(nonceResponse).result;
    console.log('Nonce:', nonce);

    // Create raw transaction
    const rawTx = {
      to: to,
      data: data,
      gasLimit,
      gasPrice,
      nonce,
      chainId: 19411, // GRC-20 testnet chain ID
      value: '0x0'
    };

    // Sign transaction
    console.log('\n[Transaction] Signing transaction...');
    const signedTx = await wallet.signTransaction(rawTx);
    console.log('Signed transaction:', signedTx);

    // Send transaction
    console.log('\n[Transaction] Sending transaction...');
    const sendTxCmd = `curl -s -X POST -H "Content-Type: application/json" -d '{"jsonrpc":"2.0","method":"eth_sendRawTransaction","params":["${signedTx}"],"id":1}' "${process.env.RPC_URL}"`;
    const sendTxResponse = execSync(sendTxCmd).toString();
    console.log('\n[Transaction] Raw response:', sendTxResponse);
    const txResult = JSON.parse(sendTxResponse);
    
    if (txResult.error) {
      throw new Error(`Transaction failed: ${JSON.stringify(txResult.error)}`);
    }
    
    const txHash = txResult.result;
    console.log('\n✅ [Transaction] Submitted:', { txHash });

    // Wait for confirmation
    console.log('\n[Transaction] Waiting for confirmation...');
    let confirmed = false;
    let attempts = 0;
    const maxAttempts = 30;
    
    while (!confirmed && attempts < maxAttempts) {
      const receiptCmd = `curl -s -X POST -H "Content-Type: application/json" -d '{"jsonrpc":"2.0","method":"eth_getTransactionReceipt","params":["${txHash}"],"id":1}' "${process.env.RPC_URL}"`;
      const receiptResponse = execSync(receiptCmd).toString();
      const receipt = JSON.parse(receiptResponse).result;
      
      if (receipt) {
        console.log('\n✅ [Transaction] Confirmed:', receipt);
        confirmed = true;
      } else {
        attempts++;
        console.log(`\n[Transaction] Waiting... (attempt ${attempts}/${maxAttempts})`);
        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
      }
    }

    if (!confirmed) {
      throw new Error('Transaction confirmation timeout');
    }

    return txHash;
  } catch (error) {
    console.error('\n❌ [Error]:', error);
    process.exit(1);
  }
}

// Execute if running directly
submitTransaction().catch(error => {
  console.error('\n❌ [Error]:', error);
  process.exit(1);
});
