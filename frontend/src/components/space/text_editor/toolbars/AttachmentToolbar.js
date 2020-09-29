import React from 'react';
import styled from 'styled-components';

import RepositoryMenu2 from '../../../menus/RepositoryMenu2';
import FileReferenceMenu from '../../../menus/FileReferenceMenu';
import LabelMenu from '../../../menus/LabelMenu';

import {connect} from 'react-redux';

import {withRouter} from 'react-router-dom';

//actions
import { attachDocumentTag, removeDocumentTag } from '../../../../actions/Document_Actions';

class AttachmentToolbar extends React.Component {

    render(){
        const { document, match } = this.props;
        const { workspaceId } = match.params;
        const { references, tags, _id} = document; 
        return(
            <Container>
                <RepositoryMenu2
                    document={document}
                />
                 <FileReferenceMenu
                        setReferences={references}//this.props.request.tags}
                        marginTop={"-1rem"}
                        document={document}
                />
                <LabelMenu
                    attachTag={(tagId) => this.props.attachDocumentTag({documentId: _id, workspaceId, tagId})}//this.props.attachDocumentTag(requestId, tagId)}
                    removeTag={(tagId) => this.props.removeDocumentTag({documentId: _id, workspaceId, tagId})}//this.props.removeTag(requestId, tagId)}
                    setTags={tags}//this.props.request.tags}
                    marginTop={"1rem"}
                />
            </Container>
        )
    }
}


const mapStateToProps = () => {
    return {

    }
}

export default withRouter(connect(mapStateToProps, 
    { attachDocumentTag, removeDocumentTag })(AttachmentToolbar));


const Container = styled.div`
    height: 4.5rem;
    display: flex;
    align-items: center;

    background-color:white;  
    /*background-color: white;*/
    padding-left: 3rem;
    padding-right: 3rem;
    opacity: 1;

    position: sticky;
    top: 0;
    z-index: 2;
    border-bottom: 1px solid #E0e4e7;
`