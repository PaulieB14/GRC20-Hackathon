import { Graph, type Op } from "@graphprotocol/grc-20";
import { publish } from "./publish.js";
import { wallet } from "./wallet.js";

const PERMITS_SPACE_ID = '7gzF671tq5JTZ13naG4tnr';
const DEEDS_SPACE_ID = '7gzF671tq5JTZ13naG4tnr';

async function setupOntology() {
  try {
    const ops: Op[] = [];

    // Create Building Permit Type and its properties
    console.log('Creating Building Permit properties...');
    
    const { id: idPropertyId, ops: idOps } = Graph.createProperty({
      name: 'ID',
      type: 'TEXT',
      description: 'Unique identifier',
    });
    ops.push(...idOps);

    const { id: datePropertyId, ops: dateOps } = Graph.createProperty({
      name: 'Date',
      type: 'TIME',
      description: 'Date of issuance',
    });
    ops.push(...dateOps);

    const { id: addressPropertyId, ops: addressOps } = Graph.createProperty({
      name: 'Address',
      type: 'TEXT',
      description: 'Physical address',
    });
    ops.push(...addressOps);

    const { id: permitTypePropertyId, ops: permitTypeOps } = Graph.createProperty({
      name: 'Permit Type',
      type: 'TEXT',
      description: 'Type of building permit',
    });
    ops.push(...permitTypeOps);

    const { id: statusPropertyId, ops: statusOps } = Graph.createProperty({
      name: 'Status',
      type: 'TEXT',
      description: 'Current status of the permit',
    });
    ops.push(...statusOps);

    console.log('Creating Building Permit type...');
    const { id: permitTypeId, ops: permitTypeEntityOps } = Graph.createType({
      name: 'Building Permit',
      description: 'A permit issued for construction or modification of a building',
      properties: [
        idPropertyId,
        datePropertyId,
        addressPropertyId,
        permitTypePropertyId,
        statusPropertyId,
      ],
    });
    ops.push(...permitTypeEntityOps);

    // Create Property Deed Type and its properties
    console.log('Creating Property Deed properties...');
    
    const { id: grantorPropertyId, ops: grantorOps } = Graph.createProperty({
      name: 'Grantor',
      type: 'TEXT',
      description: 'Person transferring the property',
    });
    ops.push(...grantorOps);

    const { id: granteePropertyId, ops: granteeOps } = Graph.createProperty({
      name: 'Grantee',
      type: 'TEXT',
      description: 'Person receiving the property',
    });
    ops.push(...granteeOps);

    const { id: saleAmountPropertyId, ops: saleAmountOps } = Graph.createProperty({
      name: 'Sale Amount',
      type: 'NUMBER',
      description: 'Amount of the property sale',
    });
    ops.push(...saleAmountOps);

    console.log('Creating Property Deed type...');
    const { id: deedTypeId, ops: deedTypeEntityOps } = Graph.createType({
      name: 'Property Deed',
      description: 'A legal document proving ownership of a property',
      properties: [
        idPropertyId,
        datePropertyId,
        addressPropertyId,
        grantorPropertyId,
        granteePropertyId,
        saleAmountPropertyId,
      ],
    });
    ops.push(...deedTypeEntityOps);

    // Publish to both spaces
    console.log('Publishing ontology to GRC-20...');
    const editName = 'Setup Pinellas County Ontology';
    
    if (!wallet?.account?.address) {
      throw new Error('Wallet not initialized or address missing');
    }

    // First publish to permits space
    console.log('Publishing to permits space...');
    await publish({
      spaceId: PERMITS_SPACE_ID,
      editName,
      author: wallet.account.address,
      ops,
    });

    // Then publish to deeds space
    console.log('Publishing to deeds space...');
    await publish({
      spaceId: DEEDS_SPACE_ID,
      editName,
      author: wallet.account.address,
      ops,
    });
    
    console.log('Ontology setup completed');
    
    return {
      types: {
        permitType: permitTypeId,
        deedType: deedTypeId,
      },
      properties: {
        id: idPropertyId,
        date: datePropertyId,
        address: addressPropertyId,
        permitType: permitTypePropertyId,
        status: statusPropertyId,
        grantor: grantorPropertyId,
        grantee: granteePropertyId,
        saleAmount: saleAmountPropertyId,
      },
    };
  } catch (error) {
    console.error('Failed to setup ontology:', error);
    throw error;
  }
}

// Execute if running directly
if (import.meta.url === new URL(import.meta.url).href) {
  setupOntology()
    .then((result) => {
      console.log('Setup completed. Generated IDs:', result);
      process.exit(0);
    })
    .catch(error => {
      console.error('Setup failed:', error);
      process.exit(1);
    });
}
