#!/bin/bash

# Load environment variables
source .env

# Check if TO and DATA are provided
if [ -z "$1" ] || [ -z "$2" ]; then
  echo "Error: TO and DATA not provided"
  echo "Usage: ./submit-tx-curl.sh <TO> <DATA>"
  exit 1
fi

TO=$1
DATA=$2

echo "Submitting transaction..."
echo "To: $TO"
echo "Data length: ${#DATA}"

# Get nonce
echo -e "\n[Transaction] Getting nonce..."
NONCE_RESPONSE=$(curl -s -X POST \
  -H "Content-Type: application/json" \
  -d "{
    \"jsonrpc\":\"2.0\",
    \"method\":\"eth_getTransactionCount\",
    \"params\":[\"$WALLET_ADDRESS\",\"latest\"],
    \"id\":1
  }" \
  "$RPC_URL")
NONCE=$(echo $NONCE_RESPONSE | jq -r '.result // empty')
echo "Nonce: $NONCE"

# Use gas settings from successful transaction
GAS_LIMIT="0xc65000" # 13,000,000
GAS_PRICE="0x2540be400" # 10 Gwei

# Create raw transaction
echo -e "\n[Transaction] Creating raw transaction..."
RAW_TX=$(curl -s -X POST \
  -H "Content-Type: application/json" \
  -d "{
    \"jsonrpc\":\"2.0\",
    \"method\":\"eth_signTransaction\",
    \"params\":[{
      \"from\": \"$WALLET_ADDRESS\",
      \"to\": \"$TO\",
      \"data\": \"$DATA\",
      \"gas\": \"$GAS_LIMIT\",
      \"gasPrice\": \"$GAS_PRICE\",
      \"nonce\": \"$NONCE\",
      \"value\": \"0x0\"
    }],
    \"id\":1
  }" \
  "$RPC_URL")
echo "Raw transaction: $RAW_TX"

# Extract signed transaction
SIGNED_TX=$(echo $RAW_TX | jq -r '.result // empty')

if [ -z "$SIGNED_TX" ]; then
  echo -e "\n❌ [Transaction] Failed to sign transaction:"
  echo $RAW_TX
  exit 1
fi

# Send raw transaction
echo -e "\n[Transaction] Sending raw transaction..."
TX_RESPONSE=$(curl -s -X POST \
  -H "Content-Type: application/json" \
  -d "{
    \"jsonrpc\":\"2.0\",
    \"method\":\"eth_sendRawTransaction\",
    \"params\":[\"$SIGNED_TX\"],
    \"id\":1
  }" \
  "$RPC_URL")
echo "Transaction response: $TX_RESPONSE"

# Extract transaction hash
TX_HASH=$(echo $TX_RESPONSE | jq -r '.result // empty')

if [ -z "$TX_HASH" ]; then
  echo -e "\n❌ [Transaction] Failed to submit transaction:"
  echo $TX_RESPONSE
  exit 1
fi

echo -e "\n✅ [Transaction] Submitted: $TX_HASH"

# Wait for confirmation
echo -e "\n[Transaction] Waiting for confirmation..."
sleep 5

RECEIPT_RESPONSE=$(curl -s -X POST \
  -H "Content-Type: application/json" \
  -d "{
    \"jsonrpc\":\"2.0\",
    \"method\":\"eth_getTransactionReceipt\",
    \"params\":[\"$TX_HASH\"],
    \"id\":1
  }" \
  "$RPC_URL")

RECEIPT_STATUS=$(echo $RECEIPT_RESPONSE | jq -r '.result.status // empty')

if [ "$RECEIPT_STATUS" == "0x1" ]; then
  echo -e "\n✅ [Transaction] Confirmed: $TX_HASH"
else
  echo -e "\n❌ [Transaction] Failed or pending: $TX_HASH"
  echo $RECEIPT_RESPONSE
fi
