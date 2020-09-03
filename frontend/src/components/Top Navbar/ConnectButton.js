import React from 'react';

//redux
import { connect } from 'react-redux';

//styles
import styled from 'styled-components';
import chroma from 'chroma-js';

//icons
import { VscDebugDisconnect } from 'react-icons/vsc';
import {AiFillFolder, AiFillFile} from 'react-icons/ai';
import {RiFileFill, RiAddFill} from 'react-icons/ri';
import {GiCubes} from 'react-icons/gi';
import {IoMdCube} from 'react-icons/io'
import {FaJira} from 'react-icons/fa';
import {FiChevronDown} from 'react-icons/fi';
//router
import {withRouter} from 'react-router-dom';
import history from '../../history';

//actions
import { createDocument } from '../../actions/Document_Actions';
import { setCreation } from '../../actions/UI_Actions';
import { clearSelected } from '../../actions/Selected_Actions';
import { CSSTransition } from 'react-transition-group';

class ConnectButton extends React.Component {

    constructor(props){
        super(props);
        this.state = {
            open: false
        }
    }
    /*
    createDocumentFromButton = (e) =>  {
        e.stopPropagation()
        e.preventDefault()
        let path = history.location.pathname.split("/")
        if (path.length > 2) {
            let workspaceId = path[2]
            this.props.createDocument({authorId: this.props.user._id,
                workspaceId, parentId: "", title: "",
                referenceIds: this.props.selected.map(item => item._id)}).then((documents) => {
                console.log("CREATE DOCS", documents)
                let document = documents.result[0]
                this.props.setCreation(true)
                history.push(`?document=${document._id}`)
                this.props.clearSelected()
            })
        }
    }*/

    render(){
        return(
            <>
                <NavbarElement onClick = {(e) => {this.setState({open: true})}} >
                    <VscDebugDisconnect style = {{color: 'white'}}/>
                </NavbarElement>
                {this.state.open &&
                    <ModalBackground onClick = {() => {this.setState({open: false})}}>
                        <CSSTransition
                            in={true}
                            appear = {true}
                            timeout={300}
                            classNames="modal"
                        >   
                            <div>
                                <ModalContent onClick = {(e) => {e.stopPropagation()}}>
                                    <DarkContainer>
                                        <Header>
                                            <VscDebugDisconnect style = {{fontSize: "2.5rem", marginRight: "1rem"}}/>
                                            Connect External Information
                                        </Header>
                                        <Guide>
                                            <Circle/>
                                            Select an information type
                                        </Guide>
                                        <Provider>
                                            <FaJira style = {{marginTop: "-0.15rem", marginRight: "1rem"}}/>
                                            Jira Ticket
                                            <FiChevronDown style = {{ marginLeft: "1rem"}}/>
                                        </Provider>
                                        <Guide>
                                            <Circle color = {"#5B75E6"}/>
                                            Provide the source link
                                        </Guide>
                                        {/*
                                        <Guide>
                                            Provide an information source
                                        </Guide>*/}
                                    </DarkContainer>
                                    <Body>
                                        <SourceInput
                                          autoFocus
            
                                        />
                                        <Guide light = {true}>
                                            <Circle color = {"#45aaf2"}/>
                                            Attach code references
                                        </Guide>
                                        <ReferenceList>
                                            <Reference>
                                                <AiFillFolder style = {{marginRight: "0.5rem"}}/>
                                                <Title>backend</Title>
                                            </Reference>
                                            <Reference>
                                                <AiFillFolder style = {{marginRight: "0.5rem"}}/>
                                                <Title>semantic</Title>
                                            </Reference>
                                            <Reference>
                                                <AiFillFolder style = {{marginRight: "0.5rem"}}/>
                                                <Title>doccontroller</Title>
                                            </Reference>
                                            <Reference2>
                                                <RiFileFill style = {{fontSize: "1.1rem" ,marginRight: "0.5rem"}}/>
                                                <Title>TagController.js</Title>
                                            </Reference2>
                                            <AddButton>
                                                <RiAddFill style = {{fontSize: "1.4rem", marginRight: "0.5rem"}}/>
                                                <Title>Add code references</Title>
                                            </AddButton>
                                        </ReferenceList>
                                    {/*
                                    <SourceInput/>
                                    */}
                                    </Body>
                                    <CreateButton>
                                        Create
                                    </CreateButton>
                                </ModalContent>
                            </div>
                        </CSSTransition>
                    </ModalBackground>
                }
            </>
        )
    }
}

const mapStateToProps = (state) => {
    return {
        user: state.auth.user,
        selected : Object.values(state.selected),
    }
}

export default withRouter(connect(mapStateToProps, {clearSelected})(ConnectButton));

const CreateButton = styled.div`
    margin-top: auto;
    background-color: #f1f5f8;
    margin-left: 4rem;
    display: inline-flex;
    font-size: 1.6rem;
    margin-bottom: 2rem;
    justify-content: center;
    align-items: center;
    padding: 1rem 2rem;
    width: 10rem;
    border-radius: 0.3rem;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
    font-weight: 500;
`

const Circle = styled.div`
    border-radius: 50%;
    height: 0.9rem;
    width: 0.9rem;
    background-color: #19e5be;
    margin-right: 1rem;
    background-color: ${props => props.color};
`

const Guide = styled.div`
    color: ${props => props.light ? "#172a4e" : "white"};
    font-size: 1.6rem;
    font-weight: 500;
    margin-bottom: 2rem;
    display: flex;
    align-items: center;
    height: 2rem;
`

const Provider = styled.div`
    background-color: #363b49;
    padding: 1.5rem 2rem;
    border-radius: 0.3rem;
    font-weight: 500;
    font-size: 1.7rem;
    color: white;
    display: inline-flex;
    align-items: center;
    margin-bottom: 4rem;
`

const Body = styled.div`
    padding: 0 4rem;
    margin-top: -2rem;
`

const Title = styled.div`
    color: #172A4e;
    font-weight: 500;
`

const ReferenceIcon = styled.div`
    background-color: ${chroma("#5B75E6").alpha(0.07)};
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    height: 4rem;
    width: 4rem;
    font-size: 2.5rem;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
    margin-right: 1rem;
    margin-bottom: 1rem;
`

const Reference = styled.div`
    background-color: ${chroma("#5B75E6").alpha(0.08)};
    /*color: ${chroma("#5B75E6").alpha(0.9)};*/
    border-radius: 0.2rem;
    font-size: 1.3rem;
    padding: 0.4rem 1rem;
    margin-right: 1rem;
    display: flex;
    align-items: center;
    margin-bottom: 1rem;
    
`

const AddButton = styled.div`
    background-color: #f1f5f8;
    /*color: ${chroma("#5B75E6").alpha(0.9)};*/
    border-radius: 0.2rem;
    font-size: 1.3rem;
    padding: 0.4rem 1rem;
    margin-right: 1rem;
    display: flex;
    align-items: center;
    margin-bottom: 1rem;
    
`

const Reference2 = styled.div`
    background-color: ${chroma("#1E90FF").alpha(0.08)};
    /*color: ${chroma("#1E90FF").alpha(0.9)};*/
    border-radius: 0.2rem;
    font-size: 1.3rem;
    padding: 0.4rem 1rem;
    margin-right: 1rem;
    display: flex;
    align-items: center;
    margin-bottom: 1rem;
`

const ReferenceList = styled.div`
    display: flex;
    flex-wrap: wrap;
    align-items: center;
`

const SourceInput = styled.input`
    height: 3.5rem;
    border: 1px solid #5B75E6;
    background-color: #ACB9F4;
    border-radius: 0.3rem;
    padding-left: 1rem;
    padding-right: 1rem;
    width: 100%;
    margin-bottom: 4rem;
    color:#2e4fe0;
    font-size: 1.6rem;
    &::placeholder{
        color:#2e4fe0;
    }
    font-weight: 500;
    outline: none;
`   

const DarkContainer = styled.div`
    padding: 0 4rem;
    background-color:#2B2F3A;
    padding-bottom: 2rem;
`

const Header = styled.div`
    font-size: 5rem;
    font-weight: 500;
    font-size: 2rem;
    font-weight: 500;
    height: 10rem;
    display: flex;
    align-items: center;
    color: white;
    
`

const ModalContent = styled.div`
    background-color: #fefefe;
    margin: 7vh auto; /* 15% from the top and centered */
    
    width: 85vw; /* Could be more or less, depending on screen size */
    height: 60rem;
    border-radius: 0.2rem;
    box-shadow: rgba(15, 15, 15, 0.05) 0px 0px 0px 1px, rgba(15, 15, 15, 0.1) 0px 5px 10px, rgba(15, 15, 15, 0.2) 0px 15px 40px;
    display: flex;
    flex-direction: column;
    max-width: 70rem;
    border-radius: 0.3rem;
    background-color: white;
    color: #172A4e;
    background-color: white;
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

const NavbarElement = styled.div`
    font-size: 1.8rem;
    /*color: #172A4E;*/
    background-color:#292d38;;
   
    height: 3.3rem;
    padding: 0 1rem;
    margin-right: 3rem;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    &:hover {
        /*background-color:#39466f*/
    }
    color: white;
    border: 1px solid #5871FF;
    border-radius: 0.3rem;
    cursor: pointer;
`
