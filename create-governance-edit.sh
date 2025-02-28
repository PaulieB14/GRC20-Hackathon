#!/bin/bash

# Load environment variables
source .env

# Check if CID is provided
if [ -z "$1" ]; then
  echo "Error: CID not provided"
  echo "Usage: ./create-governance-edit.sh <CID>"
  exit 1
fi

CID=$1
echo "Creating governance accept edit for CID: $CID"

# Create the governance edit JSON
echo "Creating edit JSON..."
cat > governance-accept-output.json << EOL
{
  "name": "Governance Accept Edit",
  "author": "$WALLET_ADDRESS",
  "description": "Governance acceptance of edit with CID: $CID",
  "ops": [
    {
      "type": "SET_TRIPLE",
      "triple": {
        "entity": "$SPACE_ID",
        "attribute": "acceptedEdit",
        "value": { "type": "TEXT", "value": "$CID" }
      }
    }
  ],
  "network": "TESTNET"
}
EOL

echo "Saved edit to governance-accept-output.json"

# Publish edit to IPFS
echo -e "\n[IPFS] Publishing governance accept edit..."
IPFS_RESPONSE=$(curl -s -X POST -F "file=@governance-accept-output.json" "https://api.thegraph.com/ipfs/api/v0/add?stream-channels=true&progress=false")
echo "[IPFS] Response: $IPFS_RESPONSE"

# Extract hash from IPFS response
HASH=$(echo $IPFS_RESPONSE | jq -r .Hash)
GOVERNANCE_CID="ipfs://$HASH"
echo -e "\n✅ [IPFS] Published governance accept edit: $GOVERNANCE_CID"

# Get calldata using API
echo -e "\n[API] Getting calldata..."
CALLDATA_RESPONSE=$(curl -s -X POST \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d "{\"cid\":\"$GOVERNANCE_CID\",\"network\":\"TESTNET\"}" \
  "https://api-testnet.grc-20.thegraph.com/space/$SPACE_ID/edit/calldata")
echo "[API] Response: $CALLDATA_RESPONSE"

# Fix JSON response if needed
FIXED_RESPONSE=$(echo $CALLDATA_RESPONSE | sed -e 's/"to":"\([^"]*\)""data"/"to":"\1","data"/g' -e 's/}""id":/},"id":/g')

# Extract 'to' and 'data' from response
TO_ADDRESS=$(echo $FIXED_RESPONSE | jq -r .to)
DATA=$(echo $FIXED_RESPONSE | jq -r .data)

echo -e "\n✅ [API] Got calldata:"
echo "To: $TO_ADDRESS"
echo "Data length: ${#DATA}"

# Print transaction details
echo -e "\n[Transaction] Transaction details:"
echo "To: $TO_ADDRESS"
echo "Data: $DATA"

# Check if AUTO_SUBMIT is set
if [[ -n "$2" && "$2" == "--auto-submit" ]]; then
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
