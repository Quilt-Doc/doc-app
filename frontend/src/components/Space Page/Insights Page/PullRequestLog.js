import React from 'react';

import styled from 'styled-components';

import {RiGitPullRequestLine, RiGitCommitLine} from 'react-icons/ri'
import {BiCube} from 'react-icons/bi';
import { IoMdCheckmarkCircleOutline } from 'react-icons/io';

import RequestModal from './RequestModal';

class PullRequestLog extends React.Component {

    render(){
        return(
            <Container>
                
                <Toolbar>
                    <RiGitPullRequestLine style = {{fontSize: "1.8rem", marginRight: "0.7rem"}}/>
                    Pull Requests
                </Toolbar>
                
                <Content>
                    <RequestList>
                        <RequestCard>
                            <Status>

                            </Status>
                            <Title>Report Metrics
                                <IoMdCheckmarkCircleOutline
                                    style = {{color: "#19e5be", fontSize: "1.8rem", marginLeft: "auto"}}
                                />
                            </Title>
                            <Chronology>August 21, 2020</Chronology>
                            <Bar>
                                <Metrics>
                                        <RiGitCommitLine
                                            style = {{
                                                fontSize: "2.2rem",
                                                marginRight: "0.35rem"
                                            }}
                                        />
                                        3
                                       
                                </Metrics>
                                <Member>F</Member>
                                
                            </Bar>
                        </RequestCard>
                        <RequestCard>
                            <Status>

                            </Status>
                            <Title>Report Metrics
                                <IoMdCheckmarkCircleOutline
                                    style = {{color: "#19e5be", fontSize: "1.8rem", marginLeft: "auto"}}
                                />
                            </Title>
                            <Chronology>August 21, 2020</Chronology>
                            <Bar>
                                <Metrics>
                                        <RiGitCommitLine
                                            style = {{
                                                fontSize: "2.2rem",
                                                marginRight: "0.35rem"
                                            }}
                                        />
                                        3
                                       
                                </Metrics>
                                <Member>F</Member>
                                
                            </Bar>
                        </RequestCard>
                        <RequestCard>
                            <Status>

                            </Status>
                            <Title>Report Metrics
                                <IoMdCheckmarkCircleOutline
                                    style = {{color: "#19e5be", fontSize: "1.8rem", marginLeft: "auto"}}
                                />
                            </Title>
                            <Chronology>August 21, 2020</Chronology>
                            <Bar>
                                <Metrics>
                                        <RiGitCommitLine
                                            style = {{
                                                fontSize: "2.2rem",
                                                marginRight: "0.35rem"
                                            }}
                                        />
                                        3
                                       
                                </Metrics>
                                <Member>F</Member>
                                
                            </Bar>
                        </RequestCard>
                        <RequestCard>
                            <Status>

                            </Status>
                            <Title>Report Metrics
                                <IoMdCheckmarkCircleOutline
                                    style = {{opacity: "0.4", fontSize: "1.8rem", marginLeft: "auto"}}
                                />
                            </Title>
                            <Chronology>August 21, 2020</Chronology>
                            <Bar>
                                <Metrics>
                                        <RiGitCommitLine
                                            style = {{
                                                fontSize: "2.2rem",
                                                marginRight: "0.35rem"
                                            }}
                                        />
                                        3
                                       
                                </Metrics>
                                <Member>K</Member>
                                
                            </Bar>
                        </RequestCard>
                    </RequestList>
                    <RequestModal/>
                </Content>
            </Container>
        )
    }
}

export default PullRequestLog;

const Member = styled.div`
    background-color: #00579B;
    color: white;
    height: 1.8rem;
    width: 1.8rem;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.7rem;
    
    margin-left: auto;
    border-radius: 50%;
`

const Metrics = styled.div`
    display: flex;
    align-items: center;
    
`

const Metric = styled.div`
    display: flex;
    align-items: center;
    margin-right: 1rem;
`

const Bar = styled.div`
    display: flex;
    align-items: center;
    margin-top: 0.6rem;
`

const Status = styled.div`
    
`

const Title = styled.div`
    font-size: 1.2rem;
    font-weight: 500;
    display: flex;
    align-items: center;
`

const Chronology = styled.div`
    margin-top: 0.7rem;
    opacity: 0.6;
    font-size: 1rem;
`

const Container = styled.div`
    display: flex;
    flex-direction: column;
    height: 60rem;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
    background-color: white;
    border-radius: 0.3rem;
    z-index: 1;
    margin-bottom: 2.5rem;
`

const Toolbar = styled.div`
    height: 4.5rem;
    display: flex;
    align-items: center;
    border-bottom: 1px solid #EDEFF1;
    padding: 0rem 3rem;
    font-size: 1.5rem;
    font-weight: 500;
`

const Circle = styled.div`
    border-radius: 50%;
    background-color: #5A75E6;
    height: 1rem;
    width: 1rem;
    margin-right: 1.5rem;
`

const Content = styled.div`
    display: flex;
    height: 100%;
`

const RequestList = styled.div`
    width: 35rem;
    height: 100%;
    overflow-y: scroll;
`

const RequestCard = styled.div`
    display: flex;
   /* background-color: #f7f9fb;*/
    border-left: 3px solid transparent;
    &:first-of-type {
        border-left: 3px solid #6FEAE1;
        background-color: #f7f9fb;
    }
    display: flex;
    flex-direction: column;
    padding: 1.5rem;
    border-bottom: 1px solid #E0E4e7;
`
