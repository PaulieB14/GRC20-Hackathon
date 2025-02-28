#!/bin/bash

# Cleanup script to remove files related to space name changes and governance
# These features are not needed until mainnet

echo "Removing files related to space name changes..."
rm -f src/update-space-name.ts
rm -f name-edit.json

echo "Removing files related to governance..."
rm -f src/governance.ts
rm -f src/create-governance-edit.ts
rm -f src/publish-accepted.ts
rm -f src/submit-governance-tx.ts
rm -f governance-accept.json
rm -f accept-edit.sh
rm -f create-governance-edit.sh
rm -f republish-accepted.sh
rm -f simple-governance-accept.js
rm -f governance-accept.js

echo "Cleanup complete!"
