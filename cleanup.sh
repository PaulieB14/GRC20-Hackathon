#!/bin/bash

echo "Cleaning up repository..."

# Create a backup directory
mkdir -p backup

# Move unnecessary files to backup
echo "Moving unnecessary files to backup..."

# Move test and temporary files
mv test*.js* backup/ 2>/dev/null
mv temp-*.json backup/ 2>/dev/null
mv *-output.* backup/ 2>/dev/null

# Move old scripts that are no longer needed
mv update-entity-ids-grc20.sh backup/ 2>/dev/null
mv update-deed-ids.sh backup/ 2>/dev/null
mv update-deed-ids.js backup/ 2>/dev/null
mv publish-grc20-deeds.sh backup/ 2>/dev/null
mv update-grc20-deed-entities.sh backup/ 2>/dev/null

# Clean up dist directory if it exists
if [ -d "dist" ]; then
  echo "Cleaning dist directory..."
  rm -rf dist
fi

# Create a clean src directory structure
echo "Organizing source files..."

# Create directories for different types of files
mkdir -p src/core
mkdir -p src/utils
mkdir -p src/scripts

# Move core files
mv src/transform*.ts src/core/ 2>/dev/null
mv src/update-*.ts src/core/ 2>/dev/null
mv src/publish*.ts src/core/ 2>/dev/null
mv src/push-entities.ts src/core/ 2>/dev/null

# Move utility files
mv src/wallet.ts src/utils/ 2>/dev/null
mv src/view.ts src/utils/ 2>/dev/null
mv src/server.ts src/utils/ 2>/dev/null

# Create a simple script to run the push entities operation
cat > push-entities.sh << 'EOF'
#!/bin/bash

# Compile the TypeScript file
echo "Compiling push-entities.ts..."
npx tsc src/core/push-entities.ts --esModuleInterop --target es2020 --module esnext --moduleResolution node --outDir dist

# Run the compiled JavaScript file
echo "Running push-entities.js..."
node --experimental-modules --es-module-specifier-resolution=node dist/core/push-entities.js

echo "Done!"
EOF

# Make the script executable
chmod +x push-entities.sh

echo "Repository cleanup complete!"
