import React, { Component } from 'react';

//styles
import styled from 'styled-components';

//redux
import { connect } from 'react-redux';

//actions
import { retrieveWorkspaces } from '../../../actions/Workspace_Actions';

//router
import { Link } from 'react-router-dom';
import history from '../../../history';

//icons
import { RiFileList2Line, RiFlagLine } from 'react-icons/ri';
import { FiPlus } from 'react-icons/fi';

import { api } from '../../../apis/api';

import axios from 'axios';

class Workspaces extends Component {
    constructor(props){
        super(props);
        this.state = {
            loaded: false,
            files: [],
        }
    }

    async componentDidMount() {
        const { retrieveWorkspaces, user: {_id} } = this.props;
        await retrieveWorkspaces({memberUserIds: [_id]});
        this.setState({loaded: true});
    }

    renderRelevantDocs = (workspace) => {
        return (
            <WorkspaceDocuments>
                <Document>
                    <RiFileList2Line
                        style = {{
                                marginRight: "0.7rem",
                                fontSize: "1.6rem",
                                color: 'white',
                            }}
                    />
                    Semantic
                </Document>
                <Document>
                <RiFileList2Line
                        style = {{
                                marginRight: "0.7rem",
                                fontSize: "1.6rem",
                                color: 'white',
                            }}
                    />
                    Backend
                </Document>
                <Document>
                <RiFileList2Line
                        style = {{
                                marginRight: "0.7rem",
                                fontSize: "1.6rem",
                                color: 'white',
                            }}
                    />
                    Controller
                </Document>
            </WorkspaceDocuments>
        )
    }

    renderSpaces = () => {
        let { workspaces } = this.props;
        workspaces = workspaces.filter(space => space.setupComplete);
        if (workspaces.length > 0) {
            return workspaces.map(space => {
                return (
                    <Space to = {`/workspaces/${space._id}/dashboard`}>
                        <WorkspaceDetail>
                            <WorkspaceIcon>{space.name[0]}</WorkspaceIcon>
                            <WorkspaceName>{space.name}</WorkspaceName>
                        </WorkspaceDetail>
                    </Space>
                )
            })
        } else {
            return (
                <Space opacity = {0.6} to = {`/create_workspace`}>
                    <WorkspaceDetail>
                        <WorkspaceIcon2><FiPlus/></WorkspaceIcon2>
                        <WorkspaceName>Create a Workspace</WorkspaceName>
                    </WorkspaceDetail>
                </Space>
            )
        }
    }

    userLogout = async () => {
        await logout();
        history.push(`/login`);
    }

    uploadDocumentRequest = ({ file, name }) => {
        console.log('UPLOAD DOCUMENT REQUEST');
        let data = new FormData();
        // document?
        data.append('attachment', file);
        data.append('documentId', '5f7801662224c343b40f0703');
        data.append('workspaceId', '5f7801662224c343b40f0703');
        data.append('name', name);
        console.log('POSTING');

        const config = {
            headers: {
                'content-type': 'multipart/form-data'
            },
            withCredentials: true
        }

        axios.post('http://localhost:3001/api/uploads/create_attachment', data, config).then(response => {
            console.log('RESPONSE: ');
            console.log(response.data);
        });
    }


    // Component method
    handleFileUpload = (event /*{ target: files }*/) => {
        
        const file = event.target.files[0];
        console.log('FILE SENDING: ');
        console.log(file);
        this.uploadDocumentRequest({
            file: file,
            name: 'attachment'
        });
    }

    render(){
        const {loaded} = this.state;
        return (
            <ContentContainer>
                <Content>
                    <Header>
                        Workspaces
                        <AddButton onClick = {() => history.push('/create_workspace')}>
                            <FiPlus/>
                        </AddButton>
                    </Header>
                    <SpaceContainer>
                        {loaded && this.renderSpaces()}
                    </SpaceContainer>


                            <input type="file" id="file" name="file" multiple /*onChange={this.handleChange}*/ onChange={this.handleFileUpload} />
                </Content>
            </ContentContainer>
        )
    }
}


const mapStateToProps = (state) => {
    const { workspaces, auth: {user} } = state;
    return {
        workspaces: Object.values(workspaces),
        user
    }
}

export default connect(mapStateToProps, { retrieveWorkspaces })(Workspaces);

const Header = styled.div`
    font-size: 2.6rem;
    height: 4.5rem;
    display: flex;
    align-items: center;
    margin-bottom: 1rem;
`

const AddButton = styled.div`
    margin-left: auto;
    border-radius: 50%;
    height: 4rem;
    width: 4rem;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow:0 2px 2px 0 rgba(0, 0, 0, 0.14), 0 1px 5px 0 rgba(0, 0, 0, 0.12), 0 3px 1px -2px rgba(0, 0, 0, 0.3);
    background-color: #23262e;
    font-size: 2.1rem;
    cursor: pointer;
    &:hover {
        box-shadow: 0 6px 10px 0 rgba(0, 0, 0, 0.14), 0 1px 18px 0 rgba(0, 0, 0, 0.12), 0 3px 5px -1px rgba(0, 0, 0, 0.4);
    }
`


const Space = styled(Link)`
    box-shadow:0 2px 2px 0 rgba(0, 0, 0, 0.14), 0 1px 5px 0 rgba(0, 0, 0, 0.12), 0 3px 1px -2px rgba(0, 0, 0, 0.3);
    height: 12rem;
    width:100%;
    border-radius: 0.4rem;
    background-color: #1d1f26;
    padding: 2rem;
    display: flex;
    flex-direction: column;
    cursor: pointer;
    &:hover {
        opacity: 1;
        box-shadow: 0 6px 10px 0 rgba(0, 0, 0, 0.14), 0 1px 18px 0 rgba(0, 0, 0, 0.12), 0 3px 5px -1px rgba(0, 0, 0, 0.4);
    }
    text-decoration: none;
    outline: none;
    color: white;
    margin-bottom: 2rem;
    &:last-of-type {
        margin-bottom: 10rem;
    }
    opacity: ${props => props.opacity};
`


const Metric =styled.div`
    font-size: 1.35rem;
    font-weight: 500;
    display: flex;
    align-items: center;
`

const Number = styled.div`
    width: 2rem;
`

const WorkspaceDetail = styled.div`
    display: flex;
    align-items: center;
`

const WorkspaceDocuments = styled.div`
    display: flex;
    margin-top: auto;
`

const Document = styled.div`
    border: 1px solid #3e4251;
    background-color: #23262f;
    padding: 0.6rem 1rem;
    width: 13.5rem; 
    margin-right: 1.5rem;
    border-radius: 0.3rem;
    display: flex;
    align-items: center;
    font-size: 1.45rem;
    font-weight: 500;
    &:first-of-type {
        margin-left: auto;
    }
    &:last-of-type {
        margin-right: 0rem;
    }
    &:hover {
        background-color: #1d1f26;
        cursor: pointer;
    }
`

const WorkspaceName = styled.div`
    font-size: 1.52rem;
    font-weight: 600;
    color: white;
`

const WorkspaceIcon = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    height: 2.9rem;
    width: 2.9rem;
    background-color: #6762df;
    border-radius: 0.3rem;
    margin-right: 1.3rem;
    font-size: 1.3rem;
`


const WorkspaceIcon2 = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    height: 2.9rem;
    width: 2.9rem;
    border: 1px solid white;
    border-radius: 0.3rem;
    margin-right: 1.3rem;
    font-size: 1.3rem;
    color: white;
`

const WorkspaceStats = styled.div`
    display: flex;
    margin-left: auto;
`

const ContentContainer = styled.div`
    width: 100%;
    height: 100%;
    padding-top: 3rem;
    display: flex;
    justify-content: center;
    padding-left: 4.5rem;
    padding-right: 4.5rem;
`

const Content = styled.div`
    width: 40rem;
`

const SpaceContainer = styled.div`
    margin-top: 3.5rem;
`