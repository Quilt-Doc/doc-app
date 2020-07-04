import React from 'react';

import styled from 'styled-components';

class RequestView extends React.Component {
    constructor(props) {
        super(props);
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
                        <IconBorder
                                marginLeft = {"1rem"}
                        >
                        <ion-icon style={{'color': '#172A4E', 'fontSize': '2.2rem', }} name="pencil-outline"></ion-icon>
                        </IconBorder>
                        <ListName>Create Request</ListName>
                        <IconBorder
                                marginLeft = {"53rem"}
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
        
    }
}


export default RequestView;

const Header = styled.div`
    color: #172A4E;
    font-size: 2.5rem;
    margin-left: 8rem;
    margin-bottom: 5rem;
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
    padding-left: 5rem;
    padding-right: 5rem;
    display: flex;
    cursor: pointer;
    border-radius: 0.3rem;
    transition: all 0.1s ease-in;
    &:hover {
        background-color: #F4F4F6; 
    }
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

const Container = styled.div`
    display: flex;
    background-color:  #F7F9FB;
    margin-left: 8rem;
    margin-right: 8rem;
    padding: 3rem;
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
    margin-left: 0rem;
    color: #172A4E;
    font-size: 1.6rem;
    font-weight: 300;
`


const IconBorder = styled.div`
    margin-left: ${props => props.marginLeft};
    margin-right: 0.2rem;
    display: flex;
    align-items: center;
    opacity: 0.7;
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