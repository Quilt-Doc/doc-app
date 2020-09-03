import React from 'react';

import styled from 'styled-components';

import {RiGitPullRequestLine, RiFlag2Line, RiTeamLine} from 'react-icons/ri'
import PullRequestLog from './PullRequestLog';
import PeopleLog from './PeopleLog';
import {CgFeed} from 'react-icons/cg';
import {AiOutlineTeam} from 'react-icons/ai';
import BreakageLog from './BreakageLog';
import FeedLog from './FeedLog';

import chroma from 'chroma-js';

class InsightsView extends React.Component {

    render(){
        return(
            <>
        
            <Container>
                {/*<Header>Dashboard</Header>*/}
                <Header>Dashboard</Header>
                <DashboardRow>

                    <PeopleLog/>
                    <BreakageLog/>
                </DashboardRow>
                <PullRequestLog/>
                <FeedLog/>
            </Container>
            </>
        )
    }
}

export default InsightsView;

const DashboardRow = styled.div`
    height: 20rem;
    display: flex;
    margin-bottom: 2.5rem;
`

const Container = styled.div`
    background-color: #f7f9fb;
    min-height: 100%;
    display: flex;
    flex-direction: column;
    padding-left: 8rem;
    padding-right: 8rem;
    padding-bottom: 7rem;
    padding-top: 1rem;
`

const Header = styled.div`
    font-size: 2rem;
    font-weight: 500;
    margin-top: 5rem;
    margin-bottom: 2.5rem;
    display: flex;
    align-items: center;

`
