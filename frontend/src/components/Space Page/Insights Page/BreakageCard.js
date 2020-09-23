import React from 'react';

import styled from 'styled-components';
import chroma from 'chroma-js';

import { FaJira } from 'react-icons/fa';
import { AiOutlineClockCircle, AiOutlineExclamation } from 'react-icons/ai';
import { RiCheckFill, RiFileList2Fill, RiCloseFill, RiGitCommitLine} from 'react-icons/ri'
import {FiAlertTriangle, FiGitCommit} from 'react-icons/fi';

class BreakageCard extends React.Component {
    renderStatus(){
        return !this.props.warning ?
        (<Status color = {"#ff4757"}>
            <RiCloseFill
                style = 
                {{
                    fontSize: "1.7rem"
                }}
            />
        </Status>) :
        (<Status color = {"#5B75E6"}>
            <AiOutlineExclamation
                style = 
                {{
                    fontSize: "1.5rem"
                }}
            />
        </Status>)
    }

    render(){
        return(
            <Card >
                <Title>
                    Probability
                    {this.renderStatus()}
                </Title>
                <Content>
                    <RiFileList2Fill style = {{
                        color: '#2684FF',
                    }}/>
                </Content> 
                <Detail>
                    <CreationDate>
                        <AiOutlineClockCircle
                            style = {{marginRight: "0.5rem"}}
                        />
                        August 12, 2015
                    </CreationDate>
                    <Commit>
                        <FiGitCommit
                            style = {{
                                fontSize: "1.2rem",
                                marginRight: "0.3rem",
                                marginTop: "0.1rem"
                            }}
                        />
                        b30e5c3
                    </Commit>
                </Detail>
            </Card>
        )
    }
}

export default BreakageCard;

const Commit = styled.div`
    font-size: 0.95rem;
    margin-left: auto;
    display: flex;
    align-items: center;
    opacity: 0.7;
    font-weight: 500;
    margin-top: 0.6rem;
`

const ImageContainer = styled.div`
    height: 22rem;
    display: flex;
    justify-content: center;
    align-items: center;
    margin-top: 1rem;
    margin-bottom: 1rem;
`

const StyledImg = styled.img`
    width: 20rem;
    height: auto;
    border: 1px solid #E0E4E7;
    border-radius: 0.3rem;
`

const Status = styled.div`
    display: inline-flex;
    background-color: ${props => chroma(props.color).alpha(0.15)};
    color:${props => props.color};
    border: 1px solid ${props => props.color};
    font-weight: 500;
    border-radius: 0.3rem;
    font-size: 1.4rem;
    align-items: center;
    height: 2rem;
    width: 2.7rem;
    margin-top: -0rem;
    margin-left: auto;
    justify-content: center;
`

const Title = styled.div`
    display: flex;
    font-weight: 500;
    font-size: 1.4rem;
    align-items: center;
`

//add a border on this guy
const Content = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    height: 22rem;
    margin-bottom: 1rem;
    margin-top: 1rem;
    font-size: 3.5rem;
`

const Detail = styled.div`
    display: flex;
    font-size: 1.1rem;
    align-items: center;
    margin-top: auto;
`

const Creator = styled.div`
    height: 2.5rem;
    width: 2.5rem;
    background-color: ${chroma('#1e90ff').alpha(0.2)};
    color:#1e90ff;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 0.3rem;
    font-size: 1.4rem;
    margin-left: auto;
    margin-top: -0.1rem;
`

const CreationDate = styled.div`
    display: inline-flex;
    align-items: center;
    background-color: #f5f7fa;
    height: 2.3rem;
    padding: 0rem 0.8rem;
    font-weight:500;
    border-radius: 0.3rem;
    color: #8996A8;
`

const Card = styled.div`
    &:first-of-type {
        margin-left: 4rem;
    }
    height: 16rem;
    min-width: 23rem;
    border-radius: 0.5rem;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
    background-color: white;
    padding: 1.5rem 2rem;
    padding-top: 2rem;
    display: flex;
    flex-direction: column;
    align-self: ${props => props.top ? "flex-start" : ""};
    margin-right: 2rem;
    margin-right: 3rem;
`


