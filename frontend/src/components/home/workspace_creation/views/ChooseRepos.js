import React from 'react';

//styles
import styled from 'styled-components';

//icons
import {ImGithub} from 'react-icons/im';
import { RiCheckboxCircleFill} from 'react-icons/ri';

//actions
import { checkInstallation } from '../../../../actions/Auth_Actions';

//redux
import { connect } from 'react-redux';

class ChooseRepos extends React.Component {
    constructor(props){
        super(props)
        this.state = {
            active: []
        }
    }

    // render the fullName of the repository aesthetically
    renderFullName = (name) => {
        let split = name.split('/');
        if (split.length == 2) {
            return `${split[0]} / ${split[1]}`;
        } else {
            const username = split.shift();
            return `${username} / ${split.join('/')}`;
        }
    }

    // select or unselect repositories depending on whether they've been clicked
    // or not
    handleRepositoryClick = (repo) => {
        let { active, setActive } = this.props;
        active  = [...active];
        if (active.includes(repo._id)){
            active = active.filter((id) => id !== repo._id);
            setActive(active);
        } else {
            active.push(repo._id);
            setActive(active);
        }
    }   

    // render all of the repositories that belong to the installation
    renderRepositories = () => {
        const { repositories } = this.props;
        const { active } = this.props;

        return repositories.map((repo, i) => {
            const style = active.includes(repo._id) ? 
                {color: '#19e5be',width: "2rem", marginLeft: "auto"} :
                {color: 'white', opacity: 0.2, width: "2rem", marginLeft: "auto"};
            
            const shaded = i % 2 === 0;
            return (
                <Repository onClick = {() => this.handleRepositoryClick(repo)} shaded = {shaded}>
                    <ImGithub  style = {{fontSize: "2rem", marginRight: "1rem"}}/>
                    {this.renderFullName(repo.fullName)}
                    <RiCheckboxCircleFill style = {style}/>
                </Repository>
            )
        })
    }

    // alert if no repository selected else retrieve the installations just in case
    // and move to the name page
    handleNextClick = async () => {
        const { changePage, active } = this.props;
        if (active.length == 0) {
            alert("Please select at least one repository");
        } else {
            changePage(2);
        }
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
                    {this.renderRepositories()}
                </RepositoryContainer>
                <NextButton onClick = {this.handleNextClick}>
                    Next
                </NextButton>
            </ContentContainer>
        )
    }
}

const mapStateToProps = (state) => {
    const { repositories } = state;
    return {
        repositories: Object.values(repositories),
    }
}

export default connect(mapStateToProps, { checkInstallation })(ChooseRepos);

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
    margin-bottom: 10rem;
`

const Repository = styled.div`
    height: 4.5rem;
    font-size: 1.7rem;
    display: flex;
    align-items: center;
    background-color: ${props => props.shaded ? "#23262f" : ""};
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
