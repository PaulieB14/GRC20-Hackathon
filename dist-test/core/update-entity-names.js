import { readFileSync } from 'fs';
import { Ipfs } from '@graphprotocol/grc-20';
import { createPublicClient, createWalletClient, http, parseGwei } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import dotenv from 'dotenv';
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
/**
 * Updates entity names to be the instrument number
 */
async function updateEntityNames() {
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
        // Read CSV data
        const csvData = readFileSync('data/GRC20_Deeds.csv', 'utf-8');
        const { parse } = await import('csv-parse/sync');
        const records = parse(csvData, {
            columns: true,
            skip_empty_lines: true
        });
        console.log(`Read ${records.length} records from GRC20_Deeds.csv`);
        // Read entity IDs from grc20-deeds-triples.json
        const grc20DeedsTriples = JSON.parse(readFileSync('data/grc20-deeds-triples.json', 'utf-8'));
        // Create a mapping from instrument number to entity ID
        const entityMappings = [];
        for (const entity of grc20DeedsTriples) {
            const instrumentNumberTriple = entity.triples.find((triple) => triple.attributeId === 'instrumentNumberId');
            if (instrumentNumberTriple) {
                entityMappings.push({
                    entityId: entity.entityId,
                    instrumentNumber: instrumentNumberTriple.value.value
                });
            }
        }
        console.log(`Found ${entityMappings.length} entity mappings`);
        // Create operations to update entity names
        const ops = [];
        const { Graph } = await import('@graphprotocol/grc-20');
        for (const mapping of entityMappings) {
            // Find the corresponding record in the CSV
            const record = records.find(r => r.InstrumentNumber === mapping.instrumentNumber);
            if (record) {
                // Create an operation to update the entity name
                ops.push({
                    path: ['entity', mapping.entityId, 'name'],
                    value: record.InstrumentNumber
                });
                console.log(`Updating entity ${mapping.entityId} name to "${record.InstrumentNumber}"`);
            }
        }
        console.log(`Generated ${ops.length} operations to update entity names`);
        // Publish to IPFS
        const spaceId = process.env.SPACE_ID;
        const author = process.env.WALLET_ADDRESS;
        const editName = 'Update GRC20 Property Deed Entity Names';
        console.log('Publishing to IPFS...');
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
        if (!to || !data) {
            throw new Error(`Invalid response format: ${JSON.stringify(await result.json())}`);
        }
        console.log(`Got calldata: to=${to}, data length=${data.length}`);
        // Submit transaction
        console.log('Submitting transaction...');
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
        // Get nonce
        console.log('Getting nonce...');
        const nonce = await publicClient.getTransactionCount({
            address: account.address
        });
        console.log(`Using nonce: ${nonce}`);
        // Use gas settings from successful transaction
        const gasLimit = 13000000n;
        const baseGasPrice = parseGwei('0.01');
        // Send transaction
        console.log('Sending transaction...');
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
        console.log('Entity names updated successfully!');
    }
    catch (error) {
        console.error('Failed to update entity names:', error);
        throw error;
    }
}
// Execute if running directly
if (import.meta.url === new URL(import.meta.url).href) {
    updateEntityNames().catch(error => {
        console.error('Failed to update entity names:', error);
        process.exit(1);
    });
}
