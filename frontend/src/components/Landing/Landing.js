import React from 'react';
import { Router, Route, Switch } from 'react-router-dom';

import styled from 'styled-components';
import smalldoc from '../../images/small-doc.png';

import DashboardPanel from './DashboardPanel';
import KnowledgePanel from './KnowledgePanel';
import SnippetPanel from './SnippetPanel';

//email validation
import * as EmailValidator from 'email-validator';

import { addUserToContacts } from '../../actions/User_Actions';

class Landing extends React.Component {
    constructor(props){
        super(props)
    }

    addContact = () => {
        const email = this.emailInput.value;

        if (!email) alert("Please enter an email");

        if (!EmailValidator.validate(email)){
            alert("Invalid Email");
        }

        addUserToContacts(email);
    }

    render(){
        return(
            <Container>
                <IntroPanel>
                    <TopBar>
                        <BrandName>
                            quilt
                        </BrandName>
                        <DemoButton>
                            Request Access
                        </DemoButton>
                    </TopBar>
                    <Content>
                        <LeftText>
                            <Header>
                                Worry about code, not docs. 
                            </Header>
                            <SubHeader>
                                Developers shouldn't have to suffer from terrible docs. 
                                Quilt monitors your evolving codebase 
                                to keep information actionable and up to date. 
                            </SubHeader>
                            <SignUpForm>
                                <Searchbar 
                                    placeholder = {"Enter your email"}
                                    ref = {node => this.emailInput = node}
                                />
                                <SignUpButton onClick = {() => this.addContact()}>
                                    Request
                                </SignUpButton>
                            </SignUpForm>
                        </LeftText>
                        <RightAsset>
                            
                        </RightAsset>
                    </Content>
                </IntroPanel>
                <Gradient/>
                <DashboardPanel/>
                <KnowledgePanel/>
                <SnippetPanel/>
            </Container>
        )
    }
}

/*<Block>
                    <Company>
                        <StyledIcon src = {logo} />
                        quilt
                    </Company>
                    <Content margin = {true}>
                        <ContentText>
                            <ContentHeader>
                            Worry about code, not docs.
                            </ContentHeader>
                            <ContentSubHeader>
                                {Keep your knowledge productive}
                                Quilt integrates with your codebase to keep your knowledge accessible and up to date.
                            </ContentSubHeader>
                        </ContentText>
                        
                        <ContentCollage>

                        </ContentCollage>
                    </Content>
                </Block>

                <Block2>
                    <Content2>
                        
                        <Gifbox>

                        </Gifbox>
                        <ContentText color = {"#262626"}>
                            <ContentHeader2>
                                Link docs to an evolving codebase
                            </ContentHeader2>
                            <ContentSubHeader active = {true}>
                                Quilt keeps your documents in sync with the code that they were made for...
                                so that you can create knowledge that has lasting importance.  
                            </ContentSubHeader>
                        </ContentText>
                    </Content2>
                </Block2>
                <Block3 bColor = {"#16181d"} >
                    <Content2>
                        <ContentText3 >
                            <ContentHeader2>
                                Keep your knowledge productive
                            </ContentHeader2>
                            <ContentSubHeader>
                                Quilt keeps your docs in sync with the code that they were made for...
                                so that you can create knowledge that has lasting importance.  
                            </ContentSubHeader>
                        </ContentText3>
                    
                    </Content2>
                </Block3>*/
export default Landing;


const Gradient = styled.div`
    height: 10rem;
    background-color: rgba(22,24,29,1);
    clip-path: polygon(0 0, 0 100%, 100% 2rem, 100% 0)
`

const RightAsset = styled.div`
    
`

const SignUpButton = styled.div`
    border-left: 1px solid #5B75E6;
    color: white;
    background-color:#1e2129;
    font-weight: 500;
    margin-left: auto;
    height: 100%;
    padding: 0rem 2rem;
    display: flex;
    align-items: center;
    justify-content: center;
    border-top-right-radius: 0.3rem;
    border-bottom-right-radius: 0.3rem;
`

const SignUpForm = styled.div`
    margin-top: 5rem;
    height: 5rem;
    width: 40rem;
    border: 1px solid #5B75E6;
    border-radius: 0.3rem;
    display:flex;
`

const Searchbar = styled.input`
    height: 5rem;
    width: 28rem;
    background-color: transparent;
    border: none;
    outline: none;
    color: white;
    padding: 2rem 2rem;
    font-weight: 500;
    &::placeholder {
        color: white;
        opacity: 0.9;
    }
    font-size: 1.6rem;
    font-weight: 500;
    font-family: -apple-system,BlinkMacSystemFont, sans-serif;
`

const Header = styled.div`
    font-size: 4.5rem;
    font-weight: 500;
`

const SubHeader = styled.div`
    font-size: 1.9rem;
    font-weight: 300;
    line-height: 3.5rem;
    margin-top: 2rem;
    opacity: 0.8;
`

const LeftText = styled.div`
    width: 45%;
    display: flex;
    flex-direction: column;
`


const Container = styled.div`
    height: calc(100vh - 0rem);
    font-family: -apple-system,BlinkMacSystemFont, sans-serif;
    color: white;
    font-size: 1.6rem;
    overflow-y: scroll;
`

const IntroPanel = styled.div`
    background-color: #16181d;
    display: flex;
    flex-direction: column;
    padding-left: 8.5rem;
    height: 100vh;
`

const Content = styled.div`
    height: 60rem;
    
    display: flex;
    align-items: center;
`

const TopBar = styled.div`
    height: 8.5rem;
    display: flex;
    align-items: center;
`

const BrandName = styled.div`
    font-size: 3.5rem;
    letter-spacing: 1px;
    font-weight: 400;
`

const DemoButton = styled.div`
    border: 1px solid #5B75E6;
    color: white;
    background-color:#1e2129;
    font-weight: 500;
    margin-left: auto;
    height: 4.5rem;
    padding: 0rem 2rem;
    border-radius: 0.3rem;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 8.5rem;
`
/*
const Company = styled.div`
    font-size: 3rem;
    color:white;
    font-weight: 500;
    letter-spacing: 1.5px;
    display: flex;
    align-items: center;
    margin-bottom: auto;
`

const Block = styled.div`
    height: 80rem;
    padding 3.5rem 17rem;
    padding-right: 10rem;
    background-color: #16181d;
    color: white;
    display: flex;
    flex-direction: column;
    justify-content: center;
    clip-path: polygon(0 0, 100% 0, 100% 70rem, 0% 100% );
`

const Block2 = styled.div`
    height: 75rem;
    padding 3.5rem 17rem;
    color: white;
    display: flex;
    flex-direction: column;
    background-color: #f7f9fb;
    padding-top: 13.5rem;
    margin-top: -10rem;
    justify-content: center;
    background-color: ${props => props.bColor};
`

const Block3 = styled.div`
    height: 75rem;
    padding 3.5rem 17rem;
    color: white;
    display: flex;
    flex-direction: column;
    background-color: #f7f9fb;
    justify-content: center;
    background-color: ${props => props.bColor};
    clip-path: polygon(0 10rem, 100% 0, 100% 100%, 0% 100% );
`

const StyledIcon = styled.img`
    width: 3.3rem;

    margin-right: 1rem;
`

const Content = styled.div`
    height: 60rem;
    display: flex;
    margin-bottom: ${props => props.margin ? "auto": ""};
`   

const Content2 = styled.div`
    height: 50rem;
    display: flex;
    margin-bottom: ${props => props.margin ? "auto": ""};
`   

const ContentText = styled.div`
    width: 40%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    color: ${props => props.color};
    margin-left: auto;
`

const ContentCollage = styled.div`
    width: 60%;
 
`

const ContentHeader = styled.div`
    font-size: 4.5rem;
    font-weight: 500;
    margin-top: -3rem;
    margin-bottom: 3.5rem;
    width: 40rem;
`

const ContentHeader2 = styled.div`
    font-size: 3.5rem;
    font-weight: 500;
    margin-bottom: 3rem;
`

const ContentSubHeader = styled.div`
    font-size: 1.8rem;
    font-weight: 300;
    line-height: 2.8rem;
    color: ${props => props.active ?  "#737a96" : ""};
`

const Gifbox = styled.div`
    min-width: 60rem;
    margin-right: 6rem;
    background-color: white;
    height: 100%;
    border-radius: 0.2rem;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2); 
`

const ContentText3 = styled.div`
    width: 40%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    color: ${props => props.color};
`

const Gifbox2 = styled.div`
    min-width: 60rem;
    margin-left: 9rem;
    background-color: white;
    height: 100%;
    border-radius: 0.2rem;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2); 
`*/