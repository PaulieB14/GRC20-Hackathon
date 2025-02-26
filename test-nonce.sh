#!/bin/bash
curl -s -X POST -H "Content-Type: application/json" -d '{"jsonrpc":"2.0","method":"eth_getTransactionCount","params":["0x6596a3C7C2eA69D04F01F064AA4e914196BbA0a7","latest"],"id":1}' "https://api-testnet.thegraph.com/rpc"
