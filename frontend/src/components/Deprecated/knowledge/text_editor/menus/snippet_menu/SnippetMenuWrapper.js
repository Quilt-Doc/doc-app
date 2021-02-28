import React from 'react';

//slate
import { useSlate } from 'slate-react'

//components
import SnippetMenu from './SnippetMenu';

const SnippetMenuWrapper = (props) => {
    let editor = useSlate();
    return (
        <SnippetMenu {...props} editor = {editor}/>
    )
}

export default SnippetMenuWrapper;