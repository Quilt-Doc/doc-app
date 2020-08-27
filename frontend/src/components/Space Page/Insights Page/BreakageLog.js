import React from 'react';
import styled from 'styled-components';

import chroma from 'chroma-js';

import {RiSlackLine, RiFlag2Line, RiGitCommitLine, RiFileList2Fill, RiFileList2Line} from 'react-icons/ri';
import {FiFileText} from 'react-icons/fi';


class BreakageLog extends React.Component {

    render(){
        return(
            <BreakageContainer>
                        <ListToolbar>
                            <RiFlag2Line style = {{fontSize: "1.8rem", marginRight: "0.7rem"}} />
                            Breakage
                            <Current>
                                <b>3</b>&nbsp; documents broken
                            </Current>
                            {/*
                                /*Document, 
                                broken references,  
                                commit date*/
                            }
                           
                        </ListToolbar>
                        <ListView>
                            <ListItem active = {true}>
                                <Document>
                                    <RiFileList2Line style = {{fontSize: "1.5rem", marginRight: "1rem", marginTop: "-0.05rem"}}/>
                                    Tensor Manipulation
                                </Document>
                                <Commit>
                                    <RiGitCommitLine
                                        style = {{
                                            fontSize: "2.1rem",
                                            marginRight: "0.7rem"
                                        }}
                                    />
                                    b30e5c3
                                </Commit>
                                <Date>
                                    August, 12, 2021
                                </Date>
                            </ListItem>
                            <ListItem>
                                <Document>
                                    <RiFileList2Line style = {{fontSize: "1.5rem", marginRight: "1rem", marginTop: "-0.05rem"}}/>
                                    Function Behavior
                                </Document>
                                <Commit>
                                    <RiGitCommitLine
                                        style = {{
                                            fontSize: "2.1rem",
                                            marginRight: "0.7rem"
                                        }}
                                    />
                                    b30e5c3
                                </Commit>
                                <Date>
                                    August, 12, 2021
                                </Date>
                            </ListItem>
                            <ListItem active = {true}>
                                <Document>
                                    <RiFileList2Line style = {{fontSize: "1.5rem",marginRight: "1rem", marginTop: "-0.05rem"}}/>
                                    Probability Distributions
                                </Document>
                                <Commit>
                                    <RiGitCommitLine
                                        style = {{
                                            fontSize: "2.1rem",
                                            marginRight: "0.7rem"
                                        }}
                                    />
                                    b30e5c3
                                </Commit>
                                <Date>
                                    August, 12, 2021
                                </Date>
                            </ListItem>
                        </ListView>
                    </BreakageContainer>
        )
    }
}

export default BreakageLog;

const Document = styled.div`
    display: flex;
    align-items: center;
    font-size: 1.35rem;
    font-weight: 500;
    width: 45%;
    margin-right: 1rem;
`

const Commit = styled.div`
    display: inline-flex;
    align-items: center;
    &:hover {
        color: #5A75E6;
    }
    cursor: pointer;
    font-size: 1.2rem;
    font-weight: 300;
`

const Date = styled.div`
    margin-left: auto;
    opacity: 0.5;
    font-size: 1.2rem;
`

const ListItem = styled.div`
    display: flex;
    align-items: center;
    padding-left: 3rem;
    padding-right: 3rem;
    min-height: 3.5rem;
    max-height: 3.5rem;
    background-color: ${props => props.active ? chroma("#5B75E6").alpha(0.04) : ''};
    font-size: 1.5rem;
    border-left: 3px solid ${chroma('#ff4757').alpha(0.5)};
`

const Current = styled.div`
    margin-left: auto;
    font-weight: 300;
    
`

const ListToolbar = styled.div`
    height: 4.5rem;
    display: flex;
    align-items: center;
    border-bottom: 1px solid #EDEFF1;
    padding: 0rem 3rem;
    font-size: 1.5rem;
    font-weight: 500;
`

const ListView = styled.div`
    display: flex;
    flex-direction: column;
    background-color: white;
    padding-bottom: 1rem;
    /*background-color: ${chroma('#ff4757').alpha(0.07)};*/
    height: 100%;
`

const BreakageContainer = styled.div`
    width: 100%;
    background-color: white;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
    border-radius: 0.2rem;
    display: flex;
    flex-direction: column;
`
