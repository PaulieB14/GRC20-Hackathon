#!/bin/bash

# This script captures entity IDs from the GRC-20 browser and updates the entity-id-mapping.json file

echo "=== Capturing and Updating Entity IDs ==="
node capture-and-update-entity-ids.js

echo "Done!"
