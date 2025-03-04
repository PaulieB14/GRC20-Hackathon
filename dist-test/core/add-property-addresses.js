import { readFileSync } from 'fs';
import { Graph } from '@graphprotocol/grc-20';
import dotenv from 'dotenv';
import { createPublicClient, createWalletClient, http, parseGwei } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
dotenv.config();
const grc20Testnet = {
    id: 19411,
    name: 'Geogenesis Testnet',
    network: 'geogenesis-testnet',
    nativeCurrency: {
        decimals: 18,
        name: 'ETH',
        symbol: 'ETH',
    },
    rpcUrls: {
        default: { http: ['https://rpc-geo-test-zc16z3tcvf.t.conduit.xyz/'] },
        public: { http: ['https://rpc-geo-test-zc16z3tcvf.t.conduit.xyz/'] },
    }
};
// Map of instrument numbers to property addresses
const propertyAddresses = {
    '2025035356': '3461 10TH AVE N, ST PETERSBURG, FL 33713',
    '2025035363': '4715 BAY ST NE APT 123, SAINT PETERSBURG, FL 33703',
    '2025035367': '755 119TH AVE, TREASURE ISLAND, FL 33706',
    '2025035368': '125 DOLPHIN DR S, OLDSMAR, FL 34677',
    '2025035369': '18500 GULF BOULEVARD, UNIT 108, INDIAN SHORES, FL 33785',
    '2025035383': '2326 MELROSE AVE S, ST. PETERSBURG, FL 33712',
    '2025035390': '2818 55TH ST N, ST PETERSBURG, FL 33710',
    '2025035391': '5136 52ND LN N, ST PETERSBURG, FL 33710',
    '2025035398': '1900 59TH AVE N # 216, ST PETERSBURG, FL 33714'
};
// Map of entity IDs to instrument numbers (from the image)
const entityMap = {
    '7tzYRxS8QES1fQQLoUpc8U': '2025035356',
    'PbuL6TM19rdkFoEh31VyQq': '2025035363',
    'GXSWc9tEJp5iP1idJDyuYC': '2025035367',
    'QQ2Cb5L4yNTUfva7aEXYdk': '2025035368',
    'JUtVFrszpHccyEQPkURtUj': '2025035369',
    'JSvDqnQxpXqdVYDm3G9Zyy': '2025035383',
    'YB7z9V1fXtBv1LU5kpY2i8': '2025035390',
    '4a2Y9zUyeknUBCu8afhyds': '2025035391',
    '8b6w38q92qaxvbvgrvJPNh': '2025035398'
};
/**
 * Adds property addresses to existing entities
 */
async function addPropertyAddresses() {
    try {
        if (!process.env.WALLET_ADDRESS) {
            throw new Error('WALLET_ADDRESS not set in environment');
        }
        if (!process.env.SPACE_ID) {
            throw new Error('SPACE_ID not set in environment');
        }
        if (!process.env.PRIVATE_KEY) {
            throw new Error('PRIVATE_KEY not set in environment');
        }
        // Read entity data from grc20-deeds-triples.json
        const grc20DeedsTriples = JSON.parse(readFileSync('data/grc20-deeds-triples.json', 'utf-8'));
        console.log(`Read ${grc20DeedsTriples.length} entities from grc20-deeds-triples.json`);
        // Create operations
        const ops = [];
        // Create property for property address
        console.log('Creating property address property...');
        const { id: propertyAddressId, ops: propertyAddressOps } = Graph.createProperty({
            name: 'Property Address',
            type: 'TEXT',
        });
        ops.push(...propertyAddressOps);
        // Find the deed type ID from the first entity
        const deedTypeTriple = grc20DeedsTriples[0].triples.find((triple) => triple.attributeId && triple.attributeId.includes('type'));
        const deedTypeId = deedTypeTriple ? deedTypeTriple.value : null;
        if (deedTypeId) {
            // Add property address to deed type
            console.log('Adding property address to deed type...');
            ops.push({
                path: ['type', deedTypeId, 'properties'],
                value: propertyAddressId,
                op: 'add'
            });
        }
        // Add property address to each entity
        console.log('Adding property addresses to entities...');
        for (const entity of grc20DeedsTriples) {
            const entityId = entity.entityId;
            const instrumentNumber = entityMap[entityId];
            if (instrumentNumber && propertyAddresses[instrumentNumber]) {
                // Add property address to entity
                const { ops: entityOps } = Graph.updateEntityProperty({
                    entityId,
                    propertyId: propertyAddressId,
                    value: {
                        type: 'TEXT',
                        value: propertyAddresses[instrumentNumber]
                    }
                });
                ops.push(...entityOps);
                console.log(`Added property address "${propertyAddresses[instrumentNumber]}" to entity ${entityId}`);
            }
        }
        console.log(`Generated ${ops.length} operations to add property addresses`);
        // Publish to the knowledge graph
        console.log(`Publishing ${ops.length} operations to the knowledge graph...`);
        // Get the wallet and client
        const account = privateKeyToAccount(process.env.PRIVATE_KEY);
        const publicClient = createPublicClient({
            chain: grc20Testnet,
            transport: http()
        });
        const walletClient = createWalletClient({
            account,
            chain: grc20Testnet,
            transport: http()
        });
        // Get the space ID
        const spaceId = process.env.SPACE_ID;
        // Publish the edit
        const editName = 'Add Property Addresses to GRC20 Deed Entities';
        const author = process.env.WALLET_ADDRESS;
        // Publish to IPFS using Ipfs.publishEdit
        console.log('Publishing to IPFS...');
        const { Ipfs } = await import('@graphprotocol/grc-20');
        const cid = await Ipfs.publishEdit({
            name: editName,
            ops,
            author,
        });
        console.log(`Published to IPFS with CID: ${cid}`);
        // Get calldata
        console.log('Getting calldata...');
        const result = await fetch(`https://api-testnet.grc-20.thegraph.com/space/${spaceId}/edit/calldata`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
            body: JSON.stringify({
                cid,
                network: "TESTNET"
            }),
        });
        if (!result.ok) {
            throw new Error(`Failed to get calldata: ${result.statusText}`);
        }
        const { to, data } = await result.json();
        console.log(`Got calldata: to=${to}, data length=${data.length}`);
        // Submit transaction
        console.log('Submitting transaction...');
        const nonce = await publicClient.getTransactionCount({
            address: account.address
        });
        console.log(`Using nonce: ${nonce}`);
        const gasLimit = 13000000n;
        const baseGasPrice = parseGwei('0.01');
        const hash = await walletClient.sendTransaction({
            account,
            chain: grc20Testnet,
            to: to,
            data: data,
            gas: gasLimit,
            maxFeePerGas: baseGasPrice,
            maxPriorityFeePerGas: baseGasPrice,
            nonce,
            value: 0n
        });
        console.log(`Transaction submitted with hash: ${hash}`);
        // Wait for confirmation
        console.log('Waiting for confirmation...');
        const receipt = await publicClient.waitForTransactionReceipt({ hash });
        console.log(`Transaction confirmed in block ${receipt.blockNumber}`);
        console.log('Property addresses added successfully!');
    }
    catch (error) {
        console.error('Failed to add property addresses:', error);
        throw error;
    }
}
// Execute if running directly
if (import.meta.url === new URL(import.meta.url).href) {
    addPropertyAddresses().catch(error => {
        console.error('Failed to add property addresses:', error);
        process.exit(1);
    });
}
