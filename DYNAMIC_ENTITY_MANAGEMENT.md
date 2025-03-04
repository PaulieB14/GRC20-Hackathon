# Dynamic Entity Management

This document describes the dynamic approach for managing entity IDs in the GRC20 space. The GRC20 space regenerates entities, making it difficult to keep track of them. This approach provides a more dynamic and automated way to handle entity updates.

## Overview

The dynamic entity management approach consists of the following components:

1. **Database-like Storage**: Entity IDs and their mappings are stored in JSON files.
2. **Programmatic ID Generation**: New entity IDs are generated programmatically using the crypto module.
3. **Logging and Auditing**: Changes to entity IDs are logged for debugging and tracking purposes.

## Files

### Data Files

- `data/property-addresses.json`: Maps instrument numbers to property addresses for deeds.
- `data/permit-addresses.json`: Maps record numbers to property addresses for permits.
- `data/entity-id-mapping.json`: Maps old entity IDs to new entity IDs for deeds.
- `data/permit-entity-id-mapping.json`: Maps old entity IDs to new entity IDs for permits.
- `data/entity-updates.log`: Logs changes to entity IDs for auditing purposes.

### Scripts

#### Deeds

- `update-deed-ids.js`: Updates deed entity IDs and adds property addresses.
- `capture-and-update-entity-ids.js`: Captures deed entity IDs from the GRC20 browser and updates the mapping file.
- `capture-and-update-entity-ids.sh`: Shell script to run the capture-and-update-entity-ids.js script.
- `publish-updated-deeds.sh`: Updates deed entity IDs and publishes to the knowledge graph.

#### Permits

- `update-permit-ids.js`: Updates permit entity IDs and adds property addresses.
- `capture-and-update-permit-entity-ids.js`: Captures permit entity IDs from the GRC20 browser and updates the mapping file.
- `capture-and-update-permit-entity-ids.sh`: Shell script to run the capture-and-update-permit-entity-ids.js script.
- `publish-updated-permits.sh`: Updates permit entity IDs and publishes to the knowledge graph.

## Workflow

### Initial Setup

1. Create the property address mapping files:
   - `data/property-addresses.json` for deeds
   - `data/permit-addresses.json` for permits

2. Create the entity ID mapping files:
   - `data/entity-id-mapping.json` for deeds
   - `data/permit-entity-id-mapping.json` for permits

### Updating Entities

#### Deeds

1. Run `./capture-and-update-entity-ids.sh` to capture deed entity IDs from the GRC20 browser and update the mapping file.
2. Run `./publish-updated-deeds.sh` to update deed entity IDs and publish to the knowledge graph.

#### Permits

1. Run `./capture-and-update-permit-entity-ids.sh` to capture permit entity IDs from the GRC20 browser and update the mapping file.
2. Run `./publish-updated-permits.sh` to update permit entity IDs and publish to the knowledge graph.

## Benefits

- **Resilience**: The system can handle entity regeneration by maintaining a mapping of old to new entity IDs.
- **Automation**: Entity IDs are captured and updated automatically, reducing manual intervention.
- **Traceability**: Changes to entity IDs are logged for auditing purposes.
- **Flexibility**: The approach can be extended to handle other types of entities.
