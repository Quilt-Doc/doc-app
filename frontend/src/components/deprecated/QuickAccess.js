import React from 'react';
import {AiOutlineTeam} from 'react-icons/ai';
import styled from 'styled-components';
import {RiFlag2Line, RiFileList2Line, RiFileTextLine, RiGitPullRequestLine, RiFileList2Fill, RiFlagFill} from 'react-icons/ri';
import {FiFileText} from 'react-icons/fi'

import chroma from 'chroma-js';

class QuickAccess extends React.Component {

    render(){
        return(
            <Container>
                <Header>
                    Quick Access
                </Header>
                <ListView>
                    <Card>
                        <RiFileList2Fill
                            style = {{
                                    
                                    marginRight: "1.2rem",
                                    fontSize: "2.7rem",
                                    color: '#2684FF'
                            }}
                        /> 
                        Probability Distributions
                    </Card>
                    <Card>
                        <RiFileList2Fill
                            style = {{
                                    
                                    marginRight: "1.2rem",
                                    fontSize: "2.7rem",
                                    color: '#2684FF'
                            }}
                        /> 
                        Data Tensors
                    </Card>
                    <Card>
                        <RiFileList2Fill
                            style = {{
                                    
                                    marginRight: "1.2rem",
                                    fontSize: "2.7rem",
                                    color: '#2684FF'
                            }}
                        /> 
                        Semantic Callbacks
                    </Card>
                </ListView>
            </Container>
        )
    }
}

export default QuickAccess;

const ListView = styled.div`
    display: flex;
    flex-direction: column;
    overflow-y: scroll;
    background-color: #f7f9fb;
    padding-left: 4rem;
    padding-right: 4rem;
    padding-top: 1.5rem;
    padding-bottom: 1.5rem;
`

const Card = styled.div`
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
    width: 100%;
    height: 4.5rem;
    border-radius: 0.2rem;
    background-color: white;
    margin-top: 1.5rem;
    &:first-of-type {
        margin-top: 0rem;
    }   
    display: flex;
    align-items: center;
    padding: 0rem 1rem;
    font-size: 1.35rem;
    font-weight: 500;
`


const Container = styled.div`
    margin-top: 2rem;
`

const Header = styled.div`
    height: 4.5rem;
    display: flex;
    align-items: center;
    font-size: 1.7rem;
    font-weight: 600;
    padding-left: 3rem;
    padding-right: 3rem;
    margin-bottom: 1rem;
`