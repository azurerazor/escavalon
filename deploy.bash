#!/bin/bash

# Install common dependencies
echo "Installing common dependencies..."
cd common
npm i --include=dev
cd ../

# Build the client
echo "Building client..."
cd client
npm i --include=dev
npm run build

# Copy over to web root + restart the nginx service
echo "Redeploying client..."
rm -rf /var/www/dist/
cp -r dist/ /var/www/
service nginx restart

# Build the server
echo "Building server..."
cd ../server
npm i --include=dev
npm run build

# Copy over the server source
cd ../
rm -rf /var/server/
cp -r server/ /var/

# Copy over the shared source
rm -rf /var/common/
cp -r common/ /var/

# Restart the server process
echo "Redeploying server..."
cd /var/server
pm2 update
pm2 start
