zip -r function.zip .
aws lambda update-function-code --function-name token-manager --zip-file fileb://function.zip
