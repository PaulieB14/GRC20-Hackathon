# Building Permit Relationship-Based Structure

This document outlines the relationship-based structure implemented for building permits in the GRC-20 knowledge graph.

## Overview

The relationship-based structure creates a more connected and queryable knowledge graph by:

1. Creating separate entities for record types and statuses
2. Connecting permits to these entities through relations
3. Using more meaningful entity names

## Entity Types

### Building Permit
- The main entity type for permits
- Contains properties:
  - Record Number
  - Description
  - Address
  - Project Name

### Record Type
- Entity type for different permit record types
- Examples: "Residential Demolition", "Commercial Electrical", "Express Building Permit"

### Status
- Entity type for different permit statuses
- Examples: "Awaiting Plans", "Issued", "In Review", "Closed - Withdrawn"

## Relation Types

### Has Record Type
- Connects a permit to its record type
- Direction: Permit → Record Type

### Has Status
- Connects a permit to its status
- Direction: Permit → Status

## Implementation Details

The implementation creates:

1. Entities for each unique record type found in the permits data
2. Entities for each unique status found in the permits data
3. Permit entities with meaningful names (using description when concise)
4. Relations connecting permits to their respective record types and statuses

## Benefits

1. **Better Queryability**
   - Find all permits with a specific status (e.g., all "Awaiting Plans" permits)
   - Find all permits of a specific record type (e.g., all "Residential Demolition" permits)

2. **Richer Relationships**
   - The structure represents the true relationships between entities
   - Relations can have their own properties (e.g., date when a status changed)

3. **More Intuitive Navigation**
   - Follow relationships between entities
   - The knowledge graph is more naturally structured

4. **Improved Data Organization**
   - More meaningful entity names make the data more understandable
   - Clearer separation of concerns with dedicated entity types

## Example Queries

With this structure, you can perform queries like:

- Find all permits with status "Awaiting Plans"
- Find all "Residential Demolition" permits
- Find all permits at a specific address
- Find all permits with a specific record type and status

## Publishing to GRC-20

The implementation includes:

1. `transformPermits.ts` - Transforms permit data into the relationship-based structure
2. `publish-grc20-permits.ts` - Publishes the transformed data to GRC-20
3. `publish-grc20-permits-simple.sh` - Shell script to run the publication process

To publish the permits with the relationship-based structure to GRC-20:

```bash
./publish-grc20-permits-simple.sh
```

This simplified script:
1. Creates a dist-test directory
2. Compiles only the necessary files (transformPermits.ts and publish-grc20-permits.ts)
3. Runs the publication script

The result will be new entities for record types and statuses, connected to permit entities through relations, creating a true knowledge graph.
