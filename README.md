# Pinellas County GRC-20 Data Publisher

This project publishes Pinellas County permits and deed transfers data to GRC-20 spaces.

## Prerequisites

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables in `.env`:
```
PRIVATE_KEY=your_private_key
NETWORK=testnet
RPC_URL=https://eth-sepolia.g.alchemy.com/v2/demo
```

## Data Structure

### Permits Data
Located in `data/permits.csv`, contains building permits with fields:
- Date
- Record Type
- Record Number
- Status
- Address
- Project Name
- Expiration Date
- Description

### Deeds Data
Located in `data/deeds.csv`, contains property transfers with fields:
- DirectName (Seller)
- IndirectName (Buyer)
- RecordDate
- DocTypeDescription
- BookType
- BookPage
- Comments
- InstrumentNumber

## Deployed Spaces

The data is organized into two separate spaces:

1. Permits Space
   - Space ID: GRqhKJ3mYiM95MDGs7NH9V
   - Contains building permits and related data
   - Primary space for Pinellas County data

2. Deeds Space
   - Space ID: NubYWjA29aN3uXjEMMHXuB
   - Contains property transfer records
   - Complementary space for real estate transactions

## Publishing Data

After deploying the spaces, you can publish data using:

1. For permits:
```bash
npm run transform:permits
npm run publish
```

2. For deeds:
```bash
npm run transform:deeds
npm run publish
```

## Uploading Deed Documents

You can upload PDF documents for specific deed records and link them to the corresponding deed entity in the GRC-20 space.

### Upload a Single Deed Document

To upload a PDF document for a specific deed:

```bash
# Make sure the SPACE_ID is set to the deeds space in .env
# SPACE_ID=P77ioa8U9EipVASzVHBA9B

# Upload and publish the document
node dist/uploadDeedPdf.js <instrumentNumber> <filePath> --publish
```

For example, to upload a PDF document for the deed with instrument number 2025035398:

```bash
node dist/uploadDeedPdf.js 2025035398 /path/to/deed-document.pdf --publish
```

This will:
1. Upload the PDF to IPFS
2. Create a Document Link property for the deed
3. Publish the update to the GRC-20 space

After uploading, the document will be accessible via the IPFS URL in the deed entity's properties.

### Entity ID Synchronization

The entity IDs in the GRC-20 space may change if the data is republished. To ensure that the local deeds-triples.json file has the correct entity IDs, you have two options:

#### Option 1: Use the update-entity-ids.ts script (API-based)

```bash
# Update entity IDs in deeds-triples.json and permits-triples.json
node dist/update-entity-ids.js
```

This script will:
1. Try to fetch the current entity IDs from the GRC-20 API
2. Update the local triples files with the current entity IDs
3. If the API is not accessible, you can manually update the entity IDs in the triples files

#### Option 2: Use the capture-entity-ids.ts script (Browser-based)

```bash
# Install puppeteer if you haven't already
npm install puppeteer

# Capture entity IDs from the browser and update triples files
node dist/capture-entity-ids.js
```

This script will:
1. Launch a browser and navigate to the GRC-20 spaces
2. Scrape the entity IDs from the browser
3. Update the local triples files with the captured entity IDs

This is particularly useful after publishing data, when the entity IDs have changed. The script will:
- Visit each entity page in the browser
- Extract the entity ID and the corresponding identifier (instrument number or record number)
- Update the local triples files with the new entity IDs

For example, if you know that the entity ID for deed 2025035398 is "ERy6XnDt3nZuFFiGkfUdit", you can manually update the deeds-triples.json file to use this entity ID, or you can use one of these scripts to automate the process.

## Governance and Accepted Edits

This project includes functionality for governance acceptance of edits and republishing accepted edits.

### Accepting Edits via Governance

To mark an edit as accepted by governance:

```bash
# Using the shell script
./accept-edit.sh <CID>

# Or using npm script
npm run governance:accept <CID>
```

This creates a governance edit that marks the specified CID as accepted.

### Republishing Accepted Edits

To republish the latest accepted edit:

```bash
# Using the shell script
./republish-accepted.sh

# Or using npm script
npm run publish:accepted
```

This fetches the latest governance-accepted edit and publishes it to the blockchain.

## Data Organization

### Permits Space Structure
```
Permits (GRqhKJ3mYiM95MDGs7NH9V)
├── Record Number (unique identifier)
├── Status
├── Address
└── Project Details
    ├── Name
    ├── Description
    └── Dates
```

### Deeds Space Structure
```
Deeds (NubYWjA29aN3uXjEMMHXuB)
├── Instrument Number (unique identifier)
├── Property Details
│   ├── Book/Page
│   └── Description
└── Transaction Details
    ├── Seller (DirectName)
    ├── Buyer (IndirectName)
    └── Date
```

## Development

- Source code is in TypeScript
- Build with `npm run build`
- Run scripts with `bun run src/script-name.ts`

## Updating Property Values

You can update property values for existing entities without changing their entity IDs. Entity IDs remain stable across updates, as confirmed by the GRC-20 team:

> "For updates, you can set new triples with the same entity ID and the desired property ID to overwrite and that will replace the old value"

To update property values:

```bash
# First, identify the property ID you want to update
# Then, modify the updates array in src/update-property-values.ts with your values

# Build the project
npm run build

# Run the update script (dry run)
node dist/update-property-values.js

# Run the update script and publish the changes
node dist/update-property-values.js --publish
```

This script:
1. Reads the current entity IDs from deeds-triples.json
2. Creates update operations for the specified properties
3. Publishes the updates to IPFS and the blockchain
4. Preserves the original entity IDs

## Improved Data Model

An improved relation-based data model has been designed to create a more connected and queryable knowledge graph. This model:

1. Creates separate entities for buyers, sellers, document types, record types, and statuses
2. Connects these entities through relations rather than properties
3. Uses more meaningful entity names (e.g., "Deed for 123 Main Street" instead of just the instrument number)

See [IMPROVED_DATA_MODEL.md](IMPROVED_DATA_MODEL.md) for detailed documentation on:
- The improved data model design
- Required changes to implement it
- Impact on triples files
- Benefits of the new model
- Implementation steps and considerations

## Notes

- Make sure you have sufficient testnet ETH in your wallet
- The editor address is set to: 0x6596a3C7C2eA69D04F01F064AA4e914196BbA0a7
- All operations are performed on the Sepolia testnet
