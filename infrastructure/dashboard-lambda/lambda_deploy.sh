#!/bin/sh

rm -rf models
rm -rf constants

mkdir -p models
mkdir -p constants

cp -R ../models/* models/
cp -R ../constants/* constants/

# zip -r function.zip .
# aws lambda update-function-code --function-name token-manager --zip-file fileb://function.zip
