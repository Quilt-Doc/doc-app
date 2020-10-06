import React from 'react';

//styles
import styled from 'styled-components';
import chroma from 'chroma-js';

//icons
import { RiPencilLine, RiGitCommitLine } from 'react-icons/ri'
import { BiLink } from 'react-icons/bi';
import { IoMdCheckmarkCircleOutline } from 'react-icons/io';

// Content on the right view of the pull request component
const CheckDetail = () => {
    return(
        <RequestBody>
            <Options>
                <IconBorder margin = {true}>
                    <RiPencilLine/>
                </IconBorder>
                <IconBorder2>
                    <IoMdCheckmarkCircleOutline style = {{ fontSize: "1.8rem"}} />
                </IconBorder2>
                <IconBorder3>
                    <BiLink style = {{ fontSize: "1.8rem"}} />
                </IconBorder3>
            </Options>
            <RequestHeader>
                Report Metrics
            </RequestHeader>
            <RequestInfo>
                Faraz Sanal, August 21, 2020
            </RequestInfo>
            <ReferencesBlock>
                <ReferenceHeader>
                    Code References
                </ReferenceHeader>
                <ReferenceList>
                    <Reference>
                            <ion-icon name="folder"
                            style = {
                                {marginRight: "0.55rem", fontSize: "1.4rem"}}></ion-icon>
                            actions
                    </Reference>
                </ReferenceList>
            </ReferencesBlock>
            <CommitList>

                <Commit>
                    <CommitText>
                        <RiGitCommitLine
                            style = {{
                                fontSize: "2.1rem",
                                marginRight: "0.7rem"
                            }}
                        />
                        b30e5c3
                    </CommitText>
                    <IoMdCheckmarkCircleOutline
                                style = {{fontSize: "1.5rem", 
                                marginLeft: "auto", opacity: "0.4"}}
                            />
                </Commit>
                <Commit>
                    <CommitText>
                        <RiGitCommitLine
                            style = {{
                                fontSize: "2.1rem",
                                marginRight: "0.7rem"
                            }}
                        />
                        b30e5c3
                    </CommitText>
                    <IoMdCheckmarkCircleOutline
                                style = {{fontSize: "1.5rem", 
                                marginLeft: "auto", opacity: "0.4"}}
                            />
                </Commit>
                <Commit>
                    <CommitText>
                        <RiGitCommitLine
                            style = {{
                                fontSize: "2.1rem",
                                marginRight: "0.7rem"
                            }}
                        />
                        b30e5c3
                    </CommitText>
                    <IoMdCheckmarkCircleOutline
                                style = {{fontSize: "1.5rem", 
                                marginLeft: "auto", opacity: "0.4"}}
                            />
                </Commit>
                <Commit>
                    <CommitText>
                        <RiGitCommitLine
                            style = {{
                                fontSize: "2.1rem",
                                marginRight: "0.7rem"
                            }}
                        />
                        b30e5c3
                    </CommitText>
                    <IoMdCheckmarkCircleOutline
                                style = {{fontSize: "1.5rem", 
                                marginLeft: "auto", opacity: "0.4"}}
                            />
                </Commit>
                <Commit>
                    <CommitText>
                        <RiGitCommitLine
                            style = {{
                                fontSize: "2.1rem",
                                marginRight: "0.7rem"
                            }}
                        />
                        b30e5c3
                    </CommitText>
                    <IoMdCheckmarkCircleOutline
                                style = {{fontSize: "1.5rem", 
                                marginLeft: "auto", opacity: "0.4"}}
                            />
                </Commit>
                
            </CommitList>
        </RequestBody>
    )
}

export default CheckDetail;

const ReferenceList = styled.div`
    display: flex;
    align-items: center;
    margin-top: 1.5rem;
`

const Reference = styled.div`
    font-size: 1.25rem;
    color: #172A4E;
 
    align-items: center;
    display: inline-flex;

	font-weight: 500;
	margin-right: 1.5rem;
`

const ReferenceHeader = styled.div` 
    font-size: 1.4rem;
    display: flex;
    align-items: center;
    font-weight: 500;
    
`

const ReferencesBlock = styled.div`
    display: flex;
    flex-direction: column;
    margin-top: 4rem;
`

const Options = styled.div`
    display: flex;
    align-items: center;
`

const IconBorder = styled.div`
    width: 3rem;
    height: 3rem;
    background-color: #f7f9fb;
    margin-left: ${props => props.margin ? "auto": "0.5rem"};
    display: flex;
    align-items: center;
    border-radius: 0.3rem;
    justify-content: center;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
    font-size: 1.7rem;
`

const IconBorder2 = styled.div`
    width: 3rem;
    height: 3rem;
    background-color: #19e5be;
    color: white;
    margin-left: 1rem;
    display: flex;
    align-items: center;
    border-radius: 0.3rem;
    justify-content: center;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
    font-size: 1.7rem;
`

const IconBorder3 = styled.div`
    width: 3rem;
    height: 3rem;
    background-color: #f7f9fb;
    color: #5A75E6;
    margin-left: 1rem;
    display: flex;
    align-items: center;
    border-radius: 0.3rem;
    justify-content: center;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
    font-size: 1.7rem;
`

const RequestBody = styled.div`
    width: 100%;
    border-left: 1px solid #E0E4e7;
    /*box-shadow: 0 2px 4px rgba(0,0,0,0.15);*/
    height: calc(100vh - 45rem);
    padding: 3rem 3.5rem;
    overflow-y: scroll;
`

const RequestInfo = styled.div`
    margin-top: 1.3rem;
    opacity: 0.5;
    font-size: 1.2rem;
`

const RequestHeader = styled.div`
    font-size: 2.5rem;
    font-weight: 500;
    display: flex;
    align-items: center;
`

const CommitList = styled.div`
    display: flex;
    flex-direction: column;
    margin-top: 4rem;
    border-radius: 0.3rem;
    background-color: ${chroma('#5B75E6').alpha(0.05)};
`

const Commit = styled.div`
    /*margin-bottom: 2rem;*/
    display: flex;
    align-items: center;
    font-size: 1.2rem;
/*
    background-color: #f7f9fb;
    border-radius: 0.4rem;
*/
    padding: 1rem 1.3rem;
/*
    width: 20rem;
*/
    /*box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);*/
    font-weight: 300;
`

const CommitText = styled.div`
    display: inline-flex;
    align-items: center;
    &:hover {
        color: #5A75E6;
    }
    cursor: pointer;
`