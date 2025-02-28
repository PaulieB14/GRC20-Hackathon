#!/bin/bash

# Load environment variables
source .env

# Function to fix JSON response
fix_json() {
    echo "$1" | sed -e 's/"to":"\([^"]*\)""data"/"to":"\1","data"/g' \
                    -e 's/}""id":/},"id":/g'
}

# Check if SPACE_ID is set
if [ -z "$SPACE_ID" ]; then
  echo "Error: SPACE_ID not set in environment"
  exit 1
fi

# Check if WALLET_ADDRESS is set
if [ -z "$WALLET_ADDRESS" ]; then
  echo "Error: WALLET_ADDRESS not set in environment"
  exit 1
fi

# Check if PRIVATE_KEY is set
if [ -z "$PRIVATE_KEY" ]; then
  echo "Error: PRIVATE_KEY not set in environment"
  exit 1
fi

echo "Republishing latest accepted edit for space: $SPACE_ID"

# Fetch latest accepted edit
echo -e "\n[Fetch] Checking for latest accepted edit..."
EDITS_RESPONSE=$(curl -s -X GET -H "Accept: application/json" "https://api-testnet.grc-20.thegraph.com/space/$SPACE_ID/edits")
echo "[Fetch] Response: $EDITS_RESPONSE"

# Parse the response to find the latest accepted edit
# This is a simplified version - in a real implementation, you would need to parse the JSON properly
# and filter for accepted edits, then sort by timestamp
LATEST_CID=$(echo $EDITS_RESPONSE | jq -r '.[] | select(.status=="ACCEPTED") | .cid' | head -1)

if [ -z "$LATEST_CID" ]; then
  echo "Error: No accepted edit found to republish."
  exit 1
fi

echo -e "\n✅ [Fetch] Found latest accepted edit: $LATEST_CID"

# Get calldata using API
echo -e "\n[API] Getting calldata..."
CALLDATA_RESPONSE=$(curl -s -X POST \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d "{\"cid\":\"$LATEST_CID\",\"network\":\"TESTNET\"}" \
  "https://api-testnet.grc-20.thegraph.com/space/$SPACE_ID/edit/calldata")
echo "[API] Response: $CALLDATA_RESPONSE"

# Fix JSON response if needed
FIXED_RESPONSE=$(fix_json "$CALLDATA_RESPONSE")

# Extract 'to' and 'data' from response
TO_ADDRESS=$(echo $FIXED_RESPONSE | jq -r .to)
DATA=$(echo $FIXED_RESPONSE | jq -r .data)

if [ -z "$TO_ADDRESS" ] || [ -z "$DATA" ]; then
  echo "Error: Invalid response format"
  exit 1
fi

echo -e "\n✅ [API] Got calldata:"
echo "To: $TO_ADDRESS"
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
  "https://rpc-geo-test-zc16z3tcvf.t.conduit.xyz/")
NONCE_RESPONSE=$(fix_json "$NONCE_RESPONSE")
NONCE=$(echo $NONCE_RESPONSE | jq -r '.result // empty')
echo "Nonce: $NONCE"

# Print transaction details
echo -e "\n[Transaction] Transaction details:"
echo "To: $TO_ADDRESS"
echo "Data: $DATA"
echo "Nonce: $NONCE"

# Check if AUTO_SUBMIT is set
if [[ -n "$1" && "$1" == "--auto-submit" ]]; then
  SUBMIT_TX="y"
  echo -e "\n[Transaction] Auto-submitting transaction to the blockchain..."
else
  # Ask if the user wants to submit the transaction
  echo -e "\nDo you want to submit this transaction to the blockchain? (y/n)"
  read -r SUBMIT_TX
fi

if [[ $SUBMIT_TX == "y" || $SUBMIT_TX == "Y" ]]; then
  echo -e "\n[Transaction] Submitting transaction using curl-based implementation..."
  node submit-tx-curl.js "$TO_ADDRESS" "$DATA"
else
  echo -e "\n[Transaction] Transaction not submitted."
  echo -e "To send this transaction later, you can run:"
  echo -e "node submit-tx-curl.js \"$TO_ADDRESS\" \"$DATA\""
fi
