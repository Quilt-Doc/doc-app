//react
import React, { Component } from 'react';
import styled from 'styled-components';

//components
import { CSSTransition } from 'react-transition-group';

//views
import ChooseProvider from './views/ChooseProvider';
import ChooseRepos from './views/ChooseRepos';
import ChooseName from './views/ChooseName';
import WaitCreation from './views/WaitCreation';

//icons
import logoSVG from '../../images/final_logo.svg';

//component that is used to go through the flow of workspace creation 
//(choosing repos, name workspace, etc)
class WorkspaceCreation extends Component {

    constructor(props){
        super(props);

        this.state = {
            // determines the current view of workspace creation
            page: 0,
            // the repositories selected for workspace creation
            active: [],
            // the id of the created workspace
            createdWorkspaceId: null
        }
    }

    setCreatedWorkspaceId = (createdWorkspaceId) => {
        this.setState({createdWorkspaceId});
    }

    setActive = (active) => {
        this.setState({active});
    }

    // changes the view
    changePage = (page) => {
        this.setState({page});
    }

    // wraps each view of workspace creation with a sliding pane animation
    renderTransitionWrapper = (into, appear, component) => {
        return (
            <CSSTransition
                in = {into}
                unmountOnExit
                enter = {true}
                exit = {false}     
                appear = {appear}  
                timeout = {300}
                classNames = "slidepane"
             >
                 <div style ={{width: "100%"}}>
                    {component}
                 </div>
             </CSSTransition>
        );
    }

    // renders each view during workspace creation process
    renderSubContent = () => {
        let {page, active, createdWorkspaceId} = this.state;

        let provider = <ChooseProvider changePage = {this.changePage}/>;
        let repos = <ChooseRepos active = {active} setActive = {this.setActive} changePage = {this.changePage}/>;
        let name = <ChooseName active = {active} setCreatedWorkspaceId = {this.setCreatedWorkspaceId} changePage = {this.changePage}/>;
        let wait = <WaitCreation  workspaceId = {createdWorkspaceId}/>;

        return (
            <>
                {this.renderTransitionWrapper(page === 0, true, provider)}
                {this.renderTransitionWrapper(page === 1, false, repos)}
                {this.renderTransitionWrapper(page === 2, false, name)}
                {this.renderTransitionWrapper(page === 3, false, wait)}
            </>
        );
    }   


    render(){
        const {page} = this.state;
        return(
            <Container>
                <Top>
                    <StyledIcon src = {logoSVG}/>
                    <BrandName>
                        quilt
                    </BrandName>
                </Top>
                <Container2>
                    <CreateBox>
                        <Content>
                            <Progress>
                                    <Bar active = {true}/>
                                    <Bar active = {page > 0} />
                                    <Bar active = {page > 1} />
                            </Progress>
                            <Header>
                                Create a new workspace
                            </Header>
                            <SubHeader>
                                Start documenting your code in three easy steps.
                            </SubHeader>
                            <SubContent>   
                                {this.renderSubContent()}
                            </SubContent>
                        </Content>
                    </CreateBox>
                </Container2>
            </Container>
        );   
    }
}

export default WorkspaceCreation;

const BrandName = styled.div`
    font-size: 3.5rem;
    letter-spacing: 1px;
    font-weight: 400;
    margin-top: 0.3rem;
`

const StyledIcon = styled.img`
    max-width: 4rem;
    margin-right: 1.33rem;
    margin-top: 1.5rem;
`

const Container = styled.div`
    background-color:#16181d;
    display: flex;
    flex: 1;
    display: flex;
    flex-direction: column;
    color: white;
`


const Top = styled.div`
    height: 9rem;
    padding-left: 8.5rem;
    padding-right: 8.5rem;
    color:white;
    display: flex;
    align-items: center;
`


const Progress = styled.div`
    display: flex;
`

const Bar = styled.div`
    background-color: ${props => props.active ? "#19e5be" : "#2e323d"};
    width: 4rem;
    height: 0.33rem;
    border-radius: 0.2rem;
    margin-right: 1rem;
    &:first-of-type {
        margin-left: auto;
    }
    &:last-of-type {
        margin-right: 0rem;
    }
    transition: background-color 0.2s ease-in;
`

const Container2 = styled.div`
    background-color:#16181d;
    display: flex;
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow-y: scroll;
    padding-bottom: 20rem;
`

const CreateBox = styled.div`
    background-color: white
    height: 60rem;
    width: 100rem;
    margin-top: 3rem;
    border-radius: 0.4rem;
    align-self: center;
    display: flex;
    justify-content: center;
`

const Content = styled.div`
    width: 60rem;
    color: white;
    height: 20rem;
    padding-top: 5rem;
`

const Header = styled.div`
    font-size: 2.6rem;
    height: 4.5rem;
    display: flex;
    align-items: center;
    margin-bottom: 1rem;
`

const SubHeader = styled.div`
    color: white;
    font-size: 1.8rem;
    font-weight: 400;
    opacity: 0.9;
`

const SubContent = styled.div`
    margin-top: 5rem;
    display: flex;
`