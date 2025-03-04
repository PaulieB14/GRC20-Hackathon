#!/bin/bash
set -e

echo "Skipping TypeScript compilation due to errors..."
echo "Using existing compiled JavaScript files..."

echo "Publishing GRC20 permits with sentence case entity names..."
# Temporarily set SPACE_ID to PERMITS_SPACE_ID for the script
PERMITS_SPACE_ID=$(grep PERMITS_SPACE_ID .env | cut -d '=' -f2)
ORIGINAL_SPACE_ID=$(grep "^SPACE_ID=" .env | cut -d '=' -f2)

# Create a temporary .env file with SPACE_ID set to PERMITS_SPACE_ID
cp .env .env.bak
sed -i.bak "s/^SPACE_ID=.*/SPACE_ID=$PERMITS_SPACE_ID/" .env

# Run the script and capture the output
node dist-test/core/publish-grc20-permits.js | tee publish-output.log

# Restore the original .env file
mv .env.bak .env

# Extract entity IDs from the output
echo "Extracting entity IDs from the output..."
echo "Entity IDs with URLs:" > sentence-case-entities.csv
echo "Type,Name,Entity ID,URL" >> sentence-case-entities.csv

# Get entity types
echo "Extracting entity types..."

# Extract Building permit type ID
BUILDING_PERMIT_TYPE_ID=$(grep -A 10 "Building permit" publish-output.log | grep -o '"id": "[^"]*"' | head -1 | cut -d '"' -f 4)
if [ -n "$BUILDING_PERMIT_TYPE_ID" ]; then
  echo "Entity Type,Building permit,$BUILDING_PERMIT_TYPE_ID,https://geogenesis-git-feat-testnet-geo-browser.vercel.app/space/$PERMITS_SPACE_ID/$BUILDING_PERMIT_TYPE_ID" >> sentence-case-entities.csv
  echo "Found Building permit type: $BUILDING_PERMIT_TYPE_ID"
fi

# Extract Record type type ID
RECORD_TYPE_TYPE_ID=$(grep -A 10 "Record type" publish-output.log | grep -o '"id": "[^"]*"' | head -1 | cut -d '"' -f 4)
if [ -n "$RECORD_TYPE_TYPE_ID" ]; then
  echo "Entity Type,Record type,$RECORD_TYPE_TYPE_ID,https://geogenesis-git-feat-testnet-geo-browser.vercel.app/space/$PERMITS_SPACE_ID/$RECORD_TYPE_TYPE_ID" >> sentence-case-entities.csv
  echo "Found Record type type: $RECORD_TYPE_TYPE_ID"
fi

# Extract Status type ID
STATUS_TYPE_ID=$(grep -A 10 "Status" publish-output.log | grep -o '"id": "[^"]*"' | head -1 | cut -d '"' -f 4)
if [ -n "$STATUS_TYPE_ID" ]; then
  echo "Entity Type,Status,$STATUS_TYPE_ID,https://geogenesis-git-feat-testnet-geo-browser.vercel.app/space/$PERMITS_SPACE_ID/$STATUS_TYPE_ID" >> sentence-case-entities.csv
  echo "Found Status type: $STATUS_TYPE_ID"
fi

# Extract relation types
echo "Extracting relation types..."

# Extract Record type relation ID
RECORD_TYPE_RELATION_ID=$(grep -A 10 "Record type relation" publish-output.log | grep -o '"id": "[^"]*"' | head -1 | cut -d '"' -f 4)
if [ -n "$RECORD_TYPE_RELATION_ID" ]; then
  echo "Relation Type,Record type relation,$RECORD_TYPE_RELATION_ID,https://geogenesis-git-feat-testnet-geo-browser.vercel.app/space/$PERMITS_SPACE_ID/$RECORD_TYPE_RELATION_ID" >> sentence-case-entities.csv
  echo "Found Record type relation: $RECORD_TYPE_RELATION_ID"
fi

# Extract Status relation ID
STATUS_RELATION_ID=$(grep -A 10 "Status relation" publish-output.log | grep -o '"id": "[^"]*"' | head -1 | cut -d '"' -f 4)
if [ -n "$STATUS_RELATION_ID" ]; then
  echo "Relation Type,Status relation,$STATUS_RELATION_ID,https://geogenesis-git-feat-testnet-geo-browser.vercel.app/space/$PERMITS_SPACE_ID/$STATUS_RELATION_ID" >> sentence-case-entities.csv
  echo "Found Status relation: $STATUS_RELATION_ID"
fi

# Extract property IDs
echo "Extracting property IDs..."

# Extract Record number property ID
RECORD_NUMBER_PROPERTY_ID=$(grep -A 10 "Record number" publish-output.log | grep -o '"id": "[^"]*"' | head -1 | cut -d '"' -f 4)
if [ -n "$RECORD_NUMBER_PROPERTY_ID" ]; then
  echo "Property,Record number,$RECORD_NUMBER_PROPERTY_ID,https://geogenesis-git-feat-testnet-geo-browser.vercel.app/space/$PERMITS_SPACE_ID/$RECORD_NUMBER_PROPERTY_ID" >> sentence-case-entities.csv
  echo "Found Record number property: $RECORD_NUMBER_PROPERTY_ID"
fi

# Extract Description property ID
DESCRIPTION_PROPERTY_ID=$(grep -A 10 "Description" publish-output.log | grep -o '"id": "[^"]*"' | head -1 | cut -d '"' -f 4)
if [ -n "$DESCRIPTION_PROPERTY_ID" ]; then
  echo "Property,Description,$DESCRIPTION_PROPERTY_ID,https://geogenesis-git-feat-testnet-geo-browser.vercel.app/space/$PERMITS_SPACE_ID/$DESCRIPTION_PROPERTY_ID" >> sentence-case-entities.csv
  echo "Found Description property: $DESCRIPTION_PROPERTY_ID"
fi

# Extract Address property ID
ADDRESS_PROPERTY_ID=$(grep -A 10 "Address" publish-output.log | grep -o '"id": "[^"]*"' | head -1 | cut -d '"' -f 4)
if [ -n "$ADDRESS_PROPERTY_ID" ]; then
  echo "Property,Address,$ADDRESS_PROPERTY_ID,https://geogenesis-git-feat-testnet-geo-browser.vercel.app/space/$PERMITS_SPACE_ID/$ADDRESS_PROPERTY_ID" >> sentence-case-entities.csv
  echo "Found Address property: $ADDRESS_PROPERTY_ID"
fi

# Extract Project name property ID
PROJECT_NAME_PROPERTY_ID=$(grep -A 10 "Project name" publish-output.log | grep -o '"id": "[^"]*"' | head -1 | cut -d '"' -f 4)
if [ -n "$PROJECT_NAME_PROPERTY_ID" ]; then
  echo "Property,Project name,$PROJECT_NAME_PROPERTY_ID,https://geogenesis-git-feat-testnet-geo-browser.vercel.app/space/$PERMITS_SPACE_ID/$PROJECT_NAME_PROPERTY_ID" >> sentence-case-entities.csv
  echo "Found Project name property: $PROJECT_NAME_PROPERTY_ID"
fi

# Extract record type entities
echo "Extracting record type entities..."
grep -A 5 "Creating record type entities" publish-output.log -A 100 | grep -o '"id": "[^"]*"' | cut -d '"' -f 4 | while read -r id; do
  name=$(grep -B 10 "$id" publish-output.log | grep -o '"name": "[^"]*"' | head -1 | cut -d '"' -f 4)
  if [ -n "$name" ] && [ -n "$id" ]; then
    echo "Record Type Entity,$name,$id,https://geogenesis-git-feat-testnet-geo-browser.vercel.app/space/$PERMITS_SPACE_ID/$id" >> sentence-case-entities.csv
    echo "Found record type entity: $name ($id)"
  fi
done

# Extract status entities
echo "Extracting status entities..."
grep -A 5 "Creating status entities" publish-output.log -A 100 | grep -o '"id": "[^"]*"' | cut -d '"' -f 4 | while read -r id; do
  name=$(grep -B 10 "$id" publish-output.log | grep -o '"name": "[^"]*"' | head -1 | cut -d '"' -f 4)
  if [ -n "$name" ] && [ -n "$id" ]; then
    echo "Status Entity,$name,$id,https://geogenesis-git-feat-testnet-geo-browser.vercel.app/space/$PERMITS_SPACE_ID/$id" >> sentence-case-entities.csv
    echo "Found status entity: $name ($id)"
  fi
done

# Extract permit entities (just a sample)
echo "Extracting sample permit entities..."
FIRST_PERMIT_ID=$(grep -A 10 "firstEntity" publish-output.log | grep -o '"id": "[^"]*"' | head -1 | cut -d '"' -f 4)
LAST_PERMIT_ID=$(grep -A 10 "lastEntity" publish-output.log | grep -o '"id": "[^"]*"' | head -1 | cut -d '"' -f 4)

if [ -n "$FIRST_PERMIT_ID" ]; then
  FIRST_PERMIT_NAME=$(grep -A 10 "firstEntity" publish-output.log | grep -o '"name": "[^"]*"' | head -1 | cut -d '"' -f 4)
  echo "Permit,\"$FIRST_PERMIT_NAME\",$FIRST_PERMIT_ID,https://geogenesis-git-feat-testnet-geo-browser.vercel.app/space/$PERMITS_SPACE_ID/$FIRST_PERMIT_ID" >> sentence-case-entities.csv
  echo "Found first permit: $FIRST_PERMIT_NAME ($FIRST_PERMIT_ID)"
fi

if [ -n "$LAST_PERMIT_ID" ]; then
  LAST_PERMIT_NAME=$(grep -A 10 "lastEntity" publish-output.log | grep -o '"name": "[^"]*"' | head -1 | cut -d '"' -f 4)
  echo "Permit,\"$LAST_PERMIT_NAME\",$LAST_PERMIT_ID,https://geogenesis-git-feat-testnet-geo-browser.vercel.app/space/$PERMITS_SPACE_ID/$LAST_PERMIT_ID" >> sentence-case-entities.csv
  echo "Found last permit: $LAST_PERMIT_NAME ($LAST_PERMIT_ID)"
fi

# Copy the CSV file to the desktop for easier access
cp sentence-case-entities.csv ~/Desktop/sentence-case-entities.csv

echo "Done! Entity IDs with URLs have been captured in sentence-case-entities.csv"
echo "A copy has also been placed on your desktop: ~/Desktop/sentence-case-entities.csv"

# Print the URLs for easy verification
echo "Here are the URLs for verification:"
grep "https://" sentence-case-entities.csv | cut -d ',' -f 4
