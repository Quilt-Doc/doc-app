import React from 'react';

//styles
import styled from 'styled-components';

//components
import DocumentNavbar from '../side_navbar/DocumentNavbar';
import EditorWrapper from './text_editor/EditorWrapper';

//react-router
import { withRouter } from 'react-router-dom';

const Knowledge = (props) => {
    const { documentId } = props.match.params;
    return (
        <Container>
            <DocumentNavbar/>
            {documentId && <EditorWrapper/>}
        </Container>
    )
}

export default withRouter(Knowledge);

const Container = styled.div`
    display: flex;
`