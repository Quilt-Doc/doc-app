import React from 'react';
import styled from 'styled-components';

//images
import {ImGithub} from 'react-icons/im';
import {IoLogoBitbucket} from 'react-icons/io';
import {RiGitlabFill} from 'react-icons/ri';

//actions
import {checkInstallation} from '../../../actions/Auth_Actions';
import { retrieveCreationRepositories } from '../../../actions/Repository_Actions';

//redux
import { connect } from 'react-redux';

// component for selecting version control
class ChooseProvider extends React.Component {
    constructor(props) {
        super(props)
        this.count = 0
    }

    // opens an external window for github-app installation
    openWindow = () => {
        let width = 900;
        let height = 700;
        
        let url = "https://github.com/apps/get-quilt/installations/new?state=installing";
        let leftPosition = (window.screen.width / 2) - ((width / 2) + 10);
        //Allow for title and status bars.
        let topPosition = (window.screen.height / 2) - ((height / 2) + 50);
    
        window.open(url, "Window2",
        "status=no,height=" + height + ",width=" + width + ",resizable=yes,left="
        + leftPosition + ",top=" + topPosition + ",screenX=" + leftPosition + ",screenY="
        + topPosition + ",toolbar=no,menubar=no,scrollbars=no,location=no,directories=no");
    }

    // checks if an installation exists for the user  // TODO: Validate that installations change
    async checkInstall(){
        let { checkInstallation, user } = this.props;
        await checkInstallation({accessToken: user.accessToken, platform: "github"});
        const { installations } = this.props;
        let installs = installations.filter(inst => inst.account.type === 'User' 
            && inst.account.id == user.profileId);
        return installs.length !== 0;
    }

    // polls installation every few seconds to check whether the user has gone through the process
    // of installing the app through the external window
    pollInstall = async () => {
        const { changePage } = this.props;
        if (this.count === 90){
            clearInterval(this.inteval)
            return false
        } else {
            this.count += 1;
            let installed = await this.checkInstall();
            if (installed){   
                clearInterval(this.interval)
                await retrieveCreationRepositories();
                changePage(1)
            }
            return true
        }
    }

    // selects github as the version control provider
    // if the user has the github app installed, move to next page
    // else open the window and start polling
    selectGithub = async () => {
        const { changePage } = this.props;
        let installed = await this.checkInstall();
        if (installed){
            await this.retrieveCreationRepos();
            changePage(1);
        } else {
            this.interval = setInterval(this.pollInstall, 3000);
            this.openWindow();
        }
    }

    // retrieves the repositories associated with the user's installationId
    retrieveCreationRepos = async () => {
        const { installations, user, retrieveCreationRepositories } = this.props;

        const installationId = installations.filter(inst => inst.account.type === 'User' 
            && inst.account.id == user.profileId)[0].id;
            
        await retrieveCreationRepositories({installationId});
    }
    
    render(){
        return(
            <ContentContainer>
                <SubContentHeader>
                    Select your code hosting service
                </SubContentHeader>
                <SubContentText>
                    When you push to git, we'll keep your documents updated and accessible as your codebase grows.
                </SubContentText>
                <CodeHostingServices>
                    <HostingService 
                        onClick = {() => this.selectGithub()}
                    git = {true}>
                        <ImGithub 
                            style = {{fontSize: "1.5rem", marginRight: "0.5rem"}}/>
                        Github
                    </HostingService>
                    <HostingService style = {{opacity: 0.5}} bit = {true}>
                        <IoLogoBitbucket style = {{fontSize: "1.5rem", marginRight: "0.5rem"}}/>
                        Bitbucket
                    </HostingService>
                    <HostingService style = {{opacity: 0.5}}>
                        <RiGitlabFill  style = {{fontSize: "1.5rem", marginRight: "0.5rem"}}/>
                        Gitlab
                    </HostingService>
                </CodeHostingServices>
            </ContentContainer>
        )
    }
}


const mapStateToProps = (state) => {
    return {
        user: state.auth.user,
        installations: state.auth.installations
    }
}

export default connect(mapStateToProps, { checkInstallation, retrieveCreationRepositories })(ChooseProvider);

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

const CodeHostingServices = styled.div`
    display: flex;
    align-items: center;
    margin-top: 5rem;

`

const HostingService = styled.div`
    background-color: #23262f;
    height: 3rem;
    border-radius: 0.3rem;
    margin-right: 2rem;
    font-size: 1.6rem;
    display: inline-flex;
    align-items: center;
    padding-left: 1rem;
    padding-right: 1rem;
    font-weight: 500;
    border: 1px solid #ff6348;
    border-color: ${props => props.bit ? '#1e90ff' : ""};
    border-color: ${props => props.git ? '#19e5be' : ""};
    cursor: ${props => props.git ? "pointer" : ''};
    &:hover {
        background-color: ${props => props.git ? "#2e323d" : ''};
    }
    
${props => props.active ? "#19E5BE" : "#2e323d"};*/
`