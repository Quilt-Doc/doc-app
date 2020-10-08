import React, { Component } from 'react';
import PropTypes from 'prop-types';

//styles
import styled from 'styled-components';
import chroma from 'chroma-js';

//icons
import { AiOutlineClockCircle, AiOutlineExclamation } from 'react-icons/ai';
import { RiCloseFill, RiFileList2Fill } from 'react-icons/ri'
import { FiGitCommit } from 'react-icons/fi';

// Card representing document that is broken
class BreakagePlaceholder extends Component {
    render(){
        return(
            <Card> {/*REPEATED COMPONENT MINIMAL DOCUMENT*/}
                <Title>
                    
                </Title>
                <Content>
                    <RiFileList2Fill style = {{
                        color: '#2684FF',
                    }}/>
                </Content> 
                <Detail>
                    
                </Detail>
            </Card>
        )
    }
}

export default BreakagePlaceholder;

const Commit = styled.div`
    font-size: 0.95rem;
    margin-left: auto;
    display: flex;
    align-items: center;
    opacity: 0.7;
    font-weight: 500;
    margin-top: 0.6rem;
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

//3 Faraz TODO: add a border on this guy
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
    opacity: 0.6;
`


