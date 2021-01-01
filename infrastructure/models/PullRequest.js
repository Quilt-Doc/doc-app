const mongoose = require.main.require("mongoose");
const Schema = mongoose.Schema;
const { ObjectId } = Schema.Types;

/* Suggested Spec:
name: String
description: String —- top level comment of PR
sourceCreationDate: Date
sourceCloseDate: Date
sourceUpdateDate: Date

labels: [IntegrationLabel]
milestone: String // Temporarily ignoring this
members: [IntegrationUser] —- all unique, relevant people (reviewers, assignees, creator, etc)
assignees: [IntegrationUser]
creator: IntegrationUser
comments: [IntegrationComment]
sourceId: Number —- replaces pullRequestObjId AND pullRequestNumb
fileChanges: [FileChange]
commits: [Commit]

created
installationId
status
headRef
baseRef
checks
repository
*/

let pullRequestSchema = new Schema({
  created: { type: Date, default: Date.now },

  installationId: { type: Number, required: true },
  checks: [{ type: ObjectId, ref: "Check" }],
  repository: { type: ObjectId, ref: "Repository", required: true },

  pullRequestId: { type: Number, required: true },
  number: { type: Number, required: true },
  // sourceId: Number —- replaces pullRequestObjId AND pullRequestNumb

  htmlUrl: { type: String },
  issueUrl: { type: String },
  state: { type: String, enum: ["open", "closed"], required: true },
  locked: { type: Boolean },
  title: { type: String },
  body: { type: String },
  labels: [{ type: String }],
  createdAt: { type: Date },
  updatedAt: { type: Date },
  closedAt: { type: Date },
  mergedAt: { type: Date },
  mergeCommitSha: { type: String },
  labels: [{ type: String }],

  headRef: { type: String, required: true },
  headLabel: { type: String, required: true },
  baseRef: { type: String, required: true },
  baseLabel: { type: String, required: true },

  draft: { type: Boolean },
  merged: { type: Boolean },
  commentNum: { type: Number },
  reviewCommentNum: { type: Number },
  commitNum: { type: Number },
  additionNum: { type: Number },
  deletionNum: { type: Number },
  changedFileNum: { type: Number },

  // KARAN TODO: Verify each of these being generated correctly
  user: { type: ObjectId, ref: "IntegrationUser" },
  comments: [{ type: ObjectId, ref: "IntegrationComment" }],
  commits: [{ type: ObjectId, ref: "Commit" }],
  fileChanges: [{ type: ObjectId, ref: "FileChange" }],
  members: [{ type: ObjectId, ref: "IntegrationUser" }],
  assignees: [{ type: ObjectId, ref: "IntegrationUser" }], // We ignore the assignee field since it's always a subset of the content of this field, which is an empty array when there are no assignees
  requestedReviewers: [{ type: ObjectId, ref: "IntegrationUser" }],
  mergedBy: { type: ObjectId, ref: "IntegrationUser" },
});

// Final mapping from source --> PullRequest
/*
    "" --> "created": Date.now,
    "" --> "installationId",
    "id" --> "pullRequestObjId",
    "html_url" --> "htmlUrl",
    ""
    "state" --> "state",
    "id" --> "sourceId",
    "type" --> "githubUserType",
    "name" --> "userName",
    "email" --> "email",

*/

// Fields we care about:
// Note: skipping milestone and team related fields for now
/*
{
    "id",
    "html_url": ,
    "issue_url": ,
    "number": ,
    "state": ,
    "locked": ,
    "title": ,
    "user": ,
    "body": ,
    "labels": ,
    "created_at": ,
    "updated_at": ,
    "closed_at": ,
    "merged_at": ,
    "merge_commit_sha": ,
    "assignees": , // We ignore the assignee field since it's always a subset of the content of this field, which is an empty array when there are no assignees
    "requested_reviewers": ,
    "head": ,
    "base": ,
    "draft": ,
    "merged": ,
    "merged_by": ,
    "comments": 3,
    "review_comments": 9,
    "commits": 5,
    "additions": 57,
    "deletions": 24,
    "changed_files": 8
}
*/

// RAW
/*
[
  'url',                   'id',                  'node_id',
  'html_url',              'diff_url',            'patch_url',
  'issue_url',             'commits_url',         'review_comments_url',
  'review_comment_url',    'comments_url',        'statuses_url',
  'number',                'state',               'locked',
  'title',                 'user',                'body',
  'labels',                'milestone',           'active_lock_reason',
  'created_at',            'updated_at',          'closed_at',
  'merged_at',             'merge_commit_sha',    'assignee',
  'assignees',             'requested_reviewers', 'requested_teams',
  'head',                  'base',                '_links',
  'author_association',    'draft',               'merged',
  'mergeable',             'rebaseable',          'mergeable_state',
  'merged_by',             'comments',            'review_comments',
  'maintainer_can_modify', 'commits',             'additions',
  'deletions',             'changed_files'
]

*/

let PullRequest = mongoose.model("PullRequest", pullRequestSchema);

module.exports = PullRequest;
