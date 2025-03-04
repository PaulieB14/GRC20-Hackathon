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

# API Keys (if needed)
GRC20_API_KEY=your-api-key
```

## Usage

### Setting up the Ontology

Before you can publish data, you need to set up the ontology in your GRC-20 spaces:

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

### Publishing Deeds Data

```bash
# Transform and publish deeds data
npm run transform-deeds
npm run publish-deeds

# Or use the combined command
npm run publish-deeds -- --transform
```

### Publishing Permits Data

```bash
# Transform and publish permits data
npm run transform-permits
npm run publish-permits

# Or use the combined command
npm run publish-permits -- --transform
```

### Updating Property Addresses

```bash
# Update property addresses for deeds and permits
npm run update-addresses

# Update only deed addresses
npm run update-addresses -- --deed-only

# Update only permit addresses
npm run update-addresses -- --permit-only
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
  - Properties: Record Number, Description, Project Name, Address
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
│   ├── services/    # Services
│   └── utils/       # Utilities
├── scripts/         # Helper scripts
├── package.json
├── tsconfig.json
└── README.md
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the ISC License - see the LICENSE file for details.
