# Deeds & Permits Publisher

A clean, modular implementation for publishing deeds and permits data to GRC-20 spaces using a relationship-based data model.

## Overview

This repository provides a complete solution for transforming and publishing deeds and permits data to GRC-20 spaces. It implements a relationship-based data model that makes it easy to query and analyze the data.

Key features:
- Clean, modular architecture with separation of concerns
- Relationship-based data model for improved queryability
- Support for both deeds and permits data using the same codebase
- Command-line interface for easy use
- Comprehensive documentation

## Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/deeds-permits-publisher.git
cd deeds-permits-publisher

# Install dependencies
npm install

# Build the project
npm run build
```

## Configuration

Create a `.env` file in the root directory with the following variables:

```
# GRC-20 Space IDs
DEEDS_SPACE_ID=your-deeds-space-id
PERMITS_SPACE_ID=your-permits-space-id

# Wallet Configuration
PRIVATE_KEY=your-private-key-here
WALLET_ADDRESS=your-wallet-address-here

# Network Configuration
NETWORK=testnet
RPC_URL=https://rpc-testnet.grc-20.thegraph.com
CHAIN_ID=19411 # GRC-20 testnet chain ID

# API Keys (if needed)
GRC20_API_KEY=your-api-key
```

## Usage

### Creating GRC-20 Spaces

Before you can publish data, you need to create GRC-20 spaces:

```bash
# Create a space with a custom name
npm run create-space -- --name "My Deed Space" --network testnet

# Create a deed space (automatically updates DEEDS_SPACE_ID in .env)
npm run create-space -- --name "Deed Space" --network testnet

# Create a permit space (automatically updates PERMITS_SPACE_ID in .env)
npm run create-space -- --name "Permit Space" --network testnet
```

### Setting up the Ontology

After creating spaces, you need to set up the ontology:

```bash
# Set up both deeds and permits ontologies
npm run setup-ontology

# Set up only the deeds ontology
npm run setup-ontology -- --deed-only

# Set up only the permits ontology
npm run setup-ontology -- --permit-only

# Use custom space IDs
npm run setup-ontology -- --deed-space your-deed-space-id --permit-space your-permit-space-id
```

### Publishing Deeds and Permits

Once you have created spaces and set up the ontology, you can publish deeds and permits data:

```bash
# Publish deeds data to the space specified in DEEDS_SPACE_ID
npm run publish-deeds

# Publish deeds data to a custom space
npm run publish-deeds -- --space-id your-deed-space-id

# Publish permits data to the space specified in PERMITS_SPACE_ID
npm run publish-permits

# Publish permits data to a custom space
npm run publish-permits -- --space-id your-permit-space-id
```

The publish scripts will:
1. Read data from CSV files in the `data/input` directory
2. Add property addresses from mapping files in the `data/mapping` directory
3. Publish the combined data to the specified GRC-20 spaces

### Deploying Spaces and Publishing Data in One Step

To deploy spaces, set up the ontology, and publish data all in one step, use the deploy-and-publish script:

```bash
# Deploy spaces, set up ontology, and publish data
npm run deploy-and-publish
```

This script will:
1. Ensure spaces exist (create them if they don't)
2. Set up the ontology for both spaces
3. Publish the deeds data
4. Publish the permits data

### Using the GRC-20 CLI

The project includes a unified CLI for GRC-20 operations:

```bash
# Show help
npm run grc20 -- help

# Create a space
npm run grc20 -- create-space --name "My Space" --network testnet

# Set up ontology
npm run grc20 -- setup-ontology --deed-only
```

## Data Model

This repository implements a relationship-based data model for deeds and permits data:

### Deed Model

- **Deed**: The main entity representing a deed document
  - Properties: Instrument Number, Record Date, Book Type, Book Page, Comments, Property Address
  - Relations:
    - **Buyer**: Relates to a Person entity
    - **Seller**: Relates to a Person entity
    - **Document Type**: Relates to a Document Type entity

### Permit Model

- **Permit**: The main entity representing a permit
  - Properties: Record Number, Description, Project Name, Address, Date, Expiration Date
  - Relations:
    - **Record Type**: Relates to a Record Type entity
    - **Status**: Relates to a Status entity

## Directory Structure

```
deeds-permits-publisher/
├── data/
│   ├── input/       # Input CSV files
│   ├── mapping/     # Mapping files (e.g., property addresses)
│   └── output/      # Output files (e.g., entity IDs)
├── src/
│   ├── cli/         # Command-line interface
│   ├── config/      # Configuration
│   ├── core/        # Core utilities
│   ├── models/      # Data models
│   ├── scripts/     # Scripts for creating spaces and publishing data
│   │   ├── deploy-space-direct.js  # Creates a new GRC-20 space
│   │   ├── publish-deeds.ts        # Publishes deed records
│   │   ├── publish-permits.ts      # Publishes permit records
│   │   ├── check-entity.ts         # Checks if an entity exists
│   │   ├── create-and-publish.ts   # Creates a space and publishes records
│   │   ├── ensure-spaces.ts        # Ensures spaces exist
│   │   ├── grc20-cli.ts            # Command-line interface
│   │   ├── deploy-and-publish.ts   # Deploys spaces, sets up ontology, and publishes data
│   │   └── old-scripts/            # Deprecated scripts kept for reference
│   ├── services/    # Services
│   └── utils/       # Utilities
├── package.json
├── tsconfig.json
└── README.md
```

## Working Scripts

The following scripts are the main ones used in this application:

- `deploy-space-direct.js` - Creates a new GRC-20 space using the correct API endpoint and transaction method
- `publish-deeds.ts` - Publishes deed records to a GRC-20 space
- `publish-permits.ts` - Publishes permit records to a GRC-20 space
- `check-entity.ts` - Checks if an entity exists in a GRC-20 space
- `create-and-publish.ts` - Creates a space and publishes records to it
- `ensure-spaces.ts` - Ensures that the necessary spaces exist
- `grc20-cli.ts` - Command-line interface for the GRC-20 application
- `deploy-and-publish.ts` - Deploys spaces, sets up ontology, and publishes data in one step

Note: Other experimental scripts have been moved to the `src/scripts/old-scripts/` directory.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the ISC License - see the LICENSE file for details.
