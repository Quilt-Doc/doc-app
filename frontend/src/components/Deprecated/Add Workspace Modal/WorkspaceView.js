import React from 'react';

//styles 
import styled from "styled-components"

//components
import WorkspaceModal from './WorkspaceModal';

//actions
import { retrieveWorkspaces } from '../../../actions/Workspace_Actions';
import { retrieveReferences } from '../../../actions/Reference_Actions';

//react-router
import { Link } from 'react-router-dom';
import history from '../../../history';

//misc
import { connect } from 'react-redux';

//icons
import w1 from '../../images/w1.svg';
import w2 from '../../images/w2.svg';
import w3 from '../../images/w3.svg';
import w4 from '../../images/w4.svg';
import w5 from '../../images/w5.svg';
import w6 from '../../images/w6.svg';
import w7 from '../../images/w7.svg';
import w8 from '../../images/w8.svg';
import w9 from '../../images/w9.svg';
import w10 from '../../images/w10.svg';
import w11 from '../../images/w11.svg';
import w12 from '../../images/w12.svg';


class WorkspaceView extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
           modalDisplay: '',
           loaded: false
        }

        this.icons = [w1, w2, w3, w4, w5, w6, w7, w8, w9, w10, w11, w12]
    }

    async componentDidMount() {
        await this.props.retrieveWorkspaces({memberUserIds: [this.props.user._id]})
        this.setState({loaded: true})
    }

    renderLink(workspace) {
        return `/workspaces/${workspace._id}/repository/${workspace.repositories[0]._id}/dir/`
    }

    renderWorkspaces() {
        let workspacesJSX = []
        this.props.workspaces.map((workspace, i) => {
            workspacesJSX.push(
                <StyledLink key = {i} to = {this.renderLink(workspace)}><WorkspaceBox >
                    <StyledIcon src = {this.icons[workspace.icon]}/>
                    {workspace.name}
                </WorkspaceBox></StyledLink>
            )
            return
        })

        workspacesJSX.push( <WorkspaceBox fd = {"row"} opacity = {0.5} onClick = {() => this.setState({modalDisplay: ''})}>
                                <ion-icon style={{'fontSize':'2rem', 'marginRight': '0.5rem'}} name="add-outline"></ion-icon>
                                Create Workspace
                            </WorkspaceBox>
        )
        
        let allJSX = []
        for (let i = 0; i < workspacesJSX.length; i+= 3) {
            allJSX.push(<WorkspaceRow>
                {workspacesJSX.slice(i, i + 3).map(workspaceJSX => {
                    return workspaceJSX
                })}
            </WorkspaceRow>)
        }
        return allJSX
    }



    clearModal() {
        this.setState({modalDisplay: 'none'})
    }

    checkCreate = () => {
        let search = history.location.search
        let params = new URLSearchParams(search)
        let creating = params.get('create') 
        if (creating !== undefined && creating !== null){
            return true
        }
        return false
    }   

    render() {
        if (this.state.loaded){
            return (
                <>
                    <Container>
                        <Header>Workspaces</Header>
                        <WorkspaceContainer>
                            {this.renderWorkspaces()}
                        </WorkspaceContainer>
                    </Container>
                    {this.checkCreate() &&
                        <WorkspaceModal 
                            clearModal = {() => this.clearModal()}
                            modalDisplay = {this.state.modalDisplay}
                        />
                    }
                </>
            )
        }
        return null
    }
}


const mapStateToProps = (state) => {
    return {
        workspaces: Object.values(state.workspaces),
        user: state.auth.user,
        references: Object.values(state.references)
    }
}

export default connect(mapStateToProps, { retrieveWorkspaces, retrieveReferences})(WorkspaceView);


const StyledIcon = styled.img`
    width: 5rem;
    margin-bottom: 1.8rem;
`

const Header = styled.div`
    font-size: 2.5rem;
    color: #172A4E;
    margin-bottom: 5rem;
`

const Container = styled.div`
    margin: 0 auto;
    margin-top: 4rem;
`

const WorkspaceContainer = styled.div`
    background-color:  #F7F9FB;
    margin-top: 3rem;
    display: flex;
    flex-direction: column;
    border-radius: 0.3rem;
    padding-bottom: 4rem;
    width: 87rem;

`

const WorkspaceRow = styled.div`
    display: flex;
    margin-top: 4rem;
`

const WorkspaceBox = styled.div`
    background-color: white;
    margin-left: 4rem;
    margin-right: 4rem;
    position: relative;
    box-shadow: rgba(9, 30, 66, 0.31) 0px 0px 1px 0px, rgba(9, 30, 66, 0.25) 0px 1px 1px 0px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    width: 21rem;
    height: 14rem;
    display: flex;
    border-radius: 5px;
    transition: box-shadow 0.1s ease, transform 0.1s ease;
    &:hover {
        cursor: pointer;
        box-shadow: rgba(9, 30, 66, 0.31) 0px 0px 1px 0px, rgba(9, 30, 66, 0.25) 0px 8px 16px -6px;
        opacity: 1;
    }
    font-size: 1.5rem;
    color: #172A4E;
    font-weight: 500;
    opacity: ${props => props.opacity};
    flex-direction: ${props => props.fd};
`  

const StyledLink = styled(Link)`
    text-decoration: none;
`