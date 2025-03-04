import { readFileSync } from "fs";
import { parse } from "csv-parse/sync";
import { Graph, Relation } from "@graphprotocol/grc-20";
let permits = null;
let ops = null;
let isTransforming = false;
/**
 * Transforms permit CSV data into GRC-20 operations using a relationship-based approach.
 * Following guide from: https://www.npmjs.com/package/@graphprotocol/grc-20
 *
 * This implementation creates separate entities for record types and statuses,
 * and links permits to these entities through relations, creating a more
 * connected and queryable knowledge graph.
 *
 * @returns Array of operations for creating permit data
 */
export async function transformPermits() {
    if (isTransforming) {
        console.log('Already transforming, skipping...');
        return ops;
    }
    isTransforming = true;
    try {
        console.log('Starting permit transformation...');
        if (!permits) {
            console.log('Reading permits from CSV...');
            permits = readPermits();
            console.log(`Read ${permits.length} permits from CSV`);
            console.log('First permit:', JSON.stringify(permits[0], null, 2));
            console.log('Last permit:', JSON.stringify(permits[permits.length - 1], null, 2));
        }
        if (!ops) {
            console.log('\nCreating operations...');
            try {
                ops = [];
                // Create properties for permit fields
                const { id: recordNumberPropertyId, ops: recordNumberOps } = Graph.createProperty({
                    type: 'TEXT',
                    name: 'Record number'
                });
                ops.push(...recordNumberOps);
                const { id: descriptionPropertyId, ops: descriptionOps } = Graph.createProperty({
                    type: 'TEXT',
                    name: 'Description'
                });
                ops.push(...descriptionOps);
                const { id: addressPropertyId, ops: addressOps } = Graph.createProperty({
                    type: 'TEXT',
                    name: 'Address'
                });
                ops.push(...addressOps);
                const { id: projectNamePropertyId, ops: projectNameOps } = Graph.createProperty({
                    type: 'TEXT',
                    name: 'Project name'
                });
                ops.push(...projectNameOps);
                // Create entity types
                const { id: permitTypeId, ops: permitTypeOps } = Graph.createType({
                    name: 'Building permit',
                    properties: [
                        recordNumberPropertyId,
                        descriptionPropertyId,
                        addressPropertyId,
                        projectNamePropertyId
                    ]
                });
                ops.push(...permitTypeOps);
                // Create record type entity type
                const { id: recordTypeTypeId, ops: recordTypeTypeOps } = Graph.createType({
                    name: 'Record type',
                    properties: []
                });
                ops.push(...recordTypeTypeOps);
                // Create status entity type
                const { id: statusTypeId, ops: statusTypeOps } = Graph.createType({
                    name: 'Status',
                    properties: []
                });
                ops.push(...statusTypeOps);
                // Create relation types
                const { id: hasRecordTypeRelationTypeId, ops: hasRecordTypeRelationTypeOps } = Graph.createType({
                    name: 'Record type relation',
                    properties: []
                });
                ops.push(...hasRecordTypeRelationTypeOps);
                const { id: hasStatusRelationTypeId, ops: hasStatusRelationTypeOps } = Graph.createType({
                    name: 'Status relation',
                    properties: []
                });
                ops.push(...hasStatusRelationTypeOps);
                // Create record type entities
                console.log('Creating record type entities...');
                const recordTypeMap = new Map();
                const uniqueRecordTypes = [...new Set(permits.map(p => p.recordType))];
                for (const recordType of uniqueRecordTypes) {
                    if (!recordType)
                        continue;
                    const { id: recordTypeEntityId, ops: recordTypeEntityOps } = Graph.createEntity({
                        name: recordType,
                        types: [recordTypeTypeId],
                        properties: {},
                    });
                    ops.push(...recordTypeEntityOps);
                    recordTypeMap.set(recordType, recordTypeEntityId);
                }
                // Create status entities
                console.log('Creating status entities...');
                const statusMap = new Map();
                const uniqueStatuses = [...new Set(permits.map(p => p.status))];
                for (const status of uniqueStatuses) {
                    if (!status)
                        continue;
                    const { id: statusEntityId, ops: statusEntityOps } = Graph.createEntity({
                        name: status,
                        types: [statusTypeId],
                        properties: {},
                    });
                    ops.push(...statusEntityOps);
                    statusMap.set(status, statusEntityId);
                }
                // Create permit entities and store their IDs
                const permitEntities = [];
                for (const permit of permits) {
                    // Use a more meaningful name for the permit entity
                    const permitName = permit.description.length < 60 ?
                        permit.description : `Permit #${permit.recordNumber}`;
                    const { id: permitId, ops: permitOps } = Graph.createEntity({
                        name: permitName,
                        types: [permitTypeId],
                        properties: {
                            [recordNumberPropertyId]: {
                                type: 'TEXT',
                                value: permit.recordNumber,
                            },
                            [descriptionPropertyId]: {
                                type: 'TEXT',
                                value: permit.description,
                            },
                            [addressPropertyId]: {
                                type: 'TEXT',
                                value: permit.address,
                            },
                            [projectNamePropertyId]: {
                                type: 'TEXT',
                                value: permit.projectName,
                            },
                        },
                    });
                    ops.push(...permitOps);
                    // Create record type relation if record type exists
                    if (permit.recordType && recordTypeMap.has(permit.recordType)) {
                        const recordTypeRelationOp = Relation.make({
                            fromId: permitId,
                            relationTypeId: hasRecordTypeRelationTypeId,
                            toId: recordTypeMap.get(permit.recordType),
                        });
                        ops.push(recordTypeRelationOp);
                    }
                    // Create status relation if status exists
                    if (permit.status && statusMap.has(permit.status)) {
                        const statusRelationOp = Relation.make({
                            fromId: permitId,
                            relationTypeId: hasStatusRelationTypeId,
                            toId: statusMap.get(permit.status),
                        });
                        ops.push(statusRelationOp);
                    }
                    permitEntities.push({
                        id: permitId,
                        name: permitName,
                        recordNumber: permit.recordNumber,
                        description: permit.description,
                        recordType: permit.recordType,
                        address: permit.address,
                        projectName: permit.projectName,
                        status: permit.status
                    });
                }
                // Log the created entities with their IDs
                console.log('\nCreated permit entities:', {
                    count: permitEntities.length,
                    firstEntity: JSON.stringify(permitEntities[0], null, 2),
                    lastEntity: JSON.stringify(permitEntities[permitEntities.length - 1], null, 2),
                });
                // Save the entity IDs to a file for easy access
                try {
                    // Use the already imported fs module
                    const entityData = {
                        permitEntities: permitEntities.map(e => ({ id: e.id, name: e.name })),
                        recordTypeEntities: Array.from(recordTypeMap.entries()).map(([name, id]) => ({ id, name })),
                        statusEntities: Array.from(statusMap.entries()).map(([name, id]) => ({ id, name }))
                    };
                    // Make sure the data directory exists
                    try {
                        if (!fs.existsSync('data')) {
                            fs.mkdirSync('data');
                        }
                    }
                    catch (dirError) {
                        console.error('Error creating data directory:', dirError);
                    }
                    // Write the entity IDs to a file
                    fs.writeFileSync('data/current-entity-ids.json', JSON.stringify(entityData, null, 2));
                    console.log(`Saved entity IDs to data/current-entity-ids.json`);
                    // Also write to a file in the current directory for easier access
                    fs.writeFileSync('current-entity-ids.json', JSON.stringify(entityData, null, 2));
                    console.log(`Also saved entity IDs to current-entity-ids.json`);
                }
                catch (error) {
                    console.error('Failed to save entity IDs:', error);
                }
                console.log('\nTransformation complete:', {
                    totalPermits: permits.length,
                    totalOps: ops.length,
                    firstOp: JSON.stringify(ops[0], null, 2),
                    lastOp: JSON.stringify(ops[ops.length - 1], null, 2),
                });
            }
            catch (opsError) {
                console.error('Failed to create operations:', opsError);
                if (opsError instanceof Error) {
                    console.error('Error details:', {
                        name: opsError.name,
                        message: opsError.message,
                        stack: opsError.stack
                    });
                }
                throw opsError;
            }
        }
        return ops;
    }
    catch (error) {
        console.error('Permit transformation failed:', error);
        if (error instanceof Error) {
            console.error('Error details:', {
                name: error.name,
                message: error.message,
                stack: error.stack,
                cause: 'cause' in error ? error.cause : undefined,
            });
        }
        throw error;
    }
    finally {
        isTransforming = false;
    }
}
function readPermits() {
    try {
        console.log('Reading permits.csv...');
        const csvData = readFileSync('data/permits.csv', 'utf-8');
        console.log('CSV data loaded, parsing...');
        const records = parse(csvData, {
            columns: true,
            skip_empty_lines: true,
        });
        console.log(`Parsed ${records.length} records from CSV`);
        const permits = records.map((record) => ({
            recordNumber: record['Record Number'],
            description: record['Description'],
            recordType: record['Record Type'],
            address: record['Address'],
            projectName: record['Project Name'],
            status: record['Status'],
        }));
        console.log('CSV parsing complete:', {
            totalPermits: permits.length,
            firstPermit: JSON.stringify(permits[0], null, 2),
            lastPermit: JSON.stringify(permits[permits.length - 1], null, 2),
        });
        return permits;
    }
    catch (error) {
        console.error('Failed to read permits:', error);
        if (error instanceof Error) {
            console.error('Error details:', {
                name: error.name,
                message: error.message,
                stack: error.stack,
                cause: 'cause' in error ? error.cause : undefined,
            });
        }
        throw error;
    }
}
