# Old Scripts

This directory contains scripts that were used during development and testing but are no longer actively used in the main application. They are kept here for reference purposes.

## Why these scripts were moved

These scripts were moved to this directory because:

1. They were experimental or test scripts that are no longer needed
2. They were replaced by more reliable implementations
3. They contain approaches that didn't work as expected

## Working Scripts

The following scripts in the main `scripts` directory are the ones that should be used:

- `deploy-space-direct.js` - Creates a new GRC-20 space using the correct API endpoint and transaction method
- `publish-deeds.ts` - Publishes deed records to a GRC-20 space
- `publish-permits.ts` - Publishes permit records to a GRC-20 space
- `check-entity.ts` - Checks if an entity exists in a GRC-20 space
- `create-and-publish.ts` - Creates a space and publishes records to it
- `ensure-spaces.ts` - Ensures that the necessary spaces exist
- `grc20-cli.ts` - Command-line interface for the GRC-20 application

## Notes on the old scripts

- `create-space-*.js/ts` - Various attempts at creating a space using different methods
- `test-*.js/ts` - Test scripts for different functionalities
- `deploy-space.js` - Original space deployment script that has been replaced by `deploy-space-direct.js`
