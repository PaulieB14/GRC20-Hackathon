# Improved Data Model Implementation Guide

This document outlines the changes needed to implement the improved relation-based data model for the Pinellas County GRC-20 Data Publisher.

## Overview of Changes

The improved data model transforms the current property-based approach to a relation-based approach, creating a more connected and queryable knowledge graph. This involves:

1. Creating separate entities for buyers, sellers, document types, record types, and statuses
2. Connecting these entities through relations rather than properties
3. Using more meaningful entity names

## Required Changes to Existing Files

### 1. transformDeeds.ts

Current approach:
```typescript
// Current approach: Storing buyer/seller as properties
const { id: deedId, ops: entityOps } = Graph.createEntity({
  name: record.InstrumentNumber,
  types: [deedTypeId],
  properties: {
    [instrumentNumberId]: {
      type: 'TEXT',
      value: record.InstrumentNumber,
    },
    [sellerId]: {
      type: 'TEXT',
      value: sellerName,
    },
    [buyerId]: {
      type: 'TEXT',
      value: record.IndirectName || '',
    },
    // Other properties...
  },
});
```

New approach:
```typescript
// Step 1: Create person entities for buyer and seller
const { id: sellerEntityId, ops: sellerOps } = createPersonEntity(personTypeId, sellerName);
ops.push(...sellerOps);

const { id: buyerEntityId, ops: buyerOps } = createPersonEntity(personTypeId, record.IndirectName || '');
ops.push(...buyerOps);

// Step 2: Get or create document type entity
let documentTypeId = documentTypeMap.get(record.DocTypeDescription || 'DEED');
if (!documentTypeId) {
  const { id, ops: docTypeOps } = Graph.createEntity({
    name: record.DocTypeDescription || 'DEED',
    types: [documentTypeTypeId],
    properties: {},
  });
  documentTypeId = id;
  ops.push(...docTypeOps);
  documentTypeMap.set(record.DocTypeDescription || 'DEED', id);
}

// Step 3: Create deed entity with relations
const { id: deedId, ops: deedOps } = createDeedEntityWithRelations(
  deedTypeId,
  record.InstrumentNumber,
  address,
  record.Comments || '',
  buyerRelationTypeId,
  buyerEntityId,
  sellerRelationTypeId,
  sellerEntityId,
  documentTypeRelationTypeId,
  documentTypeId,
  instrumentNumberId,
  propertyAddressId,
  propertyDetailsId
);
ops.push(...deedOps);
```

### 2. transformPermits.ts

Current approach:
```typescript
// Current approach: Storing record type and status as properties
const { id: permitId, ops: entityOps } = Graph.createEntity({
  name: record.RecordNumber,
  types: [permitTypeId],
  properties: {
    [recordNumberId]: {
      type: 'TEXT',
      value: record.RecordNumber,
    },
    [recordTypeId]: {
      type: 'TEXT',
      value: record.RecordType || '',
    },
    [statusId]: {
      type: 'TEXT',
      value: record.Status || '',
    },
    // Other properties...
  },
});
```

New approach:
```typescript
// Step 1: Get or create record type entity
let recordTypeEntityId = recordTypeMap.get(record.RecordType || '');
if (!recordTypeEntityId) {
  const { id, ops: recordTypeOps } = Graph.createEntity({
    name: record.RecordType || '',
    types: [recordTypeTypeId],
    properties: {},
  });
  recordTypeEntityId = id;
  ops.push(...recordTypeOps);
  recordTypeMap.set(record.RecordType || '', id);
}

// Step 2: Get or create status entity
let statusEntityId = statusMap.get(record.Status || '');
if (!statusEntityId) {
  const { id, ops: statusOps } = Graph.createEntity({
    name: record.Status || '',
    types: [statusTypeId],
    properties: {},
  });
  statusEntityId = id;
  ops.push(...statusOps);
  statusMap.set(record.Status || '', id);
}

// Step 3: Create permit entity with relations
const { id: permitId, ops: permitOps } = createPermitEntityWithRelations(
  permitTypeId,
  record.RecordNumber,
  record.Description || '',
  record.Address || '',
  record.ProjectName || '',
  recordTypeRelationTypeId,
  recordTypeEntityId,
  statusRelationTypeId,
  statusEntityId,
  recordNumberId,
  descriptionId,
  addressId,
  projectNameId
);
ops.push(...permitOps);
```

### 3. publish.ts

The publish.ts file would need to be updated to use the improved data model:

```typescript
// Import the improved data model functions
import {
  createBaseTypes,
  createDeedProperties,
  createPermitProperties,
  createDocumentTypeEntities,
  createRecordTypeEntities,
  createStatusEntities
} from './improved-data-model.js';

// In the transform function:
async function transformData(dataType: 'permits' | 'deeds'): Promise<Op[]> {
  const ops: Op[] = [];
  
  // Step 1: Create base types
  const {
    ops: baseTypeOps,
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
    statusRelationTypeId
  } = await createBaseTypes();
  ops.push(...baseTypeOps);
  
  if (dataType === 'deeds') {
    // Step 2: Create deed properties
    const {
      ops: deedPropsOps,
      instrumentNumberId,
      propertyDetailsId,
      propertyAddressId
    } = await createDeedProperties(deedTypeId);
    ops.push(...deedPropsOps);
    
    // Step 3: Create document type entities
    const {
      ops: docTypeOps,
      documentTypeMap
    } = await createDocumentTypeEntities(documentTypeTypeId);
    ops.push(...docTypeOps);
    
    // Step 4: Transform deeds data
    // ... (similar to transformDeeds.ts but using the improved model)
  } else {
    // Step 2: Create permit properties
    const {
      ops: permitPropsOps,
      recordNumberId,
      descriptionId,
      addressId,
      projectNameId
    } = await createPermitProperties(permitTypeId);
    ops.push(...permitPropsOps);
    
    // Step 3: Create record type and status entities
    const {
      ops: recordTypeOps,
      recordTypeMap
    } = await createRecordTypeEntities(recordTypeTypeId);
    ops.push(...recordTypeOps);
    
    const {
      ops: statusOps,
      statusMap
    } = await createStatusEntities(statusTypeId);
    ops.push(...statusOps);
    
    // Step 4: Transform permits data
    // ... (similar to transformPermits.ts but using the improved model)
  }
  
  return ops;
}
```

## Impact on Triples Files

When the improved data model is implemented and the transformation scripts are run, the triples files will contain:

1. **New Entity Types:**
   - Person entities for buyers and sellers
   - Document Type entities
   - Record Type entities
   - Status entities

2. **New Relation Types:**
   - Buyer relations
   - Seller relations
   - Document Type relations
   - Record Type relations
   - Status relations

3. **Changed Entity Names:**
   - Deed entities will be named "Deed for [Property Address]" instead of just the instrument number
   - Permit entities will be named using the description (if concise) or "Permit #[Record Number]"

4. **Different Structure:**
   - Instead of properties containing values like "JOHN DOE" for a buyer, there will be a relation to a Person entity with the name "JOHN DOE"
   - Instead of properties containing values like "WARRANTY DEED" for a document type, there will be a relation to a Document Type entity with the name "WARRANTY DEED"

## Benefits of the New Model

1. **Better Queryability:**
   - Find all deeds where a specific person is the buyer
   - Find all permits with a specific status
   - Find all deeds of a specific document type

2. **Richer Relationships:**
   - Relations can have their own properties (e.g., date when someone became a buyer)
   - Entities can be connected in multiple ways

3. **More Intuitive Navigation:**
   - Follow relationships between entities
   - Explore the knowledge graph more naturally

4. **Improved Data Organization:**
   - More meaningful entity names
   - Clearer separation of concerns

## Implementation Steps

1. Create the improved-data-model.ts file (already done)
2. Update transformDeeds.ts to use the improved model
3. Update transformPermits.ts to use the improved model
4. Update publish.ts to coordinate the transformation process
5. Run the transformation and publish the new data
6. Update the uploadDeedPdf.ts file to work with the new model

## Considerations

1. **Backward Compatibility:**
   - The new model is not backward compatible with the old one
   - Existing applications that expect the old structure will need to be updated

2. **Data Migration:**
   - Consider creating a migration script to convert existing data to the new model
   - Or start fresh with the new model and republish all data

3. **Performance:**
   - The new model creates more entities and relations
   - This may impact performance during transformation and querying

4. **Documentation:**
   - Update all documentation to reflect the new model
   - Provide examples of how to query the new structure
