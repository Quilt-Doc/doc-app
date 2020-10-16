import React from 'react';

import styled from 'styled-components';
import chroma from 'chroma-js';

//redux
import { connect } from 'react-redux';

//router
import history from '../../../history';
import { withRouter } from 'react-router-dom';


//actions
import { clearSelected } from '../../../actions/Selected_Actions';
import { setRequestCreation } from '../../../actions/UI_Actions';
import { createRequest, retrieveRequests } from '../../../actions/deprecated/Request_Actions';



class RequestView extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            loaded: false
        }
    }

    componentDidMount(){
        this.props.retrieveRequests().then(() => {
            this.setState({loaded: true})
        })
    }


    createRequest() {
        let {workspaceId} = this.props.match.params
        let formValues = {title: "", workspaceId, authorId: this.props.user._id}
        if (this.props.selected.length > 0) {
            formValues.referenceIds = this.props.selected.map(sel => sel._id)
        }
        this.props.createRequest(formValues).then((request) => {
            this.props.clearSelected();
            this.props.setRequestCreation(true)
            history.push(`?request=${request._id}`)
        })
    }
    /* <VoteContainer>
                        <ion-icon 
                                name="caret-up-sharp"
                                style = {
                                    {color: "#172A4E", marginLeft: "-0.1rem", fontSize: "1.7rem"}
                                }
                            >
                            </ion-icon>
                        <Votes>10</Votes>
                    </VoteContainer> */
    renderRequests(){
        return this.props.requests.map(req => {
            return (
                <RequestCard onClick = {() => {history.push(`?request=${req._id}`)}}>
                   
                    <ProfileButton>FS</ProfileButton>
                    <RequestBody>
                        <Title2>{req.title}</Title2>
                        {req.markup && 
                            <RequestContent>
                                {req.markup}
                            </RequestContent>
                        }
                        {req.references && req.references.length > 0 && 
                            <RequestReferences>
                                {req.references.map(ref => {
                                    let icon =  ref.kind === 'dir' ? <ion-icon style = {{marginRight: "0.5rem", fontSize: "1.3rem"}} name="folder-sharp"></ion-icon> 
                                        : <ion-icon style = {{marginRight: "0.5rem", fontSize: "1rem"}} name="document-outline"></ion-icon>
                                    return <Reference>{icon}{ref.name}</Reference>
                                })}
                            </RequestReferences>
                        }
                      
                    </RequestBody>
                </RequestCard>)
        }) 
    }

    render() {
        return (
            <>
                { this.state.loaded ?
                        <>
                            <Header>
                                    Request Documentation
                            </Header>
                            <Container>
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
                                <RequestCard2>
                                    <RequestToolbar>
                                        <ProfileButton>FS</ProfileButton>
                                        <RequestTime>
                                            <RequestTimeAuthor>Faraz Sanal</RequestTimeAuthor> opened this request 24 days ago
                                        </RequestTime>
                                        <RequestStat>
                                            <StatIconBorder>
                                                <ion-icon name="chatbox-ellipses-outline"></ion-icon>
                                            </StatIconBorder>
                                            <Count2>25</Count2>
                                            <StatIconBorder>
                                                <ion-icon name="thumbs-up-outline"></ion-icon>
                                            </StatIconBorder>
                                            <Count2>25</Count2>
                                        </RequestStat>
                                        <RequestStatus/>
                                    </RequestToolbar>
                                    <RequestContent2>
                                        <RequestTitle2>Documenting Semantic</RequestTitle2>
                                        <RequestBody2>Could someone please take a look at these references and explain to me whats going on. I would appreciate having documentation.</RequestBody2>
                                        <RequestReferences2>
                                            <ion-icon 
                                            name="cube-outline" 
                                            style = {{fontSize: "2rem", marginRight: "1rem"}}></ion-icon>
                                            <Reference>
                                                <ion-icon style = {{marginRight: "0.5rem", fontSize: "1.2rem"}} name="document"></ion-icon>
                                                backend.js
                                            </Reference>
                                            <Reference>
                                                <ion-icon style = {{marginRight: "0.5rem", fontSize: "1.2rem"}} name="document"></ion-icon>
                                                backend.js
                                            </Reference>
                                            <Reference>
                                                <ion-icon style = {{marginRight: "0.5rem", fontSize: "1.2rem"}} name="document"></ion-icon>
                                                backend.js
                                            </Reference>
                                        </RequestReferences2>
                                        <RequestTags2>
                                            <ion-icon 
                                            name="pricetag-outline" 
                                            style = {{fontSize: "2rem", marginRight: "1rem"}}></ion-icon>
                                            <Tag>
                                                Utility
                                            </Tag>
                                            <Tag>
                                                Backend
                                            </Tag>
                                           
                                        </RequestTags2>
                                    </RequestContent2>
                                </RequestCard2>
                                <RequestCard2>
                                    <RequestToolbar>
                                        <ProfileButton>FS</ProfileButton>
                                        <RequestTime>
                                            <RequestTimeAuthor>Faraz Sanal</RequestTimeAuthor> opened this request 24 days ago
                                        </RequestTime>
                                        <RequestStat>
                                            <StatIconBorder>
                                                <ion-icon name="chatbox-ellipses-outline"></ion-icon>
                                            </StatIconBorder>
                                            <Count2>25</Count2>
                                            <StatIconBorder>
                                                <ion-icon name="thumbs-up-outline"></ion-icon>
                                            </StatIconBorder>
                                            <Count2>25</Count2>
                                        </RequestStat>
                                        <RequestStatus/>
                                    </RequestToolbar>
                                    <RequestContent2>
                                        <RequestTitle2>Documenting Semantic</RequestTitle2>
                                        <RequestBody2>Could someone please take a look at these references and explain to me whats going on. I would appreciate having documentation.</RequestBody2>
                                        <RequestReferences2>
                                            <ion-icon 
                                            name="cube-outline" 
                                            style = {{fontSize: "2rem", marginRight: "1rem"}}></ion-icon>
                                            <Reference>
                                                <ion-icon style = {{marginRight: "0.5rem", fontSize: "1.2rem"}} name="document"></ion-icon>
                                                backend.js
                                            </Reference>
                                            <Reference>
                                                <ion-icon style = {{marginRight: "0.5rem", fontSize: "1.2rem"}} name="document"></ion-icon>
                                                backend.js
                                            </Reference>
                                            <Reference>
                                                <ion-icon style = {{marginRight: "0.5rem", fontSize: "1.2rem"}} name="document"></ion-icon>
                                                backend.js
                                            </Reference>
                                        </RequestReferences2>
                                        <RequestTags2>
                                            <ion-icon 
                                            name="pricetag-outline" 
                                            style = {{fontSize: "2rem", marginRight: "1rem"}}></ion-icon>
                                            <Tag>
                                                Utility
                                            </Tag>
                                            <Tag>
                                                Backend
                                            </Tag>
                                           
                                        </RequestTags2>
                                    </RequestContent2>
                                </RequestCard2>
                                <RequestCard2>
                                    <RequestToolbar>
                                        <ProfileButton>FS</ProfileButton>
                                        <RequestTime>
                                            <RequestTimeAuthor>Faraz Sanal</RequestTimeAuthor> opened this request 24 days ago
                                        </RequestTime>
                                        <RequestStat>
                                            <StatIconBorder>
                                                <ion-icon name="chatbox-ellipses-outline"></ion-icon>
                                            </StatIconBorder>
                                            <Count2>25</Count2>
                                            <StatIconBorder>
                                                <ion-icon name="thumbs-up-outline"></ion-icon>
                                            </StatIconBorder>
                                            <Count2>25</Count2>
                                        </RequestStat>
                                        <RequestStatus/>
                                    </RequestToolbar>
                                    <RequestContent2>
                                        <RequestTitle2>Documenting Semantic</RequestTitle2>
                                        <RequestBody2>Could someone please take a look at these references and explain to me whats going on. I would appreciate having documentation.</RequestBody2>
                                        <RequestReferences2>
                                            <ion-icon 
                                            name="cube-outline" 
                                            style = {{fontSize: "2rem", marginRight: "1rem"}}></ion-icon>
                                            <Reference>
                                                <ion-icon style = {{marginRight: "0.5rem", fontSize: "1.2rem"}} name="document"></ion-icon>
                                                backend.js
                                            </Reference>
                                            <Reference>
                                                <ion-icon style = {{marginRight: "0.5rem", fontSize: "1.2rem"}} name="document"></ion-icon>
                                                backend.js
                                            </Reference>
                                            <Reference>
                                                <ion-icon style = {{marginRight: "0.5rem", fontSize: "1.2rem"}} name="document"></ion-icon>
                                                backend.js
                                            </Reference>
                                        </RequestReferences2>
                                        <RequestTags2>
                                            <ion-icon 
                                            name="pricetag-outline" 
                                            style = {{fontSize: "2rem", marginRight: "1rem"}}></ion-icon>
                                            <Tag>
                                                Utility
                                            </Tag>
                                            <Tag>
                                                Backend
                                            </Tag>
                                           
                                        </RequestTags2>
                                    </RequestContent2>
                                </RequestCard2>
                                <RequestCard2>
                                    <RequestToolbar>
                                        <ProfileButton>FS</ProfileButton>
                                        <RequestTime>
                                            <RequestTimeAuthor>Faraz Sanal</RequestTimeAuthor> opened this request 24 days ago
                                        </RequestTime>
                                        <RequestStat>
                                            <StatIconBorder>
                                                <ion-icon name="chatbox-ellipses-outline"></ion-icon>
                                            </StatIconBorder>
                                            <Count2>25</Count2>
                                            <StatIconBorder>
                                                <ion-icon name="thumbs-up-outline"></ion-icon>
                                            </StatIconBorder>
                                            <Count2>25</Count2>
                                        </RequestStat>
                                        <RequestStatus/>
                                    </RequestToolbar>
                                    <RequestContent2>
                                        <RequestTitle2>Documenting Semantic</RequestTitle2>
                                        <RequestBody2>Could someone please take a look at these references and explain to me whats going on. I would appreciate having documentation.</RequestBody2>
                                        <RequestReferences2>
                                            <ion-icon 
                                            name="cube-outline" 
                                            style = {{fontSize: "2rem", marginRight: "1rem"}}></ion-icon>
                                            <Reference>
                                                <ion-icon style = {{marginRight: "0.5rem", fontSize: "1.2rem"}} name="document"></ion-icon>
                                                backend.js
                                            </Reference>
                                            <Reference>
                                                <ion-icon style = {{marginRight: "0.5rem", fontSize: "1.2rem"}} name="document"></ion-icon>
                                                backend.js
                                            </Reference>
                                            <Reference>
                                                <ion-icon style = {{marginRight: "0.5rem", fontSize: "1.2rem"}} name="document"></ion-icon>
                                                backend.js
                                            </Reference>
                                        </RequestReferences2>
                                        <RequestTags2>
                                            <ion-icon 
                                            name="pricetag-outline" 
                                            style = {{fontSize: "2rem", marginRight: "1rem"}}></ion-icon>
                                            <Tag>
                                                Utility
                                            </Tag>
                                            <Tag>
                                                Backend
                                            </Tag>
                                           
                                        </RequestTags2>
                                    </RequestContent2>
                                </RequestCard2>
                                <RequestCard2>
                                    <RequestToolbar>
                                        <ProfileButton>FS</ProfileButton>
                                        <RequestTime>
                                            <RequestTimeAuthor>Faraz Sanal</RequestTimeAuthor> opened this request 24 days ago
                                        </RequestTime>
                                        <RequestStat>
                                            <StatIconBorder>
                                                <ion-icon name="chatbox-ellipses-outline"></ion-icon>
                                            </StatIconBorder>
                                            <Count2>25</Count2>
                                            <StatIconBorder>
                                                <ion-icon name="thumbs-up-outline"></ion-icon>
                                            </StatIconBorder>
                                            <Count2>25</Count2>
                                        </RequestStat>
                                        <RequestStatus/>
                                    </RequestToolbar>
                                    <RequestContent2>
                                        <RequestTitle2>Documenting Semantic</RequestTitle2>
                                        <RequestBody2>Could someone please take a look at these references and explain to me whats going on. I would appreciate having documentation.</RequestBody2>
                                        <RequestReferences2>
                                            <ion-icon 
                                            name="cube-outline" 
                                            style = {{fontSize: "2rem", marginRight: "1rem"}}></ion-icon>
                                            <Reference>
                                                <ion-icon style = {{marginRight: "0.5rem", fontSize: "1.2rem"}} name="document"></ion-icon>
                                                backend.js
                                            </Reference>
                                            <Reference>
                                                <ion-icon style = {{marginRight: "0.5rem", fontSize: "1.2rem"}} name="document"></ion-icon>
                                                backend.js
                                            </Reference>
                                            <Reference>
                                                <ion-icon style = {{marginRight: "0.5rem", fontSize: "1.2rem"}} name="document"></ion-icon>
                                                backend.js
                                            </Reference>
                                        </RequestReferences2>
                                        <RequestTags2>
                                            <ion-icon 
                                            name="pricetag-outline" 
                                            style = {{fontSize: "2rem", marginRight: "1rem"}}></ion-icon>
                                            <Tag>
                                                Utility
                                            </Tag>
                                            <Tag>
                                                Backend
                                            </Tag>
                                           
                                        </RequestTags2>
                                    </RequestContent2>
                                </RequestCard2>
                                <RequestCard2>
                                    <RequestToolbar>
                                        <ProfileButton>FS</ProfileButton>
                                        <RequestTime>
                                            <RequestTimeAuthor>Faraz Sanal</RequestTimeAuthor> opened this request 24 days ago
                                        </RequestTime>
                                        <RequestStat>
                                            <StatIconBorder>
                                                <ion-icon name="chatbox-ellipses-outline"></ion-icon>
                                            </StatIconBorder>
                                            <Count2>25</Count2>
                                            <StatIconBorder>
                                                <ion-icon name="thumbs-up-outline"></ion-icon>
                                            </StatIconBorder>
                                            <Count2>25</Count2>
                                        </RequestStat>
                                        <RequestStatus/>
                                    </RequestToolbar>
                                    <RequestContent2>
                                        <RequestTitle2>Documenting Semantic</RequestTitle2>
                                        <RequestBody2>Could someone please take a look at these references and explain to me whats going on. I would appreciate having documentation.</RequestBody2>
                                        <RequestReferences2>
                                            <ion-icon 
                                            name="cube-outline" 
                                            style = {{fontSize: "2rem", marginRight: "1rem"}}></ion-icon>
                                            <Reference>
                                                <ion-icon style = {{marginRight: "0.5rem", fontSize: "1.2rem"}} name="document"></ion-icon>
                                                backend.js
                                            </Reference>
                                            <Reference>
                                                <ion-icon style = {{marginRight: "0.5rem", fontSize: "1.2rem"}} name="document"></ion-icon>
                                                backend.js
                                            </Reference>
                                            <Reference>
                                                <ion-icon style = {{marginRight: "0.5rem", fontSize: "1.2rem"}} name="document"></ion-icon>
                                                backend.js
                                            </Reference>
                                        </RequestReferences2>
                                        <RequestTags2>
                                            <ion-icon 
                                            name="pricetag-outline" 
                                            style = {{fontSize: "2rem", marginRight: "1rem"}}></ion-icon>
                                            <Tag>
                                                Utility
                                            </Tag>
                                            <Tag>
                                                Backend
                                            </Tag>
                                           
                                        </RequestTags2>
                                    </RequestContent2>
                                </RequestCard2>
                                <RequestCard2>
                                    <RequestToolbar>
                                        <ProfileButton>FS</ProfileButton>
                                        <RequestTime>
                                            <RequestTimeAuthor>Faraz Sanal</RequestTimeAuthor> opened this request 24 days ago
                                        </RequestTime>
                                        <RequestStat>
                                            <StatIconBorder>
                                                <ion-icon name="chatbox-ellipses-outline"></ion-icon>
                                            </StatIconBorder>
                                            <Count2>25</Count2>
                                            <StatIconBorder>
                                                <ion-icon name="thumbs-up-outline"></ion-icon>
                                            </StatIconBorder>
                                            <Count2>25</Count2>
                                        </RequestStat>
                                        <RequestStatus/>
                                    </RequestToolbar>
                                    <RequestContent2>
                                        <RequestTitle2>Documenting Semantic</RequestTitle2>
                                        <RequestBody2>Could someone please take a look at these references and explain to me whats going on. I would appreciate having documentation.</RequestBody2>
                                        <RequestReferences2>
                                            <ion-icon 
                                            name="cube-outline" 
                                            style = {{fontSize: "2rem", marginRight: "1rem"}}></ion-icon>
                                            <Reference>
                                                <ion-icon style = {{marginRight: "0.5rem", fontSize: "1.2rem"}} name="document"></ion-icon>
                                                backend.js
                                            </Reference>
                                            <Reference>
                                                <ion-icon style = {{marginRight: "0.5rem", fontSize: "1.2rem"}} name="document"></ion-icon>
                                                backend.js
                                            </Reference>
                                            <Reference>
                                                <ion-icon style = {{marginRight: "0.5rem", fontSize: "1.2rem"}} name="document"></ion-icon>
                                                backend.js
                                            </Reference>
                                        </RequestReferences2>
                                        <RequestTags2>
                                            <ion-icon 
                                            name="pricetag-outline" 
                                            style = {{fontSize: "2rem", marginRight: "1rem"}}></ion-icon>
                                            <Tag>
                                                Utility
                                            </Tag>
                                            <Tag>
                                                Backend
                                            </Tag>
                                           
                                        </RequestTags2>
                                    </RequestContent2>
                                </RequestCard2>
                                <RequestCard2>
                                    <RequestToolbar>
                                        <ProfileButton>FS</ProfileButton>
                                        <RequestTime>
                                            <RequestTimeAuthor>Faraz Sanal</RequestTimeAuthor> opened this request 24 days ago
                                        </RequestTime>
                                        <RequestStat>
                                            <StatIconBorder>
                                                <ion-icon name="chatbox-ellipses-outline"></ion-icon>
                                            </StatIconBorder>
                                            <Count2>25</Count2>
                                            <StatIconBorder>
                                                <ion-icon name="thumbs-up-outline"></ion-icon>
                                            </StatIconBorder>
                                            <Count2>25</Count2>
                                        </RequestStat>
                                        <RequestStatus/>
                                    </RequestToolbar>
                                    <RequestContent2>
                                        <RequestTitle2>Documenting Semantic</RequestTitle2>
                                        <RequestBody2>Could someone please take a look at these references and explain to me whats going on. I would appreciate having documentation.</RequestBody2>
                                        <RequestReferences2>
                                            <ion-icon 
                                            name="cube-outline" 
                                            style = {{fontSize: "2rem", marginRight: "1rem"}}></ion-icon>
                                            <Reference>
                                                <ion-icon style = {{marginRight: "0.5rem", fontSize: "1.2rem"}} name="document"></ion-icon>
                                                backend.js
                                            </Reference>
                                            <Reference>
                                                <ion-icon style = {{marginRight: "0.5rem", fontSize: "1.2rem"}} name="document"></ion-icon>
                                                backend.js
                                            </Reference>
                                            <Reference>
                                                <ion-icon style = {{marginRight: "0.5rem", fontSize: "1.2rem"}} name="document"></ion-icon>
                                                backend.js
                                            </Reference>
                                        </RequestReferences2>
                                        <RequestTags2>
                                            <ion-icon 
                                            name="pricetag-outline" 
                                            style = {{fontSize: "2rem", marginRight: "1rem"}}></ion-icon>
                                            <Tag>
                                                Utility
                                            </Tag>
                                            <Tag>
                                                Backend
                                            </Tag>
                                           
                                        </RequestTags2>
                                    </RequestContent2>
                                </RequestCard2>
                                <RequestCard2>
                                    <RequestToolbar>
                                        <ProfileButton>FS</ProfileButton>
                                        <RequestTime>
                                            <RequestTimeAuthor>Faraz Sanal</RequestTimeAuthor> opened this request 24 days ago
                                        </RequestTime>
                                        <RequestStat>
                                            <StatIconBorder>
                                                <ion-icon name="chatbox-ellipses-outline"></ion-icon>
                                            </StatIconBorder>
                                            <Count2>25</Count2>
                                            <StatIconBorder>
                                                <ion-icon name="thumbs-up-outline"></ion-icon>
                                            </StatIconBorder>
                                            <Count2>25</Count2>
                                        </RequestStat>
                                        <RequestStatus/>
                                    </RequestToolbar>
                                    <RequestContent2>
                                        <RequestTitle2>Documenting Semantic</RequestTitle2>
                                        <RequestBody2>Could someone please take a look at these references and explain to me whats going on. I would appreciate having documentation.</RequestBody2>
                                        <RequestReferences2>
                                            <ion-icon 
                                            name="cube-outline" 
                                            style = {{fontSize: "2rem", marginRight: "1rem"}}></ion-icon>
                                            <Reference>
                                                <ion-icon style = {{marginRight: "0.5rem", fontSize: "1.2rem"}} name="document"></ion-icon>
                                                backend.js
                                            </Reference>
                                            <Reference>
                                                <ion-icon style = {{marginRight: "0.5rem", fontSize: "1.2rem"}} name="document"></ion-icon>
                                                backend.js
                                            </Reference>
                                            <Reference>
                                                <ion-icon style = {{marginRight: "0.5rem", fontSize: "1.2rem"}} name="document"></ion-icon>
                                                backend.js
                                            </Reference>
                                        </RequestReferences2>
                                        <RequestTags2>
                                            <ion-icon 
                                            name="pricetag-outline" 
                                            style = {{fontSize: "2rem", marginRight: "1rem"}}></ion-icon>
                                            <Tag>
                                                Utility
                                            </Tag>
                                            <Tag>
                                                Backend
                                            </Tag>
                                           
                                        </RequestTags2>
                                    </RequestContent2>
                                </RequestCard2>
                                <RequestCard2>
                                    <RequestToolbar>
                                        <ProfileButton>FS</ProfileButton>
                                        <RequestTime>
                                            <RequestTimeAuthor>Faraz Sanal</RequestTimeAuthor> opened this request 24 days ago
                                        </RequestTime>
                                        <RequestStat>
                                            <StatIconBorder>
                                                <ion-icon name="chatbox-ellipses-outline"></ion-icon>
                                            </StatIconBorder>
                                            <Count2>25</Count2>
                                            <StatIconBorder>
                                                <ion-icon name="thumbs-up-outline"></ion-icon>
                                            </StatIconBorder>
                                            <Count2>25</Count2>
                                        </RequestStat>
                                        <RequestStatus/>
                                    </RequestToolbar>
                                    <RequestContent2>
                                        <RequestTitle2>Documenting Semantic</RequestTitle2>
                                        <RequestBody2>Could someone please take a look at these references and explain to me whats going on. I would appreciate having documentation.</RequestBody2>
                                        <RequestReferences2>
                                            <ion-icon 
                                            name="cube-outline" 
                                            style = {{fontSize: "2rem", marginRight: "1rem"}}></ion-icon>
                                            <Reference>
                                                <ion-icon style = {{marginRight: "0.5rem", fontSize: "1.2rem"}} name="document"></ion-icon>
                                                backend.js
                                            </Reference>
                                            <Reference>
                                                <ion-icon style = {{marginRight: "0.5rem", fontSize: "1.2rem"}} name="document"></ion-icon>
                                                backend.js
                                            </Reference>
                                            <Reference>
                                                <ion-icon style = {{marginRight: "0.5rem", fontSize: "1.2rem"}} name="document"></ion-icon>
                                                backend.js
                                            </Reference>
                                        </RequestReferences2>
                                        <RequestTags2>
                                            <ion-icon 
                                            name="pricetag-outline" 
                                            style = {{fontSize: "2rem", marginRight: "1rem"}}></ion-icon>
                                            <Tag>
                                                Utility
                                            </Tag>
                                            <Tag>
                                                Backend
                                            </Tag>
                                           
                                        </RequestTags2>
                                    </RequestContent2>
                                </RequestCard2>
                                <RequestCard2>
                                    <RequestToolbar>
                                        <ProfileButton>FS</ProfileButton>
                                        <RequestTime>
                                            <RequestTimeAuthor>Faraz Sanal</RequestTimeAuthor> opened this request 24 days ago
                                        </RequestTime>
                                        <RequestStat>
                                            <StatIconBorder>
                                                <ion-icon name="chatbox-ellipses-outline"></ion-icon>
                                            </StatIconBorder>
                                            <Count2>25</Count2>
                                            <StatIconBorder>
                                                <ion-icon name="thumbs-up-outline"></ion-icon>
                                            </StatIconBorder>
                                            <Count2>25</Count2>
                                        </RequestStat>
                                        <RequestStatus/>
                                    </RequestToolbar>
                                    <RequestContent2>
                                        <RequestTitle2>Documenting Semantic</RequestTitle2>
                                        <RequestBody2>Could someone please take a look at these references and explain to me whats going on. I would appreciate having documentation.</RequestBody2>
                                        <RequestReferences2>
                                            <ion-icon 
                                            name="cube-outline" 
                                            style = {{fontSize: "2rem", marginRight: "1rem"}}></ion-icon>
                                            <Reference>
                                                <ion-icon style = {{marginRight: "0.5rem", fontSize: "1.2rem"}} name="document"></ion-icon>
                                                backend.js
                                            </Reference>
                                            <Reference>
                                                <ion-icon style = {{marginRight: "0.5rem", fontSize: "1.2rem"}} name="document"></ion-icon>
                                                backend.js
                                            </Reference>
                                            <Reference>
                                                <ion-icon style = {{marginRight: "0.5rem", fontSize: "1.2rem"}} name="document"></ion-icon>
                                                backend.js
                                            </Reference>
                                        </RequestReferences2>
                                        <RequestTags2>
                                            <ion-icon 
                                            name="pricetag-outline" 
                                            style = {{fontSize: "2rem", marginRight: "1rem"}}></ion-icon>
                                            <Tag>
                                                Utility
                                            </Tag>
                                            <Tag>
                                                Backend
                                            </Tag>
                                           
                                        </RequestTags2>
                                    </RequestContent2>
                                </RequestCard2>
                                <RequestCard2>
                                    <RequestToolbar>
                                        <ProfileButton>FS</ProfileButton>
                                        <RequestTime>
                                            <RequestTimeAuthor>Faraz Sanal</RequestTimeAuthor> opened this request 24 days ago
                                        </RequestTime>
                                        <RequestStat>
                                            <StatIconBorder>
                                                <ion-icon name="chatbox-ellipses-outline"></ion-icon>
                                            </StatIconBorder>
                                            <Count2>25</Count2>
                                            <StatIconBorder>
                                                <ion-icon name="thumbs-up-outline"></ion-icon>
                                            </StatIconBorder>
                                            <Count2>25</Count2>
                                        </RequestStat>
                                        <RequestStatus/>
                                    </RequestToolbar>
                                    <RequestContent2>
                                        <RequestTitle2>Documenting Semantic</RequestTitle2>
                                        <RequestBody2>Could someone please take a look at these references and explain to me whats going on. I would appreciate having documentation.</RequestBody2>
                                        <RequestReferences2>
                                            <ion-icon 
                                            name="cube-outline" 
                                            style = {{fontSize: "2rem", marginRight: "1rem"}}></ion-icon>
                                            <Reference>
                                                <ion-icon style = {{marginRight: "0.5rem", fontSize: "1.2rem"}} name="document"></ion-icon>
                                                backend.js
                                            </Reference>
                                            <Reference>
                                                <ion-icon style = {{marginRight: "0.5rem", fontSize: "1.2rem"}} name="document"></ion-icon>
                                                backend.js
                                            </Reference>
                                            <Reference>
                                                <ion-icon style = {{marginRight: "0.5rem", fontSize: "1.2rem"}} name="document"></ion-icon>
                                                backend.js
                                            </Reference>
                                        </RequestReferences2>
                                        <RequestTags2>
                                            <ion-icon 
                                            name="pricetag-outline" 
                                            style = {{fontSize: "2rem", marginRight: "1rem"}}></ion-icon>
                                            <Tag>
                                                Utility
                                            </Tag>
                                            <Tag>
                                                Backend
                                            </Tag>
                                           
                                        </RequestTags2>
                                    </RequestContent2>
                                </RequestCard2>
                            </Container>
                        </> : null 
                }
            </>
        )
    }
}



const mapStateToProps = (state) => {
    return {
        user: state.auth.user,
        requests: Object.values(state.requests),
        selected: Object.values(state.selected)
    }
}



export default withRouter(connect(mapStateToProps, { createRequest, setRequestCreation, clearSelected, retrieveRequests})(RequestView));


const ListToolBar = styled.div`
    height: 4.5rem;
    display: flex;
    align-items: center;
    box-shadow: rgba(9, 30, 66, 0.31) 0px 0px 1px 0px, rgba(9, 30, 66, 0.25) 0px 8px 16px -6px;
    width: 80rem;
    margin-bottom: 2rem;
    background-color: white;
    border-radius: 0.1rem;
    position: -webkit-sticky; /* Safari */
    position: sticky;
    top: 0;
    z-index: 1;
   
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


const RequestStat = styled.div`
    margin-left: auto;
    display: flex;
    align-items: center;
    margin-right: 0rem;
`

const StatIconBorder = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 2.2rem;
    padding: 0.7rem;
    border-radius: 50%;
    margin-right: 0.3rem;
    &:hover {
        background-color:  ${chroma("#6762df").alpha(0.1)};
    }
`

const Count2 = styled.div`
    font-size: 1.5rem;
    margin-right: 2.5rem;
`


const RequestTimeAuthor = styled.span`
    font-weight: 600;
`

const RequestCard2 = styled.div`
    display: flex;
    flex-direction: column;
    background-color: white;
    width: 80rem;
    box-shadow: rgba(9, 30, 66, 0.31) 0px 0px 1px 0px, rgba(9, 30, 66, 0.25) 0px 8px 16px -6px;
    border-radius:0.4rem;
    &:hover {
        background-color: #F4F4F6; 
    }
    cursor: pointer;
    transition: all 0.1s ease-in;
    margin-bottom: 1.5rem;
`

const RequestToolbar = styled.div`
    display: flex;
    border-bottom: 1px solid #EDEFF1;
    align-items: center;
    padding: 1.5rem;
`

const RequestTime = styled.div`
    margin-left: 1.5rem;
    font-size: 1.5rem;
    font-weight: 300;
`

const RequestStatus = styled.div`
    background-color: #19E5BE;
    border-radius: 50%;
    margin-right: 0.5rem;
    width: 1.5rem;
    height: 1.5rem;
`

const RequestContent2 = styled.div`
    
    display: flex;
    flex-direction: column;
    padding: 1.5rem;
`

const RequestTitle2 = styled.div`
    font-size: 1.8rem;
    font-weight: 500;
`

const RequestBody2 = styled.div`
    font-size: 1.5rem;
    margin-top: 1rem;
`

const RequestReferences2 = styled.div`
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    margin-top: 1.5rem;
`


const RequestTags2 = styled.div`
    display: flex; 
    flex-wrap: wrap;
    align-items: center;
    margin-top: 1.5rem;
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
    flex-direction: column;
    border-radius: 0.4rem;
    border: 1px solid #DFDFDF;
    align-items: center;
    margin-bottom: 2rem;
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
    padding: 1rem 1.5rem;
    width: 80rem;
    display: flex;
    cursor: pointer;
    border-radius: 0.3rem;
    transition: all 0.1s ease-in;
    border-bottom: 1px solid #EDEFF1;
    &:hover {
        background-color: #F4F4F6; 
    }
    align-items: center;
    background-color: white;
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
    background-color:#6762df;
    cursor: pointer;
`

const RequestReferences = styled.div`
    display: flex;
    margin-top: 0.7rem;
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


const RequestContent = styled.div`
    display: flex;
    align-items: center;
    color: #172A4E;
    font-size: 1.5rem;
    margin-top: 0.7rem;
`

const RequestBody = styled.div`
    
    margin-left: 3rem;
    width: 55rem;
    display: flex;
    flex-direction: column;
    justify-content: center;
    
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
    font-size: 1.8rem;
    font-weight: 400; 
    color: #172A4E;
`