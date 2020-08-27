import React from 'react';
import {AiOutlineTeam} from 'react-icons/ai';
import styled from 'styled-components';
import {RiFlag2Line, RiFileList2Line, RiFileTextLine, RiGitPullRequestLine} from 'react-icons/ri';
import {FiFileText} from 'react-icons/fi'

import chroma from 'chroma-js';

class PeopleLog extends React.Component {

    render(){
        return(
            <PeopleContainer>
                <ListToolbar>
                    <AiOutlineTeam style = {{fontSize: "1.8rem", marginRight: "0.7rem"}} />
                    Team
                </ListToolbar>
                <ListView>
                    <Member>
                        <PersonIcon>F</PersonIcon>
                        <Name>Faraz Sanal</Name>
                        <Metrics>
                                <Metric >
                                    <RiFileList2Line style = {{marginTop: "0rem", fontSize: "1.5rem", marginRight: "0.7rem"}}/>
                                    3
                                </Metric>
                                <Metric>
                                    <RiFlag2Line style = {{fontSize: "1.5rem", marginRight: "0.7rem"}}/>
                                    3
                                </Metric>
                                
                            
                        </Metrics>
                        
                    </Member>
                    <Member>
                        <PersonIcon>K</PersonIcon>
                        <Name>Karan Godara</Name>
                        <Metrics>
                            <Metric>
                                <RiFileList2Line style = {{marginTop: "0rem", fontSize: "1.5rem", marginRight: "0.7rem"}}/>
                                3
                            </Metric>
                            <Metric>
                                <RiFlag2Line style = {{fontSize: "1.5rem", marginRight: "0.7rem"}}/>
                                3
                            </Metric>
                           
                            
                        </Metrics>
                    </Member>
                    <Member>
                        <PersonIcon>R</PersonIcon>
                        <Name>Rasprat Kohli</Name>
                        <Metrics>
                            <Metric>
                                <RiFileList2Line style = {{marginTop: "0rem", fontSize: "1.5rem", marginRight: "0.7rem"}}/>
                                3
                            </Metric>
                            <Metric>
                                <RiFlag2Line style = {{fontSize: "1.5rem", marginRight: "0.7rem"}}/>
                                3
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
    align-items: center;
    justify-content: center;
    font-size: 1.35rem;
    display: flex;
    background-color: ${chroma('#00579B')};
    border-radius: 50%;
    min-width: 2.75rem;
    min-height: 2.75rem;
    color: white;
    margin-right: 2rem;
    padding-bottom: 0.05rem;
`

const Metric =styled.div`
    font-size: 1.2rem;
    display: flex;
    align-items: center;
    margin-left: 2rem;
`

const Metrics = styled.div`
    display: flex;
    align-items: center;
    margin-left: auto;
`

const PeopleContainer = styled.div`
    margin-right: 2rem;
    width: 50rem;
    background-color: white;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
    border-radius: 0.2rem;
    
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
    height: 15.5rem;
    overflow-y: scroll;

`

const Member = styled.div`
    display: flex;
    align-items: center;
    height: 5rem;
    font-size: 1.2rem;
    /*border-bottom: 1px solid #E0e4e7;*/
    padding-left: 3rem;
    padding-right: 3rem;
`

const Name = styled.div`
    font-size: 1.3rem;
    font-weight: 500;
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