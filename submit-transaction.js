#!/usr/bin/env node

// Simple script to submit a transaction using ethers.js
import { ethers } from 'ethers';
import 'dotenv/config';

// Main function
async function submitTransaction() {
  try {
    // Get transaction details from command line arguments
    const to = process.argv[2];
    const data = process.argv[3];
    
    if (!to || !data) {
      console.error('Usage: node submit-transaction.js <to> <data>');
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
    
    // Create provider and wallet
    const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
    const wallet = new ethers.Wallet(privateKey, provider);
    
    console.log('Using account:', wallet.address);
    console.log('To:', to);
    console.log('Data length:', data.length);
    
    // Get nonce
    console.log('\n[Transaction] Getting nonce...');
    const nonce = await provider.getTransactionCount(wallet.address);
    console.log('Nonce:', nonce);
    
    // Create transaction
    const tx = {
      to: to,
      data: data,
      value: ethers.utils.parseEther('0'),
      gasLimit: ethers.utils.hexlify(13000000), // 13 million gas
      gasPrice: ethers.utils.parseUnits('0.01', 'gwei'),
      nonce: nonce
    };
    
    console.log('Transaction:', tx);
    
    // Submit transaction
    console.log('\n[Transaction] Submitting to network...');
    const txResponse = await wallet.sendTransaction(tx);
    
    console.log('\n✅ [Transaction] Submitted:', { hash: txResponse.hash });
    
    // Wait for confirmation
    console.log('\n[Transaction] Waiting for confirmation...');
    const receipt = await txResponse.wait();
    
    console.log('\n✅ [Transaction] Confirmed:', {
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed.toString(),
      status: receipt.status
    });
    
    return txResponse.hash;
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
