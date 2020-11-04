import React, { Component } from 'react';
import styled from 'styled-components';

//components
import FeedLog from './FeedLog';

//actions
import { retrieveFeeds } from '../../../../actions/Feed_Actions';

//react-router
import { withRouter } from 'react-router-dom';

//react-redux
import { connect } from 'react-redux';

// Log of activity in workspace
class Feed extends Component {
    constructor(props){
        super(props);
        this.state = {
            loaded: false
        }
    }

    componentDidMount = async () => {
        const { retrieveFeeds, match } = this.props;
        const { workspaceId } = match.params;

        await retrieveFeeds({workspaceId, limit: 9});
        this.setState({loaded:true});
    }
    
    render(){
        const { feeds} = this.props;
        const { loaded } = this.state;
        return (
            <>
                {loaded &&
                     <FeedContainer>
                        <Header>Activity</Header>
                        <ListView>
                            {feeds.map((item, i) => {
                                return <FeedLog last = {i === feeds.length - 1} feed = {item}/>
                            })}
                        </ListView>
                    </FeedContainer>
                }
            </>
        )
    }
}

const mapStateToProps = (state) => {
    return {
        feeds: Object.values(state.feeds)
    }
}

export default withRouter(connect(mapStateToProps, { retrieveFeeds })(Feed));

const Header = styled.div`
    height: 4.5rem;
    display: flex;
    align-items: center;
    font-size: 1.7rem;
    font-weight: 600;
    padding-right: 3rem;
    margin-bottom: 1rem;
`

const ListView = styled.div`
    display: flex;
    flex-direction: column;
    /*
    background-color: white;
    padding-bottom: 1rem;
    padding: 2rem;
    */
    height: calc(37vh - 5.5rem - 4rem);
    overflow-y: scroll;
`

const FeedContainer = styled.div`
    margin-top: 2.7rem;
    overflow-y: scroll;
    height: 37vh;
    background-color: white;
    padding: 2rem;
    border-radius: 0.7rem;
    box-shadow: rgba(9, 30, 66, 0.31) 0px 0px 1px 0px, rgba(9, 30, 66, 0.25) 0px 5px 10px -5px;
`