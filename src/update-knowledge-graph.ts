/**
 * Update Knowledge Graph with Relations
 * 
 * This script updates the existing knowledge graph by converting properties to relations.
 * It reads the existing triples from deeds-triples.json, extracts entity IDs and document types,
 * creates document type entities, adds relations to existing entities, creates person entities
 * for buyers and sellers, and adds buyer/seller relations.
 */

import { readFileSync } from 'fs';
import { Graph, Relation, Triple, Id, type Op } from "@graphprotocol/grc-20";
import * as dotenv from 'dotenv';
import { publish } from './publish.js';

dotenv.config();

// Attribute IDs from the existing data
const DOCUMENT_TYPE_ATTRIBUTE_ID = "3UP1qvruj8SipH9scUz1EY"; // Document type attribute ID
const SELLER_ATTRIBUTE_ID = "SyaPQfHTf3uxTAqwhuMHHa"; // Seller attribute ID
const BUYER_ATTRIBUTE_ID = "DfjyQFDy6k4dW9XaSgYttn"; // Buyer attribute ID
const PROPERTY_DETAILS_ATTRIBUTE_ID = "5yDjGNQEErVNpVZ3c61Uib"; // Property details attribute ID
const INSTRUMENT_NUMBER_ATTRIBUTE_ID = "LuBWqZAu6pz54eiJS5mLv8"; // Instrument number attribute ID

/**
 * Main function to update the knowledge graph
 */
async function updateKnowledgeGraph() {
  try {
    console.log("Starting knowledge graph update...");
    
    // Load existing triples from file
    console.log("Loading existing triples...");
    const existingTriples = JSON.parse(readFileSync('data/deeds-triples.json', 'utf8'));
    
    // Extract unique entity IDs for deeds and track document types
    console.log("Extracting entity IDs and document types...");
    const deedEntityIds = new Set<string>();
    const documentTypes = new Map<string, string>(); // Map entity ID to document type
    const buyerNames = new Map<string, string>(); // Map entity ID to buyer name
    const sellerNames = new Map<string, string>(); // Map entity ID to seller name
    const instrumentNumbers = new Map<string, string>(); // Map entity ID to instrument number
    const propertyDetails = new Map<string, string>(); // Map entity ID to property details
    
    // Process all triples to extract information
    for (const entity of existingTriples) {
      const entityId = entity.entityId;
      deedEntityIds.add(entityId);
      
      // Process each triple for this entity
      for (const triple of entity.triples) {
        if (triple.attributeId === DOCUMENT_TYPE_ATTRIBUTE_ID) {
          documentTypes.set(entityId, triple.value.value);
        } else if (triple.attributeId === BUYER_ATTRIBUTE_ID) {
          buyerNames.set(entityId, triple.value.value);
        } else if (triple.attributeId === SELLER_ATTRIBUTE_ID) {
          sellerNames.set(entityId, triple.value.value);
        } else if (triple.attributeId === INSTRUMENT_NUMBER_ATTRIBUTE_ID) {
          instrumentNumbers.set(entityId, triple.value.value);
        } else if (triple.attributeId === PROPERTY_DETAILS_ATTRIBUTE_ID) {
          propertyDetails.set(entityId, triple.value.value);
        }
      }
    }
    
    console.log(`Found ${deedEntityIds.size} deed entities`);
    
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
    const documentTypeMap = await createDocumentTypeEntities(
      documentTypes, 
      documentTypeTypeId, 
      nameAttributeId, 
      ops
    );
    
    // Create person entities for buyers and sellers
    console.log("Creating person entities...");
    const { buyerMap, sellerMap } = await createPersonEntities(
      buyerNames, 
      sellerNames, 
      personTypeId, 
      nameAttributeId, 
      ops
    );
    
    // Add relations to existing entities
    console.log("Adding relations to existing entities...");
    
    // Add document type relations
    await createDocumentTypeRelations(
      deedEntityIds, 
      documentTypes, 
      documentTypeMap, 
      documentTypeRelationTypeId, 
      ops
    );
    
    // Add buyer relations
    await createBuyerRelations(
      deedEntityIds, 
      buyerNames, 
      buyerMap, 
      buyerRelationTypeId, 
      ops
    );
    
    // Add seller relations
    await createSellerRelations(
      deedEntityIds, 
      sellerNames, 
      sellerMap, 
      sellerRelationTypeId, 
      ops
    );
    
    // Update property values if needed
    console.log("Updating property values...");
    await updatePropertyValues(ops);
    
    // Publish the update
    console.log("Publishing update...");
    const cid = await publish({
      spaceId: process.env.SPACE_ID as string,
      editName: "Convert Properties to Relations",
      ops,
      author: process.env.WALLET_ADDRESS as string
    });
    
    console.log("Published update with CID:", cid);
    
  } catch (error) {
    console.error("Error updating knowledge graph:", error);
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
 * Creates document type entities
 * @param documentTypes Map of entity IDs to document types
 * @param documentTypeTypeId ID of the document type type
 * @param nameAttributeId ID of the name attribute
 * @param ops Operations array to append to
 * @returns Map of document type names to entity IDs
 */
async function createDocumentTypeEntities(
  documentTypes: Map<string, string>,
  documentTypeTypeId: string,
  nameAttributeId: string,
  ops: Op[]
): Promise<Map<string, string>> {
  const documentTypeMap = new Map<string, string>();
  
  // Get unique document types
  const uniqueDocumentTypes = new Set<string>();
  for (const docType of documentTypes.values()) {
    uniqueDocumentTypes.add(docType);
  }
  
  // Create document type entities
  for (const docType of uniqueDocumentTypes) {
    const docTypeId = Id.generate();
    documentTypeMap.set(docType, docTypeId);
    
    ops.push(
      Graph.createEntity({
        name: docType,
        types: [documentTypeTypeId],
        properties: {
          [nameAttributeId]: {
            type: "TEXT",
            value: docType
          }
        },
      }).ops[0]
    );
  }
  
  return documentTypeMap;
}

/**
 * Creates person entities for buyers and sellers
 * @param buyerNames Map of entity IDs to buyer names
 * @param sellerNames Map of entity IDs to seller names
 * @param personTypeId ID of the person type
 * @param nameAttributeId ID of the name attribute
 * @param ops Operations array to append to
 * @returns Maps of person names to entity IDs
 */
async function createPersonEntities(
  buyerNames: Map<string, string>,
  sellerNames: Map<string, string>,
  personTypeId: string,
  nameAttributeId: string,
  ops: Op[]
): Promise<{
  buyerMap: Map<string, string>;
  sellerMap: Map<string, string>;
}> {
  const personMap = new Map<string, string>();
  const buyerMap = new Map<string, string>();
  const sellerMap = new Map<string, string>();
  
  // Process buyers
  for (const buyerName of buyerNames.values()) {
    if (!personMap.has(buyerName)) {
      const personId = Id.generate();
      personMap.set(buyerName, personId);
      buyerMap.set(buyerName, personId);
      
      ops.push(
        Graph.createEntity({
          name: buyerName,
          types: [personTypeId],
          properties: {
            [nameAttributeId]: {
              type: "TEXT",
              value: buyerName
            }
          },
        }).ops[0]
      );
    } else {
      buyerMap.set(buyerName, personMap.get(buyerName)!);
    }
  }
  
  // Process sellers
  for (const sellerName of sellerNames.values()) {
    if (!personMap.has(sellerName)) {
      const personId = Id.generate();
      personMap.set(sellerName, personId);
      sellerMap.set(sellerName, personId);
      
      ops.push(
        Graph.createEntity({
          name: sellerName,
          types: [personTypeId],
          properties: {
            [nameAttributeId]: {
              type: "TEXT",
              value: sellerName
            }
          },
        }).ops[0]
      );
    } else {
      sellerMap.set(sellerName, personMap.get(sellerName)!);
    }
  }
  
  return { buyerMap, sellerMap };
}

/**
 * Creates document type relations
 * @param deedEntityIds Set of deed entity IDs
 * @param documentTypes Map of entity IDs to document types
 * @param documentTypeMap Map of document type names to entity IDs
 * @param documentTypeRelationTypeId ID of the document type relation type
 * @param ops Operations array to append to
 */
async function createDocumentTypeRelations(
  deedEntityIds: Set<string>,
  documentTypes: Map<string, string>,
  documentTypeMap: Map<string, string>,
  documentTypeRelationTypeId: string,
  ops: Op[]
): Promise<void> {
  for (const entityId of deedEntityIds) {
    const docType = documentTypes.get(entityId);
    if (docType) {
      const docTypeEntityId = documentTypeMap.get(docType);
      
      if (docTypeEntityId) {
        ops.push(
          Relation.make({
            fromId: entityId,
            relationTypeId: documentTypeRelationTypeId,
            toId: docTypeEntityId
          })
        );
      }
    }
  }
}

/**
 * Creates buyer relations
 * @param deedEntityIds Set of deed entity IDs
 * @param buyerNames Map of entity IDs to buyer names
 * @param buyerMap Map of buyer names to entity IDs
 * @param buyerRelationTypeId ID of the buyer relation type
 * @param ops Operations array to append to
 */
async function createBuyerRelations(
  deedEntityIds: Set<string>,
  buyerNames: Map<string, string>,
  buyerMap: Map<string, string>,
  buyerRelationTypeId: string,
  ops: Op[]
): Promise<void> {
  for (const entityId of deedEntityIds) {
    const buyerName = buyerNames.get(entityId);
    if (buyerName) {
      const buyerEntityId = buyerMap.get(buyerName);
      
      if (buyerEntityId) {
        ops.push(
          Relation.make({
            fromId: entityId,
            relationTypeId: buyerRelationTypeId,
            toId: buyerEntityId
          })
        );
      }
    }
  }
}

/**
 * Creates seller relations
 * @param deedEntityIds Set of deed entity IDs
 * @param sellerNames Map of entity IDs to seller names
 * @param sellerMap Map of seller names to entity IDs
 * @param sellerRelationTypeId ID of the seller relation type
 * @param ops Operations array to append to
 */
async function createSellerRelations(
  deedEntityIds: Set<string>,
  sellerNames: Map<string, string>,
  sellerMap: Map<string, string>,
  sellerRelationTypeId: string,
  ops: Op[]
): Promise<void> {
  for (const entityId of deedEntityIds) {
    const sellerName = sellerNames.get(entityId);
    if (sellerName) {
      const sellerEntityId = sellerMap.get(sellerName);
      
      if (sellerEntityId) {
        ops.push(
          Relation.make({
            fromId: entityId,
            relationTypeId: sellerRelationTypeId,
            toId: sellerEntityId
          })
        );
      }
    }
  }
}

/**
 * Updates property values if needed
 * @param ops Operations array to append to
 */
async function updatePropertyValues(ops: Op[]): Promise<void> {
  // Example: Update property description for a specific entity
  ops.push(
    Triple.make({
      entityId: "Vim2LNdNizbRW3moViwHeb", // Use actual entity ID from data
      attributeId: PROPERTY_DETAILS_ATTRIBUTE_ID,
      value: {
        type: "TEXT",
        value: "UNIT 108 OF SAND DOLLAR OF INDIAN SHORES CONDOMINIUM" // Corrected value
      }
    })
  );
  
  // Add more property updates as needed
}

// Run the update function
updateKnowledgeGraph().catch(console.error);
