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
import { SET_IMAGE_MENU_ACTIVE } from '../editor/reducer/Editor_Types';

//redux
import { connect } from 'react-redux';

//router
import { withRouter } from 'react-router-dom';
import { Transforms } from 'slate';
import history from '../../../../../history';

//icons
import { IoMdAttach } from 'react-icons/io';
import { BsImageFill } from 'react-icons/bs';


const ImageMenu = (props) => {
    const { uploadAttachment, match, dispatch } = props;

    const [open, setOpen] = useState(false);
    const [rect, setRect] = useState(null);
    const [initialSelection, setSelection] = useState(null);
    const [canEmbed, setCanEmbed] = useState(false);

    const editor = useSlate();

    let menu = useRef();

    let embedInput = useRef(null);

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
            dispatch({type: SET_IMAGE_MENU_ACTIVE, payload: false});
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

        const parentRect = document.getElementById('editorSubContainer').getBoundingClientRect();

        rect.top = rect.top - parentRect.top;
        rect.left = rect.left - parentRect.left;

        rect.top = rect.top + rect.height/2;
        return rect;
    }

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

    const handleFileUpload = async (event) => {
        const { workspaceId } = match.params;

        const documentId = getDocumentId(props);

        if (!initialSelection) return;
            
        const file = event.target.files[0];

        Transforms.select(editor, initialSelection);

        editor.insertBlock({
            type: "image", 
            width: 100,
            name: file.name, 
            path: `${workspaceId}/${documentId}/images/${file.name}`,
            uploaded: false
        });

        dispatch({type: SET_IMAGE_MENU_ACTIVE, payload: false});

        await uploadAttachment({ attachment: file, documentId, workspaceId, name: 'attachment', isImage: true });

        Transforms.setNodes(editor, { uploaded: true }, {at: initialSelection, match: n => n.type === 'image' && n.name === file.name})
    }

    const handleEmbedLink = () => {
        if (!embedInput || !embedInput.current || !embedInput.current.value || !initialSelection) return;

        
        const link = embedInput.current.value;

        Transforms.select(editor, initialSelection);

        editor.insertBlock({
            type: "image", 
            isLink: true,
            link,
            width: 100,
        });

        dispatch({type: SET_IMAGE_MENU_ACTIVE, payload: false});
    }

    const renderOptions = () => {
        return (
            <>
                <FileInput
                    type="file" 
                    id="fileAttachmentButton" 
                    name="file" 
                    multiple 
                    onChange={(event) => handleFileUpload(event)}
                />
                <FileLabel for="fileAttachmentButton">
                    <IconBorder>
                        <BsImageFill/>
                    </IconBorder>
                    Upload
                </FileLabel>
                <EmbedButton onClick = {() => setCanEmbed(true)}>
                    <IconBorder>
                        <BsImageFill/>
                    </IconBorder>
                    Embed Link
                </EmbedButton>
            </>
        )
    }

    const renderEmbedInput = () => {
        return (
            <InputContainer>
                <EmbedInput 
                    ref = {embedInput}
                    autoFocus = {true} 
                    placeholder = {"Enter Image Link..."}
                />
                <EmbedButton onClick = {handleEmbedLink}>
                    <IconBorder>
                        <BsImageFill/>
                    </IconBorder>
                    Embed
                </EmbedButton>
            </InputContainer>
        )
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
                {canEmbed ? renderEmbedInput() : renderOptions()}
            </Container>    
        </CSSTransition>
    )
}

const mapStateToProps = (state, ownProps) => {
    return { }
}

export default withRouter(connect(mapStateToProps, { uploadAttachment })(ImageMenu));

const InputContainer = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
`

const EmbedInput = styled.input`
    width: 25rem;
    font-size: 1.3rem;
    padding: 1rem 1.5rem;
    outline: none;
    border: none;
    background-color: ${chroma('#6762df').alpha(0.15)};
    border-radius: 0.3rem;
    font-family: -apple-system,BlinkMacSystemFont, sans-serif;
    &::placeholder {
        color: #172A4E;
        opacity: 0.5;
    }
`

const EmbedButton = styled.div`
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
    margin-top: 1.5rem;
`

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
    display: inline-flex;
    align-items: center;
    width: 12rem;
`

const IconBorder = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    height: 2rem;
    margin-right: 0.8rem;
    font-size: 1.5rem;
`

const FileInput = styled.input`
    display: none;
`

const Container = styled.div`
    padding: 1.5rem 3rem;
    position: absolute;
    z-index: 1;
    background-color: white;
    border-radius: 0.5rem;
    display: flex;
    flex-direction: column;
    /*align-items: center;*/
    /*justify-content: center;*/
    box-shadow: 0 30px 60px -12px rgba(50,50,93,0.25),0 18px 36px -18px rgba(0,0,0,0.3);
    color:  #172A4e;
    margin-top: 2.2rem;
`