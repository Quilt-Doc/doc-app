import React, { useEffect, useRef, useCallback, useState } from 'react';

//styles
import styled from 'styled-components';
import chroma from 'chroma-js';

//animation
import { CSSTransition } from 'react-transition-group';

//slate
import { useSlate, ReactEditor } from 'slate-react';

//actions
import { uploadAttachment } from '../../../../../actions/Document_Actions';

//types
import { SET_ATTACHMENT_MENU_ACTIVE } from '../editor/reducer/Editor_Types';

//redux
import { connect } from 'react-redux';

//router
import { withRouter } from 'react-router-dom';
import { Transforms } from 'slate';
import { IoMdAttach } from 'react-icons/io';

const AttachmentMenu = (props) => {
    const { uploadAttachment, match, doc, dispatch, documentModal } = props;

    const [open, setOpen] = useState(false);
    const [rect, setRect] = useState(null);
    const [initialSelection, setSelection] = useState(null);

    const editor = useSlate();

    let menu = useRef();

    useEffect(() => {

        const { selection } = editor;

        const path = [selection.anchor.path[0]];
        const offset = selection.anchor.offset;

        const range = {anchor: {offset, path}, focus: {offset, path}};
        const rect = calculateRect(ReactEditor.toDOMRange(editor, range).getBoundingClientRect());

        setRect(rect);
        setSelection(selection);
        setOpen(true);
    }, []);

    const handleClickOutside = useCallback((event) => {
        if (menu.current && !menu.current.contains(event.target)) {
            dispatch({type: SET_ATTACHMENT_MENU_ACTIVE, payload: false});
        }
    }, [menu]);

    useEffect(() => {
        document.addEventListener("mousedown", handleClickOutside);

        return  () => { 
            document.removeEventListener("mousedown", handleClickOutside);
        }

    }, [handleClickOutside]);
    
    const calculateRect = (clientRect) => {
        const { top, left, height } = clientRect;
        let rect = { top, left, height };
        
        if (documentModal) {	
            const { scrollTop } = document.getElementById("documentModalBackground");
            rect.top = rect.top + scrollTop;
        } else {
            /*
            console.log("ENTERD HERE");
            const { scrollTop } = document.getElementById("rightView");
            console.log("SCROLL TOP", scrollTop)
            rect.top = rect.top - scrollTop;
            */
        }
       
        /*
        if (this.menu.current) {
            if (rect.top + 385 - 100 > window.innerHeight){
                rect.top = rect.top - 385;
            }
        }*/

        const parentRect = document.getElementById('editorSubContainer').getBoundingClientRect();

        rect.top = rect.top - parentRect.top;
        rect.left = rect.left - parentRect.left;

        rect.top = rect.top + rect.height/2;
        return rect;
    }

    const handleFileUpload = (event) => {
        const { documentId, workspaceId } = match.params;

        if (!initialSelection) return;
            
        const file = event.target.files[0];

        Transforms.select(editor, initialSelection);

        editor.insertBlock({
            type: "attachment", 
            name: file.name, 
            path: `${workspaceId}/${documentId}/${file.name}`
        });

        uploadAttachment({ attachment: file, documentId, workspaceId, name: 'attachment' });

        dispatch({type: SET_ATTACHMENT_MENU_ACTIVE, payload: false});
    }

    return (
        <CSSTransition
            in = {open}
            unmountOnExit
            enter = {true}
            exit = {true}       
            timeout = {150}
            classNames = "dropmenu"
        >
            <Container 
                style = {{
                    top: rect ?  rect.top + rect.height/2 : 0, 
                    left: rect ? rect.left : 0
                }}
                ref = {menu}
            >
                <FileInput
                    type="file" 
                    id="fileAttachmentButton" 
                    name="file" 
                    multiple 
                    onChange={handleFileUpload}
                />
                <FileLabel for="fileAttachmentButton">
                    <IconBorder>
                        <IoMdAttach/>
                    </IconBorder>
                    Upload
                </FileLabel>
            </Container>    
        </CSSTransition>
    )
}

const mapStateToProps = (state, ownProps) => {
    const { documents } = state;
    const { documentId } = ownProps.match.params;
    const doc = documents[documentId];

    return { 
        doc
    }
}

export default withRouter(connect(mapStateToProps, { uploadAttachment })(AttachmentMenu));

const FileLabel = styled.label`
    font-size: 1.5rem;
    background-color: ${chroma('#6762df').alpha(0.15)};
    font-weight: 500;
    padding: 1rem 2rem;
    border-radius: 0.3rem;
    cursor: pointer;
    &:hover {
        background-color: ${chroma('#6762df').alpha(0.3)};
    }
    display: flex;
    align-items: center;
`

const IconBorder = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    height: 2rem;
    margin-right: 0.5rem;
    font-size: 1.5rem;
`

const FileInput = styled.input`
    display: none;
`

const Container = styled.div`
    width: 20rem;
    height: 10rem;
    position: absolute;
    z-index: 1;
    background-color: white;
    border-radius: 0.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 30px 60px -12px rgba(50,50,93,0.25),0 18px 36px -18px rgba(0,0,0,0.3);
    color:  #172A4e;
    margin-top: 2.2rem;
`