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
/**
 * Pushes entities with all properties to the knowledge graph
 */
async function pushEntitiesWithProperties() {
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
        // Create entities directly
        const ops = [];
        // Create properties for deed fields
        console.log('Creating properties...');
        const { id: instrumentNumberId, ops: instrumentNumberOps } = Graph.createProperty({
            name: 'Instrument Number',
            type: 'TEXT',
        });
        ops.push(...instrumentNumberOps);
        const { id: directNameId, ops: directNameOps } = Graph.createProperty({
            name: 'Direct Name',
            type: 'TEXT',
        });
        ops.push(...directNameOps);
        const { id: indirectNameId, ops: indirectNameOps } = Graph.createProperty({
            name: 'Indirect Name',
            type: 'TEXT',
        });
        ops.push(...indirectNameOps);
        const { id: recordDateId, ops: recordDateOps } = Graph.createProperty({
            name: 'Record Date',
            type: 'TEXT',
        });
        ops.push(...recordDateOps);
        const { id: bookTypeId, ops: bookTypeOps } = Graph.createProperty({
            name: 'Book Type',
            type: 'TEXT',
        });
        ops.push(...bookTypeOps);
        const { id: bookPageId, ops: bookPageOps } = Graph.createProperty({
            name: 'Book Page',
            type: 'TEXT',
        });
        ops.push(...bookPageOps);
        const { id: legalDescriptionId, ops: legalDescriptionOps } = Graph.createProperty({
            name: 'Legal Description',
            type: 'TEXT',
        });
        ops.push(...legalDescriptionOps);
        const { id: docTypeId, ops: docTypeOps } = Graph.createProperty({
            name: 'Document Type',
            type: 'TEXT',
        });
        ops.push(...docTypeOps);
        // Create a single deed type with all properties
        console.log('Creating deed type...');
        const { id: deedTypeId, ops: deedTypeOps } = Graph.createType({
            name: 'Deed',
            properties: [
                instrumentNumberId,
                directNameId,
                indirectNameId,
                recordDateId,
                bookTypeId,
                bookPageId,
                legalDescriptionId,
                docTypeId
            ],
        });
        ops.push(...deedTypeOps);
        // Create entities for each record with all properties
        console.log('Creating entities with properties...');
        for (const record of records) {
            // Create the entity with its name as the instrument number
            const { id: entityId, ops: entityOps } = Graph.createEntity({
                name: record.InstrumentNumber,
                types: [deedTypeId],
                properties: {
                    [instrumentNumberId]: {
                        type: 'TEXT',
                        value: record.InstrumentNumber
                    },
                    [directNameId]: {
                        type: 'TEXT',
                        value: record.DirectName
                    },
                    [indirectNameId]: {
                        type: 'TEXT',
                        value: record.IndirectName
                    },
                    [recordDateId]: {
                        type: 'TEXT',
                        value: record.RecordDate
                    },
                    [bookTypeId]: {
                        type: 'TEXT',
                        value: record.BookType
                    },
                    [bookPageId]: {
                        type: 'TEXT',
                        value: record.BookPage
                    },
                    [legalDescriptionId]: {
                        type: 'TEXT',
                        value: record.LegalDescription
                    },
                    [docTypeId]: {
                        type: 'TEXT',
                        value: record.DocTypeDescription
                    }
                },
            });
            ops.push(...entityOps);
            console.log(`Created entity ${entityId} for instrument number ${record.InstrumentNumber} with all properties`);
        }
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
        const editName = 'Push GRC20 Deed Entities with Properties';
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
        console.log('Entities with properties pushed successfully!');
    }
    catch (error) {
        console.error('Failed to push entities with properties:', error);
        throw error;
    }
}
// Execute if running directly
if (import.meta.url === new URL(import.meta.url).href) {
    pushEntitiesWithProperties().catch(error => {
        console.error('Failed to push entities with properties:', error);
        process.exit(1);
    });
}
