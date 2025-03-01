/**
 * Overwrite Entities with Relations
 * 
 * This script overwrites existing entities with new ones that include relations.
 * It reads the existing triples from deeds-triples.json, creates new entities with
 * the same IDs but with relations, and publishes these new entities.
 */

import { readFileSync } from 'fs';
import { Graph, Relation, Triple, Id, type Op } from "@graphprotocol/grc-20";
import * as dotenv from 'dotenv';
import { Ipfs } from "@graphprotocol/grc-20";
import { createPublicClient, createWalletClient, http, Chain, parseGwei } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';

dotenv.config();

// Attribute IDs from the existing data
const DOCUMENT_TYPE_ATTRIBUTE_ID = "3UP1qvruj8SipH9scUz1EY"; // Document type attribute ID
const SELLER_ATTRIBUTE_ID = "SyaPQfHTf3uxTAqwhuMHHa"; // Seller attribute ID
const BUYER_ATTRIBUTE_ID = "DfjyQFDy6k4dW9XaSgYttn"; // Buyer attribute ID
const PROPERTY_DETAILS_ATTRIBUTE_ID = "5yDjGNQEErVNpVZ3c61Uib"; // Property details attribute ID
const INSTRUMENT_NUMBER_ATTRIBUTE_ID = "LuBWqZAu6pz54eiJS5mLv8"; // Instrument number attribute ID

// Chain configuration
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
} as const satisfies Chain;

/**
 * Main function to overwrite entities with relations
 */
async function overwriteWithRelations() {
  try {
    console.log("Starting entity overwrite with relations...");
    
    // Load existing triples from file
    console.log("Loading existing triples...");
    const existingTriples = JSON.parse(readFileSync('data/deeds-triples.json', 'utf8'));
    
    // Extract entity information
    console.log("Extracting entity information...");
    const entityInfo = new Map<string, {
      documentType: string;
      buyer: string;
      seller: string;
      instrumentNumber: string;
      propertyDetails: string;
    }>();
    
    // Process all triples to extract information
    for (const entity of existingTriples) {
      const entityId = entity.entityId;
      let documentType = "";
      let buyer = "";
      let seller = "";
      let instrumentNumber = "";
      let propertyDetails = "";
      
      // Process each triple for this entity
      for (const triple of entity.triples) {
        if (triple.attributeId === DOCUMENT_TYPE_ATTRIBUTE_ID) {
          documentType = triple.value.value;
        } else if (triple.attributeId === BUYER_ATTRIBUTE_ID) {
          buyer = triple.value.value;
        } else if (triple.attributeId === SELLER_ATTRIBUTE_ID) {
          seller = triple.value.value;
        } else if (triple.attributeId === INSTRUMENT_NUMBER_ATTRIBUTE_ID) {
          instrumentNumber = triple.value.value;
        } else if (triple.attributeId === PROPERTY_DETAILS_ATTRIBUTE_ID) {
          propertyDetails = triple.value.value;
        }
      }
      
      entityInfo.set(entityId, {
        documentType,
        buyer,
        seller,
        instrumentNumber,
        propertyDetails
      });
    }
    
    console.log(`Found ${entityInfo.size} entities to overwrite`);
    
    // Create operations array to hold all our changes
    const ops: Op[] = [];
    
    // Create relation type IDs
    console.log("Creating relation types...");
    const { 
      buyerRelationTypeId, 
      sellerRelationTypeId, 
      documentTypeRelationTypeId,
      personTypeId,
      documentTypeTypeId,
      nameAttributeId
    } = await createRelationTypes(ops);
    
    // Create document type entities
    console.log("Creating document type entities...");
    const documentTypeMap = new Map<string, string>();
    const uniqueDocumentTypes = new Set<string>();
    
    // Get unique document types
    for (const info of entityInfo.values()) {
      if (info.documentType) {
        uniqueDocumentTypes.add(info.documentType);
      }
    }
    
    // Create document type entities
    for (const docType of uniqueDocumentTypes) {
      const docTypeId = Id.generate();
      documentTypeMap.set(docType, docTypeId);
      
      // Create document type entity
      const { id, ops: docTypeOps } = Graph.createEntity({
        name: docType,
        types: [documentTypeTypeId],
        properties: {
          [nameAttributeId]: {
            type: "TEXT",
            value: docType
          }
        }
      });
      
      // Store the generated ID
      documentTypeMap.set(docType, id);
      
      ops.push(...docTypeOps);
    }
    
    // Create person entities
    console.log("Creating person entities...");
    const personMap = new Map<string, string>();
    const uniquePersons = new Set<string>();
    
    // Get unique persons (buyers and sellers)
    for (const info of entityInfo.values()) {
      if (info.buyer) uniquePersons.add(info.buyer);
      if (info.seller) uniquePersons.add(info.seller);
    }
    
    // Create person entities
    for (const person of uniquePersons) {
      const personId = Id.generate();
      personMap.set(person, personId);
      
      // Create person entity
      const { id, ops: personOps } = Graph.createEntity({
        name: person,
        types: [personTypeId],
        properties: {
          [nameAttributeId]: {
            type: "TEXT",
            value: person
          }
        }
      });
      
      // Store the generated ID
      personMap.set(person, id);
      
      ops.push(...personOps);
    }
    
    // Create new entities with relations
    console.log("Creating new entities with relations...");
    
    // Create a map to store old entity ID to new entity ID mapping
    const entityIdMap = new Map<string, string>();
    
    for (const [entityId, info] of entityInfo.entries()) {
      // We can't create entities with specific IDs, so we'll use Triple.make instead
      // First, create a new entity
      const { id: newEntityId, ops: entityOps } = Graph.createEntity({
        name: info.instrumentNumber || entityId,
        types: [],
        properties: {}
      });
      
      // Store the mapping from old entity ID to new entity ID
      entityIdMap.set(entityId, newEntityId);
      console.log(`Entity ID mapping: ${entityId} -> ${newEntityId}`);
      
      // Then add the properties using Triple.make
      ops.push(
        Triple.make({
          entityId: newEntityId,
          attributeId: INSTRUMENT_NUMBER_ATTRIBUTE_ID,
          value: {
            type: "TEXT",
            value: info.instrumentNumber
          }
        })
      );
      
      ops.push(
        Triple.make({
          entityId: newEntityId,
          attributeId: PROPERTY_DETAILS_ATTRIBUTE_ID,
          value: {
            type: "TEXT",
            value: info.propertyDetails
          }
        })
      );
      
      ops.push(...entityOps);
      
      // Add document type relation
      if (info.documentType && documentTypeMap.has(info.documentType)) {
        const docTypeEntityId = documentTypeMap.get(info.documentType)!;
        ops.push(
          Relation.make({
            fromId: newEntityId,
            relationTypeId: documentTypeRelationTypeId,
            toId: docTypeEntityId
          })
        );
      }
      
      // Add buyer relation
      if (info.buyer && personMap.has(info.buyer)) {
        const buyerEntityId = personMap.get(info.buyer)!;
        ops.push(
          Relation.make({
            fromId: newEntityId,
            relationTypeId: buyerRelationTypeId,
            toId: buyerEntityId
          })
        );
      }
      
      // Add seller relation
      if (info.seller && personMap.has(info.seller)) {
        const sellerEntityId = personMap.get(info.seller)!;
        ops.push(
          Relation.make({
            fromId: newEntityId,
            relationTypeId: sellerRelationTypeId,
            toId: sellerEntityId
          })
        );
      }
    }
    
    // Publish the update
    console.log("Publishing update...");
    await publishUpdate(ops);
    
  } catch (error) {
    console.error("Error overwriting entities:", error);
  }
}

/**
 * Creates relation types needed for the update
 * @param ops Operations array to append to
 * @returns IDs for the created relation types
 */
async function createRelationTypes(ops: Op[]): Promise<{
  buyerRelationTypeId: string;
  sellerRelationTypeId: string;
  documentTypeRelationTypeId: string;
  personTypeId: string;
  documentTypeTypeId: string;
  nameAttributeId: string;
}> {
  // Create person type
  const { id: personTypeId, ops: personTypeOps } = Graph.createType({
    name: 'Person',
    properties: [], 
  });
  ops.push(...personTypeOps);
  
  // Create document type type
  const { id: documentTypeTypeId, ops: documentTypeTypeOps } = Graph.createType({
    name: 'Document Type',
    properties: [],
  });
  ops.push(...documentTypeTypeOps);
  
  // Create name attribute
  const { id: nameAttributeId, ops: nameAttributeOps } = Graph.createProperty({
    name: 'Name',
    type: 'TEXT',
  });
  ops.push(...nameAttributeOps);
  
  // Create buyer relation type
  const { id: buyerRelationTypeId, ops: buyerRelationTypeOps } = Graph.createType({
    name: 'Buyer',
    properties: [],
  });
  ops.push(...buyerRelationTypeOps);
  
  // Create seller relation type
  const { id: sellerRelationTypeId, ops: sellerRelationTypeOps } = Graph.createType({
    name: 'Seller',
    properties: [],
  });
  ops.push(...sellerRelationTypeOps);
  
  // Create document type relation type
  const { id: documentTypeRelationTypeId, ops: documentTypeRelationTypeOps } = Graph.createType({
    name: 'Document Type Relation',
    properties: [],
  });
  ops.push(...documentTypeRelationTypeOps);
  
  return {
    buyerRelationTypeId,
    sellerRelationTypeId,
    documentTypeRelationTypeId,
    personTypeId,
    documentTypeTypeId,
    nameAttributeId
  };
}

/**
 * Publishes the update to IPFS and the blockchain
 * @param ops Operations to publish
 */
async function publishUpdate(ops: Op[]): Promise<void> {
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
    
    // Publish to IPFS
    console.log('\n[IPFS] Publishing edit...');
    const cid = await Ipfs.publishEdit({
      name: 'Overwrite Entities with Relations',
      ops: ops,
      author: author
    });
    console.log(`\n✅ [IPFS] Published edit: ${cid}`);
    
    // Get calldata for blockchain transaction
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
    
    console.log('\n✅ [API] Got calldata');
    
    // Submit transaction
    console.log('\n[Transaction] Submitting to network...');
    try {
      const account = privateKeyToAccount(process.env.PRIVATE_KEY as `0x${string}`);
      
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
      const gasLimit = 13_000_000n; // Same as previous successful tx
      const baseGasPrice = parseGwei('0.01'); // Same as previous successful tx
      
      // Send transaction
      console.log('\n[Transaction] Sending transaction...');
      const hash = await walletClient.sendTransaction({
        chain: grc20Testnet,
        to: to as `0x${string}`,
        data: data as `0x${string}`,
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
      
    } catch (txError) {
      console.error('\n❌ [Transaction] Failed:', txError);
      throw txError;
    }
  } catch (error) {
    console.error('Publishing failed:', error);
    throw error;
  }
}

// Run the overwrite function
overwriteWithRelations().catch(console.error);
