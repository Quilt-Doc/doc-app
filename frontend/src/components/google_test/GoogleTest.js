import React from "react";

import styled from "styled-components";

import { withRouter } from "react-router-dom";

import { connect } from "react-redux";

// endpoint used by axios api to backend
import { apiEndpoint } from "../../apis/api";

const GoogleTest = (props) => {
    const { user, match } = props;
    const { workspaceId } = match.params;

    return (
        <Container>
            <Button onClick={() => authorizeGoogle(user._id, workspaceId)}>
                Authorize Google
            </Button>
        </Container>
    );
};

const authorizeGoogle = (userId, workspaceId) => {
    const url = `${apiEndpoint}/integrations/connect/google?workspace_id=${workspaceId}&user_id=${userId}`;
    window.open(url, "_self");
};

const mapStateToProps = (state) => {
    const {
        auth: { user },
    } = state;
    return {
        user,
    };
};

export default withRouter(connect(mapStateToProps, {})(GoogleTest));

const Container = styled.div`
    height: 100vh;
    width: 100vw;
    display: flex;
    align-items: center;
    justify-content: center;
`;

const Button = styled.div`
    display: flex;
    align-items: center;
    padding: 1rem;
    border: 1px solid #e0e4e7;
    background-color: white;
    cursor: pointer;
`;
