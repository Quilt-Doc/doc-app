import React, { Component } from 'react';

//styles
import styled from 'styled-components';

//actions
import { createWorkspace } from '../../../actions/Workspace_Actions';

//redux
import { connect } from 'react-redux';

// part of the workspace creation where name of workspace is inputted and workspace is created
class ChooseName extends Component {

    createWorkspace = async () => {
        const {changePage, installations, createWorkspace, user, active, setCreatedWorkspaceId} = this.props;

        const installationId = installations.filter(inst => inst.account.type == 'User' 
                    && inst.account.id == user.profileId)[0].id;
        
        const name = this.input.value;

        if (name === "") {
            alert("Please enter a workspace name");
        } else {
            const workspace = await createWorkspace({installationId, creatorId: user._id, repositoryIds: active, name}, true);
            setCreatedWorkspaceId(workspace._id);
            changePage(3);
        }
    }

    render(){
        return(
            <ContentContainer>
                <SubContentHeader>
                    Name your workspace
                </SubContentHeader>
                <SubContentText>
                    And thats it! Enjoy.
                </SubContentText>
                <NameInput ref = {(node) => this.input = node} spellCheck = {false} autoFocus placeholder = 
                    {"workspace name"}/>
                <NextButton onClick = {this.createWorkspace}>
                    Create
                </NextButton>
            </ContentContainer>
        )
    }
}
/*
    const installationId = installations.filter(inst => inst.account.type === 'User' 
                    && inst.account.id == user.profileId)[0].id;*/
//const {name, creatorId, installationId, repositoryIds } = req.body;

const mapStateToProps = (state) => {
    return {
        user: state.auth.user,
        installations: state.auth.installations
    }
}

export default connect(mapStateToProps, { createWorkspace })(ChooseName);


const NameInput = styled.input`
    height: 4.5rem;
    font-size: 1.7rem;
    display: flex;
    align-items: center;
    background-color: #23262f;
    padding-left: 2rem;
    padding-right: 2rem;
    color: white;
    border-radius: 0.3rem;
    border: 2px solid #3e4251;
    letter-spacing: 0.5px;
    outline: none;
    margin-top: 5rem;
    &::placeholder {
        color: white;
        opacity: 0.3;
    }
`

const NextButton = styled.div`
    background-color: #23262f;
    height: 3.5rem;
    border-radius: 0.4rem;
    display: inline-flex;
    border-radius: 0.3rem;
    margin-top: 5rem;
    font-size: 1.6rem;
    display: inline-flex;
    align-items: center;
    padding-left: 2rem;
    padding-right: 2rem;
    font-weight: 500;
    border: 1px solid #5B75E6;
    cursor: pointer;
    &:hover {
        background-color: #2e323d;
    }
`

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

const SubContentText = styled.div`
    color: white;
    font-size: 1.8rem;
    font-weight: 400;
    line-height: 1.6;
    opacity: 0.9
`
