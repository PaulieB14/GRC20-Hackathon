#!/bin/bash
set -e

# Compile the updated transformPermits.ts file
echo "Compiling transformPermits.ts..."
npx tsc src/core/transformPermits.ts --outDir dist-test/core --esModuleInterop --target es2015 --module esnext

# Run the publish-grc20-permits.js script to publish the updated entity names
echo "Publishing updated entity names..."
node dist-test/core/publish-grc20-permits.js | tee publish-output.log

# Extract entity IDs from the output
echo "Extracting entity IDs from the output..."
echo "Entity IDs with URLs:" > entity-ids-with-urls.csv
echo "Type,Name,Entity ID,URL" >> entity-ids-with-urls.csv

# Get the space ID from the .env file
PERMITS_SPACE_ID=$(grep PERMITS_SPACE_ID .env | cut -d '=' -f2)

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

# Extract entity type IDs from the output
echo "Extracting entity type IDs..."
BUILDING_PERMIT_ID=$(grep -A 5 "Building permit" publish-output.log | grep -o '"id": "[^"]*"' | head -1 | cut -d '"' -f 4)
RECORD_TYPE_ID=$(grep -A 5 "Record type" publish-output.log | grep -o '"id": "[^"]*"' | head -1 | cut -d '"' -f 4)
STATUS_ID=$(grep -A 5 "Status" publish-output.log | grep -o '"id": "[^"]*"' | head -1 | cut -d '"' -f 4)
RECORD_NUMBER_ID=$(grep -A 5 "Record number" publish-output.log | grep -o '"id": "[^"]*"' | head -1 | cut -d '"' -f 4)
PROJECT_NAME_ID=$(grep -A 5 "Project name" publish-output.log | grep -o '"id": "[^"]*"' | head -1 | cut -d '"' -f 4)
RECORD_TYPE_RELATION_ID=$(grep -A 5 "Record type relation" publish-output.log | grep -o '"id": "[^"]*"' | head -1 | cut -d '"' -f 4)
STATUS_RELATION_ID=$(grep -A 5 "Status relation" publish-output.log | grep -o '"id": "[^"]*"' | head -1 | cut -d '"' -f 4)

# Add entity type IDs to the CSV
if [ -n "$BUILDING_PERMIT_ID" ]; then
  echo "Entity Type,Building permit,$BUILDING_PERMIT_ID,https://geogenesis-git-feat-testnet-geo-browser.vercel.app/space/$PERMITS_SPACE_ID/$BUILDING_PERMIT_ID" >> entity-ids-with-urls.csv
fi

if [ -n "$RECORD_TYPE_ID" ]; then
  echo "Entity Type,Record type,$RECORD_TYPE_ID,https://geogenesis-git-feat-testnet-geo-browser.vercel.app/space/$PERMITS_SPACE_ID/$RECORD_TYPE_ID" >> entity-ids-with-urls.csv
fi

if [ -n "$STATUS_ID" ]; then
  echo "Entity Type,Status,$STATUS_ID,https://geogenesis-git-feat-testnet-geo-browser.vercel.app/space/$PERMITS_SPACE_ID/$STATUS_ID" >> entity-ids-with-urls.csv
fi

# Add property IDs to the CSV
if [ -n "$RECORD_NUMBER_ID" ]; then
  echo "Property,Record number,$RECORD_NUMBER_ID,https://geogenesis-git-feat-testnet-geo-browser.vercel.app/space/$PERMITS_SPACE_ID/$RECORD_NUMBER_ID" >> entity-ids-with-urls.csv
fi

if [ -n "$PROJECT_NAME_ID" ]; then
  echo "Property,Project name,$PROJECT_NAME_ID,https://geogenesis-git-feat-testnet-geo-browser.vercel.app/space/$PERMITS_SPACE_ID/$PROJECT_NAME_ID" >> entity-ids-with-urls.csv
fi

# Add relation type IDs to the CSV
if [ -n "$RECORD_TYPE_RELATION_ID" ]; then
  echo "Relation Type,Record type relation,$RECORD_TYPE_RELATION_ID,https://geogenesis-git-feat-testnet-geo-browser.vercel.app/space/$PERMITS_SPACE_ID/$RECORD_TYPE_RELATION_ID" >> entity-ids-with-urls.csv
fi

if [ -n "$STATUS_RELATION_ID" ]; then
  echo "Relation Type,Status relation,$STATUS_RELATION_ID,https://geogenesis-git-feat-testnet-geo-browser.vercel.app/space/$PERMITS_SPACE_ID/$STATUS_RELATION_ID" >> entity-ids-with-urls.csv
fi

# Copy the CSV file to the desktop
cp entity-ids-with-urls.csv ~/Desktop/entity-ids-with-urls.csv

echo "Done! Entity IDs with URLs have been captured in entity-ids-with-urls.csv"
echo "A copy has also been placed on your desktop: ~/Desktop/entity-ids-with-urls.csv"
