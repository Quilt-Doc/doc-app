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
                        <ListView>
                            {feeds.map(item => {
                                return <FeedLog feed = {item}/>
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

`

const FeedContainer = styled.div`
    margin-top: 2.7rem;
    overflow-y: scroll;
    height: calc(100vh - 7.5rem);
`