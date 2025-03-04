#!/bin/bash

# This script captures entity IDs from the GRC-20 browser and updates the permit-entity-id-mapping.json file

echo "=== Capturing and Updating Permit Entity IDs ==="
node capture-and-update-permit-entity-ids.js

echo "Done!"
