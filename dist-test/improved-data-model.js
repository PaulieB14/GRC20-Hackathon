/**
 * Improved Data Model for Pinellas County GRC-20 Data
 *
 * This file outlines the improved data model for deeds and permits using a relation-based approach
 * rather than a property-based approach. This creates a more connected and queryable knowledge graph.
 */
import { Graph, Relation } from '@graphprotocol/grc-20';
/**
 * Creates the base types needed for the improved data model
 * @returns Array of operations and IDs for the created types
 */
export async function createBaseTypes() {
    const ops = [];
    // Create person type
    console.log('Creating person type...');
    const { id: personTypeId, ops: personTypeOps } = Graph.createType({
        name: 'Person',
        properties: [], // Will add properties later
    });
    ops.push(...personTypeOps);
    // Create deed type
    console.log('Creating deed type...');
    const { id: deedTypeId, ops: deedTypeOps } = Graph.createType({
        name: 'Deed',
        properties: [], // Will add properties later
    });
    ops.push(...deedTypeOps);
    // Create permit type
    console.log('Creating permit type...');
    const { id: permitTypeId, ops: permitTypeOps } = Graph.createType({
        name: 'Permit',
        properties: [], // Will add properties later
    });
    ops.push(...permitTypeOps);
    // Create document type type
    console.log('Creating document type type...');
    const { id: documentTypeTypeId, ops: documentTypeTypeOps } = Graph.createType({
        name: 'Document Type',
        properties: [], // Will add properties later
    });
    ops.push(...documentTypeTypeOps);
    // Create record type type
    console.log('Creating record type type...');
    const { id: recordTypeTypeId, ops: recordTypeTypeOps } = Graph.createType({
        name: 'Record type',
        properties: [], // Will add properties later
    });
    ops.push(...recordTypeTypeOps);
    // Create status type
    console.log('Creating status type...');
    const { id: statusTypeId, ops: statusTypeOps } = Graph.createType({
        name: 'Status',
        properties: [], // Will add properties later
    });
    ops.push(...statusTypeOps);
    // Create relation types
    console.log('Creating relation types...');
    // Buyer relation type
    const { id: buyerRelationTypeId, ops: buyerRelationTypeOps } = Graph.createType({
        name: 'Buyer',
        properties: [], // Will add properties later
    });
    ops.push(...buyerRelationTypeOps);
    // Seller relation type
    const { id: sellerRelationTypeId, ops: sellerRelationTypeOps } = Graph.createType({
        name: 'Seller',
        properties: [], // Will add properties later
    });
    ops.push(...sellerRelationTypeOps);
    // Document type relation type
    const { id: documentTypeRelationTypeId, ops: documentTypeRelationTypeOps } = Graph.createType({
        name: 'Document Type Relation',
        properties: [], // Will add properties later
    });
    ops.push(...documentTypeRelationTypeOps);
    // Record type relation type
    const { id: recordTypeRelationTypeId, ops: recordTypeRelationTypeOps } = Graph.createType({
        name: 'Record type relation',
        properties: [], // Will add properties later
    });
    ops.push(...recordTypeRelationTypeOps);
    // Status relation type
    const { id: statusRelationTypeId, ops: statusRelationTypeOps } = Graph.createType({
        name: 'Status relation',
        properties: [], // Will add properties later
    });
    ops.push(...statusRelationTypeOps);
    return {
        ops,
        personTypeId,
        deedTypeId,
        permitTypeId,
        documentTypeTypeId,
        recordTypeTypeId,
        statusTypeId,
        buyerRelationTypeId,
        sellerRelationTypeId,
        documentTypeRelationTypeId,
        recordTypeRelationTypeId,
        statusRelationTypeId,
    };
}
/**
 * Creates properties for the deed type
 * @param deedTypeId The ID of the deed type
 * @returns Array of operations and IDs for the created properties
 */
export async function createDeedProperties(deedTypeId) {
    const ops = [];
    // Create properties for deed fields
    console.log('Creating deed properties...');
    const { id: instrumentNumberId, ops: instrumentNumberOps } = Graph.createProperty({
        name: 'Instrument Number',
        type: 'TEXT',
    });
    ops.push(...instrumentNumberOps);
    const { id: propertyDetailsId, ops: propertyDetailsOps } = Graph.createProperty({
        name: 'Property Details',
        type: 'TEXT',
    });
    ops.push(...propertyDetailsOps);
    const { id: propertyAddressId, ops: propertyAddressOps } = Graph.createProperty({
        name: 'Property Address',
        type: 'TEXT',
    });
    ops.push(...propertyAddressOps);
    // Update deed type to include properties
    console.log('Updating deed type with properties...');
    // Note: The Graph SDK doesn't support updating types directly
    // In a real implementation, you would need to create a new type and update all entities
    // For simplicity, we'll just create a new type with the same name
    const { ops: updateDeedTypeOps } = Graph.createType({
        name: 'Deed',
        properties: [
            instrumentNumberId,
            propertyDetailsId,
            propertyAddressId,
        ],
    });
    ops.push(...updateDeedTypeOps);
    return {
        ops,
        instrumentNumberId,
        propertyDetailsId,
        propertyAddressId,
    };
}
/**
 * Creates properties for the permit type
 * @param permitTypeId The ID of the permit type
 * @returns Array of operations and IDs for the created properties
 */
export async function createPermitProperties(permitTypeId) {
    const ops = [];
    // Create properties for permit fields
    console.log('Creating permit properties...');
    const { id: recordNumberId, ops: recordNumberOps } = Graph.createProperty({
        name: 'Record Number',
        type: 'TEXT',
    });
    ops.push(...recordNumberOps);
    const { id: descriptionId, ops: descriptionOps } = Graph.createProperty({
        name: 'Description',
        type: 'TEXT',
    });
    ops.push(...descriptionOps);
    const { id: addressId, ops: addressOps } = Graph.createProperty({
        name: 'Address',
        type: 'TEXT',
    });
    ops.push(...addressOps);
    const { id: projectNameId, ops: projectNameOps } = Graph.createProperty({
        name: 'Project Name',
        type: 'TEXT',
    });
    ops.push(...projectNameOps);
    // Update permit type to include properties
    console.log('Updating permit type with properties...');
    // Note: The Graph SDK doesn't support updating types directly
    // In a real implementation, you would need to create a new type and update all entities
    // For simplicity, we'll just create a new type with the same name
    const { ops: updatePermitTypeOps } = Graph.createType({
        name: 'Permit',
        properties: [
            recordNumberId,
            descriptionId,
            addressId,
            projectNameId,
        ],
    });
    ops.push(...updatePermitTypeOps);
    return {
        ops,
        recordNumberId,
        descriptionId,
        addressId,
        projectNameId,
    };
}
/**
 * Creates document type entities
 * @param documentTypeTypeId The ID of the document type type
 * @returns Array of operations and a map of document type names to entity IDs
 */
export async function createDocumentTypeEntities(documentTypeTypeId) {
    const ops = [];
    const documentTypeMap = new Map();
    // Create document type entities
    console.log('Creating document type entities...');
    const documentTypes = [
        'DEED',
        'WARRANTY DEED',
        'QUIT CLAIM DEED',
        'SPECIAL WARRANTY DEED',
        'TRUSTEE DEED',
    ];
    for (const documentType of documentTypes) {
        const { id: entityId, ops: entityOps } = Graph.createEntity({
            name: documentType,
            types: [documentTypeTypeId],
            properties: {},
        });
        ops.push(...entityOps);
        documentTypeMap.set(documentType, entityId);
    }
    return {
        ops,
        documentTypeMap,
    };
}
/**
 * Creates record type entities
 * @param recordTypeTypeId The ID of the record type type
 * @returns Array of operations and a map of record type names to entity IDs
 */
export async function createRecordTypeEntities(recordTypeTypeId) {
    const ops = [];
    const recordTypeMap = new Map();
    // Create record type entities
    console.log('Creating record type entities...');
    const recordTypes = [
        'Building',
        'Electrical',
        'Plumbing',
        'Mechanical',
        'Residential',
        'Commercial',
        'Demolition',
        'Revision-Supplement',
    ];
    for (const recordType of recordTypes) {
        const { id: entityId, ops: entityOps } = Graph.createEntity({
            name: recordType,
            types: [recordTypeTypeId],
            properties: {},
        });
        ops.push(...entityOps);
        recordTypeMap.set(recordType, entityId);
    }
    return {
        ops,
        recordTypeMap,
    };
}
/**
 * Creates status entities
 * @param statusTypeId The ID of the status type
 * @returns Array of operations and a map of status names to entity IDs
 */
export async function createStatusEntities(statusTypeId) {
    const ops = [];
    const statusMap = new Map();
    // Create status entities
    console.log('Creating status entities...');
    const statuses = [
        'Active',
        'Completed',
        'Expired',
        'Issued',
        'Pending',
        'Rejected',
        'Revoked',
        'Void',
    ];
    for (const status of statuses) {
        const { id: entityId, ops: entityOps } = Graph.createEntity({
            name: status,
            types: [statusTypeId],
            properties: {},
        });
        ops.push(...entityOps);
        statusMap.set(status, entityId);
    }
    return {
        ops,
        statusMap,
    };
}
/**
 * Creates a person entity
 * @param personTypeId The ID of the person type
 * @param name The name of the person
 * @returns The ID of the created entity and the operations
 */
export function createPersonEntity(personTypeId, name) {
    return Graph.createEntity({
        name,
        types: [personTypeId],
        properties: {},
    });
}
/**
 * Creates a deed entity with relations
 * @param deedTypeId The ID of the deed type
 * @param instrumentNumber The instrument number of the deed
 * @param propertyAddress The property address
 * @param propertyDetails The property details
 * @param buyerRelationTypeId The ID of the buyer relation type
 * @param buyerId The ID of the buyer entity
 * @param sellerRelationTypeId The ID of the seller relation type
 * @param sellerId The ID of the seller entity
 * @param documentTypeRelationTypeId The ID of the document type relation type
 * @param documentTypeId The ID of the document type entity
 * @param instrumentNumberId The ID of the instrument number property
 * @param propertyAddressId The ID of the property address property
 * @param propertyDetailsId The ID of the property details property
 * @returns Array of operations for creating the deed entity and its relations
 */
export function createDeedEntityWithRelations(deedTypeId, instrumentNumber, propertyAddress, propertyDetails, buyerRelationTypeId, buyerId, sellerRelationTypeId, sellerId, documentTypeRelationTypeId, documentTypeId, instrumentNumberId, propertyAddressId, propertyDetailsId) {
    const ops = [];
    // Create deed entity
    const { id: deedId, ops: deedOps } = Graph.createEntity({
        name: `Deed for ${propertyAddress}`,
        types: [deedTypeId],
        properties: {
            [instrumentNumberId]: {
                type: 'TEXT',
                value: instrumentNumber,
            },
            [propertyAddressId]: {
                type: 'TEXT',
                value: propertyAddress,
            },
            [propertyDetailsId]: {
                type: 'TEXT',
                value: propertyDetails,
            },
        },
    });
    ops.push(...deedOps);
    // Create buyer relation
    const buyerRelationOp = Relation.make({
        fromId: deedId,
        relationTypeId: buyerRelationTypeId,
        toId: buyerId,
    });
    ops.push(buyerRelationOp);
    // Create seller relation
    const sellerRelationOp = Relation.make({
        fromId: deedId,
        relationTypeId: sellerRelationTypeId,
        toId: sellerId,
    });
    ops.push(sellerRelationOp);
    // Create document type relation
    const documentTypeRelationOp = Relation.make({
        fromId: deedId,
        relationTypeId: documentTypeRelationTypeId,
        toId: documentTypeId,
    });
    ops.push(documentTypeRelationOp);
    return {
        id: deedId,
        ops,
    };
}
/**
 * Creates a permit entity with relations
 * @param permitTypeId The ID of the permit type
 * @param recordNumber The record number of the permit
 * @param description The description of the permit
 * @param address The address of the permit
 * @param projectName The project name of the permit
 * @param recordTypeRelationTypeId The ID of the record type relation type
 * @param recordTypeId The ID of the record type entity
 * @param statusRelationTypeId The ID of the status relation type
 * @param statusId The ID of the status entity
 * @param recordNumberId The ID of the record number property
 * @param descriptionId The ID of the description property
 * @param addressId The ID of the address property
 * @param projectNameId The ID of the project name property
 * @returns Array of operations for creating the permit entity and its relations
 */
export function createPermitEntityWithRelations(permitTypeId, recordNumber, description, address, projectName, recordTypeRelationTypeId, recordTypeId, statusRelationTypeId, statusId, recordNumberId, descriptionId, addressId, projectNameId) {
    const ops = [];
    // Create permit entity with a name based on description if it's concise
    const permitName = description.length < 60 ? description : `Permit #${recordNumber}`;
    const { id: permitId, ops: permitOps } = Graph.createEntity({
        name: permitName,
        types: [permitTypeId],
        properties: {
            [recordNumberId]: {
                type: 'TEXT',
                value: recordNumber,
            },
            [descriptionId]: {
                type: 'TEXT',
                value: description,
            },
            [addressId]: {
                type: 'TEXT',
                value: address,
            },
            [projectNameId]: {
                type: 'TEXT',
                value: projectName,
            },
        },
    });
    ops.push(...permitOps);
    // Create record type relation
    const recordTypeRelationOp = Relation.make({
        fromId: permitId,
        relationTypeId: recordTypeRelationTypeId,
        toId: recordTypeId,
    });
    ops.push(recordTypeRelationOp);
    // Create status relation
    const statusRelationOp = Relation.make({
        fromId: permitId,
        relationTypeId: statusRelationTypeId,
        toId: statusId,
    });
    ops.push(statusRelationOp);
    return {
        id: permitId,
        ops,
    };
}
