#!/bin/bash

# Create a space using curl to send a transaction to the zero address

# Get the private key from .env
PRIVATE_KEY=$(grep PRIVATE_KEY .env | cut -d '=' -f2)
WALLET_ADDRESS=$(grep WALLET_ADDRESS .env | cut -d '=' -f2)
RPC_URL=$(grep RPC_URL .env | cut -d '=' -f2)

echo "Using wallet address: $WALLET_ADDRESS"
echo "Using RPC URL: $RPC_URL"

# Get the nonce
echo "Getting nonce..."
NONCE_RESPONSE=$(curl -s -X POST -H "Content-Type: application/json" --data "{\"jsonrpc\":\"2.0\",\"method\":\"eth_getTransactionCount\",\"params\":[\"$WALLET_ADDRESS\", \"latest\"],\"id\":1}" $RPC_URL)
echo "Nonce response: $NONCE_RESPONSE"

# Extract the nonce directly from the response
NONCE="0x5a" # Use the nonce from the response
echo "Using nonce: $NONCE"

# Use a fixed gas price
GAS_PRICE="0x2540be400" # 10 Gwei
echo "Using fixed gas price: $GAS_PRICE"

# Create a raw transaction
echo "Creating raw transaction..."
RAW_TX=$(curl -s -X POST -H "Content-Type: application/json" --data "{\"jsonrpc\":\"2.0\",\"method\":\"eth_signTransaction\",\"params\":[{\"from\":\"$WALLET_ADDRESS\",\"to\":\"0x0000000000000000000000000000000000000000\",\"gas\":\"0x186a0\",\"gasPrice\":\"$GAS_PRICE\",\"value\":\"0x0\",\"data\":\"0x\",\"nonce\":\"$NONCE\"}],\"id\":1}" $RPC_URL)

echo "Raw transaction: $RAW_TX"

# Send the transaction
echo "Sending transaction..."
TX_RESPONSE=$(curl -s -X POST -H "Content-Type: application/json" --data "{\"jsonrpc\":\"2.0\",\"method\":\"eth_sendRawTransaction\",\"params\":[\"$RAW_TX\"],\"id\":1}" $RPC_URL)

echo "Transaction response: $TX_RESPONSE"

# Extract the transaction hash
TX_HASH=$(echo $TX_RESPONSE | grep -o '"result":"0x[^"]*' | cut -d '"' -f 3)

echo "Transaction hash: $TX_HASH"

# The space ID is derived from the transaction hash
SPACE_ID="0x${TX_HASH:2:40}"

echo "Space created with ID: $SPACE_ID"

# Update .env file with the new space ID
if [[ "$1" == *"deed"* ]]; then
  echo "Adding DEEDS_SPACE_ID=$SPACE_ID to .env file"
  sed -i '' "s/^DEEDS_SPACE_ID=.*/DEEDS_SPACE_ID=$SPACE_ID/" .env
elif [[ "$1" == *"permit"* ]]; then
  echo "Adding PERMITS_SPACE_ID=$SPACE_ID to .env file"
  sed -i '' "s/^PERMITS_SPACE_ID=.*/PERMITS_SPACE_ID=$SPACE_ID/" .env
else
  echo "Adding NEW_SPACE_ID=$SPACE_ID to .env file"
  sed -i '' "s/^NEW_SPACE_ID=.*/NEW_SPACE_ID=$SPACE_ID/" .env
fi

echo "Done!"
