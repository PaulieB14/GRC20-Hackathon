# Comparison of Deed and Permit Entity Structures in GRC-20

This document compares the entity structures used for Deeds and Permits in the GRC-20 knowledge graph.

## Overview

Both Deeds and Permits have been implemented using the GRC-20 relationship-based structure, but with some differences in how entities and relations are organized.

## Deed Structure

### Entity Types
- **Deed**: Main entity type for deed records
- **Person**: Entity type for buyers and sellers
- **Document Type**: Entity type for different deed types (e.g., "WARRANTY DEED")

### Relation Types
- **Buyer**: Connects a deed to its buyer
- **Seller**: Connects a deed to its seller
- **Document Type Relation**: Connects a deed to its document type

### Properties
- Instrument Number
- Direct Name
- Indirect Name
- Record Date
- Book Type
- Book Page
- Legal Description
- Document Type

## Permit Structure

### Entity Types
- **Building Permit**: Main entity type for permit records
- **Record Type**: Entity type for different permit record types (e.g., "Residential Demolition")
- **Status**: Entity type for different permit statuses (e.g., "Awaiting Plans")

### Relation Types
- **Has Record Type**: Connects a permit to its record type
- **Has Status**: Connects a permit to its status

### Properties
- Record Number
- Description
- Address
- Project Name

## Key Similarities

1. **Entity-Relation Model**: Both use separate entities connected by relations rather than storing all information as properties on a single entity.

2. **Meaningful Entity Names**: Both use descriptive names for entities rather than just IDs.

3. **Separate Entity Types**: Both create separate entity types for different categories of data.

4. **Relation-Based Structure**: Both connect entities through typed relations that represent real-world relationships.

## Key Differences

1. **Status Entities**: Permits have a dedicated Status entity type, while Deeds do not typically track status changes.

2. **Record Type vs. Document Type**: Permits use Record Type entities, while Deeds use Document Type entities (similar concept, different domain terminology).

3. **Person Entities**: Deeds explicitly model Person entities for buyers and sellers, while Permits don't currently model people (though they could be added).

4. **Property Focus**: Deeds are focused on property ownership transfers, while Permits are focused on construction/modification activities.

## Implementation Approach

For both Deeds and Permits, the implementation:

1. Creates new entities for each unique value of certain fields (e.g., record types, statuses, document types)
2. Creates main entities (Deeds or Permits) with meaningful names
3. Connects these entities through typed relations
4. Stores basic information as properties on the entities

This approach creates a true knowledge graph where entities are connected through meaningful relations, enabling powerful queries and intuitive navigation.

## Publishing Process

Both use a similar publishing process:

1. Transform the source data into GRC-20 operations
2. Publish the operations to IPFS
3. Submit a transaction to the GRC-20 network

The main difference is in the specific transformation logic, which is tailored to the domain-specific data structures of Deeds and Permits.
