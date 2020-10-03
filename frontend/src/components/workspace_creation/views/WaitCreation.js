import React, { Component } from 'react';

//styles
import styled from 'styled-components';

//actions
import { createDocument } from '../../../actions/Document_Actions';
import { getWorkspace } from '../../../actions/Workspace_Actions';

//router
import history from '../../../history';

//redux
import { connect } from 'react-redux';

//components
import { Oval } from 'svg-loaders-react';

class WaitCreation extends Component {

    async componentDidMount(){
        const { workspaceId, getWorkspace, createDocument, user } = this.props;

        await Promise.all([
            getWorkspace(workspaceId),
            createDocument({ authorId: user._id, title: "", root: true, workspaceId })
        ]);

        const { workspace: {setupComplete} } = this.props;

        if (setupComplete) history.push(`/workspaces/${workspaceId}`);

        this.interval = setInterval(this.pollWorkspace, 2000);
    }

    pollWorkspace = async () => {
        const { workspaceId, getWorkspace } = this.props;

        await getWorkspace(workspaceId);

        const { workspace } = this.props;
        const { setupComplete } = workspace;

        if (setupComplete){
            history.push(`/workspaces/${workspaceId}/dashboard`);
            clearInterval(this.interval);
        }
    }


    render(){
        return (
            <ContentContainer>
            <SubContentHeader>
                Creating your workspace...
            </SubContentHeader>
            <LoaderContainer>
                <Oval stroke="white"/>
            </LoaderContainer>
        </ContentContainer>
        )
    }
}

const mapStateToProps = (state, ownProps) => {
    const { workspaces, auth: {user} } = state;
    const { workspaceId } = ownProps;

    const workspace = workspaces[workspaceId];

    return {
        user,
        workspace
    }
}

export default connect(mapStateToProps, { getWorkspace, createDocument })(WaitCreation);

const ContentContainer = styled.div`
    display: flex;
    flex-direction: column;
    width: 100%;
`

const SubContentHeader = styled.div`
    font-size: 2.2rem;
    height: 3.5rem;
    margin-bottom: 0.5rem;
`

const LoaderContainer = styled.div`
    height: 6rem;
    width: 100%;
    display: flex;
    align-items: center;
`