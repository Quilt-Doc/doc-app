import React from 'react';

//styles
import styled from 'styled-components';

//icons
import { RiGitCommitLine } from 'react-icons/ri'
import { IoMdCheckmarkCircleOutline } from 'react-icons/io';

// Card representing a single pull request
const PullRequestCard = () => {
    return (
        <Container>
            <Status>
            </Status>
            <Title>
                Report Metrics
                <IoMdCheckmarkCircleOutline
                    style = {{color: "#19e5be", fontSize: "1.8rem", marginLeft: "auto"}}
                />
            </Title>
            <Chronology>August 21, 2020</Chronology> {/*TODO: REPEATED COMPONENT CHRONOLOGY*/}
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
                <Member>F</Member> {/*TODO: REPEATED COMPONENT MEMBER*/}
            </Bar>
        </Container>
    );
}

export default PullRequestCard;

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
