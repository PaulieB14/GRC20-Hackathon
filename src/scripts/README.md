# GRC-20 Scripts

This directory contains scripts for working with GRC-20 spaces, entities, and triples.

## Available Scripts

### Main Scripts

- **check-and-update.js** - Check if spaces exist and update them with new entities
- **check-entity.ts** - Check if an entity exists in a space
- **check-spaces-exist.js** - Check if spaces exist
- **grc20-cli.ts** - Main CLI tool for working with GRC-20 spaces
- **list-entities.js** - List entities in a space
- **log-info.js** - Log information about spaces and entities
- **publish-deeds.ts** - Publish deeds to a space
- **publish-permits.ts** - Publish permits to a space
- **push-existing-entities.js** - Push existing entities from triples files to spaces using the SDK approach

### Usage Examples

#### Check and Update Spaces

```bash
# Check if spaces exist
node src/scripts/check-spaces-exist.js

# Check if spaces exist and update them with new entities
node src/scripts/check-and-update.js --update
```

#### List Entities

```bash
# List entities in a space
node src/scripts/list-entities.js

# List entities in a specific space
node src/scripts/list-entities.js --space SPACE_ID
```

#### Publish Data

```bash
# Publish deeds to a space
npx ts-node src/scripts/publish-deeds.ts

# Publish permits to a space
npx ts-node src/scripts/publish-permits.ts

# Push existing entities from triples files to spaces using the SDK approach
node src/scripts/push-existing-entities.js
```

#### Check Entities

```bash
# Check if an entity exists in a space
npx ts-node src/scripts/check-entity.ts --space SPACE_ID --entity ENTITY_ID
```

## Notes

- All scripts use the space IDs from the `.env` file by default
- You can specify a different space ID using the `--space` or `--space-id` parameter
- The `old-scripts` directory contains older versions of scripts that are no longer used
