#!/bin/bash
set -e

# This script updates entity names to use sentence case, publishes them to GRC-20, and captures the entity IDs

echo "Compiling TypeScript..."
npx tsc

echo "Publishing updated entity names with sentence case..."
# Run the publish-grc20-permits.js script and capture the output
node dist-test/core/publish-grc20-permits.js | tee publish-output.log

# Extract entity IDs from the output
echo "Extracting entity IDs from the output..."
echo "Entity IDs with URLs:" > entity-ids-with-urls.csv
echo "Type,Name,Entity ID,URL" >> entity-ids-with-urls.csv

# Get the space ID from the .env file
PERMITS_SPACE_ID=$(grep PERMITS_SPACE_ID .env | cut -d '=' -f2)

# Extract entity IDs for the main types
echo "Extracting entity IDs for main types..."

# Extract Building permit type ID
BUILDING_PERMIT_TYPE_ID=$(grep -A 10 "Building permit" publish-output.log | grep -o '"id": "[^"]*"' | head -1 | cut -d '"' -f 4)
if [ -n "$BUILDING_PERMIT_TYPE_ID" ]; then
  echo "Entity Type,Building permit,$BUILDING_PERMIT_TYPE_ID,https://geogenesis-git-feat-testnet-geo-browser.vercel.app/space/$PERMITS_SPACE_ID/$BUILDING_PERMIT_TYPE_ID" >> entity-ids-with-urls.csv
fi

# Extract Record type type ID
RECORD_TYPE_TYPE_ID=$(grep -A 10 "Record type" publish-output.log | grep -o '"id": "[^"]*"' | head -1 | cut -d '"' -f 4)
if [ -n "$RECORD_TYPE_TYPE_ID" ]; then
  echo "Entity Type,Record type,$RECORD_TYPE_TYPE_ID,https://geogenesis-git-feat-testnet-geo-browser.vercel.app/space/$PERMITS_SPACE_ID/$RECORD_TYPE_TYPE_ID" >> entity-ids-with-urls.csv
fi

# Extract Status type ID
STATUS_TYPE_ID=$(grep -A 10 "Status" publish-output.log | grep -o '"id": "[^"]*"' | head -1 | cut -d '"' -f 4)
if [ -n "$STATUS_TYPE_ID" ]; then
  echo "Entity Type,Status,$STATUS_TYPE_ID,https://geogenesis-git-feat-testnet-geo-browser.vercel.app/space/$PERMITS_SPACE_ID/$STATUS_TYPE_ID" >> entity-ids-with-urls.csv
fi

# Extract Record type relation ID
RECORD_TYPE_RELATION_ID=$(grep -A 10 "Record type relation" publish-output.log | grep -o '"id": "[^"]*"' | head -1 | cut -d '"' -f 4)
if [ -n "$RECORD_TYPE_RELATION_ID" ]; then
  echo "Relation Type,Record type relation,$RECORD_TYPE_RELATION_ID,https://geogenesis-git-feat-testnet-geo-browser.vercel.app/space/$PERMITS_SPACE_ID/$RECORD_TYPE_RELATION_ID" >> entity-ids-with-urls.csv
fi

# Extract Status relation ID
STATUS_RELATION_ID=$(grep -A 10 "Status relation" publish-output.log | grep -o '"id": "[^"]*"' | head -1 | cut -d '"' -f 4)
if [ -n "$STATUS_RELATION_ID" ]; then
  echo "Relation Type,Status relation,$STATUS_RELATION_ID,https://geogenesis-git-feat-testnet-geo-browser.vercel.app/space/$PERMITS_SPACE_ID/$STATUS_RELATION_ID" >> entity-ids-with-urls.csv
fi

# Extract property IDs
echo "Extracting property IDs..."

# Extract Record number property ID
RECORD_NUMBER_PROPERTY_ID=$(grep -A 10 "Record number" publish-output.log | grep -o '"id": "[^"]*"' | head -1 | cut -d '"' -f 4)
if [ -n "$RECORD_NUMBER_PROPERTY_ID" ]; then
  echo "Property,Record number,$RECORD_NUMBER_PROPERTY_ID,https://geogenesis-git-feat-testnet-geo-browser.vercel.app/space/$PERMITS_SPACE_ID/$RECORD_NUMBER_PROPERTY_ID" >> entity-ids-with-urls.csv
fi

# Extract Description property ID
DESCRIPTION_PROPERTY_ID=$(grep -A 10 "Description" publish-output.log | grep -o '"id": "[^"]*"' | head -1 | cut -d '"' -f 4)
if [ -n "$DESCRIPTION_PROPERTY_ID" ]; then
  echo "Property,Description,$DESCRIPTION_PROPERTY_ID,https://geogenesis-git-feat-testnet-geo-browser.vercel.app/space/$PERMITS_SPACE_ID/$DESCRIPTION_PROPERTY_ID" >> entity-ids-with-urls.csv
fi

# Extract Address property ID
ADDRESS_PROPERTY_ID=$(grep -A 10 "Address" publish-output.log | grep -o '"id": "[^"]*"' | head -1 | cut -d '"' -f 4)
if [ -n "$ADDRESS_PROPERTY_ID" ]; then
  echo "Property,Address,$ADDRESS_PROPERTY_ID,https://geogenesis-git-feat-testnet-geo-browser.vercel.app/space/$PERMITS_SPACE_ID/$ADDRESS_PROPERTY_ID" >> entity-ids-with-urls.csv
fi

# Extract Project name property ID
PROJECT_NAME_PROPERTY_ID=$(grep -A 10 "Project name" publish-output.log | grep -o '"id": "[^"]*"' | head -1 | cut -d '"' -f 4)
if [ -n "$PROJECT_NAME_PROPERTY_ID" ]; then
  echo "Property,Project name,$PROJECT_NAME_PROPERTY_ID,https://geogenesis-git-feat-testnet-geo-browser.vercel.app/space/$PERMITS_SPACE_ID/$PROJECT_NAME_PROPERTY_ID" >> entity-ids-with-urls.csv
fi

# Extract permit entities
echo "Extracting permit entities..."
FIRST_PERMIT_ID=$(grep -A 10 "firstEntity" publish-output.log | grep -o '"id": "[^"]*"' | head -1 | cut -d '"' -f 4)
LAST_PERMIT_ID=$(grep -A 10 "lastEntity" publish-output.log | grep -o '"id": "[^"]*"' | head -1 | cut -d '"' -f 4)

if [ -n "$FIRST_PERMIT_ID" ]; then
  FIRST_PERMIT_NAME=$(grep -A 10 "firstEntity" publish-output.log | grep -o '"name": "[^"]*"' | head -1 | cut -d '"' -f 4)
  echo "Permit,\"$FIRST_PERMIT_NAME\",$FIRST_PERMIT_ID,https://geogenesis-git-feat-testnet-geo-browser.vercel.app/space/$PERMITS_SPACE_ID/$FIRST_PERMIT_ID" >> entity-ids-with-urls.csv
fi

if [ -n "$LAST_PERMIT_ID" ]; then
  LAST_PERMIT_NAME=$(grep -A 10 "lastEntity" publish-output.log | grep -o '"name": "[^"]*"' | head -1 | cut -d '"' -f 4)
  echo "Permit,\"$LAST_PERMIT_NAME\",$LAST_PERMIT_ID,https://geogenesis-git-feat-testnet-geo-browser.vercel.app/space/$PERMITS_SPACE_ID/$LAST_PERMIT_ID" >> entity-ids-with-urls.csv
fi

# Copy the CSV file to the desktop for easier access
cp entity-ids-with-urls.csv ~/Desktop/entity-ids-with-urls.csv

echo "Done! Entity IDs with URLs have been captured in entity-ids-with-urls.csv"
echo "A copy has also been placed on your desktop: ~/Desktop/entity-ids-with-urls.csv"

# Print the URLs for easy verification
echo "Here are the URLs for verification:"
grep "https://" entity-ids-with-urls.csv | cut -d ',' -f 4
