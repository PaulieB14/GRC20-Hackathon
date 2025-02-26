#!/bin/bash

# Load environment variables
source .env

# Function to fix JSON response
fix_json() {
    echo "$1" | sed -e 's/"jsonrpc":"2.0""result"/"jsonrpc":"2.0","result"/g' \
                    -e 's/"to":"\([^"]*\)""data"/"to":"\1","data"/g' \
                    -e 's/}""id":/},"id":/g'
}

# Step 1: Create edit proposal and get CID
echo "Step 1: Getting CID from IPFS..."
CID=$(cat data/permits-triples.json | jq -c "{\"name\":\"Test Permits\",\"ops\":.}" | curl -s -X POST -F "file=@-" "https://api.thegraph.com/ipfs/api/v0/add?stream-channels=true&progress=false" | jq -r .Hash)
IPFS_CID="ipfs://$CID"
echo "Got CID: $IPFS_CID"

# Step 2: Get calldata
echo -e "\nStep 2: Getting calldata..."
CALLDATA_RESPONSE=$(curl -s -X POST \
  -H "Content-Type: application/json" \
  -H "Accept: */*" \
  -d "{\"cid\":\"$IPFS_CID\",\"network\":\"TESTNET\"}" \
  "https://api-testnet.grc-20.thegraph.com/space/$SPACE_ID/edit/calldata")
CALLDATA_RESPONSE=$(fix_json "$CALLDATA_RESPONSE")
echo "Calldata response: $CALLDATA_RESPONSE"

# Extract 'to' and 'data' from response
TO_ADDRESS=$(echo $CALLDATA_RESPONSE | jq -r .to)
DATA=$(echo $CALLDATA_RESPONSE | jq -r .data)

echo -e "\nTransaction details:"
echo "To: $TO_ADDRESS"
echo "Data length: ${#DATA}"

# Step 3: Get nonce and gas price
echo -e "\nStep 3: Getting nonce and gas price..."

# Validate environment variables
if [ -z "$WALLET_ADDRESS" ]; then
    echo "Error: WALLET_ADDRESS not set in .env"
    exit 1
fi

if [ -z "$RPC_URL" ]; then
    echo "Error: RPC_URL not set in .env"
    exit 1
fi

# Test RPC connection first
echo "Testing RPC connection..."
TEST_RESPONSE=$(curl -s -X POST \
  -H "Content-Type: application/json" \
  -d "{
    \"jsonrpc\":\"2.0\",
    \"method\":\"eth_blockNumber\",
    \"params\":[],
    \"id\":1
  }" \
  "$RPC_URL")
TEST_RESPONSE=$(fix_json "$TEST_RESPONSE")
echo "Block number response: $TEST_RESPONSE"

BLOCK_NUMBER=$(echo $TEST_RESPONSE | jq -r '.result // empty')
if [ -z "$BLOCK_NUMBER" ]; then
    echo "Error: RPC endpoint not responding correctly"
    echo "Full response: $TEST_RESPONSE"
    exit 1
fi
echo "Current block: $BLOCK_NUMBER"

# Get chain ID
echo -e "\nGetting chain ID..."
CHAIN_ID_RESPONSE=$(curl -s -X POST \
  -H "Content-Type: application/json" \
  -d "{
    \"jsonrpc\":\"2.0\",
    \"method\":\"eth_chainId\",
    \"params\":[],
    \"id\":1
  }" \
  "$RPC_URL")
CHAIN_ID_RESPONSE=$(fix_json "$CHAIN_ID_RESPONSE")
CHAIN_ID=$(echo $CHAIN_ID_RESPONSE | jq -r '.result // empty')
if [ -z "$CHAIN_ID" ]; then
    echo "Error: Failed to get chain ID"
    echo "Full response: $CHAIN_ID_RESPONSE"
    exit 1
fi
echo "Chain ID: $CHAIN_ID"

# Get nonce with error handling
echo -e "\nGetting nonce for address: $WALLET_ADDRESS"
NONCE_RESPONSE=$(curl -s -X POST \
  -H "Content-Type: application/json" \
  -d "{
    \"jsonrpc\":\"2.0\",
    \"method\":\"eth_getTransactionCount\",
    \"params\":[\"$WALLET_ADDRESS\",\"latest\"],
    \"id\":1
  }" \
  "$RPC_URL")
NONCE_RESPONSE=$(fix_json "$NONCE_RESPONSE")
NONCE=$(echo $NONCE_RESPONSE | jq -r '.result // empty')
if [ -z "$NONCE" ]; then
    echo "Error: Failed to get nonce"
    echo "Full response: $NONCE_RESPONSE"
    exit 1
fi
echo "Nonce: $NONCE"

# Get gas price with error handling
echo -e "\nGetting gas price..."
GAS_PRICE_RESPONSE=$(curl -s -X POST \
  -H "Content-Type: application/json" \
  -d "{
    \"jsonrpc\":\"2.0\",
    \"method\":\"eth_gasPrice\",
    \"params\":[],
    \"id\":1
  }" \
  "$RPC_URL")
GAS_PRICE_RESPONSE=$(fix_json "$GAS_PRICE_RESPONSE")
GAS_PRICE=$(echo $GAS_PRICE_RESPONSE | jq -r '.result // empty')
if [ -z "$GAS_PRICE" ]; then
    echo "Error: Failed to get gas price"
    echo "Full response: $GAS_PRICE_RESPONSE"
    exit 1
fi
echo "Gas Price: $GAS_PRICE"

# Get gas estimate
echo -e "\nGetting gas estimate..."
GAS_ESTIMATE_RESPONSE=$(curl -s -X POST \
  -H "Content-Type: application/json" \
  -d "{
    \"jsonrpc\":\"2.0\",
    \"method\":\"eth_estimateGas\",
    \"params\":[{
      \"from\":\"$WALLET_ADDRESS\",
      \"to\":\"$TO_ADDRESS\",
      \"data\":\"$DATA\",
      \"value\":\"0x0\"
    }],
    \"id\":1
  }" \
  "$RPC_URL")
GAS_ESTIMATE_RESPONSE=$(fix_json "$GAS_ESTIMATE_RESPONSE")
GAS_ESTIMATE=$(echo $GAS_ESTIMATE_RESPONSE | jq -r '.result // empty')
if [ -z "$GAS_ESTIMATE" ]; then
    echo "Error: Failed to get gas estimate"
    echo "Full response: $GAS_ESTIMATE_RESPONSE"
    exit 1
fi
echo "Gas Estimate: $GAS_ESTIMATE"

# Convert hex values to decimal
CHAIN_ID_DEC=$((16#${CHAIN_ID#0x}))
NONCE_DEC=$((16#${NONCE#0x}))
GAS_PRICE_DEC=$((16#${GAS_PRICE#0x}))
GAS_PRICE_GWEI=$(echo "scale=9; $GAS_PRICE_DEC / 1000000000" | bc)
if [ ! -z "$GAS_ESTIMATE" ]; then
    GAS_ESTIMATE_DEC=$((16#${GAS_ESTIMATE#0x}))
fi

# Step 4: Transaction details
echo -e "\nStep 4: Transaction details ready for sending"
echo "Chain ID: $CHAIN_ID (${CHAIN_ID_DEC})"
echo "To Address: $TO_ADDRESS"
echo "Data: $DATA"
echo "Nonce: $NONCE (${NONCE_DEC})"
echo "Gas Price: $GAS_PRICE (${GAS_PRICE_GWEI} Gwei)"
if [ ! -z "$GAS_ESTIMATE" ]; then
    echo "Gas Estimate: $GAS_ESTIMATE (${GAS_ESTIMATE_DEC})"
fi

# Calculate total gas cost in Gwei if we have both gas price and estimate
if [ ! -z "$GAS_ESTIMATE" ]; then
    TOTAL_COST_GWEI=$(echo "scale=9; $GAS_PRICE_GWEI * $GAS_ESTIMATE_DEC" | bc)
    echo "Estimated Total Gas Cost: ${TOTAL_COST_GWEI} Gwei"
fi

# Step 5: Example transaction
echo -e "\nTo send this transaction, you can use the following curl command with your signed transaction:"
echo "curl -X POST --data '{
  \"jsonrpc\":\"2.0\",
  \"method\":\"eth_sendRawTransaction\",
  \"params\":[\"<SIGNED_TRANSACTION_HERE>\"],
  \"id\":1
}' -H \"Content-Type: application/json\" $RPC_URL"
