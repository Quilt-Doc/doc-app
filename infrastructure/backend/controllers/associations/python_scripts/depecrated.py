
'''

pr_keys = unique_pull_requests.keys()

pr_names = [ unique_pull_requests[key].name for key in pr_keys ]

pr_descs = [ unique_pull_requests[key].name + unique_pull_requests[key].description for key in pr_keys ]

embedded_pr_names = use(pr_names)

embedded_pr_descs = use(pr_descs)


issue_keys = unique_issues.keys()

issue_names = [ unique_issues[key].name for key in issue_keys ]

issue_descs = [ unique_issues[key].name + unique_issues[key].description for key in issue_keys ]

embedded_issue_names = use(issue_names)

embedded_issue_descs = use(issue_descs)


branch_keys = unique_branches.keys()

branch_names = [ unique_branches[key].name for key in branch_keys ]

branch_descs = [ unique_branches[key].name + unique_branches[key].description for key in branch_keys ]

embedded_branch_names = use(branch_names)

embedded_branch_descs = use(branch_descs)


commit_keys = unique_commits.keys()

commit_names = [ unique_commits[key].name for key in commit_keys ]

commit_descs = [ unique_commits[key].name + unique_commits[key].description for key in commit_keys ]

embedded_commit_names = use(commit_names)

embedded_commit_descs = use(commit_descs)

for i, ticket in enumerate(tickets):


    likely_pull_requests = ticket["likelyPullRequests"]

    for pr in likely_pull_requests:

        if (pr._id not in unique_pull_requests):

            unique_pull_requests[pr._id] = pr


    likely_issues = ticket["likelyIssues"]

    for issue in likely_issues:

        if (issue._id not in unique_issues):

            unique_issues[issue._id] = issue


    likely_commits = ticket["likelyCommits"]

    for commit in likely_commits:

        if (commit._id not in unique_commits):

            unique_commits[commit._id] = commit


    likely_branches = ticket["likelyBranches"]

    for branch in likely_branches:

        if (branch._id not in unique_branches):

            unique_branches[branch._id] = branch'''