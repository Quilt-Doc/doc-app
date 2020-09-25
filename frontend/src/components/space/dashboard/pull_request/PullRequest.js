import React from 'react';

//styles
import styled from 'styled-components';

//components
import PullRequestDetail from './elements/pull_request_detail/PullRequestDetail';
import PullRequestToolbar from './elements/PullRequestToolbar';
import PullRequestCard from './elements/PullRequestCard';

// component that retrieve pull requests from version control
// and keeps track of doc/reference updating and deprecation with regard to the request
const PullRequest = () => {
    return(
        <Container>
            <Header>
                Git Checks
            </Header>
            <BodyContainer>
                <PullRequestToolbar/>
                <Content>
                    <PullRequestList>
                      <PullRequestCard/>
                      
                    </PullRequestList>
                    <PullRequestDetail/>
                </Content>
            </BodyContainer>
        </Container>
    );
}

export default PullRequest;

const Header = styled.div`
    height: 4.5rem;
    display: flex;
    align-items: center;
    font-size: 1.7rem;
    font-weight: 600;
    margin-bottom: 1rem;
`

const Container = styled.div`
    display: flex;
    flex-direction: column;
    border-radius: 0.3rem;
    z-index: 1;
    padding-left: 4rem;
    padding-right: 4rem;
    margin-top: 1.5rem;
`

const BodyContainer = styled.div`
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
    background-color: white;
    border-radius: 0.4rem;
`

const Content = styled.div`
    display: flex;
    height: 100%;
    border-radius: 0.5rem;
`

const PullRequestList = styled.div`
    width: 38rem;
    height: 100%;
    overflow-y: scroll;
`