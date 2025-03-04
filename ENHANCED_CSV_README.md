# Enhanced CSV Generator

This script generates enhanced CSV files that include all the original data from the input CSV files (deeds or permits) plus additional columns for the entity ID and URL.

## Features

- Reads the original CSV files (deeds or permits)
- Loads entity mappings from JSON files
- Generates enhanced CSV files with all original columns plus:
  - Entity ID: The ID of the entity in the GRC-20 space
  - Entity URL: The URL to view the entity in the GRC-20 space browser

## Usage

```bash
# Generate enhanced CSV for deeds
node generate-enhanced-csv.js deeds

# Generate enhanced CSV for permits
node generate-enhanced-csv.js permits

# Generate enhanced CSV for both deeds and permits
node generate-enhanced-csv.js all
```

## Output Files

The script generates the following output files:

- `data/enhanced-deeds.csv`: Enhanced CSV file for deeds
- `data/enhanced-permits.csv`: Enhanced CSV file for permits

## Configuration

The script is configured to use the following files:

### Deeds

- Input CSV: `data/GRC20_Deeds.csv`
- Entity Mapping: `data/entity-ids.json`
- Output CSV: `data/enhanced-deeds.csv`
- Space ID: `P77ioa8U9EipVASzVHBA9B`
- ID Field: `InstrumentNumber`

### Permits

- Input CSV: `data/permits.csv`
- Entity Mapping: `data/permit-entity-ids.json`
- Output CSV: `data/enhanced-permits.csv`
- Space ID: `XPZ8fnf3DvNMRDbFgxEZi2`
- ID Field: `Record Number`

## Entity URLs

The entity URLs are generated using the following format:

```
https://geogenesis-git-feat-testnet-geo-browser.vercel.app/space/{spaceId}/{entityId}
```

Where:
- `{spaceId}` is the ID of the GRC-20 space
- `{entityId}` is the ID of the entity in the GRC-20 space

## Dependencies

The script requires the following npm packages:

- `csv-parser`: For parsing CSV files
- `csv-writer`: For writing CSV files

Install these dependencies using:

```bash
npm install csv-parser csv-writer
```

## Integration with New Repository

This script can be integrated into the new repository structure outlined in `NEW_REPO_STRUCTURE.md`. In the new repository, it would be placed in the `scripts` directory and modified to use the new file paths.
