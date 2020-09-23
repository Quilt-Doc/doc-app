import React from 'react';
import {AiOutlineTeam} from 'react-icons/ai';
import styled from 'styled-components';
import {RiFlag2Line, RiFileList2Line, RiFileTextLine, RiGitPullRequestLine, RiFileList2Fill, RiFlagFill} from 'react-icons/ri';
import {FiFileText} from 'react-icons/fi'

import chroma from 'chroma-js';

class PeopleLog extends React.Component {

    render(){
        return(
            <PeopleContainer>
                <Header>
                    Team
                </Header>
                <ListView>
                    <Member>
                        <PersonIcon color = {'#1e90ff'}>F</PersonIcon>
                        <Name >Faraz Sanal</Name>
                        <Metrics>
                            <Metric>
                                <RiFileList2Fill
                                    style = {{
                                            marginTop: "0rem", 
                                            marginRight: "0.7rem",
                                            fontSize: "1.8rem",
                                            color: '#2684FF'
                                        }}
                                />
                                <Number>0</Number>
                            </Metric>
                            <Metric>
                                <RiFlagFill style = {{
                                    marginRight: "0.7rem",
                                    fontSize: "1.8rem",
                                    color: '#ff4757'
                                }}/>
                                <Number>8</Number>
                            </Metric>
                        </Metrics>
                        
                    </Member>
                    <Member>
                        <PersonIcon color = {'#fd9644'}>K</PersonIcon>
                        <Name>Karan Goda</Name>
                        <Metrics>
                            <Metric>
                                <RiFileList2Fill
                                    style = {{
                                            marginTop: "0rem", 
                                            marginRight: "0.7rem",
                                            fontSize: "1.8rem",
                                            color: '#2684FF'
                                        }}
                                />
                                <Number>8</Number>
                            </Metric>
                            <Metric>
                                <RiFlagFill style = {{
                                    marginRight: "0.7rem",
                                    fontSize: "1.8rem",
                                    color: '#ff4757'
                                }}/>
                                <Number>7</Number>
                            </Metric>
                        </Metrics>
                    </Member>
                    <Member>
                        <PersonIcon color = {'#20bf6b'}>R</PersonIcon>
                        <Name>Raspra Koh</Name>
                        <Metrics>
                            <Metric>
                                <RiFileList2Fill
                                    style = {{
                                            marginTop: "0rem", 
                                            marginRight: "0.7rem",
                                            fontSize: "1.8rem",
                                            color: '#2684FF'
                                        }}
                                />
                                <Number>3</Number>
                            </Metric>
                            <Metric>
                                <RiFlagFill style = {{
                                    marginRight: "0.7rem",
                                    fontSize: "1.8rem",
                                    color: '#ff4757'
                                }}/>
                                <Number>4</Number>
                            </Metric>
                        </Metrics>
                    </Member>
                </ListView>
            </PeopleContainer>
        )
    }
}

export default PeopleLog;

const PersonIcon = styled.div`
    min-height: 3rem;
    min-width: 3rem;
    background-color: ${props => chroma(props.color).alpha(0.2)};
    color:${props => props.color};
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 0.3rem;
    font-size: 1.5rem;
    margin-right: 1.5rem;
`

const Metric =styled.div`
    font-size: 1.35rem;
    font-weight: 500;
    display: flex;
    align-items: center;
    &:last-of-type {
        margin-left: 0.5rem;
    }
`

const Metrics = styled.div`
    display: flex;
    align-items: center;
    margin-left: auto;
`

const Number = styled.div`
    width: 2rem;
`

const PeopleContainer = styled.div`
    margin-top: 1rem;
    padding: 0 3rem;

`

const Header = styled.div`
    height: 4.5rem;
    display: flex;
    align-items: center;
    font-size: 1.7rem;
    font-weight: 600;
`

const ListView = styled.div`
    display: flex;
    flex-direction: column;
    height: 15.5rem;
    overflow-y: scroll;

`

const Member = styled.div`
    display: flex;
    align-items: center;
    height: 5rem;
    font-size: 1.3rem;
    /*border-bottom: 1px solid #E0e4e7;*/
`

const Name = styled.div`
    font-size: 1.3rem;
    font-weight: 500;
    width: 13rem;
    margin-right: 1rem;
`

const Block = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    width: 2.6rem;
    height: 2.6rem;
    background-color: #5B75E6;
    color: white;
    border-radius: 0.3rem;
    margin-right: 1.1rem;
`