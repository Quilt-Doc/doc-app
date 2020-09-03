import React from 'react';

import styled from 'styled-components';

import {ImGithub} from 'react-icons/im';
import { RiCheckboxCircleFill} from 'react-icons/ri';

import {retrieveInstallationRepositories} from '../../actions/Repository_Actions';

//redux
import { connect } from 'react-redux';

class ChooseRepos extends React.Component {
    constructor(props){
        super(props)
    }

    componentDidMount(){
        let installationId = this.props.installations.filter(inst => inst.account.type === 'User' 
                    && inst.account.id == this.props.user.profileId)[0].id;
        this.props.retrieveInstallationRepositories({installationId})
    }

    render(){

        return(
            <ContentContainer>
                <SubContentHeader>
                    Choose the repositories you would like to link
                </SubContentHeader>
                <SubContentText>
                    Keep all information relevant to your development team in one place. 
                </SubContentText>
                <RepositoryContainer>
                    <Repository active = {true}>
                        <ImGithub  style = {{fontSize: "2rem", marginRight: "1rem"}}/>
                        fsanal / react-select
                        <RiCheckboxCircleFill style = 
                            {{color: '#19e5be',width: "2rem", marginLeft: "auto"}}/>
                    </Repository>
                    <Repository active = {false}>
                        <ImGithub  style = {{fontSize: "2rem", marginRight: "1rem"}}/>
                        fsanal / doc-app
                        <RiCheckboxCircleFill style = 
                            {{color: '#19e5be',width: "2rem", marginLeft: "auto"}}/>
                    </Repository>
                    <Repository active = {true}>
                        <ImGithub   style = {{fontSize: "2rem", marginRight: "1rem"}}/>
                        fsanal / doc-app-vscode
                        <RiCheckboxCircleFill style = 
                            {{color: 'white', opacity: 0.2, width: "2rem", marginLeft: "auto"}}/>
                    </Repository>
                </RepositoryContainer>
                <NextButton onClick = {() => {this.props.changePage(2)}}>
                    Next
                </NextButton>
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

export default connect(mapStateToProps, {retrieveInstallationRepositories})(ChooseRepos);

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

const Repository = styled.div`
    height: 4.5rem;
    font-size: 1.7rem;
    display: flex;
    align-items: center;
    background-color: ${props => props.active ? "#23262f" : ""};
    padding-left: 2rem;
    padding-right: 2rem;
    cursor: pointer;
    &:hover {
        background-color: #2e323d;
    }
    letter-spacing: 0.5px;

`

const RepositoryContainer = styled.div`
    display: flex;
    flex-direction: column;
    margin-top: 5rem;
    width: 100%;
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
