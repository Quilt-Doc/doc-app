import { api } from '../apis/api';

export const getWorkspaceJiraSites = async (formValues) => {

    const { workspaceId } = formValues;

    console.log(`Getting Jira sites for workspaceId: ${workspaceId}`);

    var jiraSiteResponse;
    try {
        jiraSiteResponse = await api.get(`/integrations/${workspaceId}/jira`);
    }
    catch (err) {
        console.log('Error getting Workspace Jira Sites');
        throw err;
    }
    if (!jiraSiteResponse.data.success) {
        console.log(`Error getting Workspace Jira Sites: ${jiraSiteResponse.data.result}`);
    }
    return jiraSiteResponse.data.result;
}

export const getJiraSiteIssues = async (formValues) => {
    const { workspaceId, cloudId } = formValues;

    console.log(`getJiraSiteIssues received - workspaceId, cloudId: ${workspaceId}, ${cloudId}`);

    var jiraSiteIssueResponse;
    try {
        // /integrations/:workspaceId/jira/get
        jiraSiteIssueResponse = await api.post(`/integrations/${workspaceId}/jira/get`, { cloudId });
    }
    catch (err) {
        console.log("Error getting Jira Site Issues");
        throw err;
    }

    if (!jiraSiteIssueResponse.data.success) {
        console.log(`Error getting Workspace Jira Site Issues: ${jiraSiteIssueResponse.data.error}`);
    }

    var issueSummaries = jiraSiteIssueResponse.data.result.map( (issueObj, idx) => {
        if (idx == 0) {
            console.log(`Issue Object: ${JSON.stringify(issueObj)}`);
        }
        return issueObj.fields.summary;
    });
    
    console.log(`Jira Issue Summaries: ${JSON.stringify(issueSummaries)}`);

    return issueSummaries;
}