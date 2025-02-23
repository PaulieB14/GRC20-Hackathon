import { Id, SystemIds, Triple, Relation, type Op, type ValueType } from "@graphprotocol/grc-20";
import { wallet } from "./wallet.js";

const PERMITS_SPACE_ID = '7gzF671tq5JTZ13naG4tnr';
const DEEDS_SPACE_ID = '7gzF671tq5JTZ13naG4tnr';

type PublishOptions = {
  spaceId: string;
  editName: string;
  ops: Op[];
};

async function publish(options: PublishOptions) {
  console.log('Publishing edit:', options.editName);
  console.log('Operations:', JSON.stringify(options.ops, null, 2));

  // Get the transaction data
  console.log('Getting transaction data...');
  const result = await fetch(`https://rpc-geo-test-zc16z3tcvf.t.conduit.xyz/`, {
    method: "POST",
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "geo_edit",
      params: [{
        spaceId: options.spaceId,
        name: options.editName,
        ops: options.ops,
        timestamp: Date.now(),
        editor: wallet.account.address
      }]
    }),
  });

  if (!result.ok) {
    const errorText = await result.text();
    throw new Error(`Failed to get transaction data: ${errorText}`);
  }

  const { result: { to, data } } = await result.json();
  console.log('Got transaction data:', { to, data });

  console.log('Sending transaction...');
  const tx = await wallet.sendTransaction({
    to: to as `0x${string}`,
    value: 0n,
    data: data as `0x${string}`,
  });
  console.log('Transaction sent:', tx);

  return tx;
}

// Helper functions for creating types and properties
function createType(name: string, description: string | null = null, typeOfId: string | null = null): [Op[], string] {
  const typeId = Id.generate();
  const ops: Op[] = [];

  // Add name
  ops.push({
    type: 'SET_TRIPLE',
    triple: {
      entity: typeId,
      attribute: SystemIds.NAME_ATTRIBUTE,
      value: {
        type: 'TEXT' as ValueType,
        value: name
      }
    }
  });

  // Add description if provided
  if (description) {
    ops.push({
      type: 'SET_TRIPLE',
      triple: {
        entity: typeId,
        attribute: SystemIds.DESCRIPTION_ATTRIBUTE,
        value: {
          type: 'TEXT' as ValueType,
          value: description
        }
      }
    });
  }

  // Set type relation
  ops.push({
    type: 'SET_TRIPLE',
    triple: {
      entity: typeId,
      attribute: SystemIds.TYPES_ATTRIBUTE,
      value: {
        type: 'TEXT' as ValueType,
        value: typeOfId || SystemIds.TYPES_ATTRIBUTE // Use as base type
      }
    }
  });

  return [ops, typeId];
}

function createProperty(name: string, valueType: string, description: string | null = null, propertyOfId: string | null = null): [Op[], string] {
  const propertyId = Id.generate();
  const ops: Op[] = [];

  // Add name
  ops.push({
    type: 'SET_TRIPLE',
    triple: {
      entity: propertyId,
      attribute: SystemIds.NAME_ATTRIBUTE,
      value: {
        type: 'TEXT' as ValueType,
        value: name
      }
    }
  });

  // Add description if provided
  if (description) {
    ops.push({
      type: 'SET_TRIPLE',
      triple: {
        entity: propertyId,
        attribute: SystemIds.DESCRIPTION_ATTRIBUTE,
        value: {
          type: 'TEXT' as ValueType,
          value: description
        }
      }
    });
  }

  // Set value type
  ops.push({
    type: 'SET_TRIPLE',
    triple: {
      entity: propertyId,
      attribute: SystemIds.VALUE_TYPE_ATTRIBUTE,
      value: {
        type: 'TEXT' as ValueType,
        value: valueType.toUpperCase()
      }
    }
  });

  // Set property relation
  if (propertyOfId) {
    ops.push({
      type: 'SET_TRIPLE',
      triple: {
        entity: propertyId,
        attribute: SystemIds.TYPES_ATTRIBUTE,
        value: {
          type: 'TEXT' as ValueType,
          value: propertyOfId
        }
      }
    });
  }

  return [ops, propertyId];
}

async function setupOntology() {
  try {
    const allOps: Op[] = [];

    // Create Building Permit Type
    console.log('Creating Building Permit Type...');
    const [permitTypeOps, permitTypeId] = createType(
      'Building Permit',
      'A permit issued for construction or modification of a building'
    );
    allOps.push(...permitTypeOps);

    // Create Property Deed Type
    console.log('Creating Property Deed Type...');
    const [deedTypeOps, deedTypeId] = createType(
      'Property Deed',
      'A legal document proving ownership of a property'
    );
    allOps.push(...deedTypeOps);

    // Create common properties
    console.log('Creating common properties...');
    
    // ID Property
    const [idPropOps, idPropId] = createProperty(
      'ID',
      'TEXT',
      'Unique identifier',
      permitTypeId
    );
    allOps.push(...idPropOps);

    // Date Property
    const [datePropOps, datePropId] = createProperty(
      'Date',
      'DATE',
      'Date of issuance',
      permitTypeId
    );
    allOps.push(...datePropOps);

    // Address Property
    const [addressPropOps, addressPropId] = createProperty(
      'Address',
      'TEXT',
      'Physical address',
      permitTypeId
    );
    allOps.push(...addressPropOps);

    // Create permit-specific properties
    console.log('Creating permit-specific properties...');
    
    // Permit Type Property
    const [permitTypePropOps, permitTypePropId] = createProperty(
      'Permit Type',
      'TEXT',
      'Type of building permit',
      permitTypeId
    );
    allOps.push(...permitTypePropOps);

    // Status Property
    const [statusPropOps, statusPropId] = createProperty(
      'Status',
      'TEXT',
      'Current status of the permit',
      permitTypeId
    );
    allOps.push(...statusPropOps);

    // Create deed-specific properties
    console.log('Creating deed-specific properties...');
    
    // Grantor Property
    const [grantorPropOps, grantorPropId] = createProperty(
      'Grantor',
      'TEXT',
      'Person transferring the property',
      deedTypeId
    );
    allOps.push(...grantorPropOps);

    // Grantee Property
    const [granteePropOps, granteePropId] = createProperty(
      'Grantee',
      'TEXT',
      'Person receiving the property',
      deedTypeId
    );
    allOps.push(...granteePropOps);

    // Sale Amount Property
    const [salePropOps, salePropId] = createProperty(
      'Sale Amount',
      'NUMBER',
      'Amount of the property sale',
      deedTypeId
    );
    allOps.push(...salePropOps);

    console.log('Publishing ontology to GRC-20...');
    const editName = 'Setup Pinellas County Ontology';
    
    // First publish to permits space
    console.log('Publishing to permits space...');
    await publish({
      spaceId: PERMITS_SPACE_ID,
      editName,
      ops: allOps
    });

    // Then publish to deeds space
    console.log('Publishing to deeds space...');
    await publish({
      spaceId: DEEDS_SPACE_ID,
      editName,
      ops: allOps
    });
    
    console.log('Ontology setup completed');
    
    return {
      types: {
        permitType: permitTypeId,
        deedType: deedTypeId
      },
      properties: {
        id: idPropId,
        date: datePropId,
        address: addressPropId,
        permitType: permitTypePropId,
        status: statusPropId,
        grantor: grantorPropId,
        grantee: granteePropId,
        saleAmount: salePropId
      }
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
