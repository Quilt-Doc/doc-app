import React, {Component} from 'react'

import styled from 'styled-components';

import { connect } from 'react-redux';

import { withRouter } from 'react-router-dom';

//history
import history from '../../../history';

//actions
import { getRequest } from '../../../actions/Request_Actions';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faAlignJustify } from '@fortawesome/free-solid-svg-icons'

class RequestModal extends Component {
    constructor(props){
        super(props)
    }

    componentDidMount(){
        let search = history.location.search
        let params = new URLSearchParams(search)
        let requestId = params.get('request') 
        
        this.props.getRequest(requestId)
    }

    render(){
        return (
        <>
            {this.props.request ? 
                <ModalBackground >
                        <ModalContent >
                            <RequestTitle>Explain Semantic 
                                
                            </RequestTitle>
                            
                            <RequestHighlight>
                                
                                <RequestStatusButton>Open</RequestStatusButton>
                                <RequestTime><b>Faraz Sanal</b> opened this request 24 days ago</RequestTime>
                                <RequestStat>
                                    <StatContainer>
                                        <ion-icon 
                                            name="caret-up-sharp"
                                            style = {
                                                {color: "#172A4E", marginLeft: "-0.1rem",marginBottom: "0.3rem", marginTop: "0.2rem", fontSize: "1.7rem"}
                                            }
                                        >
                                        </ion-icon>
                                        <Votes>10</Votes>
                                    </StatContainer>
                                    <StatContainer>
                                        <ion-icon 
                                            name="chatbox-ellipses-outline"
                                            style = {
                                                {color: "#172A4E", marginLeft: "-0.1rem",marginBottom: "0.3rem", marginTop: "0.2rem", fontSize: "1.7rem"}
                                            }
                                        >
                                        </ion-icon>
                                        <Votes>10</Votes>
                                    </StatContainer>
                                
                                </RequestStat>
                                
                            </RequestHighlight>
                        
                            <InfoBlock>   
                                <InfoHeader>
                                    <ion-icon style = {
                                            {color: "#172A4E",  marginLeft: "-0.4rem", marginRight: "1rem", fontSize: "2rem"}
                                        } name="code-outline"></ion-icon>
                                    References
                                </InfoHeader>
                                <ReferenceContainer>
                                    
                                    <NoneMessage>None yet</NoneMessage>
                                    <AddButton>
                                        <ion-icon style = {{fontSize: "1.5rem"}} name="add-outline"></ion-icon>
                                    </AddButton>
                                </ReferenceContainer>
                            </InfoBlock>
                            <InfoBlock>
                                <InfoHeader>
                                    <FontAwesomeIcon style = {
                                                {color: "#172A4E", marginRight: "1.2rem"}
                                            } icon={faAlignJustify} />
                                    Description
                                </InfoHeader>

                                    <RequestDescription>
                                        Describe your request
                                    </RequestDescription>
                            </InfoBlock>
                            <InfoBlock>
                                <InfoHeader>
                                    <ion-icon style = {
                                                {color: "#172A4E",  marginLeft: "-0.4rem", marginRight: "1rem", fontSize: "2rem"}
                                            } name="pricetag-outline"></ion-icon>
                                    Labels
                                </InfoHeader>
                                <ReferenceContainer>
                                    <Tag>Utility</Tag>
                                    <AddButton>
                                        <ion-icon style = {{fontSize: "1.5rem"}} name="add-outline"></ion-icon>
                                    </AddButton>
                                </ReferenceContainer>
                            </InfoBlock>
                            <InfoBlock>
                                <InfoHeader>
                                    <ion-icon style = {
                                                {color: "#172A4E",  marginLeft: "-0.4rem", marginRight: "1rem", fontSize: "2rem"}
                                        } name="people-outline"></ion-icon>   
                                    Mentions
                                
                                </InfoHeader>
                                <ReferenceContainer>
                                    <NoneMessage>None yet</NoneMessage>
                                    <AddButton>
                                        <ion-icon style = {{fontSize: "1.5rem"}} name="add-outline"></ion-icon>
                                    </AddButton>
                                </ReferenceContainer>
                            </InfoBlock>
                                    
                        
                            <InfoBlock>
                                <InfoHeader>
                                    <ion-icon style = {
                                                {color: "#172A4E",  marginLeft: "-0.4rem", marginRight: "1rem", fontSize: "2rem"}
                                        }name="chatbox-ellipses-outline"></ion-icon>
                                    Comments
                                </InfoHeader>
                                <ReferenceContainer>
                                    <ProfileButton2>FS</ProfileButton2><CommentInput placeholder = {"Write a comment.."}/>
                                </ReferenceContainer>
                            </InfoBlock>
                        
                        </ModalContent>
                    </ModalBackground> : null
                }
            </>
        )
    }
}

const mapStateToProps = (state, ownProps) => {
    let search = history.location.search
    let params = new URLSearchParams(search)
    let requestId = params.get('request') 

    return {
        request : state.requests[requestId]
    }
}


export default  connect(mapStateToProps, { getRequest })(RequestModal);


const CommentInput = styled.input`
    height: 3.7rem;
    outline: none;
    padding: 1rem;
    border-radius: 0.3rem;
    width: 59rem;
    border: 1px solid #E0E4E7;
    background-color: #F7F9FB;
    color: #172A4E;
    &::placeholder { 
        color: #172A4E;
        opacity: 0.7;
    }
    &:focus {
        border: 1px solid #19E5BE;
        background-color: white;
    }
`

const AddButton = styled.div`
    width: 2.3rem;
    height: 2.3rem;
    background-color: #F7F9FB;
    border: 1px solid #E0E4E7;
    opacity: 0.3;
    border-radius: 0.2rem;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    &:hover {
        opacity: 1
    }
`

const NoneMessage = styled.div`
    font-size: 1.3rem;
    margin-right: 1rem;
    opacity: 0.5;
`

const Tag = styled.div`
    font-size: 1.25rem;
    color: #2980b9;
    padding: 0.4rem 0.8rem;
    background-color: rgba(51, 152, 219, 0.1);
    display: inline-block;
    border-radius: 4px;
    margin-right: 1rem;
`

const RequestDescription = styled.div`
    margin-top: 0.8rem;
    height: 6rem;
    background-color: #F7F9FB;
    border-radius: 0.5rem;
    padding: 1rem;
    border: 1px solid #E0E4E7;
    font-size: 1.4rem;
    opacity: 0.7;
`

const Reference = styled.div`
    font-size: 1.25rem;
    color: #19E5BE;
    /*box-shadow: rgba(9, 30, 66, 0.31) 0px 0px 1px 0px, rgba(9, 30, 66, 0.25) 0px 8px 16px -6px;*/
    padding: 0.5rem 0.9rem;
    align-items: center;
    display: inline-flex;
    background-color:#262E49;
    color:#D6E0EE;
    border-radius: 0.3rem;
   /* box-shadow: rgba(9, 30, 66, 0.31) 0px 0px 1px 0px, rgba(9, 30, 66, 0.25) 0px 1px 1px 0px;*/
    margin-right: 1rem;
`

const ReferenceContainer = styled.div`
    margin-top: 0.8rem;
    display: flex;
    align-items: center;

`


const RequestTitle = styled.div`
    font-size: 3rem;
    display: flex;
    margin-bottom: 2rem;
    align-items: center;
`

const RequestStatusButton = styled.div`
    display: inline-flex;
    font-size: 1.5rem;
    font-weight: 500;
   
    color: white;
    padding: 0.8rem 2rem;
    background-color: #19E5BE;
    border-radius: 0.4rem;
    margin-left: 1rem;
    letter-spacing: 1;
    margin-right: 0.5rem;
    box-shadow: rgba(9, 30, 66, 0.31) 0px 0px 1px 0px, rgba(9, 30, 66, 0.25) 0px 1px 1px 0px;
`

const RequestTime = styled.div`
    margin-left: 1rem;
    font-size: 1.5rem;
`

const StatContainer = styled.div`
    display: flex;
    flex-direction: column;
    &:first-of-type {
        margin-right: 1.5rem;
    }

`

const RequestStat = styled.div`
    display: flex;
    background-color: white;
    box-shadow: rgba(9, 30, 66, 0.31) 0px 0px 1px 0px, rgba(9, 30, 66, 0.25) 0px 1px 1px 0px;
    margin-left: auto;
    margin-right: 2rem;
    padding: 0.7rem 2rem;
    border-radius: 0.3rem;
    align-items: center;
`

const RequestHighlight = styled.div`
    min-height: 7rem;
    border-radius: 0.3rem;
    background-color: #F7F9FB;
    border: 1px solid #E0E4E7;
    display: flex;
    align-items: center;
    margin-bottom: 1rem;
`

const InfoHeader = styled.div`
    display: flex;
    align-items: center;
    font-weight: 500;
    font-size: 1.6rem;
    color: #172A4E;
    margin-bottom: 1.5rem;
`

const InfoBlock = styled.div`
    padding-top: 2.4rem;
    padding-bottom: 2.4rem;
    display: ${props => props.display};
    border-bottom: ${props => props.borderBottom};
`

const ModalBackground = styled.div`
    position: fixed; /* Stay in place */
    z-index: 10000; /* Sit on top */
    left: 0;
    top: 0;
    width: 100%; /* Full width */
    height: 100%; /* Full height */
    overflow: hidden; /* Enable scroll if needed */
    background-color: rgb(0,0,0); /* Fallback color */
    background-color: rgba(0, 0, 0, 0.4); /* Black w/ opacity */
    display: ${props => props.display};
`

/* Modal Content/Box */
const ModalContent = styled.div`
    background-color:#fefefe;
    margin: 8vh auto; /* 15% from the top and centered */
    padding: 6rem;
    padding-top: 4rem;
    padding-bottom: 4rem;
    overflow-y: scroll;
    border: 1px solid #888;
    width: 75rem; /* Could be more or less, depending on screen size */
    height: 90vh;
    border-radius: 0.4rem;
    box-shadow: rgba(15, 15, 15, 0.05) 0px 0px 0px 1px, rgba(15, 15, 15, 0.1) 0px 5px 10px, rgba(15, 15, 15, 0.2) 0px 15px 40px;
    display: flex;
    flex-direction: column;
    max-width: 98rem;
`

const ProfileButton2 = styled.div`
    width: 3.5rem;
    height: 3.5rem;
    margin-right: 1rem;
    justify-content: center;
    align-items: center;
    display: flex;
    border-radius: 0.3rem;
    font-size: 1.6rem;
    color: white;
    background-color: #19E5BE;
    cursor: pointer;
`

const Votes = styled.div`
    font-size: 1.5rem;
    margin-top: 0.05rem;
    color: #172A4E;
`
