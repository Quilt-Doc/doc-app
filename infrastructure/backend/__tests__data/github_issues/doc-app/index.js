
const docAppIssueObjects = [
    {
        githubIssueNumber: 1,
        githubIssueTitle: "Open and Empty",
        hasDirectAttachment: false,
    },
    {
        githubIssueNumber: 2,
        githubIssueTitle: "Closed and Empty",
        hasDirectAttachment: false,
    },
    {
        githubIssueNumber: 3,
        githubIssueTitle: "Open and Full",
        hasDirectAttachment: false,
    },
    {
        githubIssueNumber: 4,
        githubIssueTitle: "Closed and Full",
        hasDirectAttachment: false,
    },
    {
        githubIssueNumber: 5,
        githubIssueTitle: "Open with Labels",
        hasDirectAttachment: false,
    },
    {
        githubIssueNumber: 6,
        githubIssueTitle: "Closed with Labels",
        hasDirectAttachment: false,
    },
    {
        githubIssueNumber: 7,
        githubIssueTitle: "Open and Markdown-linked",
        timelineScraped: false,
        hasDirectAttachment: true,
        directAttachmentIssueNumber: 3,
    },
    {
        githubIssueNumber: 8,
        githubIssueTitle: "Open and Explicitly Linked",
        timelineScraped: false,
        hasDirectAttachment: false,

    },
]

module.exports = {
    docAppIssueObjects,
}