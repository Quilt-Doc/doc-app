import React from 'react';
import { AiFillFolder, AiOutlinePullRequest } from 'react-icons/ai';
import { RiFileFill } from 'react-icons/ri';
import chroma  from 'chroma-js';
import styled from 'styled-components';
import { APP_LIGHT_PRIMARY_COLOR } from '../../../../../styles/colors';
import { LIGHT_SHADOW_1 } from '../../../../../styles/shadows';
import { FiChevronsRight } from 'react-icons/fi';

class PullRequestRecs extends React.Component {
    
    renderFolders = (dep) => {
        //let {references} = this.props.document
        let directories = ['back-server', 'space'];

        if (dep) {
            directories = [];
        }

        if (directories.length > 0) {
            directories = directories.sort((a, b) => {if (a.name < b.name) return -1; else if (a.name > b.name) return 1; else return 0})
        }

        
        return directories.map((directory, i) => {
            return (    <Reference invalid = {dep} pending = {!dep}>
                            <AiFillFolder style = {{marginRight: "0.5rem"}}/>
                            <Title>{directory}</Title>
                        </Reference>
                    )
        })
    }


    renderFiles = (dep) => {
        //let {references} = this.props.document
        let files = ['routes.js'];

        if (dep) {
            files = ['QuickAccess.js', 'TagWrapper.js'];
        }

        if (files) {
            files = files.sort((a, b) => {if (a.name < b.name) return -1; else if (a.name > b.name) return 1; else return 0})
        }

        return files.map((file, i) => {
            return (
                <Reference invalid = {dep} pending = {!dep}>
                    <RiFileFill style = {{width: "1rem", fontSize: "1.1rem" ,marginRight: "0.5rem"}}/>
                    <Title>{file}</Title>
                </Reference>
            )
        })
    }



    render(){
        return(
            <Container>
                <Header>
                    <PullRequest>
                        <PullRequestIcon>
                            <AiOutlinePullRequest/>
                        </PullRequestIcon>
                        Advanced Label Support
                    </PullRequest>
                    <CloseButton>
                        <FiChevronsRight/>
                    </CloseButton>
                </Header>
                <Recommendation>
                    <RecDetail>Deprecated</RecDetail>
                    <InfoList>
                        {this.renderFolders(true)}
                        {this.renderFiles(true)}
                    </InfoList>
                </Recommendation>
                <Recommendation>
                    <RecDetail>Pending</RecDetail>
                        <InfoList>
                            {this.renderFolders(false)}
                            {this.renderFiles(false)}
                        </InfoList>
                </Recommendation>
            </Container>
        )
    }
}

export default PullRequestRecs;

const Header = styled.div`
    display: flex;
    align-items: center;
`

const CloseButton = styled.div`
    display: flex;
    align-items: center;
    font-size: 2rem;
    margin-left: auto;
    margin-top: -1.5rem;
`

const PullRequestIcon = styled.div`
    display: flex;
    align-items: center;
    margin-right: 0.35rem;
    font-size: 1.8rem;
    margin-top: -0.1rem;
`

const PullRequest = styled.div`
    display: inline-flex;
    align-items: center;
    background-color: ${APP_LIGHT_PRIMARY_COLOR};
    font-weight: 500;
    font-size: 1.4rem;
    padding: 0.7rem 1rem;
    border-radius: 0.4rem;
    margin-bottom: 1rem;
`

const Recommendation = styled.div`
    margin-top: 2.5rem;
    display: flex;
`

const RecDetail = styled.div`
    font-weight: 500;
    font-size: 1.3rem;
    min-width: 10rem;
    width: 10rem;
    margin-top: 0.3rem;
`

const Container = styled.div`
    margin-bottom: 2rem;
    width: 40vw;
    max-width: 55rem;
    box-shadow: ${LIGHT_SHADOW_1};
    border-top-left-radius: 0.35rem;
    border-bottom-left-radius: 0.35rem;
    padding: 3rem 2rem;
    margin-bottom: 2rem;
    position: absolute;
    right: 0;
    margin-top: 3rem;
    z-index: 10;
    background-color: white;
`

const InfoList = styled.div`
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    margin-bottom: -1rem;
    margin-left: ${props => props.edit ? "1.5rem" : "0rem"};
`

const Reference = styled.div`
    background-color: ${props => props.invalid ? chroma("#ca3e8c").alpha(0.2) 
    : chroma('#fad390').alpha(0.4)};
    /*color: ${chroma("#6762df").alpha(0.9)};*/
    border-radius: 0.2rem;
    font-size: 1.3rem;
    padding: 0.3rem 0.55rem;
    margin-right: 1.5rem;
    display: flex;
    align-items: center;
    margin-bottom: 1rem;
`

const Title = styled.div`
    color: #172A4e;
    font-weight: 500;
`

