# Desktop Enhanced CSV Generator

This script generates enhanced CSV files directly to your Desktop that include all the original data from the input CSV files (deeds or permits) plus additional columns for the entity ID and URL.

## Features

- Reads the original CSV files (deeds or permits)
- Loads entity mappings from JSON files
- Generates enhanced CSV files on your Desktop with all original columns plus:
  - Entity ID: The ID of the entity in the GRC-20 space
  - Entity URL: The URL to view the entity in the GRC-20 space browser

## Usage

```bash
# Generate enhanced CSV for deeds (saved to Desktop)
node generate-desktop-csv.js deeds

# Generate enhanced CSV for permits (saved to Desktop)
node generate-desktop-csv.js permits

# Generate enhanced CSV for both deeds and permits (saved to Desktop)
node generate-desktop-csv.js all
```

## Output Files

The script generates the following output files on your Desktop:

- `enhanced-deeds.csv`: Enhanced CSV file for deeds
- `enhanced-permits.csv`: Enhanced CSV file for permits

## Configuration

The script is configured to use the following files:

### Deeds

- Input CSV: `data/GRC20_Deeds.csv`
- Entity Mapping: `data/entity-ids.json`
- Output CSV: `~/Desktop/enhanced-deeds.csv`
- Space ID: `P77ioa8U9EipVASzVHBA9B`
- ID Field: `InstrumentNumber`

### Permits

- Input CSV: `data/permits.csv`
- Entity Mapping: `data/permit-entity-ids.json`
- Output CSV: `~/Desktop/enhanced-permits.csv`
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

## How to View the CSV Files

After running the script, you can find the CSV files on your Desktop. You can open them with:

- Microsoft Excel
- Google Sheets (upload the file)
- Apple Numbers
- LibreOffice Calc
- Any text editor (though formatting will be less readable)

The CSV files include clickable URLs that you can use to view the entities in the GRC-20 browser.
