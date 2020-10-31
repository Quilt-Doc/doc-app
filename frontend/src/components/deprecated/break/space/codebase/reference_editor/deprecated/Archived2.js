/*
// selection framework
createSelection() {
    Selection.create({

        // Class for the selection-area
        class: 'selection',
    
        // All elements in this container can be selected
        selectables: ['.codeline'],
    
        // The container is also the boundary in this case
        boundaries: ['.codetext'],

        scrollSpeedDivider: 10,
        manualScrollSpeed: 750
    }).on('start', ({inst, selected, oe}) => {
        if ((!(this.state.cannotSelect) && this.state.selectionMode) ||
            this.state.reselectingSnippet !== null) {
            let addedClass = 'selected_code'
            this.setState({selected: {}})
            for (const el of selected) {
                el.classList.remove(addedClass);
                inst.removeFromSelection(el);
            }
            inst.clearSelection();
        }
        
    }).on('move', ({changed: {removed, added}}) => {
        // Add a custom class to the elements that where selected.
        if ((!(this.state.cannotSelect) && this.state.selectionMode) ||
            this.state.reselectingSnippet !== null) {
            
            let addedClass = 'selected_code'
            
            let selected = {...this.state.selected}
            for (const el of added) {
                selected[el.id] = el
                el.classList.add(addedClass);
            }
        
            // Remove the class from elements that were removed
            // since the last selection
            for (const el of removed) {
                if (el.id in selected) {
                    delete selected[el.id]
                }
                el.classList.remove(addedClass);
            }

            
            let newState = {selected};
            
            if (_.isEmpty(this.state.selected) && added.length > 0){
                newState.first = added[0]
            }

            this.setState({...newState})
        }
        
    }).on('stop', ({inst}) => {

        if ((!(this.state.cannotSelect) && this.state.selectionMode) ||
        this.state.reselectingSnippet !== null) {
            inst.keepSelection();
        }
    });
}

renderCallbacks(line, callbacks, offset, lineNumber, currLineJSX, tokenType) {
        const { position, name, path, definitionReferences } =  callbacks.slice(-1)[0];
        let symbol = name;
        const { start, end } = position;



        const identifiers = {
            'keyword':{color: '#D73A49', type: ''},
            'boolean': {color: '#56B6C2', type: ''},
            'function': {color: '#6F42C1', type: ''},
            'class-name': {color: '#DC4A68', type: ''},
            'string': {color: '#032F62', type: ''},
            'triple-quoted-string': {color: '#032F62', type: ''},
            'number': {color: '#FF8563', type: ''},
            'decorator': {color: '#6F42C1',type: ''},
            'builtin': {color:'#6F42C1', type: ''},
            'comment': {color: '#5C6370', type: 'italic'}
        }

        if (lineNumber === start.line && start.column >= offset && start.column < offset + line.length) {
            let last = end.line === lineNumber ? start.column - offset - 1 + symbol.length : line.length

            currLineJSX.push(<>{line.slice(0, start.column - offset - 1)}</>)
            let color = '#6F42C1'
            
            if (tokenType === "class-name") {
                color = '#DC4A68'
            }

            
            if (definitionReferences.length !== 0) {
                definitionReferences.sort((a,b) => {
                    if (this.calculatePathDifference(path, a.path) > this.calculatePathDifference(path, b.path)){
                        return 1
                    } else {
                        return -1
                    }
                })
                if (definitionReferences[0].kind === 'class') {
                    color =  '#DC4A68'
                }
            }

            currLineJSX.push(<ColoredSpan2
                                color = {color}>
                                {line.slice(start.column - offset - 1, last)}
                             </ColoredSpan2>)
            currLineJSX.push(<>{line.slice(last)}</>)
            callbacks.pop()
        } else if (tokenType !== undefined) {
            currLineJSX.push(<ColoredSpan 
                                type =  {identifiers[tokenType].type} 
                                color = {identifiers[tokenType].color}>
                                {line}
                            </ColoredSpan>)
        } else {
            currLineJSX.push(<>{line}</>)
        }
    } 

    
*/


renderLines(fileContents) {
    const grammar = Prism.languages["python"]
    const identifiers = {
        'keyword':{color: '#D73A49', type: ''},
        'boolean': {color: '#56B6C2', type: ''},
        'function': {color: '#6F42C1', type: ''},
        'class-name': {color: '#DC4A68', type: ''},
        'string': {color: '#032F62', type: ''},
        'triple-quoted-string': {color: '#032F62', type: ''},
        'number': {color: '#FF8563', type: ''},
        'decorator': {color: '#6F42C1',type: ''},
        'builtin': {color:'#6F42C1', type: ''},
        'comment': {color: '#5C6370', type: 'italic'}
    }
    
    const tokens = Prism.tokenize(fileContents, grammar)
    
    let allLinesJSX = []
    let currLineJSX = []
    
    let callbacks = this.props.references.filter(ref => 
        {return ref.parseProvider === 'semantic' && ref._id !== this.props.match.params.referenceId}).map(ref => {
            console.log('ref: ', ref);
            ref.position = 
            JSON.parse(ref.position); return ref}).sort((a, b) => {
                a = a.position.start;
                b = b.position.start;
                if (a.line > b.line) {
                    return -1
                } else if (a.line < b.line) {
                    return 1
                } else if (a.column > b.column) {
                    return -1
                } else {
                    return 1
                }
            })
    
    /*[...this.props.callbacks].reverse()*/
    let lineNumber = 1
    let offset = 0
    
    tokens.forEach(token => {
        let content = this.getContent(token)
        let splitContent = content.split("\n")
        if (typeof token !== "string" && token.type in identifiers) {
            for (let i = 0; i < splitContent.length - 1; i++){
                if (splitContent[i] !== '') {
                    if (callbacks.length > 0) {
                        this.renderCallbacks(splitContent[i], callbacks, offset, lineNumber, currLineJSX, token.type)   
                    } else {
                        currLineJSX.push(<ColoredSpan 
                                            type =  {identifiers[token.type].type} 
                                            color = {identifiers[token.type].color}>
                                            {splitContent[i]}
                                        </ColoredSpan>)
                    }
                }
                
                if (currLineJSX.length > 0) {
                    allLinesJSX.push(currLineJSX)
                } else {
                    allLinesJSX.push([<>{"\n"}</>])
                }

                offset = 0
                lineNumber += 1
                currLineJSX = []   

                // MAY BE DEPRECATED
                if (callbacks.length > 0 && lineNumber > callbacks.slice(-1)[0].position.end.line) {
                    callbacks.pop()
                }
            }
            //console.log("SPLIT CONTENT", splitContent.slice(-1)[0])
            
            if (splitContent.slice(-1)[0] !== '') {
                if (callbacks.length > 0) {
                    this.renderCallbacks(splitContent.slice(-1)[0], callbacks, offset, lineNumber, currLineJSX, token.type)
                } else {
                    currLineJSX.push(<ColoredSpan 
                        type =  {identifiers[token.type].type} 
                        color = {identifiers[token.type].color}>
                        {splitContent.slice(-1)[0]}
                    </ColoredSpan>)
                }
            }
            offset += splitContent.slice(-1)[0].length
            /*
            if (callbacks.length > 0 && 
                (lineNumber > callbacks.slice(-1)[0].position.end.line || 
                (lineNumber === callbacks.slice(-1)[0].position.end.line && offset + 1 > callbacks.slice(-1)[0].position.start.column))) {
                callbacks.pop()
            }*/
        } else {
            for (let i = 0; i < splitContent.length - 1; i++){
                if (splitContent[i] !== '') {
                    if (callbacks.length > 0) {
                        this.renderCallbacks(splitContent[i], callbacks, offset, lineNumber, currLineJSX)   
                    } else {
                        currLineJSX.push(<>{splitContent[i]}</>)
                    }
                }

                if (currLineJSX.length > 0) {
                    allLinesJSX.push(currLineJSX)
                } else {
                    allLinesJSX.push([<>{"\n"}</>])
                }
                
                offset = 0
                lineNumber += 1
                currLineJSX = []
                
                // MAY BE DEPRECATED
                if (callbacks.length > 0 && lineNumber > callbacks.slice(-1)[0].position.end.line) {
                    callbacks.pop()
                }
            }
            //console.log("SPLIT CONTENT", splitContent.slice(-1)[0])
            if (splitContent.slice(-1)[0] !== '') {
                if (callbacks.length > 0) {
                    this.renderCallbacks(splitContent.slice(-1)[0], callbacks, offset, lineNumber, currLineJSX)
                } else {
                    currLineJSX.push(<>{splitContent.slice(-1)[0]}</>)
                }
            }
            offset += splitContent.slice(-1)[0].length
        }
    })


    if (currLineJSX.length !== 0) {
        allLinesJSX.push(currLineJSX)
    }

    return allLinesJSX
}



calculatePathDifference(basePath, comparePath) {
    let basePathSplit = basePath.split("/")
    let comparePathSplit = comparePath.split("/")

    if (comparePathSplit.length < basePathSplit.length) {
        basePathSplit = comparePath.split("/")
        comparePathSplit = basePath.split("/")
    }

    let diff = comparePathSplit.length - basePathSplit.length

    for (let i = 0; i < basePathSplit.length; i+= 1){
        if (basePathSplit[i] !== comparePathSplit[i]){
            diff += 1
        }
    }
    return diff
}
