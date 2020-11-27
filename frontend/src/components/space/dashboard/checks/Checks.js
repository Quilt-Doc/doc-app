import React, {Component} from 'react';

//icons
import { CgSearch } from 'react-icons/cg'

//styles
import styled from 'styled-components';
import chroma from 'chroma-js';
import { LIGHT_SHADOW_1 } from '../../../../styles/shadows';
import { APP_LIGHT_PRIMARY_COLOR } from '../../../../styles/colors';

//components
import CheckCard from './elements/CheckCard';
import CheckRightContent from './elements/CheckRightContent'

//actions
import { retrieveChecks } from '../../../../actions/Check_Actions';

//react-redux
import { connect } from 'react-redux';

//router
import { withRouter } from 'react-router-dom';
import { VscRepo } from 'react-icons/vsc';
import { FiChevronDown } from 'react-icons/fi';
import { RiRefreshLine } from 'react-icons/ri';
import { AiOutlinePullRequest } from 'react-icons/ai';
import { BsCardChecklist } from 'react-icons/bs';

// component that retrieve pull requests from version control
// and keeps track of doc/reference updating and deprecation with regard to the request
class Checks extends Component {
    constructor(props){
        super(props);
        this.state = {
            currentCheck: null,
            loaded: false
        }
    }

    componentDidMount = async () => {
        const { retrieveChecks, match, workspace } = this.props;
        const { workspaceId } = match.params;

        await retrieveChecks({ workspaceId, repositoryId: workspace.repositories[0]._id });

        const { checks } = this.props;
        const currentCheck = checks.length > 0 ? checks[0] : null;
        this.setState({ loaded: true, currentCheck});
    }

    renderChecks = () => {
        const { checks, workspace } = this.props;
        const { currentCheck } = this.state;
        return checks.map(check => {
            let {pusher} = check;
            let color = 0;
            workspace.memberUsers.map((user, i) => {
                if (user.username === pusher) {
                    pusher = user.firstName
                    color = i;
                }
            });
            return <CheckCard 
                active = {currentCheck._id === check._id} 
                setCheck = {() => this.setState({currentCheck: check})} 
                check = {check}
                pusher = {pusher}
                color = {color}
            />
        })
    }

    acquireUserIndex = (check) => {
        const { workspace } = this.props;
        let {pusher} = check;
        let color = 0;

        workspace.memberUsers.map((user, i) => {
            if (user.username === pusher) {
                pusher = `${user.firstName} ${user.lastName}`;
                color = i;
            }
        });

        return { pusher, color }
    }
    render(){
        const { currentCheck } = this.state;

        let user;
        let color;

        if (currentCheck) { 
            let infoObj = this.acquireUserIndex(currentCheck);
            user = infoObj.pusher;
            color = infoObj.color;
        } 

        {/*
                            borderColor = {borderColor}  
                            active = {this.state.open} 
                        onClick = {(e) => this.openMenu(e)}*/}

        return(
            <>
                <Header>
                    Git Tasks
                    <LeftSide>
                        <Switch>
                            <PullSwitch>    
                                <AiOutlinePullRequest/>
                            </PullSwitch>       
                            <CheckSwitch>
                                <BsCardChecklist/>
                            </CheckSwitch>
                        </Switch>
                        <SearchbarWrapper>
                            <SearchIcon>
                                <CgSearch/>
                            </SearchIcon>
                            <Searchbar placeholder = {"Filter tasks.."}/>
                        </SearchbarWrapper>
                    </LeftSide>
                </Header>
                <BodyContainer>
                    { currentCheck ? 
                        <>
                            <CheckBar>
                                <RepositoryMenuButton>
                                    <RepoIconBorder>    
                                        <VscRepo/>
                                    </RepoIconBorder>
                                
                                    <LimitedTitle>{"doc-app"}</LimitedTitle>
                                    <FiChevronDown
                                            style = {{
                                                marginLeft: "0.5rem",
                                                marginTop: "0.3rem",
                                                fontSize: "1.45rem"
                                            }}
                                        />
                                </RepositoryMenuButton>
                                { this.renderChecks() }
                            </CheckBar>
                            <CheckRightContent 
                                color = {color}
                                user = {user}
                                check = {currentCheck}
                            />
                        </>
                        :
                        <Centered>
                            <Message>Push code to your repository to see checks</Message>
                        </Centered>
                    }
                </BodyContainer>
            </>
        )
    }    
}

{/*  <RepositorySection>
                                    <MenuButton >
                                        <IconBorder>    
                                            <VscRepo/>
                                        </IconBorder>
                                        <LimitedTitle>doc-app</LimitedTitle> 
                                        <FiChevronDown 
                                                style = {{
                                                    marginLeft: "0.5rem",
                                                    marginTop: "0.3rem",
                                                    fontSize: "1.45rem"
                                                }}
                                            />
                                    </MenuButton>
                                            </RepositorySection>*/}

const mapStateToProps = (state, ownProps) => {
    const { workspaces, checks } = state;
    const { workspaceId } = ownProps.match.params;

    const workspace = workspaces[workspaceId];

    return {
        checks: Object.values(checks),
        workspace
    }
}

export default withRouter(connect(mapStateToProps, { retrieveChecks })(Checks));

const LimitedTitle = styled.div`
    opacity: 1;
    text-overflow: ellipsis;
    white-space: nowrap;
    overflow: hidden;
    max-width: 22rem;
`

const RepoIconBorder = styled.div`
    font-size: 1.8rem;
    margin-right: 0.7rem;
    width: 2rem;
    display: flex;
    align-items: center;
    margin-top: 0.1rem;
`

const RepositoryMenuButton = styled.div`
    display: flex;
    align-items: center;
    font-size: 1.4rem;
    padding: 0rem 1.5rem;
    border-radius: 0.4rem;
    height: 3.5rem;
    font-weight: 500;
    display: inline-flex;
    background-color: ${props => props.active ? chroma('#6762df').alpha(0.2) : ""};
    &:hover {
        background-color: ${props => props.active ?  chroma('#6762df').alpha(0.2) : "#f7f9fb" };
    }
    cursor: pointer;
    border: 1px solid ${props => props.active ? chroma('#6762df').alpha(0.2) : '#172A4e'}; 
    margin-bottom: 2rem;
`


const Switch = styled.div`
    margin-right: 2rem;
    display: flex;
    align-items: center;
`

const PullSwitch = styled.div`
    width: 5rem;
    height: 3rem;
    background-color: ${chroma('#2684FF').alpha(0.15)};
    border-top-left-radius: 0.4rem;
    border-bottom-left-radius: 0.4rem;
    display: flex;
    align-items: center;
    justify-content: center;

    &:hover {
        background-color: ${chroma('#2684FF').alpha(0.25)};
    }
    cursor: pointer;
`

const CheckSwitch = styled.div`
    width: 5rem;
    height: 3rem;
    background-color: ${chroma('#2684FF').alpha(0.45)};
    border-top-right-radius: 0.4rem;
    border-bottom-right-radius: 0.4rem;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
`

const Top = styled.div`
    padding-top: 5rem;
    height: 10rem;
    width: 100%;
    display: flex;
    align-items: center;
`


const MenuButton = styled.div`
    display: flex;
    align-items: center;
    font-size: 1.4rem;
    padding: 0rem 1.5rem;
    border-radius: 0.4rem;
    height: 3.5rem;
    font-weight: 500;
    display: inline-flex;
    background-color: ${props => props.active ? chroma('#6762df').alpha(0.2) : ""};
    &:hover {
        background-color: ${props => props.active ?  chroma('#6762df').alpha(0.2) : "#F4F4F6" };
    }
    cursor: pointer;
    border: 1px solid #172A4e;
    margin-left: auto;
`

const IconBorder = styled.div`
    font-size: 1.8rem;
    margin-right: 0.7rem;
    width: 2rem;
    display: flex;
    align-items: center;
    margin-top: 0.1rem;
`

const RepositorySection = styled.div`
    height: 6rem;
    display: flex;
    align-items: center;
    padding-left: 2rem;
    border-bottom: 1px solid #E0E4E7;
    width: 100%;
`

const Message = styled.div`
    opacity: 0.5;
    font-size: 1.4rem;
    font-weight: 500;
`

const Centered = styled.div`
    height: 100%;
    width: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
`

const CheckBar = styled.div`
    overflow-y: scroll;
    padding: 0rem 0.5rem;
    /*
    padding: 2rem;
    padding-top: 3rem;
    */
    /*
    background-color: #f7f9fb;
    border: 1px solid #E0E4E7;
    */
    width: 50rem;
    height: calc(85vh - 5.5rem - 4rem)
`

const LeftBar = styled.div`
    width: 50rem;
    min-height: 100%;
    border-top-left-radius: 0.5rem;
    border-bottom-left-radius: 0.5rem;
`

const Header = styled.div`
    min-height: 4.5rem;
    max-height: 4.5rem;
    display: flex;
    align-items: center;
    font-size: 1.7rem;
    font-weight: 600;
    margin-bottom: 1rem;
    /*
    padding-left: 4rem;
    padding-right: 4rem;
    */
`

const LeftSide = styled.div`
    margin-left: auto;
    display: flex;
    align-items: center;
    padding-right: 3rem;
`

const SearchbarWrapper = styled.div`
    background-color: ${APP_LIGHT_PRIMARY_COLOR};
    height: 3.5rem;
    border-radius: 3rem;
    &:hover {
        box-shadow: ${LIGHT_SHADOW_1}
    }
    display: flex;
    align-items: center;
`

const Searchbar = styled.input`
    background-color: transparent;
    width: 20rem;
    height: 3.5rem;
    padding-right: 1rem;
    outline: none;
    border: none;
    &::placeholder {
        color: #172A4e;
        opacity: 0.6;
    }
    font-family:-apple-system,BlinkMacSystemFont, sans-serif;
`

const BodyContainer = styled.div`
    display: flex;
    height: 100%;
`

const SearchIcon = styled.div`
    margin-left: 1.5rem;
    width: 3.2rem;
    font-size: 2rem;
    display: flex;
    height: 3.5rem;
    align-items: center;
`