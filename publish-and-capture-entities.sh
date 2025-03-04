#!/bin/bash
set -e

echo "Publishing GRC20 permits with updated relation type names..."
# Temporarily set SPACE_ID to PERMITS_SPACE_ID for the script
PERMITS_SPACE_ID=$(grep PERMITS_SPACE_ID .env | cut -d '=' -f2)
ORIGINAL_SPACE_ID=$(grep "^SPACE_ID=" .env | cut -d '=' -f2)

# Create a temporary .env file with SPACE_ID set to PERMITS_SPACE_ID
cp .env .env.bak
sed -i.bak "s/^SPACE_ID=.*/SPACE_ID=$PERMITS_SPACE_ID/" .env

# Run the script
node dist-test/core/publish-grc20-permits.js | tee publish-output.log

# Restore the original .env file
mv .env.bak .env

# Extract entity IDs from the output
echo "Extracting entity IDs from the output..."
echo "Record type entities:" > new-entities.txt
grep "recordType" publish-output.log -A 10 | grep "id" >> new-entities.txt
echo "Status entities:" >> new-entities.txt
grep "status" publish-output.log -A 10 | grep "id" >> new-entities.txt

echo "Done! New entities have been captured in new-entities.txt"
