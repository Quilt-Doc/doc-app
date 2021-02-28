handleKeyDown = (e) => {
    e.preventDefault();
    e.stopPropagation();
    //document.body.style.pointerEvents = 'none';
    if (e.keyCode === 40) {
        this.stopMouseEvents = true;
        if (!this.state.focused && this.props.snippets.length > 0){
            this.focusSnippet2(this.props.snippets[0])
        } else {
            for (let i = 0; i < this.props.snippets.length; i++){
                let snippet = this.props.snippets[i];
                if (snippet._id === this.state.focused) {
                    if (i !== this.props.snippets.length - 1) {
                        this.focusSnippet2(this.props.snippets[i + 1])
                    } else {
                        this.focusSnippet2(this.props.snippets[0])
                    }
                    break
                }
            }
        }
        window.addEventListener('mousemove', this.resetPointerEvents, false)
    } else if (e.keyCode === 38) {
        this.stopMouseEvents = true;
        if (!this.state.focused && this.props.snippets.length > 0){
            this.focusSnippet2(this.props.snippets[0])
        } else {
            for (let i = 0; i < this.props.snippets.length; i++){
                let snippet = this.props.snippets[i];
                if (snippet._id === this.state.focused) {
                    if (i !== 0) {
                        this.focusSnippet2(this.props.snippets[i - 1])
                    } else {
                        this.focusSnippet2(this.props.snippets[this.props.snippets.length - 1])
                    }
                    break
                }
            }  
        }
        window.addEventListener('mousemove', this.resetPointerEvents, false)
    }
}

resetPointerEvents = () => {
    window.removeEventListener('mousemove', this.resetPointerEvents, false)
    this.stopMouseEvents = false;
}


deleteSnippet(index) {
    var { workspaceId } = this.props.match.params;
    this.props.deleteSnippet({workspaceId, snippetId: this.props.snippets[index]._id});
}


focusSnippet = (snippet) => {
        let line = this.lines[snippet.start]
        if (this.state.newSnippetId === '' 
            && !this.state.selectionMode &&  
            this.state.focused !== snippet._id
        ) {
            if (this.state.focused) {this.annotations[this.state.focused].unhover()};
            const annotation = this.annotations[snippet._id]
            const offset_snippet = ReactDOM.findDOMNode(line.node).offsetTop
                - document.getElementById('codeholder').offsetTop
            const offset_annotation =ReactDOM.findDOMNode(annotation).offsetTop;
            const offset_difference = offset_annotation - offset_snippet
            const newScale = -1 * offset_difference
            this.setState({scaleY: newScale, focused: snippet._id})
            //snippet.hover()
            annotation.hover()
        }
}

