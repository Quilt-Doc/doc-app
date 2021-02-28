import React from 'react';

//styles
import styled from 'styled-components';
import chroma from 'chroma-js';

//icons
import { IoMdAttach } from 'react-icons/io';

//actions
import { getUpload } from '../../../../../../actions/Document_Actions';

//redux
import { connect } from 'react-redux';

//router
import { withRouter } from 'react-router-dom';
import history from '../../../../../../history';

//loader
import { Oval } from 'svg-loaders-react';

const Attachment = (props) => {
    const { attributes, children, element, documents, getUpload } = props;
    const { name, path } = element;

    const getDocumentId = (props) => {
        const { match } = props;
        let { documentId } = match.params;

        // if the editor is a modal, the id is in the params
        if (!documentId) {
            let search = history.location.search;
            let params = new URLSearchParams(search);
            documentId = params.get('document');
        }

        return documentId;
    }

    const doc = documents[getDocumentId(props)];

    const handleMouseDown = (e) => {
        e.preventDefault();
        if (doc.attachments.includes(path)) {
            getUpload({targetName: path, download: "true"});
        } else {
            alert("Error: Attachment cannot be downloaded")
        }
    }

    const renderLoader = () => {
        return (
            <Oval stroke={chroma('#6762df').alpha(0.5)}/>
        )
    }

    return (
        <Container {...attributes} contentEditable={false} onMouseDown = {handleMouseDown}>
            <IoMdAttach/>
            <FileName>
                {doc.attachments.includes(path) ? name : renderLoader()}
            </FileName>
            {children}
        </Container>
    )
}

const mapStateToProps = (state, ownProps) => {
    const { documents } = state;
    return { 
        documents
    }
}

export default withRouter(connect(mapStateToProps, {getUpload})(Attachment));

const FileName = styled.div`
    font-size: 1.64rem;
    font-weight: 500;
    margin-left: 1rem;
`

const Container = styled.div`
    display: flex;
    padding: 1rem;
    align-items: center;
    background-color: ${chroma('#6762df').alpha(0.15)};
    border-radius: 0.2rem;
    margin-top: 2rem;
    cursor: pointer;
    &:hover {
        background-color: ${chroma('#6762df').alpha(0.3)};
    }
`