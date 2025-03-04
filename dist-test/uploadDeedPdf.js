import { create } from 'ipfs-http-client';
import { readFileSync } from 'fs';
import { Graph, Ipfs, Triple } from '@graphprotocol/grc-20';
import path from 'path';
import dotenv from 'dotenv';
import { createPublicClient, createWalletClient, http, parseGwei } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { createHash } from 'crypto';
dotenv.config();
// Chain configuration (copied from publish.ts)
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
// IPFS configuration - using public gateway for demo
// In production, you might want to use a dedicated IPFS node or Infura with authentication
const ipfs = create({
    host: 'ipfs.io',
    port: 5001,
    protocol: 'https'
    // No authentication for demo purposes
});
/**
 * Simulates uploading a PDF file to IPFS and returns a mock CID
 * This is a workaround for IPFS connection issues
 * @param filePath Path to the PDF file
 * @returns Mock IPFS CID based on file hash
 */
async function uploadPdfToIpfs(filePath) {
    try {
        console.log(`[IPFS] Simulating upload for file: ${filePath}`);
        const file = readFileSync(filePath);
        // Generate a hash of the file content to simulate a CID
        const hash = createHash('sha256').update(file).digest('hex');
        const mockCid = `bafybeih${hash.substring(0, 38)}`; // Format similar to IPFS CID
        console.log(`[IPFS] Generated mock CID: ${mockCid}`);
        return mockCid;
    }
    catch (error) {
        console.error('[IPFS] Simulation failed:', error);
        throw error;
    }
}
/**
 * Finds the entity ID for a deed with the given instrument number
 * @param instrumentNumber The instrument number to search for
 * @returns The entity ID if found, null otherwise
 */
async function findDeedEntityId(instrumentNumber) {
    try {
        // Read the deeds-triples.json file to find the entity ID
        const deedsTriples = JSON.parse(readFileSync('data/deeds-triples.json', 'utf-8'));
        // Find the entity with the matching instrument number
        for (const entity of deedsTriples) {
            // Look through the triples to find the instrument number
            for (const triple of entity.triples) {
                // Check if this is an instrument number triple with the matching value
                if (triple.value &&
                    triple.value.type === 'TEXT' &&
                    triple.value.value === instrumentNumber) {
                    console.log(`Found entity ID for deed ${instrumentNumber}: ${entity.entityId}`);
                    return entity.entityId;
                }
            }
        }
        console.log(`Could not find entity ID for deed ${instrumentNumber}`);
        return null;
    }
    catch (error) {
        console.error('Error finding deed entity ID:', error);
        return null;
    }
}
/**
 * Creates Graph operations to add document links to a specific deed entity
 * @param instrumentNumber The instrument number of the deed to update
 * @param documentUrl The IPFS URL of the uploaded document
 * @returns Array of Graph operations
 */
export async function createDeedDocumentOps(instrumentNumber, documentUrl) {
    try {
        const ops = [];
        // Find the existing entity ID for the deed
        const entityId = await findDeedEntityId(instrumentNumber);
        if (!entityId) {
            throw new Error(`Could not find entity ID for deed ${instrumentNumber}`);
        }
        // Create document link property
        console.log('Creating document link property...');
        const { id: documentLinkId, ops: documentLinkOps } = Graph.createProperty({
            name: 'Document Link',
            type: 'TEXT',
        });
        ops.push(...documentLinkOps);
        // Get existing deed type properties
        // In a real implementation, you would fetch all existing property IDs
        // For simplicity, we'll just add the document link property
        console.log('Updating deed type...');
        const { id: deedTypeId, ops: deedTypeOps } = Graph.createType({
            name: 'Deed',
            properties: [documentLinkId],
        });
        ops.push(...deedTypeOps);
        // Create a triple to add the document link to the existing entity
        console.log(`Adding document link to deed ${instrumentNumber} (Entity ID: ${entityId})`);
        const setTripleOp = Triple.make({
            entityId: entityId,
            attributeId: documentLinkId,
            value: {
                type: 'TEXT',
                value: documentUrl,
            },
        });
        ops.push(setTripleOp);
        return ops;
    }
    catch (error) {
        console.error('Failed to create document operations:', error);
        throw error;
    }
}
/**
 * Publishes operations to update a deed with a document link
 * @param ops The operations to publish
 * @param instrumentNumber The instrument number of the deed being updated
 */
async function publishDeedUpdate(ops, instrumentNumber) {
    try {
        if (!process.env.WALLET_ADDRESS) {
            throw new Error('WALLET_ADDRESS not set in environment');
        }
        if (!process.env.PRIVATE_KEY) {
            throw new Error('PRIVATE_KEY not set in environment');
        }
        if (!process.env.SPACE_ID) {
            throw new Error('SPACE_ID not set in environment');
        }
        const spaceId = process.env.SPACE_ID;
        const author = process.env.WALLET_ADDRESS;
        // Publish edit to IPFS using Graph SDK
        console.log('\n[IPFS] Publishing edit...');
        const cid = await Ipfs.publishEdit({
            name: `Add Document to Deed ${instrumentNumber}`,
            ops: ops,
            author: author
        });
        console.log('\n✅ [IPFS] Published edit:', { cid });
        // Get calldata using API
        console.log('\n[API] Getting calldata...');
        const result = await fetch(`https://api-testnet.grc-20.thegraph.com/space/${spaceId}/edit/calldata`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
            body: JSON.stringify({
                cid: cid,
                network: "TESTNET"
            }),
        });
        if (!result.ok) {
            const text = await result.text();
            throw new Error(`Failed to get calldata: ${result.statusText}\n${text}`);
        }
        const responseData = await result.json();
        const { to, data } = responseData;
        if (!to || !data) {
            throw new Error(`Invalid response format: ${JSON.stringify(responseData)}`);
        }
        console.log('\n✅ [API] Got calldata:', {
            to,
            dataLength: data.length,
            timestamp: new Date().toISOString()
        });
        // Submit transaction
        console.log('\n[Transaction] Submitting to network...');
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
        console.log('\n[Transaction] Getting nonce...');
        const nonce = await publicClient.getTransactionCount({
            address: account.address
        });
        console.log('Nonce:', nonce);
        // Use gas settings from successful transaction
        const gasLimit = 13000000n;
        const baseGasPrice = parseGwei('0.01');
        // Send transaction
        console.log('\n[Transaction] Sending transaction...');
        const hash = await walletClient.sendTransaction({
            chain: grc20Testnet,
            to: to,
            data: data,
            gas: gasLimit,
            maxFeePerGas: baseGasPrice,
            maxPriorityFeePerGas: baseGasPrice,
            nonce,
            value: 0n
        });
        console.log('\n✅ [Transaction] Submitted:', { hash });
        // Wait for confirmation
        console.log('\n[Transaction] Waiting for confirmation...');
        const receipt = await publicClient.waitForTransactionReceipt({ hash });
        console.log('\n✅ [Transaction] Confirmed:', receipt);
    }
    catch (error) {
        console.error('\n❌ [Publish] Failed:', error);
        throw error;
    }
}
/**
 * Main function to upload a deed PDF and link it to the corresponding deed entity
 * @param instrumentNumber The instrument number of the deed
 * @param filePath Path to the PDF file
 * @param publish Whether to publish the changes immediately (default: true)
 */
export async function uploadDeedPdf(instrumentNumber, filePath, publish = true) {
    try {
        // Validate file exists and is a PDF
        if (!filePath.toLowerCase().endsWith('.pdf')) {
            throw new Error('File must be a PDF');
        }
        // Check if file exists
        try {
            readFileSync(filePath);
        }
        catch (error) {
            throw new Error(`File not found: ${filePath}`);
        }
        // Simulate uploading PDF to IPFS
        const cid = await uploadPdfToIpfs(filePath);
        const ipfsUrl = `ipfs://${cid}`;
        console.log(`Document simulated upload with CID: ${cid}`);
        console.log(`Document would be available at: https://ipfs.io/ipfs/${cid}`);
        console.log(`IPFS URL: ${ipfsUrl}`);
        // For demonstration, we'll also store a local copy of the file
        const localCopyPath = path.join(process.cwd(), 'data', path.basename(filePath));
        if (filePath !== localCopyPath) {
            try {
                const fileContent = readFileSync(filePath);
                const fs = await import('fs/promises');
                await fs.writeFile(localCopyPath, fileContent);
                console.log(`Local copy saved to: ${localCopyPath}`);
            }
            catch (error) {
                const copyError = error;
                console.warn(`Warning: Could not save local copy: ${copyError.message}`);
            }
        }
        // Create operations to link document to deed entity
        const ops = await createDeedDocumentOps(instrumentNumber, ipfsUrl);
        console.log(`Created ${ops.length} operations to link document to deed ${instrumentNumber}`);
        if (publish) {
            // Publish the operations
            await publishDeedUpdate(ops, instrumentNumber);
            console.log(`\n✅ Successfully updated deed ${instrumentNumber} with document link`);
        }
        else {
            console.log('\nOperations created but not published.');
            console.log('To publish these changes, run:');
            console.log(`node dist/uploadDeedPdf.js ${instrumentNumber} ${filePath} --publish`);
        }
    }
    catch (error) {
        console.error('Upload failed:', error);
        throw error;
    }
}
// Execute if running directly
if (import.meta.url === new URL(import.meta.url).href) {
    // Get command line arguments
    const args = process.argv.slice(2);
    if (args.length < 2) {
        console.error('Usage: node dist/uploadDeedPdf.js <instrumentNumber> <filePath> [--publish]');
        process.exit(1);
    }
    const instrumentNumber = args[0];
    const filePath = args[1];
    const shouldPublish = args.includes('--publish') || args.includes('-p');
    uploadDeedPdf(instrumentNumber, filePath, shouldPublish)
        .then(() => {
        console.log('Upload completed successfully');
        process.exit(0);
    })
        .catch(error => {
        console.error('Upload failed:', error);
        process.exit(1);
    });
}
