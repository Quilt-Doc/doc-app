import React, { Component } from 'react';

//styles
import styled from 'styled-components';

//component
import { CSSTransition } from 'react-transition-group';

//actions
import { retrieveSearchResults } from '../../../actions/Search_Actions';

//loader
import { Oval } from 'svg-loaders-react';
import { RiFileLine, RiFileList2Line } from 'react-icons/ri';
import { AiFillFolder } from 'react-icons/ai';

//icons
import { CgSearch } from 'react-icons/cg';
import { BiCode } from 'react-icons/bi';

//router
import { withRouter } from 'react-router-dom';
import history from '../../../history';

//redux
import { connect } from 'react-redux';

class Search extends Component {
    constructor(props){
        super(props);
        this.state = {
            // typingTimeout refers to method which search results after a short delay
            // rather than on every keystroke
            typingTimeout: null,
            loading: true
        }
    }

    async componentDidMount() {
        
        await this.retrieveSearchResults()
        this.setState({loading: false});
    }

    async retrieveSearchResults() {
        const { retrieveSearchResults, match } = this.props;
        const { workspaceId } = match.params;

        this.setState({loading: true});
        await retrieveSearchResults({
            userQuery: this.input.value,
            workspaceId,
            limit: 9,
            returnReferences: true, 
            returnDocuments: true,
            minimalDocuments: true,
            minimalReferences: true,
            searchContent: true
        });
        this.setState({loading: false});
    }


    onChangeHandler = () => {
        let {typingTimeout} = this.state;

        if (typingTimeout) {
            clearTimeout(this.state.typingTimeout);
        }

        this.setState({
            typingTimeout: setTimeout(() => this.retrieveSearchResults(), 100)
        })
    }

    renderLoader = () => {
        return(
            <LoaderContainer>
                <Oval
                    stroke="white"
                />
            </LoaderContainer>
        )
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

    renderSearchResults = () => {
        const { results, match, setSearch } = this.props;
        const { workspaceId } = match.params;
        if (results.length > 0) {
            return results.map(result => {
                if (result.isDocument) {
                    return (
                        <SearchResult onClick = {() => {
                            setSearch(false);
                            history.push(`/workspaces/${workspaceId}/document/${result._id}`)}}
                        >
                            <IconContainer>
                            <RiFileList2Line  style = {{
                                color: 'white'
                            }}/>
                            </IconContainer>
                            <ResultTitle>
                                {result.title ? result.title : "Untitled"}
                            </ResultTitle>
                        </SearchResult>
                    )
                } else if (result.isReference) {
                    let view = result.kind === "dir" ? "dir" : "code";
                    return (
                        <SearchResult onClick = {() => 
                            history.push(`/workspaces/${workspaceId}/repository/${result.repository._id}/${view}/${result._id}`)}
                        >
                            <IconContainer>
                                {this.renderReferenceIcon(result.kind)}
                            </IconContainer>
                            <ResultTitle>
                                {result.name ? result.name : "Untitled"} 
                            </ResultTitle>
                        </SearchResult>
                    )
                }
            })
        } else {
            return <EmptyResult>No Results</EmptyResult>
        }
    }

    render(){
        const { setSearch } = this.props;
        const { loading } = this.state;
        return (
            <ModalBackground onClick = {() => {setSearch(false)}}>
                <CSSTransition
                    in={true}
                    appear = {true}
                    timeout={300}
                    classNames="modal"
                >  
                <ModalContent 
                    onClick = {(e) => {e.stopPropagation()}}
                >
                    <SearchbarWrapper>
                        <IconBorder>
                            <CgSearch/>
                        </IconBorder>
                        <SearchInput 
                            ref = {node => this.input = node}
                            autoFocus
                            placeholder = {"Search..."}
                            onChange = {(e) => this.onChangeHandler(e)}
                        />
                    </SearchbarWrapper>
                    <Results>   
                        { loading ? this.renderLoader() : this.renderSearchResults()}
                    </Results>
                </ModalContent>
                </CSSTransition>
            </ModalBackground>
        )
    }
}

const mapStateToProps = (state) => {
    const { search: {searchResults} } = state;

    return {
       results: searchResults
    }
}

export default withRouter(connect(mapStateToProps, {retrieveSearchResults})(Search));


const EmptyResult = styled.div`
    height: 10rem;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 1.4rem;
    padding: 1.6rem 0.6rem;
    cursor: pointer;
    opacity: 0.8;
    font-weight: 500;
`

const ResultTitle = styled.div`
    text-overflow: ellipsis;
    white-space: nowrap;
    overflow: hidden;
`

const IconContainer = styled.div`
    min-width: 2rem;
    max-width: 2rem;
    font-size: 1.7rem;
    margin-right: 0.8rem;
    display: flex;
    align-items: center;
    justify-content: center;
`

const SearchResult = styled.div`
    height: 3rem;
    display: flex;
    align-items: center;
    color: white;
    font-size: 1.3rem;
    padding: 1.6rem 0.6rem;
    border-radius: 0.3rem;
    cursor: pointer;
    &:hover {
        background-color: #3b404f;
    }
    font-weight: 500;
`


const Results = styled.div`
    padding: 1.8rem;
    padding-top: 1rem;
    padding-bottom: 1rem;
`

const LoaderContainer = styled.div`
    height: 30rem;
    width: 100%;
    margin-left: 0.2rem;
    display: flex;
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
    overflow-y: scroll;
`

const SearchbarWrapper = styled.div`
    height: 5.3rem;
    border-bottom: 2px solid #5B75E6;
    display: flex;
`

const ModalContent = styled.div`
    background-color: #23252f;
    margin: 7vh auto; /* 15% from the top and centered */
    width: 83vw; /* Could be more or less, depending on screen size */
    /*height: 43rem;*/
    border-radius: 0.4rem;
    box-shadow: rgba(15, 15, 15, 0.05) 0px 0px 0px 1px, rgba(15, 15, 15, 0.1) 0px 5px 10px, rgba(15, 15, 15, 0.2) 0px 15px 40px;
    display: flex;
    flex-direction: column;
    max-width: 62rem;
    color: white;
`

const IconBorder = styled.div`
    width: 5rem;
    padding-left: 2rem;
    font-size: 2.5rem;
    height: 5.3rem;
    display: flex;
    align-items: center;
    justify-content: center;
`

const SearchInput = styled.input`
    width: 100%;
    padding: 0rem 0.5rem;
    padding-top: 0.25rem;
    padding-left: 1rem;
    padding-right: 2.5rem;
    background-color: #23252f;
    border: none;
    border-top-right-radius: 0.4rem;
    color: white;
    &::placeholder {
        color: white;
        opacity: 0.3;
        font-weight: 400;
    }
    outline: none;
    font-size: 1.75rem;
    font-weight: 400;
`