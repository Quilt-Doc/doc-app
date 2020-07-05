// MODAL STORAGE
const ModalBackground = styled.div`
   
position: fixed; /* Stay in place */
z-index: 10000; /* Sit on top */
left: 0;
top: 0;
width: 100%; /* Full width */
height: 100%; /* Full height */
overflow: hidden; /* Enable scroll if needed */
background-color: rgb(0,0,0); /* Fallback color */
background-color: rgba(0, 0, 0, 0.4); /* Black w/ opacity */
display: ${props => props.display};
`

/* Modal Content/Box */
const ModalContent = styled.div`
background-color: #fefefe;
margin: 7% auto; /* 15% from the top and centered */
padding: 5rem;
padding-bottom: 2rem;
border: 1px solid #888;
width: 73vw; /* Could be more or less, depending on screen size */
height: 50rem;
border-radius: 5px;
box-shadow: rgba(15, 15, 15, 0.05) 0px 0px 0px 1px, rgba(15, 15, 15, 0.1) 0px 5px 10px, rgba(15, 15, 15, 0.2) 0px 15px 40px;
display: flex;
flex-direction: column;
max-width: 96rem;
`

//COLOR LINES FUNCTION CODEVIEW STORAGE
    const colorLines = () => {
        const grammar = Prism.languages["python"]
        const identifiers = {
            'keyword':'#C679DD',
            'boolean': '#56B6C2',
            'function': '#61AEEE',
            'class-name': '#E6C07A',
            'string': '#98C379',
            'triple-quoted-string': '#98C379',
            'number': '#D19966',
            'decorator': '#61AEEE',
            'builtin': '#61AEEE'
        }
        const tokens = Prism.tokenize(this.props.fileContents, grammar)
        let allLinesJSX = []
        let currLineJSX = []
        let callbacks = [...this.props.callbacks].reverse()
        let lineNumber = 1
        let offset = 0
        
        tokens.forEach(token => {
            let content = this.getContent(token)
            let splitContent = content.split("\n")
            if (typeof token !== "string" && token.type in identifiers) {
                for (let i = 0; i < splitContent.length - 1; i ++){
                    if (splitContent[i] !== '') {
                        currLineJSX.push(<ColoredSpan color = {identifiers[token.type]}>{splitContent[i]}</ColoredSpan>)
                    }
                    if (currLineJSX.length > 0) {
                        allLinesJSX.push(currLineJSX)
                    } else {
                        allLinesJSX.push([<>{"  "}</>])
                    }
                    
                    offset = 0
                    lineNumber += 1
                    currLineJSX = []
                    
                }
                if (splitContent.slice(-1)[0] !== '') {
                    currLineJSX.push(<ColoredSpan color = {identifiers[token.type]}>{splitContent.slice(-1)[0]}</ColoredSpan>)
                }
                offset += splitContent[splitContent.length - 1].length
                if (callbacks.length > 0 && 
                    (lineNumber > callbacks.slice(-1)[0].span.end.line || 
                    (lineNumber === callbacks.slice(-1)[0].span.end.line && offset + 1 > callbacks.slice(-1)[0].span.start.column))) {
                    callbacks.pop()
                }
            }  else if (token.type === "comment") {
                for (let i = 0; i < splitContent.length - 1; i ++){
                    if (splitContent[i] !== '') {
                        currLineJSX.push(<ObliqueSpan color = {"#5C6370"}>{splitContent[i]}</ObliqueSpan>)
                    }
                    if (currLineJSX.length > 0) {
                        allLinesJSX.push(currLineJSX)
                    } else {
                        allLinesJSX.push([<>{"  "}</>])
                    }
                    offset = 0
                    lineNumber += 1
                    currLineJSX = []
                }
                if (splitContent.slice(-1)[0] !== '') {
                    currLineJSX.push(<ObliqueSpan color = {"#5C6370"}>{splitContent.slice(-1)[0]}</ObliqueSpan>)
                }
                offset += splitContent.slice(-1)[0].length
                if (callbacks.length > 0 && 
                    (lineNumber > callbacks.slice(-1)[0].span.end.line || 
                    (lineNumber === callbacks.slice(-1)[0].span.end.line && offset + 1 > callbacks.slice(-1)[0].span.start.column))) {
                    callbacks.pop()
                }
            } else {
                for (let i = 0; i < splitContent.length - 1; i ++){
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
                        allLinesJSX.push([<>{"  "}</>])
                    }
                    
                    offset = 0
                    lineNumber += 1
                    currLineJSX = []
                    if (callbacks.length > 0 && lineNumber > callbacks.slice(-1)[0].span.end.line) {
                        callbacks.pop()
                    }
                }
                if (splitContent.slice(-1)[0] !== '') {
                    if (callbacks.length > 0) {
                        this.renderCallbacks(splitContent.slice(-1)[0], callbacks, offset, lineNumber, currLineJSX)
                    } else {
                        currLineJSX.push(<>{content}</>)
                    }
                }
                offset += splitContent.slice(-1)[0].length
            }
        })
        if (currLineJSX.length !== 0) {
            allLinesJSX.push(currLineJSX)
        }
        //console.log("CURRLINE", currLineJSX)
        return allLinesJSX
    }




    renderCallbacks(line, callbacks, offset, lineNumber, currLineJSX){
        let info = callbacks.slice(-1)[0].span.start
        let infoEnd = callbacks.slice(-1)[0].span.end
        let symbol = callbacks.slice(-1)[0].symbol

        if (line.includes("contiguous")){
            console.log("LINE", line)
            console.log("SYMBOL", symbol)
            console.log("OFFSET", offset)
            console.log("OFFSET END", offset + line.length)
            console.log("BEGIN OF SYMBOL", info.column)
            console.log("END OF SYMBOL", infoEnd.column)
            console.log("LINENUMBER", lineNumber)
        }

        if (lineNumber === info.line && info.column >= offset && info.column < offset + line.length){
            let end = infoEnd.line === lineNumber ? info.column - offset - 1 + symbol.length : line.length
            //console.log("SLICE", line.slice(0, info.column))

            currLineJSX.push(<>{line.slice(0, info.column - offset - 1)}</>)
            currLineJSX.push(<ColoredSpan color = {'#61AEEE'}>{line.slice(info.column - offset - 1, end)}</ColoredSpan>)
            currLineJSX.push(<>{line.slice(end)}</>)
            if (infoEnd.line === lineNumber) {
                callbacks.pop()
            }
        } else if (lineNumber > info.line && lineNumber === infoEnd.line) {
            currLineJSX.push(<ColoredSpan color = {'#61AEEE'}>{line.slice(0, infoEnd.column)}</ColoredSpan>)
            currLineJSX.push(<>{line.slice(infoEnd.column)}</>)
            callbacks.pop()
        } else if (lineNumber > info.line) {

        } else {
            currLineJSX.push(<>{line}</>)
        }
    } 