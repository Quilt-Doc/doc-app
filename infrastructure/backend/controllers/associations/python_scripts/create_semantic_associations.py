import os
import json
import requests as req

import tensorflow as tf
import tensorflow_hub as hub
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
import sys

import argparse

from sklearn.metrics.pairwise import cosine_similarity

'''
parser = argparse.ArgumentParser()
parser.add_argument('--integrationId', type=str, required=True)
parser.add_argument('--integrationType', type=str, required=True)

args = parser.parse_args()

data = { 
    "integrationId" : str(args.integrationId),
    "integrationType" : str(args.integrationType)
}

response = req.post("http://localhost:3001/api/example_route", data = data)

tickets = json.loads(response.text)['result'];
'''

ex_prs = [
    "Layout change",
    "Production frontend ui changes",
    "Reporting backend",
    "Production worker",
    "All Code",
    "Lambda GitHub listener",
    "ELK Stack Logging",
    "Secure routes"
]

ex_commits = [
    "Tested to make sure backend is working",

    "Added Integration Interval",
    
    "[QD-24] Modularize Association Pipeline",

    "remove deleted file",

    "new models",

    "commit model",

    "[QIJ-1] Hello with Jira!",

    "Github Issue bulk scraping -- no pagination",

    "Delete Integration Related Models on Workspace Deletion",

    "Github Projects Bulk Scraping Integrated into Scan Repositories Job",

    "jira bulk ticket scraping",

    "Initial Jira PoC",

    "disable tests",

    "pushing multiple polishing changes",

    "dealing with Title part 1",

    "temp merge",

    "just testing",

    "pushing code",
    
    "Testing modifiedDocuments",

    "Pull Request Integration & Class/Function parsing",

    "Refactored Directory Validation",

    "removed QuickAccess.js + TagWrapper.js",
]

ex_commits = [{ "name": name, "description": "", "_id": name } for name in ex_commits]

ex_prs = [{ "name": name, "description": "", "_id": name} for name in ex_prs]

ex_branches = [ { "name": "github-projects", "description": "" , "_id": "github-projects"},
            { "name": "jira-integration", "description": "", "_id": "jira-integration" }]
# note associations can be made for tickets using epic
# note commits can be filtered by using branch or PR
# note labels groupings

# possibly group pr or branch -> commits (give commits higher preference if in associated pr or branch)
# possibly use epics prs or branches as likely connected

tickets = [
    {
        "name": "Create Github Issue Bulk Scraping Procedure",
        "description": "",
        "likelyBranches": ex_branches,
        "likelyCommits": ex_commits,
        "likelyPullRequests": ex_prs
    },
    {
        "name": "Create Github Project Management Bulk Scraping Procedure",
        "description": "",
        "likelyBranches": ex_branches,
        "likelyCommits": ex_commits,
        "likelyPullRequests": ex_prs
    },
    {
        "name": "Create PoC to Display JIRA Tickets",
         "description": "",
        "likelyBranches": ex_branches,
        "likelyCommits": ex_commits,
        "likelyPullRequests": ex_prs
    },
    {
        "name": "JIRA App Authorization Frontend Settings",
          "description": "",
        "likelyBranches": ex_branches,
        "likelyCommits": ex_commits,
        "likelyPullRequests": ex_prs
    },
    {
        "name": "Create JIRA Webhook for Ticket Creation and Apply Change",
          "description": "",
        "likelyBranches": ex_branches,
        "likelyCommits": ex_commits,
        "likelyPullRequests": ex_prs
    },
    {
        "name": "Extract USE Embeddings for Each Unique Code Object",
          "description": "",
        "likelyBranches": ex_branches,
        "likelyCommits": ex_commits,
        "likelyPullRequests": ex_prs
    },
    {
        "name": "Move Association Pipeline to Association Controller --- Modularize even further ",
          "description": "",
        "likelyBranches": ex_branches,
        "likelyCommits": ex_commits,
        "likelyPullRequests": ex_prs
    },
    {
        "name": "Create Specs for Code Object Params Expected By Association Pipeline",
          "description": "",
        "likelyBranches": ex_branches,
        "likelyCommits": ex_commits,
        "likelyPullRequests": ex_prs
    },
    {
        "name": "Compute Semantic Similarity between Ticket and Code Object Embeddings",
          "description": "",
        "likelyBranches": ex_branches,
        "likelyCommits": ex_commits,
        "likelyPullRequests": ex_prs
    },
]


module_url = "https://tfhub.dev/google/universal-sentence-encoder/4"

use = hub.Module(module_url)

'''

unique_pull_requests = {}

unique_issues = {}

unique_commits = {}

unique_branches = {}


#map the index

unique_code_object_mapping = {
    "likelyPullRequests" : {},
    "likelyIssues": {},
    "likelyCommits": {},
    "likelyBranches": {}
}

for i, ticket in enumerate(tickets):

    for key in unique_code_object_mapping.keys():

        likely_code_objects = tickets[key]

        for co in likely_code_objects:

            if (co["_id"] not in unique_code_object_mapping[key]):

                unique_code_object_mapping[key][co["_id"]] = co

print(unique_code_object_mapping);
'''
'''
co_embedding_map = {}

for key in unique_code_object_mapping.keys():

    unique_code_objects = unique_code_object_mapping[key]

    co_keys = unique_code_objects.keys()

    embedded_co_names = use([ unique_code_objects[co_key].name for co_key in co_keys ])

    embedded_co_descs = use([ unique_code_objects[co_key].name + unique_code_objects[co_key].description for co_key in co_keys ])

    for i, co_key in enumerate(co_keys):

        co_embedding_map[co_key] = [ embedded_co_names[i], embedded_co_descs[i] ] 


#for optimization: can build one matrix for ticket embedded data, build another matrix for code object embedded data -- take cossim
 
embedded_ticket_names = use([ ticket.name for ticket in tickets ])

embedded_ticket_descs = use([ ticket.name + " " + ticket.description for ticket in tickets ])

for i, ticket in enumerate(tickets):

    embedded_ticket_name = embedded_ticket_names[i]

    embedded_ticket_desc = embedded_ticket_descs[i]

    co_key_and_score = []

    for key in unique_code_object_mapping.keys(): #do we put all of the same objects in the same array and sort or separate arrays?

        likely_code_objects = tickets[key]

        for co in likely_code_objects:

            [embedded_co_name, embedded_co_desc]  = co_embedding_map[co._id]

            score = 5 * cosine_similarity(embedded_co_name, embedded_ticket_name) + cosine_similarity(embedded_co_desc, embedded_ticket_desc)

            co_key_and_score.push({ score: score, co_key: co._id })
    
    co_key_and_score.sort(key= lambda x: x.score)

    print("TICKET", ticket.name)

    print("CODE OBJECTS SORTED BY SCORE", co_key_and_score)

    
'''



