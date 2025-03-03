import { transformPermits } from './core/transformPermits.js';
import { writeFileSync } from 'fs';

/**
 * Test script to run the permit transformation with the new relationship-based model
 * and save the output to a file for inspection.
 */
async function testPermitRelations() {
  try {
    console.log('Starting permit transformation with relationship-based model...');
    
    const ops = await transformPermits();
    
    if (!ops) {
      console.error('No operations returned from transformation');
      return;
    }
    
    console.log(`Generated ${ops.length} operations`);
    
    // Save the operations to a file for inspection
    writeFileSync('data/permit-relations.json', JSON.stringify(ops, null, 2));
    
    console.log('Saved operations to data/permit-relations.json');
    
    // Count the different types of operations
    const opTypes = new Map<string, number>();
    for (const op of ops) {
      const type = op.type;
      opTypes.set(type, (opTypes.get(type) || 0) + 1);
    }
    
    console.log('Operation types:');
    for (const [type, count] of opTypes.entries()) {
      console.log(`  ${type}: ${count}`);
    }
    
    // Count relations by type
    const relationTypes = new Map<string, number>();
    for (const op of ops) {
      if (op.type === 'CREATE_RELATION') {
        const relationType = op.relation.type;
        relationTypes.set(relationType, (relationTypes.get(relationType) || 0) + 1);
      }
    }
    
    console.log('Relation types:');
    for (const [type, count] of relationTypes.entries()) {
      console.log(`  ${type}: ${count}`);
    }
    
  } catch (error) {
    console.error('Error running test:', error);
  }
}

// Run the test
testPermitRelations().catch(console.error);
