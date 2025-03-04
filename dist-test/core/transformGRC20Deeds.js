import { readFileSync } from 'fs';
import { parse } from 'csv-parse/sync';
import { Graph } from '@graphprotocol/grc-20';
// Mapping of seller names to addresses
const addressMapping = {
    'WATERMAN WANETA DECEASED': '3461 10TH AVE N, ST PETERSBURG, FL 33713',
    'KIGER SUSAN DIANE': '4715 BAY ST NE APT 123, SAINT PETERSBURG, FL 33703',
    'CHRIST MARY J': '755 119TH AVE, TREASURE ISLAND, FL 33706',
    'RICCARDO JAMES C': '125 DOLPHIN DR S, OLDSMAR, FL 34677',
    'GARCIA DEBORAH NEELEY': '18500 GULF BOULEVARD, INDIAN SHORES, FL',
    'DENNARD BREHT K SR': '2326 MELROSE AVE S, ST. PETERSBURG, FL',
    'CHIRIBOGA FANNY MARTHA': '2818 55TH ST N, ST PETERSBURG, FL 33710',
    'BRITO JANET': '5136 52ND LN N, ST PETERSBURG, FL 33710',
    'LEONELLO MICHELE': '1900 59TH AVE N # 216, ST PETERSBURG, FL 33714'
};
/**
 * Transforms deeds CSV into a set of Graph operations using the GRC-20 SDK.
 * Creates properties, types, and entities for deed records.
 */
export async function transformDeeds() {
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
        // Create entities for each deed record
        console.log('Creating deed entities...');
        const deedEntities = [];
        for (const record of records) {
            const { id: deedId, ops: entityOps } = Graph.createEntity({
                name: record.InstrumentNumber, // Use instrument number as name
                types: [deedTypeId],
                properties: {
                    [instrumentNumberId]: {
                        type: 'TEXT',
                        value: record.InstrumentNumber,
                    },
                    [directNameId]: {
                        type: 'TEXT',
                        value: record.DirectName,
                    },
                    [indirectNameId]: {
                        type: 'TEXT',
                        value: record.IndirectName,
                    },
                    [recordDateId]: {
                        type: 'TEXT',
                        value: record.RecordDate,
                    },
                    [bookTypeId]: {
                        type: 'TEXT',
                        value: record.BookType,
                    },
                    [bookPageId]: {
                        type: 'TEXT',
                        value: record.BookPage,
                    },
                    [legalDescriptionId]: {
                        type: 'TEXT',
                        value: record.LegalDescription,
                    },
                    [docTypeId]: {
                        type: 'TEXT',
                        value: record.DocTypeDescription,
                    }
                },
            });
            ops.push(...entityOps);
            deedEntities.push({
                id: deedId,
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
        // Log the created entities
        console.log('\nCreated deed entities:', {
            count: deedEntities.length,
            firstEntity: deedEntities.length > 0 ? JSON.stringify(deedEntities[0], null, 2) : 'none',
            lastEntity: deedEntities.length > 0 ? JSON.stringify(deedEntities[deedEntities.length - 1], null, 2) : 'none',
        });
        console.log(`Transformed ${records.length} deeds into ${ops.length} operations`);
        return ops;
    }
    catch (error) {
        console.error('Transformation failed:', error instanceof Error ? error.message : String(error));
        throw error;
    }
}
// Execute if running directly
if (import.meta.url === new URL(import.meta.url).href) {
    transformDeeds().catch(error => {
        console.error('Failed to transform deeds:', error);
        process.exit(1);
    });
}
