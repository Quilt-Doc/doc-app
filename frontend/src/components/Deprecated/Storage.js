import React from 'react';

import styled from 'styled-components';

//redux
import { connect } from 'react-redux';

//router
import history from '../../../history';
import { withRouter } from 'react-router-dom';

//actions
import { clearSelected } from '../../../actions/Selected_Actions';
import { setRequestCreation } from '../../../actions/UI_Actions';
import { createRequest, retrieveRequests } from '../../../actions/Request_Actions';


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
                                    {this.renderRequests()}
                                </RequestContainer>
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

const VoteContainer = styled.div`
    display: flex;
    flex-direction: column;
    align-self: flex-start;
    margin-right: 1rem;
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

const RequestReferences = styled.div`
    display: flex;
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
    margin-bottom: 1rem;
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
    font-weight: 500;
    color: #172A4E;
`
// MODAL STORAGE
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
background-color: #fefefe;
margin: 7% auto; /* 15% from the top and centered */
padding: 5rem;
padding-bottom: 2rem;
border: 1px solid #888;
width: 73vw; /* Could be more or less, depending on screen size */
height: 50rem;
border-radius: 5px;
box-shadow: rgba(15, 15, 15, 0.05) 0px 0px 0px 1px, rgba(15, 15, 15, 0.1) 0px 5px 10px, rgba(15, 15, 15, 0.2) 0px 15px 40px;
display: flex;
flex-direction: column;
max-width: 96rem;
`

//COLOR LINES FUNCTION CODEVIEW STORAGE
    const colorLines = () => {
        const grammar = Prism.languages["python"]
        const identifiers = {
            'keyword':'#C679DD',
            'boolean': '#56B6C2',
            'function': '#61AEEE',
            'class-name': '#E6C07A',
            'string': '#98C379',
            'triple-quoted-string': '#98C379',
            'number': '#D19966',
            'decorator': '#61AEEE',
            'builtin': '#61AEEE'
        }
        const tokens = Prism.tokenize(this.props.fileContents, grammar)
        let allLinesJSX = []
        let currLineJSX = []
        let callbacks = [...this.props.callbacks].reverse()
        let lineNumber = 1
        let offset = 0
        
        tokens.forEach(token => {
            let content = this.getContent(token)
            let splitContent = content.split("\n")
            if (typeof token !== "string" && token.type in identifiers) {
                for (let i = 0; i < splitContent.length - 1; i ++){
                    if (splitContent[i] !== '') {
                        currLineJSX.push(<ColoredSpan color = {identifiers[token.type]}>{splitContent[i]}</ColoredSpan>)
                    }
                    if (currLineJSX.length > 0) {
                        allLinesJSX.push(currLineJSX)
                    } else {
                        allLinesJSX.push([<>{"  "}</>])
                    }
                    
                    offset = 0
                    lineNumber += 1
                    currLineJSX = []
                    
                }
                if (splitContent.slice(-1)[0] !== '') {
                    currLineJSX.push(<ColoredSpan color = {identifiers[token.type]}>{splitContent.slice(-1)[0]}</ColoredSpan>)
                }
                offset += splitContent[splitContent.length - 1].length
                if (callbacks.length > 0 && 
                    (lineNumber > callbacks.slice(-1)[0].span.end.line || 
                    (lineNumber === callbacks.slice(-1)[0].span.end.line && offset + 1 > callbacks.slice(-1)[0].span.start.column))) {
                    callbacks.pop()
                }
            }  else if (token.type === "comment") {
                for (let i = 0; i < splitContent.length - 1; i ++){
                    if (splitContent[i] !== '') {
                        currLineJSX.push(<ObliqueSpan color = {"#5C6370"}>{splitContent[i]}</ObliqueSpan>)
                    }
                    if (currLineJSX.length > 0) {
                        allLinesJSX.push(currLineJSX)
                    } else {
                        allLinesJSX.push([<>{"  "}</>])
                    }
                    offset = 0
                    lineNumber += 1
                    currLineJSX = []
                }
                if (splitContent.slice(-1)[0] !== '') {
                    currLineJSX.push(<ObliqueSpan color = {"#5C6370"}>{splitContent.slice(-1)[0]}</ObliqueSpan>)
                }
                offset += splitContent.slice(-1)[0].length
                if (callbacks.length > 0 && 
                    (lineNumber > callbacks.slice(-1)[0].span.end.line || 
                    (lineNumber === callbacks.slice(-1)[0].span.end.line && offset + 1 > callbacks.slice(-1)[0].span.start.column))) {
                    callbacks.pop()
                }
            } else {
                for (let i = 0; i < splitContent.length - 1; i ++){
                    if (splitContent[i] !== '') {
                        if (callbacks.length > 0) {
                            this.renderCallbacks(splitContent[i], callbacks, offset, lineNumber, currLineJSX)   
                        } else {
                            currLineJSX.push(<>{splitContent[i]}</>)
                        }
                    }
                    if (currLineJSX.length > 0) {
                        allLinesJSX.push(currLineJSX)
                    } else {
                        allLinesJSX.push([<>{"  "}</>])
                    }
                    
                    offset = 0
                    lineNumber += 1
                    currLineJSX = []
                    if (callbacks.length > 0 && lineNumber > callbacks.slice(-1)[0].span.end.line) {
                        callbacks.pop()
                    }
                }
                if (splitContent.slice(-1)[0] !== '') {
                    if (callbacks.length > 0) {
                        this.renderCallbacks(splitContent.slice(-1)[0], callbacks, offset, lineNumber, currLineJSX)
                    } else {
                        currLineJSX.push(<>{content}</>)
                    }
                }
                offset += splitContent.slice(-1)[0].length
            }
        })
        if (currLineJSX.length !== 0) {
            allLinesJSX.push(currLineJSX)
        }
        //console.log("CURRLINE", currLineJSX)
        return allLinesJSX
    }




    renderCallbacks(line, callbacks, offset, lineNumber, currLineJSX){
        let info = callbacks.slice(-1)[0].span.start
        let infoEnd = callbacks.slice(-1)[0].span.end
        let symbol = callbacks.slice(-1)[0].symbol

        if (line.includes("contiguous")){
            console.log("LINE", line)
            console.log("SYMBOL", symbol)
            console.log("OFFSET", offset)
            console.log("OFFSET END", offset + line.length)
            console.log("BEGIN OF SYMBOL", info.column)
            console.log("END OF SYMBOL", infoEnd.column)
            console.log("LINENUMBER", lineNumber)
        }

        if (lineNumber === info.line && info.column >= offset && info.column < offset + line.length){
            let end = infoEnd.line === lineNumber ? info.column - offset - 1 + symbol.length : line.length
            //console.log("SLICE", line.slice(0, info.column))

            currLineJSX.push(<>{line.slice(0, info.column - offset - 1)}</>)
            currLineJSX.push(<ColoredSpan color = {'#61AEEE'}>{line.slice(info.column - offset - 1, end)}</ColoredSpan>)
            currLineJSX.push(<>{line.slice(end)}</>)
            if (infoEnd.line === lineNumber) {
                callbacks.pop()
            }
        } else if (lineNumber > info.line && lineNumber === infoEnd.line) {
            currLineJSX.push(<ColoredSpan color = {'#61AEEE'}>{line.slice(0, infoEnd.column)}</ColoredSpan>)
            currLineJSX.push(<>{line.slice(infoEnd.column)}</>)
            callbacks.pop()
        } else if (lineNumber > info.line) {

        } else {
            currLineJSX.push(<>{line}</>)
        }
    } 