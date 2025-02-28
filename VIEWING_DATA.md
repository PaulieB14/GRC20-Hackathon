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

### Permits

```bash
# Set the space ID to the permits space
echo 'SPACE_ID=XPZ8fnf3DvNMRDbFgxEZi2' >> .env

# Run the publish script
node dist/publish.js
```

## Notes

- The entity IDs are generated dynamically each time the data is published, so they will change if you republish the data.
- The URLs provided in this document are for the testnet environment.
