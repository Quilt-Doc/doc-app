import React from 'react';

//styles
import styled from 'styled-components';
import chroma from 'chroma-js';

//icons
import { RiFileList2Fill } from 'react-icons/ri'
import { AiOutlineClockCircle } from 'react-icons/ai';

//Individual item in Feed
const FeedLog = () => {
    return (
       <ListItem active = {true}>
            <Icon>
                <IconBorder>
                    <RiFileList2Fill 
                        style = {{fontSize: "2.2rem"}}
                    />
                </IconBorder>
            </Icon>
            <Detail>
                <Content>
                    <Document>Faraz Sanal</Document> created <Document>Probability Distributions</Document>
                </Content>
                <CreationDate>
                    <AiOutlineClockCircle
                        style = {{marginRight: "0.5rem"}}
                    />
                    August 12, 2020
                </CreationDate> {/*REPEATED COMPONENT CHRONOLOGY*/}
            </Detail>
        </ListItem>
    )
}

export default FeedLog;


const Document = styled.b`
    font-weight: 500;
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
    font-size: 1.1rem;
    float: right;
    margin-top: 0.6rem;
`

const ListItem = styled.div`
    display: flex;
    /*background-color: ${props => props.active ? chroma('#f7f9fb').alpha(1) : ''};*/
    /*background-color: #f7f9fb;*/
    font-size: 1.5rem;
    margin-bottom: 2rem;
`

const Icon = styled.div`
    width: 5rem;
    margin-right: 1.5rem;
`

const Detail = styled.div`

`

const Content = styled.div`
    font-size: 1.25rem;
    opacity: 0.8;
    margin-top: 0.1rem;
    line-height:1.5;
`

const IconBorder = styled.div`
    width: 4rem;
    height: 4rem;
    background-color: ${props => props.red ? chroma('#ff4757').alpha(0.2) : chroma('#19e5be').alpha(0.2)};
    color: ${props => props.red ? "#ff4757" : '#19e5be'};
    align-items: center;
    justify-content: center;
    display: flex;
    border-radius: 50%;
    font-size: 1.6rem;
`
