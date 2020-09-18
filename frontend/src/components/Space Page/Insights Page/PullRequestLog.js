import React from 'react';

import styled from 'styled-components';

import {RiGitPullRequestLine, RiGitCommitLine} from 'react-icons/ri'
import {BiCube} from 'react-icons/bi';
import { IoMdCheckmarkCircleOutline } from 'react-icons/io';
import { FiGitPullRequest } from 'react-icons/fi';
import { CgArrowsExpandRight } from 'react-icons/cg';

import RequestModal from './RequestModal';
import chroma from 'chroma-js';
import { FiChevronDown, FiFilter } from 'react-icons/fi';

class PullRequestLog extends React.Component {

    render(){
        return(
            <Container>
                
                <Header>
                   Git Checks
                </Header>

                <BodyContainer>
                    <Toolbar>
                        <SwitchButton>
                            <FiGitPullRequest style = {{
                                    marginRight: "0.5rem",
                                    fontSize: "1.45rem"
                                }}/>
                            Pull Requests
                            <FiChevronDown 
                                style = {{
                                    marginLeft: "0.5rem",
                                    marginTop: "0.3rem",
                                    fontSize: "1.45rem"
                                }}
                            />
                        </SwitchButton>
                        <SearchButton>
                        <ion-icon 
                            style={{ 'fontSize': '2rem'}} 
                            name="search-outline"
                        >
                        </ion-icon>
                        </SearchButton>
                        <FilterButton>
                            <FiFilter
                              
                            />
                        </FilterButton>
                        <CgArrowsExpandRight style = {{fontSize: "1.9rem", marginLeft: "1rem"}}/>
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
                </BodyContainer>
            </Container>
        )
    }
}

export default PullRequestLog;


const SearchButton = styled.div`
    height: 3.5rem;
    width: 3.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-left: auto;
`

const FilterButton = styled.div`
    margin-left: 0.8rem;
    margin-right: 0.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.8rem;
    border-radius: 0.4rem;
`




const SwitchButton = styled.div`
    display: flex;
    align-items: center;
    border: 1px solid #E0E4e7;
    font-size: 1.4rem;
    padding: 0rem 1.5rem;
    border-radius: 0.4rem;
    height: 3.5rem;
    font-weight: 500;
`


const Header = styled.div`
    height: 4.5rem;
    display: flex;
    align-items: center;
    font-size: 1.7rem;
    font-weight: 600;
    margin-bottom: 1rem;
`

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
    border-radius: 0.3rem;
    z-index: 1;
    padding-left: 4rem;
    padding-right: 4rem;
    margin-top: 1.5rem;
`

const Toolbar = styled.div`
    height: 5rem;
    display: flex;
    align-items: center;
    border-bottom: 1px solid #EDEFF1;
    padding: 0 1.5rem;
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

const BodyContainer = styled.div`
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
    background-color: white;
    border-radius: 0.4rem;
`

const Content = styled.div`
    display: flex;
    height: 100%;
    border-radius: 0.5rem;
`

const RequestList = styled.div`
    width: 38rem;
    height: 100%;
    overflow-y: scroll;
`

const RequestCard = styled.div`
    display: flex;
   /* background-color: #f7f9fb;*/
    border-left: 3px solid transparent;
    &:first-of-type {
        border-left: 3px solid #6FEAE1;
        background-color: ${chroma('#5A75E6').alpha(0.08)}
    }
    display: flex;
    flex-direction: column;
    padding: 1.5rem;
    border-bottom: 1px solid #E0E4e7;
   
`
