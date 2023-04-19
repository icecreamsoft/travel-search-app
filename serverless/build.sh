#!/bin/sh

rm -rf dist
rm -rf public

cd ../api
npm run build

cp -r dist ../serverless

cd ../client
npm run build
rm -rf ../serverless/public
cp -r dist ../serverless/public