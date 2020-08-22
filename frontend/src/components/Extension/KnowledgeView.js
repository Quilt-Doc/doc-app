import React from 'react';
import styled from 'styled-components';
import chroma from 'chroma-js';

import { FaConfluence, FaJira, FaTrello } from "react-icons/fa";
import { FiFileText} from "react-icons/fi"
import {GiTicket} from 'react-icons/gi'
import {GoFileCode} from 'react-icons/go'
import {GrStatusCriticalSmall, GrStatusPlaceholder} from 'react-icons/gr';

class KnowledgeView extends React.Component {
    render(){
        return(
            <>
            <TopContainer>
                <FileHeader>
                    <GoFileCode style = {{fontSize: "1.5rem",  marginRight: "0.5rem"}}/>
                    extension.js
                </FileHeader>
                <Status>
                    <GrStatusCriticalSmall style = {{ fontSize: "1.5rem", color: '#C21D1D'}}/>
                    <Link color = '#1b1f31'/>
                    <GrStatusCriticalSmall style = {{fontSize: "1.5rem", color: '#1b1f31'}}/>
                    <Link color = '#1b1f31'/>
                    <GrStatusCriticalSmall style = {{fontSize: "1.5rem", color: '#1b1f31'}}/>
                </Status>
            </TopContainer>
            <TagContainer>
                <Tag>Utility</Tag>
                <Tag color = '#5352ed'>Backend</Tag>
            </TagContainer>
            <DocumentContainer>
                    <HeaderContainer>
                        <Circle/>
                        <Header>
                            Knowledge
                        </Header>
                        
                    </HeaderContainer>
                    <ListContainer>
                            <Card>
                                <IconBorder>
                                    <FiFileText/>
                                </IconBorder>
                                Probability Distributions
                                <IconBorder2
                                     style = {{color: '#2884FF'}}
                                >
                                   <FaConfluence/>
                                </IconBorder2>
                            </Card>
                            <Card>
                                <IconBorder>
                                    <FiFileText/>
                                </IconBorder>
                                Tree Network
                                <IconBorder2>
                                    <ion-icon 
                                        style = {{color: '#E11D5A'}}
                                        name="logo-slack">
                                       
                                    </ion-icon>
                                </IconBorder2>
                            </Card>
                            <Card>
                                {/*FiFileText*/}
                                {/*BsFileText*/}
                                <IconBorder>
                                    <FiFileText/>
                                </IconBorder>
                                Pytorch Integrations
                                <IconBorder2>
                                    <ion-icon 
                                        style = {{color: '#E11D5A'}}
                                        name="logo-slack">
                                       
                                    </ion-icon>
                                </IconBorder2>
                            </Card>
                            <Card>
                                {/*FiFileText*/}
                                {/*BsFileText*/}
                                <IconBorder>
                                    <FiFileText/>
                                </IconBorder>
                                Prototyping Data
                                <IconBorder2
                                     style = {{color: '#2884FF'}}
                                >
                                   <FaConfluence/>
                                </IconBorder2>
                            </Card>
                        </ListContainer>
            </DocumentContainer>
            <DocumentContainer>
                    <HeaderContainer>
                        <Circle color = "#19e5be" />
                        <Header>
                            Project Management
                        </Header>
                    </HeaderContainer>
                    <ListContainer>
                            <Card>
                                <IconBorder>
                                    <GiTicket/>
                                </IconBorder>
                                Finish MarkupMenu
                                <IconBorder2>
                                    <FaJira style = {{color: '#2884FF'}}/>
                                </IconBorder2>
                            </Card>
                            <Card>
                                <IconBorder>
                                    <GiTicket/>
                                </IconBorder>
                                Server Bug
                                <IconBorder2>
                                    <FaJira style = {{color: '#2884FF'}}/>
                                </IconBorder2>
                            </Card>
                            <Card>
                                {/*FiFileText*/}
                                {/*BsFileText*/}
                                <IconBorder>
                                    <GiTicket/>
                                </IconBorder>
                                Doc Hierarchy Fixes
                                <IconBorder2>
                                    <FaTrello style = {{color: '#0079BF'}}
                                    />
                                </IconBorder2>
                            </Card>
                        </ListContainer>
            </DocumentContainer>
        </>
        )
    }
}

export default KnowledgeView;

const Status = styled.div`
    margin-left: auto;
    display: flex;
    align-items: center;
`

const Ball = styled.div`
    border-radius: 50%;
    height: 1.5rem;
    width: 1.5rem;
    background-color: #5B75E6;
    background-color: ${props => props.color};
`

const Link = styled.div`
    background-color: ${props => props.color};
    width: 3rem;
    height: 0.2rem;
`

const FileHeader = styled.div`
    align-items: center;
    display: flex;
`

const TopContainer = styled.div`
    font-size: 1.7rem;
    display: flex;
    align-items: center;
  
    margin-bottom: 2rem;

`

const SpaceHeader = styled.div`
    align-items: center;
    display: flex;
`

const IconBorder = styled.div`
    width: 1rem;
    height: 1rem;
    justify-content: center;
    align-items: center;
    font-size: 1.15rem;
    margin-right: 0.7rem;
`


const IconBorder2 = styled.div`
    justify-content: center;
    align-items: center;
    font-size: 1.3rem;
    margin-left: auto;
    margin-right: 1rem;
    margin-top: 0.3rem;
`

const Card = styled.div`
    display: flex;
    padding-left: 1rem;
    margin-left: 1.1rem;
    font-size: 1.3rem;
    align-items: center;
    height: 3.5rem;
    font-weight: 500;
    cursor: pointer;
    &:hover {
        background-color: #272b45;
    }
    transition: all 0.1s ease-in-out;
    border-radius: 0.4rem;
`

const ListContainer = styled.div`
    margin-top: 1.5rem;
`




const HeaderContainer = styled.div`
    display: flex;
    align-items: center;
`

const Header = styled.div`
    display: flex;
    font-size: 1.4rem;
    align-items: center;
    font-weight: 400;
    letter-spacing: 0.5px;
`

const TagContainer = styled.div`
    margin-bottom: 2rem;
    display: flex;
`

const Tag = styled.div`
    font-size: 1.25rem;
    
    padding: 0.4rem 0.8rem;

    
    color: white;
    display: inline-block;
    border-radius: 4px;
    margin-right: 1rem;
    background-color: ${props => props.color ? chroma(props.color).alpha(1) : chroma("#2980b9").alpha(1)};
`

const DocumentContainer = styled.div`
    background-color: #181b2b;
    padding: 2.2rem 2rem;
    border-radius: 0.4rem;
    margin-bottom: 2rem;
`

const DocCard = styled.div`
    height: 2.5rem;
    width: 100%;
    background-color: #1b1f31;
    border-radius: 0.3rem;
`

const Circle = styled.div`
    border-radius: 50%;
    height: 0.7rem;
    width: 0.7rem;
    background-color: #5B75E6;
    margin-right: 1.5rem;
    background-color: ${props => props.color};
`