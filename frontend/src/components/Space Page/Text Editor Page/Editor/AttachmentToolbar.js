import React from 'react';
import styled from 'styled-components';

import RepositoryMenu2 from '../../../General/Menus/RepositoryMenu2';
import FileReferenceMenu from '../../../General/Menus/FileReferenceMenu';
import LabelMenu from '../../../General/Menus/LabelMenu';

import {connect} from 'react-redux';

//actions
import { attachTag, removeTag } from '../../../../actions/Document_Actions';

class AttachmentToolbar extends React.Component{
    render(){
        return(
            <Container>
                <RepositoryMenu2
                    document={this.props.document}
                />
                 <FileReferenceMenu
                        setReferences={this.props.document.references}//this.props.request.tags}
                        marginTop={"-1rem"}
                        document={this.props.document}
                />
                <LabelMenu
                    attachTag={(tagId) => this.props.attachTag(this.props.document._id, tagId)}//this.props.attachTag(requestId, tagId)}
                    removeTag={(tagId) => this.props.removeTag(this.props.document._id, tagId)}//this.props.removeTag(requestId, tagId)}
                    setTags={this.props.document.tags}//this.props.request.tags}
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

export default connect(mapStateToProps, 
    { attachTag, removeTag })(AttachmentToolbar);


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