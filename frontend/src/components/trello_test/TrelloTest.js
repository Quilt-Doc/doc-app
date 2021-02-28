import React from 'react';

import styled from 'styled-components';

import { withRouter } from 'react-router-dom';

import { connect } from 'react-redux';

const trelloAuthEndpoint = "https://trello.com/1/authorize";

const TrelloTest = (props) => {
    const { user, match } = props;
    const { workspaceId } = match.params;

    return (
        <Container>
            <Button onClick = {() => authorizeTrello(user._id, workspaceId)}>Authorize Trello</Button>
        </Container>
    )
}

const authorizeTrello = (userId, workspaceId) => {
    const returnURL = `http://localhost:3001/api/integrations/create`;
    const callbackMethod = "fragment";
    const scope = "read,write,account";
    const expiration = "never";
    const name = "Quilt";
    const TRELLO_API_KEY = "5d50547bb9f5efe9ae09cb17e51deef6";
    const responseType = "fragment";
    
    const url = `http://localhost:3001/api/integrations/connect/trello?workspace_id=${workspaceId}&user_id=${userId}`;

    window.open(url, "_self");
    //window.open(`${trelloAuthEndpoint}?callback_method=${callbackMethod}&user_id=${userId}&workspace_id=${workspaceId}&return_url=${returnURL}&expiration=${expiration}&name=${name}&scope=${scope}&response_type=${responseType}&key=${TRELLO_API_KEY}`, "_self");
}

const mapStateToProps = (state) => {
    const { auth: {user} } = state;
    return {
        user
    }
}

export default withRouter(connect(mapStateToProps, {})(TrelloTest));

const Container = styled.div`
    height: 100vh;
    width: 100vw;
    display: flex;
    align-items: center;
    justify-content: center;
`

const Button = styled.div`
    display: flex;
    align-items: center;
    padding: 1rem;
    border: 1px solid #E0E4E7;
    background-color: white;
    cursor: pointer;
`