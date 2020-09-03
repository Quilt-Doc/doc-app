import {CgFeed} from 'react-icons/cg';
import React from 'react';
import styled from 'styled-components';
import {FiFileText} from 'react-icons/fi';
import {RiFileList2Fill} from 'react-icons/ri'
import {RiDeleteBin7Fill} from 'react-icons/ri'
import chroma from 'chroma-js';

class FeedLog extends React.Component {

    render(){
        return(
            <>
         <FeedContainer>
                        <ListToolbar>
                            <CgFeed style = {{fontSize: "1.8rem", marginRight: "0.7rem"}}/>
                            Feed
                            <Current>
                                <b>12</b>&nbsp; new documents this week
                            </Current>
                            {/*
                                /*Document, 
                                broken references,  
                                commit date*/
                            }
                           
                        </ListToolbar>
                        <ListView>
                            <ListItem active = {true}>
                                <Date>
                                    August, 12, 2021
                                </Date>
                                <Document>
                                    <IconBorder>
                                        <RiFileList2Fill />
                                    </IconBorder>
                                    Faraz Sanal 
                                    
                                    <div style = {{opacity: 0.5, marginLeft: "0.6rem", marginRight: "0.6rem"}}>created</div> Tensor Manipulation
                                </Document>
                            </ListItem>
                            <Line/>
                            <ListItem active = {true}>
                                <Date>
                                    August, 12, 2021
                                </Date>
                                <Document>
                                    <IconBorder red = {true}>
                                        <RiDeleteBin7Fill />
                                    </IconBorder>
                                    Karan Godara
                                    
                                    <div style = {{opacity: 0.5, marginLeft: "0.6rem", marginRight: "0.6rem"}}>deleted</div> Semantic Functionality
                                </Document>
                            </ListItem>
                            <Line/>
                            <ListItem active = {true}>
                                <Date>
                                    August, 12, 2021
                                </Date>
                                <Document>
                                    <IconBorder red = {true}>
                                        <RiDeleteBin7Fill/>
                                    </IconBorder>
                                    Jasprat Kohli
                                    
                                    <div style = {{opacity: 0.5, marginLeft: "0.6rem", marginRight: "0.6rem"}}>deleted</div> Everything
                                </Document>
                            </ListItem>
                        </ListView>
                    </FeedContainer>
            </>
        )
    }
}

export default FeedLog;

const Document = styled.div`
    display: flex;
    align-items: center;
    font-size: 1.35rem;
    font-weight: 500;
    width: 80%;
    margin-right: 1rem;
`

const Date = styled.div`
    font-size: 1.3rem;
    font-weight: 500;
    width: 11rem;
`

const ListItem = styled.div`
    display: flex;
    align-items: center;
    padding-left: 3rem;
    padding-right: 3rem;
    height: 3.5rem;
  
    /*background-color: ${props => props.active ? chroma('#f7f9fb').alpha(1) : ''};*/
    /*background-color: #f7f9fb;*/
    font-size: 1.5rem;
`


const Current = styled.div`
    margin-left: auto;
    font-weight: 300;
    
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
    background-color: white;
    padding-bottom: 1rem;
    /*background-color: ${chroma('#ff4757').alpha(0.07)};*/
    height: 100%;
    padding-top: 1rem;
`

const FeedContainer = styled.div`
    width: 100%;
    background-color: white;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
    border-radius: 0.2rem;
    display: flex;
    flex-direction: column;
`

const Line = styled.div`
    border-right: 2px solid #EDEFF1;
    height: 2.5rem;
    width: 6rem;
`

const IconBorder = styled.div`
    width: 3rem;
    height: 3rem;
    background-color: ${props => props.red ? chroma('#ff4757').alpha(0.1) : chroma('#19e5be').alpha(0.1)};
    color: ${props => props.red ? "#ff4757" : '#19e5be'};
    margin-left: 5rem;
    align-items: center;
    justify-content: center;
    display: flex;
    border-radius: 50%;
    margin-right: 2rem;
    font-size: 1.6rem;
    
`
