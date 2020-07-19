import React from 'react';

import styled from 'styled-components';

//redux
import { connect } from 'react-redux';

//router
import history from '../../../history';
import { withRouter } from 'react-router-dom';

//actions
import { createRequest } from '../../../actions/Request_Actions';

//components
import RequestModal from './RequestModal';

class RequestView extends React.Component {
    constructor(props) {
        super(props);
    }

    createRequest() {
        let {workspaceId} = this.props.match.params
        this.props.createRequest({title: "", workspaceId, authorId: this.props.user._id}).then((request) => {
            console.log(request)
            history.push(`?request=${request._id}`)
        })
    }


    render() {
        return (
            <>
                <Header>
                        Request Documentation
                </Header>
                <Container>
                <RequestContainer>
                    
                    <ListToolBar>
                        
                        <ListName onClick = {() => {this.createRequest()}}>
                            <ion-icon marginLeft = {"0.3rem"} style={{marginTop :"-0.3rem", marginRight :"0.5rem", 'color': '#172A4E', 'fontSize': '2.4rem', }} name="create-outline"></ion-icon>
                            Create Request
                           
                        </ListName>

                        <IconBorder
                                marginLeft = {"auto"}
                        >
                            <ion-icon style={{'color': '#172A4E', 'fontSize': '2.2rem'}} name="search-outline"></ion-icon>
                        </IconBorder>
                        <IconBorder marginRight = {"1rem"}>
                            <ion-icon style={{'color': '#172A4E', 'fontSize': '2.2rem', }} name="filter-outline"></ion-icon>
                        </IconBorder>
                    </ListToolBar>
                    <RequestCard>
                        <Author>
                            <ProfileButton>FS</ProfileButton>
                            <ion-icon 
                                name="caret-up-sharp"
                                style = {
                                    {color: "#172A4E", marginLeft: "-0.1rem", marginTop: "1rem", fontSize: "1.7rem"}
                                }
                            >
                            </ion-icon>
                            <Votes>10</Votes>
                            
                        </Author>
                        <RequestBody>
                            <Title2>Explain Semantic</Title2>
                            
                            <RequestContent>
                                Could someone highlight this for me? I didn't understand why reference.js is calling. I understand how the slate js backwards call is occurring but that is all.
                            </RequestContent>
                            <RequestReferences>
                                <Reference>
                                    <ion-icon 
                                        name="folder-sharp"
                                        style = {
                                            {color: "#172A4E", marginRight: "0.5rem"}
                                        }
                                    >
                                    
                                    </ion-icon>
                                    backend
                                </Reference>
                                <Reference>
                                    <ion-icon 
                                        style = {
                                            {color: "#172A4E", marginRight: "0.5rem"}
                                        }
                                        name="document-outline">
                                    </ion-icon>
                                    index.js
                                </Reference>
                            </RequestReferences>
                        </RequestBody>

                    </RequestCard>
                    <RequestCard>
                        <Author>
                            <ProfileButton>FS</ProfileButton>
                            <ion-icon 
                                name="caret-up-sharp"
                                style = {
                                    {color: "#172A4E", marginLeft: "-0.1rem", marginTop: "0.7rem", fontSize: "1.7rem"}
                                }
                            >
                            </ion-icon>
                            <Votes>10</Votes>
                        </Author>
                        <RequestBody>
                            <Title2>Explain Semantic</Title2>
                            
                            <RequestContent>
                                Could someone highlight this for me? I didn't understand why reference.js is calling. I understand how the slate js backwards call is occurring but that is all.
                            </RequestContent>
                            <RequestReferences>
                                <Reference>
                                    <ion-icon 
                                        name="folder-sharp"
                                        style = {
                                            {color: "#172A4E", marginRight: "0.5rem"}
                                        }
                                    >
                                    
                                    </ion-icon>
                                    backend
                                </Reference>
                                <Reference>
                                    <ion-icon 
                                        style = {
                                            {color: "#172A4E", marginRight: "0.5rem"}
                                        }
                                        name="document-outline">
                                    </ion-icon>
                                    index.js
                                </Reference>
                            </RequestReferences>
                        </RequestBody>

                    </RequestCard>
                    <RequestCard>
                        <Author>
                            <ProfileButton>FS</ProfileButton>
                            <ion-icon 
                                name="caret-up-sharp"
                                style = {
                                    {color: "#172A4E", marginLeft: "-0.1rem", marginTop: "1rem", fontSize: "1.7rem"}
                                }
                            >
                            </ion-icon>
                            <Votes>10</Votes>
                        </Author>
                        <RequestBody>
                            <Title2>Explain Semantic</Title2>
                            
                            <RequestContent>
                                Could someone highlight this for me? I didn't understand why reference.js is calling. I understand how the slate js backwards call is occurring but that is all.
                            </RequestContent>
                            <RequestReferences>
                                <Reference>
                                    <ion-icon 
                                        name="folder-sharp"
                                        style = {
                                            {color: "#172A4E", marginRight: "0.5rem"}
                                        }
                                    >
                                    
                                    </ion-icon>
                                    backend
                                </Reference>
                                <Reference>
                                    <ion-icon 
                                        style = {
                                            {color: "#172A4E", marginRight: "0.5rem"}
                                        }
                                        name="document-outline">
                                    </ion-icon>
                                    index.js
                                </Reference>
                            </RequestReferences>
                        </RequestBody>

                    </RequestCard>
                    <RequestCard>
                        <Author>
                            <ProfileButton>FS</ProfileButton>
                            <ion-icon 
                                name="caret-up-sharp"
                                style = {
                                    {color: "#172A4E", marginLeft: "-0.1rem", marginTop: "1rem", fontSize: "1.7rem"}
                                }
                            >
                            </ion-icon>
                            <Votes>10</Votes>
                        </Author>
                        <RequestBody>
                            <Title2>Explain Semantic</Title2>
                            
                            <RequestContent>
                                Could someone highlight this for me? I didn't understand why reference.js is calling. I understand how the slate js backwards call is occurring but that is all.
                            </RequestContent>
                            <RequestReferences>
                                <Reference>
                                    <ion-icon 
                                        name="folder-sharp"
                                        style = {
                                            {color: "#172A4E", marginRight: "0.5rem"}
                                        }
                                    >
                                    
                                    </ion-icon>
                                    backend
                                </Reference>
                                <Reference>
                                    <ion-icon 
                                        style = {
                                            {color: "#172A4E", marginRight: "0.5rem"}
                                        }
                                        name="document-outline">
                                    </ion-icon>
                                    index.js
                                </Reference>
                            </RequestReferences>
                        </RequestBody>

                    </RequestCard>
                    <RequestCard>
                        <Author>
                            <ProfileButton>FS</ProfileButton>
                            <ion-icon 
                                name="caret-up-sharp"
                                style = {
                                    {color: "#172A4E", marginLeft: "-0.1rem", marginTop: "1rem", fontSize: "1.7rem"}
                                }
                            >
                            </ion-icon>
                            <Votes>10</Votes>
                        </Author>
                        <RequestBody>
                            <Title2>Explain Semantic</Title2>
                            
                            <RequestContent>
                                Could someone highlight this for me? I didn't understand why reference.js is calling. I understand how the slate js backwards call is occurring but that is all.
                            </RequestContent>
                            <RequestReferences>
                                <Reference>
                                    <ion-icon 
                                        name="folder-sharp"
                                        style = {
                                            {color: "#172A4E", marginRight: "0.5rem"}
                                        }
                                    >
                                    
                                    </ion-icon>
                                    backend
                                </Reference>
                                <Reference>
                                    <ion-icon 
                                        style = {
                                            {color: "#172A4E", marginRight: "0.5rem"}
                                        }
                                        name="document-outline">
                                    </ion-icon>
                                    index.js
                                </Reference>
                            </RequestReferences>
                        </RequestBody>

                    </RequestCard>
                </RequestContainer>
                </Container>
            </>
        )
        }
}



const mapStateToProps = (state) => {
    return {
        user: state.auth.user
    }
}



export default withRouter(connect(mapStateToProps, { createRequest })(RequestView));

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
   
    font-size: 1.4rem;
    opacity: 0.7;
`

const Reference3 = styled.div`
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

const RequestStatus = styled.div`
    height: 4rem;
    align-items: center;
    margin-bottom: 1rem;
    margin-top: 2rem;
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
    padding-top: 1.9rem;
    padding-bottom: 1.9rem;
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
    height: 84vh;
    border-radius: 0.4rem;
    box-shadow: rgba(15, 15, 15, 0.05) 0px 0px 0px 1px, rgba(15, 15, 15, 0.1) 0px 5px 10px, rgba(15, 15, 15, 0.2) 0px 15px 40px;
    display: flex;
    flex-direction: column;
    max-width: 98rem;
`

const Header = styled.div`
    color: #172A4E;
    font-size: 2.5rem;
    margin-top: 5rem;
    margin-left: 8rem;
    margin-bottom: 5rem;
`

const Container = styled.div`
    display: flex;
    background-color:  #F7F9FB;
    margin-left: 8rem;
    margin-right: 8rem;
    padding: 3rem;
`

const RequestContainer = styled.div`
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    background-color: white;
    box-shadow: rgba(9, 30, 66, 0.31) 0px 0px 1px 0px, rgba(9, 30, 66, 0.25) 0px 8px 16px -6px;
    border-radius: 0.3rem;
`

const RequestCard = styled.div`
    padding: 1.5rem;
    padding-left: 9rem;
    padding-right: 9rem;
    display: flex;
    cursor: pointer;
    border-radius: 0.3rem;
    transition: all 0.1s ease-in;
    &:hover {
        background-color: #F4F4F6; 
    }
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

const ProfileButton = styled.div`
    width: 3.5rem;
    height: 3.5rem;
    justify-content: center;
    align-items: center;
    display: flex;
    border-radius: 0.3rem;
    font-size: 1.4rem;
    color: white;
    background-color: #19E5BE;
    cursor: pointer;
`

const Author = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
`

const RequestReferences = styled.div`
    display: flex;
`


const Reference = styled.div`
    font-size: 1.25rem;
    color: #172A4E;
    border: 1px solid #1BE5BE;
    padding: 0.4rem 0.8rem;
    background-color: white;
    display: flex;
    align-items: center;
    border-radius: 4px;
    margin-right: 1rem;
    margin-bottom: 1rem;
`

const RequestContent = styled.div`
    display: flex;
    align-items: center;
    color: #172A4E;
    font-size: 1.5rem;
    margin-bottom: 1rem;
`

const RequestBody = styled.div`
    margin-left: 3rem;
    width: 55rem;
`

const Votes = styled.div`
    font-size: 1.5rem;
    margin-top: 0.05rem;
    color: #172A4E;
`


const ProgressBox = styled.div`
    width: 25rem;
    height: 40rem;
    border-radius: 0.3rem;
    box-shadow: rgba(9, 30, 66, 0.31) 0px 0px 1px 0px, rgba(9, 30, 66, 0.25) 0px 8px 16px -6px;
    display: flex;
    flex-direction: column;
    padding-top: 0.5rem;
    padding-bottom: 0.5rem;
    background-color: white;
`

const ProgressItem = styled.div`
    display: flex;
    align-items: center;
    
    padding: 1.5rem;
    margin-top: 1rem;
    height: 5rem;
    color: ${props => props.color};
    &: hover {
        background-color: #F4F4F6; 
    }
    cursor: pointer;
`


const ListToolBar = styled.div`
    height: 4.5rem;
    display: flex;
    border-bottom: 1px solid #EDEFF1;
    align-items: center;
   
`

const ListName = styled.div`
    margin-left: 2rem;
    color: #172A4E;
    font-size: 1.6rem;
    font-weight: 400;
    padding: 0.7rem 1rem;
    cursor: pointer;
    letter-spacing: 0.8;
    display: flex;
    align-items: center;
    border-radius: 0.3rem;
    &:hover {
        background-color: #F4F4F6; 
    }
`


const IconBorder = styled.div`
    margin-left: ${props => props.marginLeft};
    margin-right: 0.2rem;
    display: flex;
    align-items: center;
    width: 3.5rem;
    height: 3.5rem;
    &: hover {
        opacity: 1;
        background-color: #F4F4F6; 
    }
    cursor: pointer;
    justify-content: center;
    transition: all 0.1s ease-in;
    border-radius: 0.3rem;
    margin-right: ${props => props.marginRight};
`


const Reference2 = styled.div`
    font-size: 1.25rem;
    color: #172A4E;
    border: 1px solid #1BE5BE;
    padding: 0.4rem 0.8rem;
    background-color: white;
    display: flex;
    align-items: center;
    border-radius: 4px;
    margin-left: 1rem;
    
`

const Title = styled.div`
    font-size: 1.5rem;
    font-weight: bold;
    margin-left: 2rem;
    color: #172A4E;
`


const Title2= styled.div`
    font-size: 1.5rem;
    font-weight: bold;
    margin-bottom: 0.5rem;
    color: #172A4E;
`