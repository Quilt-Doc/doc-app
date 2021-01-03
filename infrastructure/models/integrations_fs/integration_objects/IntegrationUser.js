const mongoose = require.main.require("mongoose")
const Schema = mongoose.Schema;
const { ObjectId } = Schema.Types;

var integrationUserSchema = new Schema({
    sourceId: String,
    source: { type: String, enum: ['github', 'jira', 'trello'] },
    userName: String,
    name: String,
    email: String,
    user: { type: ObjectId, ref: 'User'},
	created: {type: Date, default: Date.now},
});

var IntegrationUser = mongoose.model("IntegrationUser", integrationUserSchema);

module.exports = IntegrationUser;


// Final mapping from source --> IntegrationUser
/*
    "" --> "source": "github",
    "login" --> "userName",
    "id" --> "sourceId",
    "type" --> "githubUserType",
    "name" --> "userName",
    "email" --> "email",

*/

// Fields we care about:
/*
{
    "login": ,
    "id": ,
    "type": ,
    "name": ,
    "email": ,
}
*/

// Github GET User Response

// RAW
/*
{
  "login": "octocat",
  "id": 1,
  "node_id": "MDQ6VXNlcjE=",
  "avatar_url": "https://github.com/images/error/octocat_happy.gif",
  "gravatar_id": "",
  "url": "https://api.github.com/users/octocat",
  "html_url": "https://github.com/octocat",
  "followers_url": "https://api.github.com/users/octocat/followers",
  "following_url": "https://api.github.com/users/octocat/following{/other_user}",
  "gists_url": "https://api.github.com/users/octocat/gists{/gist_id}",
  "starred_url": "https://api.github.com/users/octocat/starred{/owner}{/repo}",
  "subscriptions_url": "https://api.github.com/users/octocat/subscriptions",
  "organizations_url": "https://api.github.com/users/octocat/orgs",
  "repos_url": "https://api.github.com/users/octocat/repos",
  "events_url": "https://api.github.com/users/octocat/events{/privacy}",
  "received_events_url": "https://api.github.com/users/octocat/received_events",
  "type": "User",
  "site_admin": false,
  "name": "monalisa octocat",
  "company": "GitHub",
  "blog": "https://github.com/blog",
  "location": "San Francisco",
  "email": "octocat@github.com",
  "hireable": false,
  "bio": "There once was...",
  "twitter_username": "monatheoctocat",
  "public_repos": 2,
  "public_gists": 1,
  "followers": 20,
  "following": 0,
  "created_at": "2008-01-14T04:33:35Z",
  "updated_at": "2008-01-14T04:33:35Z"
}


*/


