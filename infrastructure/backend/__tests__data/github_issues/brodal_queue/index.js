
const brodalQueueIssueObjects = [
    {
        githubIssueNumber: 6,
        githubIssueTitle: "Open Issue",
        hasDirectAttachment: false,
    },
    {
        githubIssueNumber: 7,
        githubIssueTitle: "Moved Issue",
        hasDirectAttachment: false,
    },
    {
        githubIssueNumber: 8,
        githubIssueTitle: "Open and Markdown-linked",
        hasDirectAttachment: true,
        timelineScraped: false,
        directAttachmentIssueNumber: 1
    },
    {
        githubIssueNumber: 9,
        githubIssueTitle: "Open and Explicitly Linked",
        hasDirectAttachment: true,
        timelineScraped: true,
        directAttachmentIssueNumber: 9
    },
]

module.exports = {
    brodalQueueIssueObjects,
}