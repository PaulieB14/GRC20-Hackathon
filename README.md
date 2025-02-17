# Pinellas County GRC-20 Data Publisher

## Project Overview
This project transforms Pinellas County permit and deed transfer data into GRC-20 compatible triples and relations for decentralized data publishing.

## Prerequisites
- Node.js (v16+ recommended)
- npm or yarn
- A GRC-20 compatible wallet

## Setup

1. Clone the repository
```bash
git clone <repository-url>
cd grc20-pinellas-county
```

2. Install Dependencies
```bash
npm install
```

3. Configure Environment
- Copy `.env.example` to `.env`
- Fill in your wallet private key and space ID

## Data Transformation

### Permits
Transform permits CSV:
```bash
npm run transform:permits
```

### Deed Transfers
Transform deed transfers CSV:
```bash
npm run transform:deeds
```

## Publishing to GRC-20

Publish transformed data:
```bash
npm run publish
```

## Configuration

- `src/wallet.ts`: Wallet configuration
- `.env`: Environment variables
- `data/`: Place your CSV files here

## Security Notes
- NEVER commit your `.env` file
- Keep your private key confidential
- Use testnet for initial testing

## Troubleshooting
- Ensure correct CSV file formats
- Check network connectivity
- Verify wallet configuration
