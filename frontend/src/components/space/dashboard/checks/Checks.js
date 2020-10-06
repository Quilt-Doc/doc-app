import React from 'react';

//styles
import styled from 'styled-components';
import chroma from 'chroma-js';

//components
import CheckDetail from './elements/check_detail/CheckDetail';
import CheckToolbar from './elements/CheckToolbar';
import CheckCard from './elements/CheckCard';
import { IoMdCheckmarkCircleOutline } from 'react-icons/io';
import { AiOutlineClockCircle } from 'react-icons/ai';
import { FiGitCommit } from 'react-icons/fi';
import { RiFile2Fill, RiFileList2Fill, RiScissorsLine } from 'react-icons/ri';

// component that retrieve pull requests from version control
// and keeps track of doc/reference updating and deprecation with regard to the request
const Checks = () => {
    return(
        <Container>
            <Header>
                Git Checks
            </Header>
            <BodyContainer>
                <LeftBar>
                    <Check>
                        <Status>
                            <IoMdCheckmarkCircleOutline/>
                        </Status>
                        <CheckContent>
                            <Commit>
                                    <FiGitCommit
                                        style = {{
                                            fontSize: "1.2rem",
                                            marginTop: "0.1rem",
                                            marginRight: "0.2rem",
                                        }}
                                    />
                                    b30e5c3
                            </Commit>
                            <Title>Reporting pushed</Title>
                            <Detail>
                                <Bottom>
                                    <Creator>F</Creator>
                                    <CreationDate> 
                                        <AiOutlineClockCircle
                                            style = {{marginTop: "0.08rem", marginRight: "0.5rem"}}
                                        />
                                        August 12, 2015
                                    </CreationDate>
                                </Bottom>
                            </Detail>
                        </CheckContent>
                    </Check>
                    <Check>
                        <Status>
                            <IoMdCheckmarkCircleOutline/>
                        </Status>
                        <CheckContent>
                            <Commit>
                                    <FiGitCommit
                                        style = {{
                                            fontSize: "1.2rem",
                                            marginTop: "0.1rem",
                                            marginRight: "0.2rem",
                                        }}
                                    />
                                    b30e5c3
                            </Commit>
                            <Title>Reporting pushed</Title>
                            <Detail>
                                <Bottom>
                                    <Creator>F</Creator>
                                    <CreationDate> 
                                        <AiOutlineClockCircle
                                            style = {{marginTop: "0.08rem", marginRight: "0.5rem"}}
                                        />
                                        August 12, 2015
                                    </CreationDate>
                                </Bottom>
                            </Detail>
                        </CheckContent>
                    </Check>
                </LeftBar>
                <RightContent>
                    <Block>
                        <BlockHeader>
                            New Code References
                        </BlockHeader>
                        <BrokenDocument>
                            <RiFileList2Fill  style = {{
                               
                                width: "2rem",
                                fontSize: "1.6rem",
                                marginRight: "0.5rem"
                            }}/>
                            Data Utils
                        </BrokenDocument>
                    </Block>
                    <Block>
                        <BlockHeader>
                            Broken Documents
                        </BlockHeader>
                        <BrokenDocument>
                            <RiFileList2Fill  style = {{
                               
                                width: "2rem",
                                fontSize: "1.6rem",
                                marginRight: "0.5rem"
                            }}/>
                            Data Utils
                        </BrokenDocument>
                    </Block>
                    <Block>
                        <BlockHeader>
                            Deprecated Snippets
                        </BlockHeader>
                        <BrokenSnippet>
                            <RiScissorsLine style = {{
                               
                                width: "2rem",
                                fontSize: "1.5rem",
                                marginRight: "0.5rem"
                            }}/>
                            <Name>Reference.js</Name>
                            <SnippetInfo>Lines 11-13</SnippetInfo>
                        </BrokenSnippet>
                    </Block>
                </RightContent>
            </BodyContainer>
        </Container>
    );
}

export default Checks;

const BlockHeader = styled.div`
    font-size: 1.5rem;
    font-weight: 500;
    margin-bottom: 1.7rem;
`

const Block = styled.div`
    background-color: white;
   
    padding: 1.7rem 2rem;
    border-radius: 0.7rem;
    width: 90%;
    margin-bottom: 2rem;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
`

const BrokenDocument = styled.div`
    height: 3rem;
    border-radius: 0.3rem;
    display: flex;
    font-weight: 500;
    align-items: center;
    font-size: 1.25rem;
`

const BrokenSnippet = styled.div`
    height: 3rem;
    border-radius: 0.3rem;
    display: flex;
    font-weight: 500;
    align-items: center;
    font-size: 1.25rem;
`

const Name = styled.div`
    opacity: 1;
    text-overflow: ellipsis;
    white-space: nowrap;
    overflow: hidden;
    font-weight: 500;
    width: ${props => props.width}rem;
    font-size: 1.25rem;
`

const SnippetInfo = styled.div`
    margin-left: auto;
`

const LeftBar = styled.div`
    width: 40rem;
    min-height: 100%;
    overflow-y: scroll;
    background-color: white;
    border-right: 1px solid #E0E4E7;
    padding: 2rem;
    border-top-left-radius: 0.5rem;
    border-bottom-left-radius: 0.5rem;
`

const RightContent = styled.div`
    width: 100%;
    padding: 2rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    overflow-y: scroll;
`

const Check = styled.div`
    height: 11rem;
    width: 100%;
    border-radius: 0.7rem;
    background-color: white;
    margin-bottom: 1.5rem;
    display: flex;
    
`

const CheckContent = styled.div`
    width: 100%;
    border-top: 1px solid #E0E4E7;
    border-right: 1px solid #E0E4E7;
    border-bottom: 1px solid #E0E4E7;
    border-top-right-radius: 0.8rem;
    border-bottom-right-radius: 0.8rem;
    padding: 1rem 1.8rem;
    display: flex;
    flex-direction: column;
`

const Title = styled.div`
    font-weight: 500;
    font-size: 1.3rem;
`

const Status = styled.div`
    color: #19e5be;
    font-size: 2.7rem;
    padding: 1rem;
    background-color:#373a49;
    border-top-left-radius: 0.8rem;
    border-bottom-left-radius: 0.8rem;

`

const Header = styled.div`
    height: 4.5rem;
    display: flex;
    align-items: center;
    font-size: 1.7rem;
    font-weight: 500;
    margin-bottom: 1rem;
`

const Container = styled.div`
    display: flex;
    flex-direction: column;
    z-index: 1;
    /*
    padding-left: 4rem;
    padding-right: 4rem;
    */
    margin-top: 1.5rem;
`

const BodyContainer = styled.div`
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
    background-color: #f9fafb;
    border-radius: 0.5rem;
    min-height: 45rem;
    display: flex;
    height: 60vh;
`


const Commit = styled.div`
    font-size: 0.95rem;
    display: flex;
    align-items: center;
    opacity: 0.7;
    font-weight: 500;
    margin-bottom: 0.7rem;
`

//3 Faraz TODO: add a border on this guy
const Creator = styled.div`
    height: 2.5rem;
    width: 2.5rem;
    background-color: ${chroma('#1e90ff').alpha(0.2)};
    color:#1e90ff;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.4rem;
    margin-top: -0.1rem;
    border-radius: 0.3rem;
    font-weight: 500;
`

const Bottom = styled.div`
    display: flex;
    width: 100%;
`   

const Detail = styled.div`
    display: flex;
    font-size: 1.1rem;
    align-items: center;
    margin-top: auto;
`

const CreationDate = styled.div`
    display: inline-flex;
    align-items: center;
    height: 2.3rem;
    
    font-weight:500;
    border-radius: 0.3rem;
    color: #8996A8;
    margin-left: auto;
`

