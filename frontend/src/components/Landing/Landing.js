import React from 'react';
import { Router, Route, Switch } from 'react-router-dom';


import styled from 'styled-components';

import TopBlock from './TopBlock';
import SecondBlock from './SecondBlock';

class Landing extends React.Component {
    constructor(props){
        super(props)
    }

    render(){
        return(
            <Container>
                <TopBlock/>
                <SecondBlock/>
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

const Container = styled.div`
    background-color: #f7f9fb;
    font-family: -apple-system,BlinkMacSystemFont, sans-serif;
`

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
`