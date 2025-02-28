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

## Notes

- Make sure you have sufficient testnet ETH in your wallet
- The editor address is set to: 0x6596a3C7C2eA69D04F01F064AA4e914196BbA0a7
- All operations are performed on the Sepolia testnet
