# Viewing Published Data in GRC-20

This document provides instructions on how to view the property data published to GRC-20 spaces.

## Spaces

We have two spaces set up:

1. **Deeds Space**
   - Space ID: `P77ioa8U9EipVASzVHBA9B`
   - URL: https://geogenesis-git-feat-testnet-geo-browser.vercel.app/space/P77ioa8U9EipVASzVHBA9B

2. **Permits Space**
   - Space ID: `XPZ8fnf3DvNMRDbFgxEZi2`
   - URL: https://geogenesis-git-feat-testnet-geo-browser.vercel.app/space/XPZ8fnf3DvNMRDbFgxEZi2

## Viewing Entities

### Deeds

The deeds data is published to the Deeds Space. Each deed has a unique entity ID. Here are some example entity URLs:

- Deed 2025035356 (WATERMAN WANETA DECEASED to SWANK STAYS INC):
  https://geogenesis-git-feat-testnet-geo-browser.vercel.app/space/P77ioa8U9EipVASzVHBA9B/entity/HsviSN53psykkDCir7kvtJ

- Deed 2025035398 (LEONELLO MICHELE to CAYNE ALFRED):
  https://geogenesis-git-feat-testnet-geo-browser.vercel.app/space/P77ioa8U9EipVASzVHBA9B/entity/ERy6XnDt3nZuFFiGkfUdit

### Permits

The permits data is published to the Permits Space. Each permit has a unique entity ID. Here are some example entity URLs:

- Permit BR-DMO-25-00104 (Residential Demolition):
  https://geogenesis-git-feat-testnet-geo-browser.vercel.app/space/XPZ8fnf3DvNMRDbFgxEZi2/entity/UsdepoWa8vGmEuC2xn4j1f

- Permit BR-SOL-24-00780.001 (Residential Revision-Supplement):
  https://geogenesis-git-feat-testnet-geo-browser.vercel.app/space/XPZ8fnf3DvNMRDbFgxEZi2/entity/VfRjw4eaBvqiAqgA5JiPTN

## Data Structure

The data is structured according to the GRC-20 specification:

1. **Properties** define the attributes that entities can have
2. **Types** define the types of entities and which properties they can have
3. **Entities** are the actual data instances with their properties

### Deeds Structure

Each deed entity has the following properties:
- Instrument Number
- Seller
- Buyer
- Property Details
- Document Type
- Property Address

### Permits Structure

Each permit entity has the following properties:
- Record Number
- Description
- Record Type
- Address
- Project Name
- Status

## Republishing Data

If you need to republish the data, you can use the following commands:

### Deeds

```bash
# Set the space ID to the deeds space
echo 'SPACE_ID=P77ioa8U9EipVASzVHBA9B' >> .env

# Run the publish script
node dist/publish.js
```

## Uploading Deed Documents

You can upload PDF documents for specific deed records and link them to the corresponding deed entity. This allows you to attach the actual deed document to the record in the GRC-20 space.

### Upload a Single Deed Document

To upload a PDF document for a specific deed:

```bash
# Set the space ID to the deeds space
echo 'SPACE_ID=P77ioa8U9EipVASzVHBA9B' >> .env

# Upload and publish the document
node dist/uploadDeedPdf.js <instrumentNumber> <filePath> --publish
```

For example, to upload a PDF document for the deed with instrument number 2025035398 (LEONELLO MICHELE):

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

For example, if you know that the entity ID for deed 2025035398 (LEONELLO MICHELE) is "ERy6XnDt3nZuFFiGkfUdit", you can manually update the deeds-triples.json file to use this entity ID, or you can use one of these scripts to automate the process.

### Permits

```bash
# Set the space ID to the permits space
echo 'SPACE_ID=XPZ8fnf3DvNMRDbFgxEZi2' >> .env

# Run the publish script
node dist/publish.js
```

## Updating Property Values

You can update property values for existing entities without changing their entity IDs. Entity IDs remain stable across updates, as confirmed by the GRC-20 team:

> "For updates, you can set new triples with the same entity ID and the desired property ID to overwrite and that will replace the old value"

This means you can update properties like addresses without republishing all data:

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

For example, to update the property address for deed 2025035356:

1. Find the entity ID in deeds-triples.json or using the capture-entity-ids.js script
2. Find the property ID for "Property Address" in the GRC-20 browser
3. Update the values in src/update-property-values.ts
4. Run the script to publish the changes

The update will preserve the original entity ID while changing only the specified property value.

## Improved Data Model

An improved relation-based data model has been designed that would change how the data is structured in the GRC-20 spaces. This model:

1. Creates separate entities for buyers, sellers, document types, record types, and statuses
2. Connects these entities through relations rather than properties
3. Uses more meaningful entity names

If implemented, this would change how the data appears in the GRC-20 browser:
- Deed entities would be named "Deed for [Property Address]" instead of just the instrument number
- Permit entities would be named using the description (if concise) or "Permit #[Record Number]"
- You would be able to navigate between related entities (e.g., from a deed to its buyer or seller)

See [IMPROVED_DATA_MODEL.md](IMPROVED_DATA_MODEL.md) for detailed documentation on the improved data model.

## Notes

- The entity IDs are generated dynamically each time the data is published, so they will change if you republish the data.
- The URLs provided in this document are for the testnet environment.
