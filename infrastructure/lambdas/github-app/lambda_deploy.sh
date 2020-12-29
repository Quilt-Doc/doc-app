zip -r function.zip .
aws lambda update-function-code --function-name github-app-listener --zip-file fileb://function.zip
