# Desktop Enhanced CSV Generator (Fixed)

This script generates enhanced CSV files directly to your Desktop that include all the original data from the input CSV files (deeds or permits) plus additional columns for the entity ID and URL.

## Features

- Reads the original CSV files (deeds or permits)
- Loads entity mappings from JSON files and hard-coded data
- Generates enhanced CSV files on your Desktop with all original columns plus:
  - Entity ID: The ID of the entity in the GRC-20 space
  - Entity URL: The URL to view the entity in the GRC-20 space browser

## Usage

```bash
# Generate enhanced CSV for deeds (saved to Desktop)
node generate-desktop-csv-fixed.js deeds

# Generate enhanced CSV for permits (saved to Desktop)
node generate-desktop-csv-fixed.js permits

# Generate enhanced CSV for both deeds and permits (saved to Desktop)
node generate-desktop-csv-fixed.js all
```

## Output Files

The script generates the following output files on your Desktop:

- `enhanced-deeds.csv`: Enhanced CSV file for deeds
- `enhanced-permits.csv`: Enhanced CSV file for permits

## How It Works

### Deeds

For deeds, the script:
1. Reads the deed records from `data/GRC20_Deeds.csv`
2. Loads the entity mappings from `data/entity-ids.json`
3. Enhances each deed record with its entity ID and URL
4. Writes the enhanced records to `~/Desktop/enhanced-deeds.csv`

### Permits

For permits, the script:
1. Reads the permit records from `data/permits.csv`
2. Loads the entity mappings from the `permitEntities` array in `hard-coded-permit-entities.js`
3. Enhances each permit record with its entity ID and URL
4. Writes the enhanced records to `~/Desktop/enhanced-permits.csv`

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

## Differences from the Original Script

This fixed version of the script:

1. Uses the hard-coded permit entities from `hard-coded-permit-entities.js` for permits instead of trying to load them from a JSON file
2. Separates the processing of deeds and permits into different functions
3. Creates a mapping from record number to entity ID and URL for permits
4. Ensures that both deeds and permits CSV files have the entity ID and URL columns
