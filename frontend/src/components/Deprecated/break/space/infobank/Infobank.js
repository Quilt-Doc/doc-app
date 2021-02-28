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
        let { docSkip, refSkip } = this.props;

        await this.props.retrieveInfobankResults({
            userQuery: query,
            workspaceId,
            limit: 20,
            returnReferences: false, 
            returnDocuments: true,
            docSkip: newSearch ? 0 : docSkip,
            refSkip: newSearch ? 0 : refSkip,
            includeImage: true,
            mix: true
        }, newSearch);
        //this.setState({loaded: true})
    }



    renderCards(){
        let {infobankResults} = this.props;
        return infobankResults.map((result, i) => {
            if (result.isDocument && result.title !== "") {
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
            <Background>
                <Top>
                    <Header>INFOBANK</Header>
                </Top>
                <Content>
                    <BodyContainer>
                        <InfobankToolbar/>
                        <Container>
                            <InfiniteScroll
                                pageStart={0}
                                loadMore={() => this.retrieveInfobankResults(false)}
                                useWindow = {false}
                                hasMore={hasMore}
                                initialLoad = {false}
                                loader={this.renderLoader()}
                            >
                                {(infobankResults && infobankResults.length > 0) &&
                                    <CardContainer>
                                        {this.renderCards()}
                                    </CardContainer>
                                }
                            </InfiniteScroll>
                        </Container>
                    </BodyContainer>
                </Content>
            </Background>
        )
    }
}

/* <div>
                        <InfiniteScroll
                            pageStart={0}
                            loadMore={() => this.retrieveInfobankResults(false)}
                            useWindow = {false}
                            hasMore={hasMore}
                            initialLoad = {false}
                            loader={this.renderLoader()}
                        >
                            <Container>
                                {(infobankResults && infobankResults.length > 0) &&
                                    <CardContainer>
                                        {this.renderCards()}
                                    </CardContainer>
                                }
                            </Container>
                        </InfiniteScroll>
                    </div>*/

const mapStateToProps = (state) => {

    let { infobankResults, docSkip, refSkip, hasMore } = state.search;

    return {
        infobankResults,
        docSkip,
        refSkip,
        hasMore
    }
}

export default withRouter(connect( mapStateToProps, { retrieveInfobankResults })(Infobank));

const BodyContainer = styled.div`
    width: 85%;
    max-width: 125rem;
`

const Content = styled.div`
    display: flex;
    width: 100%;
    margin-top: 3rem;
    justify-content: center;
`

const Top = styled.div`
    display: flex;
    align-items: center;
`

const Header = styled.div`
    font-size: 1.1rem;
    font-weight: 400;
    display: inline-flex;
    border-bottom: 2px solid #172A4E;
    height: 2.8rem;
    padding-right: 3.5rem;
    display: flex;
    align-items: center;
`

const Background = styled.div`
    background-color: #f6f7f9;
    min-height: 100%;
    padding-left: 2.1rem;
    padding-top: 2.1rem;
    padding-right: 2.1rem;
    background-color: #f6f7f9;
`

const CardContainer = styled.div`
    display: grid;
    align-items: center;
    grid-template-columns: repeat(auto-fill, minmax(10rem, 1fr));
    grid-gap: 3rem;
    padding-bottom: 3rem;
`

const Container = styled.div`
    width: 100%;
`

const LoaderContainer = styled.div`
    padding-left: 5rem;
    padding-right: 5rem;
    margin-top: 2rem;
    margin-bottom: 2rem;
    display: flex;
    justify-content: center;
`