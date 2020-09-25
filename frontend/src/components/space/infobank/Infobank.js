import React from 'react';
import styled from 'styled-components';

import chroma from 'chroma-js';

import InfobankToolbar from './InfobankToolbar';
import InfobankCard from './InfobankCard';

import {withRouter, Link} from 'react-router-dom';
import {connect} from 'react-redux';

import {retrieveInfobankResults} from '../../../actions/Search_Actions';

import InfiniteScroll from 'react-infinite-scroller';

import MoonLoader from "react-spinners/MoonLoader";

class Infobank extends React.Component {
    constructor(props){
        super(props)

        this.state = {
            loaded: false,
            query: ""
        }
    }

    componentDidMount() {
        this.retrieveInfobankResults(true)
    }

    componentDidUpdate = (prevProps, prevState) => {
        if (prevState.query !== this.state.query) {
            this.retrieveInfobankResults(true)
        }
    }

    updateQuery = (query) => {
        this.setState({query});
    }

    retrieveInfobankResults = async (newSearch) => {

        let {query} = this.state;
        let { workspaceId } = this.props.match.params;
        let { docSkip, refSkip, linkageSkip } = this.props;

        await this.props.retrieveInfobankResults({
            userQuery: query,
            workspaceId,
            limit: 20,
            returnReferences: false, 
            returnDocuments: true,
            returnLinkages: false,
            docSkip: newSearch ? 0 : docSkip,
            refSkip: newSearch ? 0 : refSkip,
            linkageSkip: newSearch ? 0 : linkageSkip,
            includeImage: true,
            mix: true
        }, newSearch);
        //this.setState({loaded: true})
    }



    renderCards(){
        let {infobankResults} = this.props;
        return infobankResults.map((result, i) => {
            if (result.isDocument) {
                return (
                    <InfobankCard key = {i} result = {result} />
                )
            }
        })
    }

    renderLoader = () => {
        return (
            <LoaderContainer>
                <MoonLoader size = {30}/>
            </LoaderContainer>
        )
    }

    render(){
        let { infobankResults, hasMore } = this.props;
        return(
            <InfiniteScroll
                pageStart={0}
                loadMore={() => this.retrieveInfobankResults(false)}
                useWindow = {false}
                hasMore={hasMore}
                initialLoad = {false}
                loader={this.renderLoader()}
            >
                <Container>
                    <InfobankToolbar
                        updateQuery = {this.updateQuery}
                    />
                    {(infobankResults && infobankResults.length > 0) &&
                         <CardContainer>
                            {this.renderCards()}
                        </CardContainer>
                    }
                </Container>
            </InfiniteScroll>
        )
    }
}


const mapStateToProps = (state) => {

    let {infobankResults, docSkip, refSkip, linkageSkip, hasMore} = state.searchResults;

    return {
        infobankResults,
        docSkip,
        refSkip,
        linkageSkip,
        hasMore
    }
}

export default withRouter(connect(mapStateToProps, { retrieveInfobankResults })(Infobank));


const Cover = styled.div`
    position: absolute; 
    color: black;
    height: 20rem;
`

const ImageContainer = styled.div`
    height: 22rem;
    display: flex;
    justify-content: center;
    align-items: center;
    margin-top: -2rem;
    margin-bottom: 1rem;
    
`

const StyledImg = styled.img`
    width: 20rem;
    height: auto;
    border: 1px solid #E0E4E7;
    border-radius: 0.2rem;
`

const Icon = styled.div`
    align-items: center;
    justify-content: center;
    display: flex;
`


const Status = styled.div`
    display: inline-flex;
    background-color: ${chroma('#19e5be').alpha(0.15)};
    color:#19e5be;
    border: 1px solid #19e5be;
    font-weight: 500;
    border-radius: 0.3rem;
    font-size: 1.4rem;
    padding: 0rem 1rem;
    align-items: center;
    height: 2rem;
    margin-top: -0rem;
    margin-left: auto;
    justify-content: center;
`


const Title = styled.div`
    display: flex;
    font-weight: 500;
    font-size: 1.4rem;
    align-items: center;
    padding: 2rem;
    padding-bottom: 3rem;
    background-color: #2B2F3A;
    color: white;
    border-top-left-radius: 0.3rem;
    border-top-right-radius: 0.3rem;
`

//add a border on this guy
const Content = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    height: 22rem;
    margin-bottom: 1rem;
    margin-top: 1rem;
    font-size: 3rem;
`

const ContentType = styled.div`
    opacity: 0.5;
`

const Icon2 = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 2.8rem;
`


const Detail = styled.div`
    display: flex;
    font-size: 1.1rem;
    align-items: center;
    margin-top: auto;
    padding: 0 2rem;
`

const Creator = styled.div`
    height: 2.5rem;
    width: 2.5rem;
    background-color: ${chroma('#1e90ff').alpha(0.2)};
    color:#1e90ff;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 0.3rem;
    font-size: 1.4rem;
    margin-left: auto;
    margin-top: -0.1rem;
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
`

const CardContainer = styled.div`
    display: grid;
    align-items: center;
    grid-template-columns: repeat(auto-fill, minmax(24rem, 1fr));
    grid-gap: 2rem;
    padding-bottom: 3rem;
    padding-top: 3rem;
    padding-left: 5rem;
    padding-right: 5rem;
`


const Card = styled(Link)`
    width: 100%;
    position: relative;
    color: #172A4E;
    border-radius: 0.3rem;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
    background-color: white;
    /*padding: 1.5rem 2rem;
    padding-top: 2rem;*/
    padding-bottom: 1.5rem;
    display: flex;
    flex-direction: column;
    align-self: ${props => props.top ? "flex-start" : ""};
    cursor: pointer;
    &:hover {
        box-shadow: rgba(9, 30, 66, 0.31) 0px 0px 1px 0px, rgba(9, 30, 66, 0.25) 0px 8px 16px -6px;
    }
    text-decoration: none;
    transition: box-shadow 0.1s;
`



const BankContainer = styled.div`
    background-color: white;
   /*box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);*/
    border-radius: 0.5rem; 
`

const Container = styled.div`
    min-height: 100%;
    min-width: 90rem;
    background-color: #f7f9fb;
`

const LoaderContainer = styled.div`
    padding-left: 5rem;
    padding-right: 5rem;
    margin-top: 2rem;
    margin-bottom: 2rem;
    display: flex;
    justify-content: center;
`
/*
  {
            <Container>
                <ConnectContainer>
                    <Toolbar>
                        <IoIosSearch style = {{'fontSize': '2.3rem'}}/>
                        <FilterButton>
                            <RiFilter2Line/>
                        </FilterButton>
                    </Toolbar>
                    <ListView>
                        {this.renderListItems()}
                    </ListView>
                </ConnectContainer>
            </Container>
  }     
const FilterButton = styled.div`
    margin-left: auto;
    height: 2.5rem;
    width: 2.5rem;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
    background-color: #f7f9fb;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 0.3rem;
    font-size: 1.8rem;
    cursor: pointer;
`

const Toolbar = styled.div`
    height: 4.5rem;

    display: flex;
    align-items: center;
    padding-left: 2rem;
    padding-right: 3rem;
    
`

const Header = styled.div`
    font-size: 2rem;
    font-weight: 500;
    height: 10rem;
    display: flex;
    align-items: center;
`

const ListView = styled.div`
    display: flex;
    flex-direction: column;
    max-height: 67rem;
`

const Title = styled.div`
    font-weight: 500;
    font-size: 1.3rem;
`

const Container = styled.div`
    background-color: #f7f9fb;
    height: 100%;
    padding-top: 1rem;
    padding-left: 8rem;
    padding-right: 8rem;
    padding-bottom: 5rem;
`

const ConnectContainer = styled.div`
    background-color: white;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
    border-radius: 0.3rem;
`

const ListItem = styled.div`
    
    display: flex;
    align-items: center;
    padding-left: 3rem;
    padding-right: 3rem;
    height: 3.8rem;
    background-color: white;
    background-color: ${props => props.active ? chroma("#5B75E6").alpha(0.04) : ''};
    font-size: 1.5rem;
`*/