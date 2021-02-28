import React from 'react';

//styles
import styled from "styled-components";
import { CSSTransition } from 'react-transition-group';

//actions
import {retrieveSearchResults} from '../../../../actions/Search_Actions';

//icons
import {RiFileList2Fill, RiFileLine} from 'react-icons/ri';
import { FaJira, FaTrello, FaConfluence, FaGoogleDrive, FaGithub, FaAtlassian } from 'react-icons/fa';
import { VscDebugDisconnect } from 'react-icons/vsc'
import { AiFillFolder } from 'react-icons/ai';
import { BiCode } from 'react-icons/bi';

//redux
import { connect } from 'react-redux'; 

//router
import { withRouter } from 'react-router-dom';

//spinner
import MoonLoader from "react-spinners/MoonLoader";

class MainSearchbar extends React.Component {

    constructor(props){
        super(props);
        this.state = {
            // searchOpen refers to whether searchbubble is open 
            searchOpen: false,
            // typingTimeout refers to method which search results after a short delay
            // rather than on every keystroke
            typingTimeout: null
        }
    }


    openSearch = () => {
        if (this.input) {
            this.retrieveSearchResults();
            this.input.focus();
            this.setState({searchOpen: true});
        }
    }

    // sets typingTimeout as the user types
    onChangeHandler = (e) => {
        let {typingTimeout} = this.state;

        if (typingTimeout) {
            clearTimeout(this.state.typingTimeout);
        }

        this.setState({
            typingTimeout: setTimeout(() => this.retrieveSearchResults(), 100)
        })
    }

    onBlurHandler = (e) => {
        this.input.value = "";
        this.input.blur(); 
        this.setState({searchOpen: false, typingTimeout: null});
    }

    async retrieveSearchResults() {
        this.setState({loading: true})

        let { workspaceId } = this.props.match.params
        await this.props.retrieveSearchResults({
            userQuery: this.input.value,
            workspaceId,
            limit: 9,
            returnReferences: true, 
            returnDocuments: true,
            returnLinkages: true
        });

        this.setState({loading: false})
    }

    renderSearchResults = () => {
        let {documents, linkages, references} = this.props;

        let result = [];
        let count = 0;

        if (documents) {
            documents.map(doc => {
                count += 1;
                if (count < 9) { 
                    result.push(
                        <SearchResult>
                             <IconContainer>
                                <RiFileList2Fill  style = {{
                                    color: '#2684FF'
                                }}/>
                             </IconContainer>
                            {doc.title ? doc.title : "Untitled"}
                        </SearchResult>
                    )
                }
            })
        }

        if (linkages) {
            linkages.map(link => {
                count += 1;
                if (count < 9) {
                    result.push(
                        <SearchResult>
                            <IconContainer>
                                {this.renderLinkageIcon(link.domain)}
                            </IconContainer>
                            {link.title ? link.title : "Untitled"} 
                        </SearchResult>
                    )
                }
            })
        }

        if (references) {
            references.map(ref => {
                count += 1;
                if (count < 9) {
                    result.push(
                        <SearchResult>
                            <IconContainer>
                                {this.renderReferenceIcon(ref.kind)}
                            </IconContainer>
                            {ref.name ? ref.name : "Untitled"} 
                        </SearchResult>
                    )
                }
            })
        }

        if (result.length === 0) {
            result.push(<EmptyResult>No Results</EmptyResult>)
        }

        result.push(
            <InfobankLink>
                <IconContainer>  
                    <ion-icon style={{'color': '#172A4e'}} name="search-outline"></ion-icon>
                </IconContainer>
                <InfobankLinkText>Advanced search in Infobank</InfobankLinkText>
            </InfobankLink>
        );
        
        return result
    }

    renderReferenceIcon = (kind) => {
        switch (kind) {
            case "file":
                return <RiFileLine />
            case "dir":
                return <AiFillFolder style={{
                    'fontSize': '1.75rem'}}/>
            default:
                return <BiCode/>
        }
    } 

    renderLinkageIcon = (domain) => {
        switch (domain) {
            case "Github":
                return  < FaGithub/>
            case "Confluence Doc":
                return  <FaConfluence 
                            style = {{
                                marginTop: "-0.15rem"}}
                        /> 
            case "Atlassian":
                return <FaAtlassian 
                            style = {{
                                marginTop: "-0.15rem"}}
                        /> 
            case "Trello":
                return <FaTrello
                            style = {{
                                marginTop: "-0.15rem"}}
                    /> 
            case "Jira Ticket":
                return <FaJira 
                            style = {{
                                marginTop: "-0.15rem"}}
                        />
            case "Google Doc":
                return <FaGoogleDrive 
                            style = {{
                                marginTop: "-0.15rem"}}
                        /> 
            default:
                return <VscDebugDisconnect/>
        }
    }

    render(){
        let {searchOpen, loading} = this.state;
        let {workspace} = this.props;

        return(
            <>
                <SearchbarWrapper active = {searchOpen}
                    onClick = {() => this.openSearch()}>
                    <ion-icon 
                        style={{'color': 'white', 'cursor': 'pointer', 'fontSize': '2rem'}} 
                        name="search-outline">
                    </ion-icon>
                    <Searchbar 
                        ref = {node => this.input = node} 
                        onBlur = {(e) => this.onBlurHandler(e)} 
                        onChange = {(e) => this.onChangeHandler(e)}
                        barWidth = {searchOpen ? '40rem' : '15rem'} 
                    />
                </SearchbarWrapper>
                <CSSTransition
                    in = {searchOpen}
                    unmountOnExit
                    enter = {true}
                    exit = {true}       
                    timeout = {150}
                    classNames = "dropmenu"
                >
                    <SearchBubble>
                        <SearchHeader>
                            Searching in 
                            <Strong>{workspace ? ` ${workspace.name}` : ""}</Strong>
                            ...
                        </SearchHeader>
                        {!loading ? this.renderSearchResults() : <Placeholder><MoonLoader size = {25} /></Placeholder>}
                    </SearchBubble>
                </CSSTransition>
            </>
        )
    }
}

const mapStateToProps = (state, ownProps) => {
    let workspace, documents, linkages, references;

    let workspaces = Object.values(state.workspaces);

    let {workspaceId} = ownProps.match.params;

    // acquire the correct workspace through Id
    if (workspaceId) {
        let filtered = workspaces.filter(space => space._id === workspaceId);
        workspace = filtered.length === 1 ? filtered[0] : null;
    }

    // acquire the correct searchResult format
    documents =  state.searchResults ?  state.searchResults['documents'] : null;
    linkages = state.searchResults ?  state.searchResults['linkages'] : null;
    references = state.searchResults ?  state.searchResults['references'] : null;

    return {
        workspace,
        documents,
        linkages,
        references
    }
}

export default withRouter(connect(mapStateToProps, {retrieveSearchResults})(MainSearchbar));

const IconContainer = styled.div`
    width: 2rem;
    font-size: 1.7rem;
    margin-right: 0.8rem;
    display: flex;
    align-items: center;
    justify-content: center;
`

const Strong = styled.b`
    font-weight: 600;
`

const SearchHeader = styled.div`
    height: 2rem;
    color: #172A4E;
    opacity: 0.8;
    font-size: 1.3rem;
    padding: 1rem;
    margin-bottom: 1.5rem;
    
`

const SearchResult = styled.div`
    height: 3rem;
    display: flex;
    align-items: center;
    color: #172A4E;
    font-size: 1.3rem;
    padding: 1.5rem 2rem;
    cursor: pointer;
    &:hover {
        background-color: #EBECF0;
    }
    font-weight: 500;
`

const Placeholder = styled.div`
    height: 10rem;
    color: #172A4E;
    opacity: 0.5;
    padding: 1.5rem 2rem;
`

const EmptyResult = styled.div`
    height: 10rem;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #172A4E;
    font-size: 1.4rem;
    padding: 1.5rem 2rem;
    cursor: pointer;
    opacity: 0.5;
    font-weight: 500;
    font-style: italic;
`

const InfobankLinkText = styled.div`
    opacity: 0.7;
    font-weight: 500;
`

const InfobankLink = styled.div`
    height: 4rem;
    display: flex;
    align-items: center;
    color: #172A4E;
    font-size: 1.3rem;
    padding: 1.5rem 2rem;
    cursor: pointer;
    &:hover {
        background-color: #EBECF0;
    }
    border-top: 1px solid #E0E4E7;
    margin-top: 1rem;
`

const SearchBubble = styled.div`
    width: 50rem;
    position: absolute;
    border-radius: 0.2rem;
    background-color: white;
    top: 5rem;
    display: flex;
    flex-direction: column;
    box-shadow: 0 30px 60px -12px rgba(50,50,93,0.25),0 18px 36px -18px rgba(0,0,0,0.3);
`

const SearchbarWrapper = styled.div`
    margin-right: 3rem;
    border-radius: 0.25rem;
    cursor: text;
    display: flex;
    align-items: center;
    height: 3.3rem;
    padding: 0.5rem 1.5rem;
    background-color: #323643;
    border: 1px solid #323743;
    &:hover {
        background-color: ${props => !props.active ? '#3d4151' : '#323643' };
    }
    width: ${props => props.width};
`

const Searchbar = styled.input`
    background-color:transparent;
    border-radius: 2px;
    border: none;
    padding: 0.4rem 0.4rem;
    font-size: 1.35rem;
    outline: none;
    color: white;
    margin-left: 1rem;
    &::placeholder {
        color: white;
        opacity: 0.7;
        font-weight: 400;
    }
    &:hover {
        background-color:transparent;
    }
    font-weight: 350;
    height: 3rem;
    width: ${props => props.barWidth};
    transition: width 0.1s;
    font-family: -apple-system,BlinkMacSystemFont, sans-serif;
`
