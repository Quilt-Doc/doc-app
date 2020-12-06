import React, { useEffect, useMemo, useState, useRef } from 'react';

//styles
import styled from 'styled-components';
import chroma from 'chroma-js';

//actions
import { getUpload } from '../../../../../../actions/Document_Actions';

//redux
import { connect } from 'react-redux';

//router
import { withRouter } from 'react-router-dom';

//loader
import { Oval } from 'svg-loaders-react';

//slate
import { Transforms } from 'slate';
import { ReactEditor, useReadOnly, useSlate } from 'slate-react';
import { MENU_SHADOW } from '../../../../../../styles/shadows';
import { AiOutlineColumnWidth } from 'react-icons/ai';
import { BsImage, BsImageFill } from 'react-icons/bs';

const Image = (props) => {
    const { attributes, children, element, getUpload } = props;
    const { isLink, link, name, path, uploaded, width } = element;

    const [imageData, setImageData] = useState(null);
    const [isSelected, setIsSelected] = useState(false);
    const [isWidthInputFocused, setIsWidthInputFocused] = useState(false);

    const editor = useSlate();

    const imageRef = useRef();

    const readOnly = useReadOnly();
    
    const getImage = useMemo(() => async () => {
        const data = await getUpload({targetName: path, download: "false"});
        setImageData(data);
    }, [path]);

    const handleOnClick = useMemo(() => async () => {
        if (!readOnly) setIsSelected(true);
    }, []);

    const handleClickOutside = useMemo(() => (event) => {
        if (imageRef && imageRef.current && !imageRef.current.contains(event.target)) {
            setIsSelected(false);
        }
    }, [imageRef]);

    const handleKeyDown = useMemo(() => (event) => {
        if (event.keyCode === 8 && !isWidthInputFocused) {
            Transforms.removeNodes(editor, { 
                at: ReactEditor.findPath(editor, element),
                match: n => n.type === "image" && n.name === name
            })
        }
    }, [name, element, isWidthInputFocused])

    useEffect(() => {
        if (isSelected) {
            document.addEventListener('mousedown', handleClickOutside, false);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside, false);
        }
    }, [isSelected, handleClickOutside]);

    useEffect(() => {
        if (isSelected) {
            document.addEventListener('keydown', handleKeyDown, false);
        }

        return () => {
            document.removeEventListener('keydown', handleKeyDown, false);
        }
    }, [isSelected, handleKeyDown]);


    useEffect(() => {
        if (!isLink && uploaded) getImage();
    }, [uploaded]);

    const renderLoader = useMemo(() => () => {
        return (
            <Oval stroke={chroma('#6762df').alpha(0.5)}/>
        )
    }, []);

    const renderContent = useMemo(() => () => {
        const source = isLink ? link : imageData ? imageData : null;
        if (source) {
            return (
                <StyledImage 
                    isSelected = {isSelected} 
                    width = {width}
                    onClick = {handleOnClick} 
                    src = {source} 
                />
            )
        } else {
            return (
                <Placeholder>
                    {uploaded === false ? renderLoader() : <BsImageFill/>}
                </Placeholder>
            )
        }
    }, [isLink, link, imageData, isSelected, imageRef, width, uploaded]);

    const changeImageWidth = useMemo(() => (event) => {
        let newWidth = event.target.value;

        try {
            newWidth = parseInt(newWidth);
        } catch (err) {
            newWidth = 100;
        }

        if (newWidth > 100 ) newWidth = 100;

        Transforms.setNodes(
            editor,
            { width: newWidth },
            { 
                at: ReactEditor.findPath(editor, element),
                match: n => n.type === "image" && n.name === name
            }
        )
        return 
    }, [element, name]);

    const renderMenu = useMemo(() => () => {
        return (
            <MenuContainer>
                <WidthMenu>
                    <MenuHeader>
                        <AiOutlineColumnWidth/>
                        <MenuHeaderText>Width</MenuHeaderText>
                    </MenuHeader>
                    <WidthInput 
                        defaultValue = {width} 
                        onChange = {changeImageWidth}
                        onFocus = {(e) => setIsWidthInputFocused(true)}
                        onBlur = {(e) => setIsWidthInputFocused(false)}
                    />
                </WidthMenu>
            </MenuContainer>
        )
    }, [width, changeImageWidth]);

    return (
        <Container {...attributes} contentEditable={false}>
            <SubContainer ref = {imageRef}>
                {isSelected && renderMenu()}
                {renderContent()}
                {children}
            </SubContainer>
        </Container>
     

        /*
        <Container {...attributes} contentEditable={false} onMouseDown = {handleMouseDown}>
            <IoMdAttach/>
            <FileName>
                {doc.attachments.includes(path) ? name : renderLoader()}
            </FileName>
            {children}
        </Container>*/
    )
}

const mapStateToProps = (state, ownProps) => {
    return {}
}

export default withRouter(connect(mapStateToProps, {getUpload})(Image));

const MenuHeader = styled.div`
    display: flex;
    align-items: center;
    margin-bottom: 0.8rem;
`

const MenuHeaderText = styled.div`
    font-size: 1.4rem;
    font-weight: 500;
    margin-left: 0.5rem;
`

const WidthInput = styled.input`
    outline: none;
    border: none;
    font-size: 1.3rem;
    font-family: -apple-system, BlinkMacSystemFont, sans-serif;
    padding: 0.5rem 1rem;
    font-weight: 500;
    background-color: ${chroma("#6762df").alpha(0.15)};
`

const WidthMenu = styled.div`
    border-radius: 0.4rem;
    box-shadow: ${MENU_SHADOW};
    color: #172A4e;
    display: flex;
    flex-direction: column;
    padding: 1.5rem;
    z-index: 2;
    background-color: white;
    cursor: default;
`

const MenuContainer = styled.div`
    position: absolute;
    top: 0;
    right: 0;
`   

const Placeholder = styled.div`
    height: 10rem;
    width: 100%;
    background-color: #f7f9fb;
    display: flex;
    align-items: center;
    justify-content: center;
`

const StyledImage = styled.img`
    width: ${props => props.width ? props.width : 100}%;
    max-width: ${props => props.width ? props.width : 100}%;
    border: ${props => props.isSelected ? "2px solid #6762df" : ""};
    border-radius: 0.3rem;
`

const Container = styled.div`
    width: 100%;
    margin-top: 2rem;
    cursor: pointer;
    position: relative;
`

const SubContainer = styled.div`
    display: flex;
    width: 100%;
    justify-content: center;
`