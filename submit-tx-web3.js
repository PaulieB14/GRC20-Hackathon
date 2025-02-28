#!/usr/bin/env node

// Simple script to submit a transaction using web3.js
import { Web3 } from 'web3';
import 'dotenv/config';

async function submitTransaction() {
  try {
    // Get transaction details from command line arguments
    const to = process.argv[2];
    const data = process.argv[3];
    
    if (!to || !data) {
      console.error('Usage: node submit-tx-web3.js <to> <data>');
      process.exit(1);
    }
    
    // Check environment variables
    const privateKey = process.env.PRIVATE_KEY;
    const rpcUrl = process.env.RPC_URL;
    
    if (!privateKey) {
      console.error('Error: PRIVATE_KEY not set in environment');
      process.exit(1);
    }
    
    if (!rpcUrl) {
      console.error('Error: RPC_URL not set in environment');
      process.exit(1);
    }
    
    console.log('Submitting transaction...');
    
    // Create web3 instance
    const web3 = new Web3(rpcUrl);
    
    // Add private key to wallet
    const account = web3.eth.accounts.privateKeyToAccount(privateKey);
    web3.eth.accounts.wallet.add(account);
    
    console.log('Using account:', account.address);
    console.log('To:', to);
    console.log('Data length:', data.length);
    
    // Get nonce
    console.log('\n[Transaction] Getting nonce...');
    const nonce = await web3.eth.getTransactionCount(account.address);
    console.log('Nonce:', nonce);
    
    // Create transaction
    const tx = {
      from: account.address,
      to: to,
      data: data,
      value: '0',
      gas: 13000000, // 13 million gas
      gasPrice: web3.utils.toWei('0.01', 'gwei'),
      nonce: nonce
    };
    
    console.log('Transaction:', tx);
    
    // Submit transaction
    console.log('\n[Transaction] Submitting to network...');
    const receipt = await web3.eth.sendTransaction(tx);
    
    console.log('\n✅ [Transaction] Submitted and confirmed:', {
      hash: receipt.transactionHash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed,
      status: receipt.status
    });
    
    return receipt.transactionHash;
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
