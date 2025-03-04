import { readFileSync } from 'fs';
import { parse } from 'csv-parse/sync';
import { Graph, Triple } from '@graphprotocol/grc-20';
/**
 * Updates existing deed entities with data from GRC20_Deeds.csv
 */
export async function updateGRC20Deeds() {
    try {
        // Read and parse CSV from data directory
        const csvData = readFileSync('data/GRC20_Deeds.csv', 'utf-8');
        const records = parse(csvData, {
            columns: true,
            skip_empty_lines: true
        });
        if (!records.length) {
            throw new Error('No records found in GRC20_Deeds.csv');
        }
        // Read entity IDs from entity-ids.json
        const entityIdsData = readFileSync('data/entity-ids.json', 'utf-8');
        const entityIds = JSON.parse(entityIdsData);
        const ops = [];
        // Create properties for deed fields (these will be reused across entities)
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
        // Create deed type
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
        // Update existing entities with new property values
        console.log('Updating deed entities...');
        const updatedEntities = [];
        for (const record of records) {
            const instrumentNumber = record.InstrumentNumber;
            const entityId = entityIds[instrumentNumber];
            if (!entityId) {
                console.warn(`No entity ID found for instrument number ${instrumentNumber}`);
                continue;
            }
            // Update entity properties using Triple.make
            ops.push(Triple.make({
                entityId: entityId,
                attributeId: instrumentNumberId,
                value: {
                    type: 'TEXT',
                    value: record.InstrumentNumber
                }
            }));
            ops.push(Triple.make({
                entityId: entityId,
                attributeId: directNameId,
                value: {
                    type: 'TEXT',
                    value: record.DirectName
                }
            }));
            ops.push(Triple.make({
                entityId: entityId,
                attributeId: indirectNameId,
                value: {
                    type: 'TEXT',
                    value: record.IndirectName
                }
            }));
            ops.push(Triple.make({
                entityId: entityId,
                attributeId: recordDateId,
                value: {
                    type: 'TEXT',
                    value: record.RecordDate
                }
            }));
            ops.push(Triple.make({
                entityId: entityId,
                attributeId: bookTypeId,
                value: {
                    type: 'TEXT',
                    value: record.BookType
                }
            }));
            ops.push(Triple.make({
                entityId: entityId,
                attributeId: bookPageId,
                value: {
                    type: 'TEXT',
                    value: record.BookPage
                }
            }));
            ops.push(Triple.make({
                entityId: entityId,
                attributeId: legalDescriptionId,
                value: {
                    type: 'TEXT',
                    value: record.LegalDescription
                }
            }));
            ops.push(Triple.make({
                entityId: entityId,
                attributeId: docTypeId,
                value: {
                    type: 'TEXT',
                    value: record.DocTypeDescription
                }
            }));
            // Also add the entity to the deed type
            // Note: We'll skip this for now as 'ENTITY' type is not supported
            // We'll rely on the existing entity type associations
            updatedEntities.push({
                id: entityId,
                instrumentNumber: record.InstrumentNumber,
                directName: record.DirectName,
                indirectName: record.IndirectName,
                recordDate: record.RecordDate,
                bookType: record.BookType,
                bookPage: record.BookPage,
                legalDescription: record.LegalDescription,
                docType: record.DocTypeDescription
            });
        }
        // Log the updated entities
        console.log('\nUpdated deed entities:', {
            count: updatedEntities.length,
            firstEntity: updatedEntities.length > 0 ? JSON.stringify(updatedEntities[0], null, 2) : 'none',
            lastEntity: updatedEntities.length > 0 ? JSON.stringify(updatedEntities[updatedEntities.length - 1], null, 2) : 'none',
        });
        console.log(`Generated ${ops.length} operations to update ${updatedEntities.length} deed entities`);
        return ops;
    }
    catch (error) {
        console.error('Update failed:', error instanceof Error ? error.message : String(error));
        throw error;
    }
}
// Execute if running directly
if (import.meta.url === new URL(import.meta.url).href) {
    updateGRC20Deeds().catch(error => {
        console.error('Failed to update GRC20 deeds:', error);
        process.exit(1);
    });
}
