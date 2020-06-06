
import os
import json
import importlib

import requests
from dotenv import load_dotenv
load_dotenv()

from create_objects import set_connect_info
set_connect_info()

import create_objects

accepted_types = ['user', 'workspace', 'codebase']
accepted_methods = {}

mod = importlib.import_module('create_objects')

for objType in accepted_types:
    accepted_methods[objType] = getattr(mod, 'create_'+objType)

filepath = 'test_data_schema.txt'
path = os.getcwd()

print(path)
with open(filepath) as fp:
    line = fp.readline()
    cnt = 1
    invoke_name = ''
    while line:
        if len(line) > 1:
            # New Object Type
            if not line[0:1].isspace():
                # Intentionally ignore the case where non-accepted type
                # This is just for iterative development
                if line.strip().lower() in accepted_types:
                    print('Setting new invoke_name')
                    invoke_name = line.strip().lower()
            elif len(invoke_name) > 0:
                data = json.loads(line.strip())
                accepted_methods[invoke_name](data)
            else:
                raise Exception("Invalid input file: No initial object type found")
            print("Line {}".format(cnt))
        line = fp.readline()
        cnt += 1