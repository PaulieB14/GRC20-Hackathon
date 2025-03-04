import { exec } from 'child_process';
import { promisify } from 'util';
import { Graph } from '@graphprotocol/grc-20';
const execPromise = promisify(exec);
async function updateKnowledgeGraph() {
    try {
        // Execute transformGRC20Deeds and capture console output
        const { stdout } = await execPromise('npx tsx src/transformGRC20Deeds.ts');
        // Parse the created deed entities from the log
        const entityLogPattern = /Created deed entities: \{[\s\S]*?\}/;
        const entityLogMatch = stdout.match(entityLogPattern);
        if (!entityLogMatch) {
            throw new Error('Could not find entity log in output');
        }
        const entityLog = entityLogMatch[0];
        const entities = [];
        const firstEntityPattern = /'firstEntity': '(\{[\s\S]*?\})',/;
        const firstEntityMatch = entityLog.match(firstEntityPattern);
        if (firstEntityMatch) {
            const firstEntity = JSON.parse(firstEntityMatch[1].replace(/'/g, '"'));
            entities.push(firstEntity);
        }
        const lastEntityPattern = /'lastEntity': '(\{[\s\S]*?\})',/;
        const lastEntityMatch = entityLog.match(lastEntityPattern);
        if (lastEntityMatch) {
            const lastEntity = JSON.parse(lastEntityMatch[1].replace(/'/g, '"'));
            entities.push(lastEntity);
        }
        console.log('Parsed deed entities:', entities);
        // Update the knowledge graph with the parsed entities
        const ops = [];
        for (const entity of entities) {
            const { id, instrumentNumber, recordDate, bookType, bookPage, legalDescription, docType } = entity;
            const ops = [];
            ops.push(...Graph.updateEntityProperty({
                id,
                name: 'Instrument Number',
                value: instrumentNumber,
                type: 'TEXT'
            }).ops);
            ops.push(...Graph.updateEntityProperty({
                id,
                name: 'Record Date',
                value: recordDate,
                type: 'TEXT'
            }).ops);
            ops.push(...Graph.updateEntityProperty({
                id,
                name: 'Book Type',
                value: bookType,
                type: 'TEXT'
            }).ops);
            ops.push(...Graph.updateEntityProperty({
                id,
                name: 'Book Page',
                value: bookPage,
                type: 'TEXT'
            }).ops);
            ops.push(...Graph.updateEntityProperty({
                id,
                name: 'Legal Description',
                value: legalDescription,
                type: 'TEXT'
            }).ops);
            ops.push(...Graph.updateEntityProperty({
                id,
                name: 'Document Type',
                value: docType,
                type: 'TEXT'
            }).ops);
            ops.push(...entityOps);
        }
        console.log(`Generated ${ops.length} operations to update knowledge graph`);
        // TODO: Submit operations to update knowledge graph
    }
    catch (error) {
        console.error('Failed to update knowledge graph:', error);
    }
}
updateKnowledgeGraph();
