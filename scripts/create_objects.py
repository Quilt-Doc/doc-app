import os
import json

from urllib.parse import urljoin

import requests

def set_connect_info():

    if os.getenv("USING_LOCAL_API"):
        set_connect_info.url = os.getenv("LOCAL_API")
    else:
        set_connect_info.url = os.getenv("EXTERNAL_API")
    set_connect_info.headers = {'Content-type': 'application/json', 'Accept': 'text/plain'}

def create_user(payload):
    endpoint = 'users/create/'
    user_url = urljoin(set_connect_info.url, endpoint)
    r = requests.post(user_url, data=json.dumps(payload), headers=set_connect_info.headers)

def create_workspace(payload):
    endpoint = 'workspaces/create/'
    workspace_url = urljoin(set_connect_info.url, endpoint)
    r = requests.post(workspace_url, data=json.dumps(payload), headers=set_connect_info.headers)

def create_codebase(payload):
    endpoint = 'codebases/create/'
    codebase_url = urljoin(set_connect_info.url, endpoint)
    r = requests.post(codebase_url, data=json.dumps(payload), headers=set_connect_info.headers)
