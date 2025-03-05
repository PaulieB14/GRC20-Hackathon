# Old Update Scripts

This directory contains old scripts that were used for updating spaces. These scripts have been replaced by the `check-and-update.js` script in the parent directory.

## Files

- `update-space-curl.js`: Updates a space using curl commands
- `update-space-curl-simple.js`: A simplified version of update-space-curl.js
- `update-space-direct.js`: Updates a space using direct API calls
- `update-space-grc20.js`: Updates a space using the GRC-20 library
- `update-space-viem.ts`: Updates a space using the viem library
- `wallet-alt.ts`: An alternative wallet implementation

## Why These Were Replaced

These scripts were replaced by the `check-and-update.js` script because:

1. It provides a more comprehensive solution that both checks if spaces exist and updates them
2. It uses the existing wallet utility from `src/utils/wallet.js`
3. It has better error handling and logging
4. It's more maintainable and easier to use

## Historical Context

These scripts were created during the development of the GRC-20 hackathon project to explore different approaches to updating spaces. They are kept here for reference and historical purposes.
