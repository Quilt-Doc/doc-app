import React from 'react';

//styles
import styled from "styled-components";

//redux
import { connect } from 'react-redux';

//actions
import { getRepositoryRefs  } from '../../../actions/Repository_Actions';

//slate
import { Transforms, Node } from 'slate';

//lodash 
import _ from 'lodash';

class ReferenceMenu extends React.Component {
    constructor(props) {
        super(props)

        this.menuRef = React.createRef();
        this.disableCount = 0

        this.state = {
            'filters' : new Set(),
        }
        
    }

    //sort by type, alphabetically, then by string length
    componentDidMount(){
        this.props.getRepositoryRefs({repoLink: "cewing/fizzbuzz/"})
    }

    renderKind(kind){
        let filterText = ''
        /*
        if (this.props.editorState.anchor && this.props.editorState.focus) {
            let iterab = Node.texts(this.props.editor, {from: this.props.editorState.anchor.path, to: this.props.editorState.focus.path})
            for (let t of iterab) {
                console.log(t)
            }
            //filterText = Array.from(iterab)[0][0].text
            console.log("FILTERTEXT", filterText)
        }
        */
       if (this.props.editorState.text){
           filterText = this.props.editorState.text
       }
       
        let kindReferences = this.props.references.filter((reference) => {
            return reference.kind === kind && reference.file
        })
        
        kindReferences.map(kindReference => { 
                let items = [kindReference.link.split('/')[1]]
                kindReference.file.split('/').map(item => {
                    if (item !== '') {
                        items.push(item)
                    }
                })

                if (kind === 'class' || kind === 'function' || kind == 'variable') {
                    let fileName = items.pop()
                    fileName = fileName.split('.')[0]
                    items.push(fileName)
                    items.push(kindReference.name)
                }
                let sliceLength = items.length - 4 > 0 ? items.length - 4 : 0
                kindReference.phrase = items.slice(sliceLength).join('.')
            }
        )
        
        kindReferences = kindReferences.filter(reference => {
            return reference.phrase.toLowerCase().includes(filterText.toLowerCase())
        })

        kindReferences.sort((a,  b) => a.phrase > b.phrase ? 1 : -1)
        let str = undefined
        let color = undefined
        
        if (kind === 'dir') {
            color = '#56B6C2'
            str = 'dir'
        } else if (kind === 'file') {
            color = '#C679DD'
            str = 'file'
        } else if (kind === 'class') {
            color = '#19E5BE'
            str = 'class'
        } else if (kind === 'function') {
            color = '#5534FF'
            str = 'func'
        } else if (kind === 'variable') {
            color = '#E6C07A'
            str = 'var'
        }
        return kindReferences.map(reference => {
            let [begin, end] =  this.renderName(reference.phrase, kind)
            return (<MenuButton  onClick = {() => this.insertReference(str, begin, end, color)}
                        //onMouseEnter = {() => props.dispatch({type: 'setHovered', payload: {position: i, ui: 'mouse'}})}
                        //backgroundColor = {backgroundColor} 
                        //onClick={() => { toggleBlock(editor, props, block.block) }}
                    >
                        <ReferenceClassName color = {color}>{str}</ReferenceClassName>
                        <CodeLine2>{begin}<Name>{end}</Name></CodeLine2>
                        <Source>[Source]</Source>
                    </MenuButton>)
        })
    }

    renderName(items, kind){
        items = items.split('.')
        if (kind === 'file') {
            return [items.slice(0, items.length - 2).join('.') + '.', items.slice(items.length - 2).join('.')]
        }
        return [items.slice(0, items.length - 1).join('.') + '.', items.slice(items.length - 1).join('.')]
    }

    toggleFilter(kind){
        if (this.state.filters.has(kind)){
            let temp = new Set(this.state.filters)
            temp.delete(kind)
            this.setState({filters: temp})
        } else {
            let temp = new Set(this.state.filters)
            temp.add(kind)
            this.setState({filters: temp})
        }
    }

    renderAll(){
        let allItems = []
        if (this.state.filters.size === 0) {
            allItems.push(this.renderKind('dir'))
            allItems.push(this.renderKind('file'))
            allItems.push(this.renderKind('class'))
            allItems.push(this.renderKind('function'))
            allItems.push(this.renderKind('variable'))
        } else {
            if (this.state.filters.has('dir')){
                allItems.push(this.renderKind('dir'))
            } 
            if (this.state.filters.has('file')){
                allItems.push(this.renderKind('file'))
            }
            if (this.state.filters.has('class')){
                allItems.push(this.renderKind('class'))
            }
            if (this.state.filters.has('function')){
                allItems.push(this.renderKind('function'))
            }
            if (this.state.filters.has('variable')){
                allItems.push(this.renderKind('variable'))
            }
        }
        return allItems.map(item => {return item})
    }

    insertReference(kind, path, name, color){
        let range = { anchor: this.props.editorState.anchor, focus: this.props.editorState.focus }
        console.log(range)
        let editor = this.props.editor
        let {selection} = editor

        if (range.focus.offset !== range.anchor.offset) {
            range = _.cloneDeep(range)
            range.focus.offset += 1
        }
        //console.log(range)
        console.log("ANCHOR OF INSERTION", range.anchor)
        console.log("FOCUS OF INSERTION", range.focus)
        Transforms.select(editor, range)
        Transforms.delete(editor)
        editor.insertBlock({type: 'code-reference', kind, path, name, color}, range)

        this.props.dispatch({type: 'turn_references_off'})
    }

    //tabINDEX MENU
    render(){
        let el = this.menuRef.current
        if (this.props.editorState.referenceDropdownActive) {
            el.style.opacity = 1
            el.style.top = `${this.props.editorState.rect.top + window.pageYOffset + this.props.editorState.rect.height}px`
            el.style.left = `${this.props.editorState.rect.left + window.pageXOffset}px`
        } else if (el) {
            el.style.opacity = 0
            el.style.top = `-10000px`
            el.style.left = `-10000px`
        }
        if (this.props.references){
            return(
                <Menu onKeyDown = {() => console.log("KEY DOWN")} ref={this.menuRef}>
                    <MenuHeader>
                        <MenuTitle>Select a Reference</MenuTitle>
                        <MenuFilter> 
                            <FilterButton 
                                hoverColor = {'#56B6C2'}
                                color = {this.state.filters.has('dir') ? '#56B6C2' : ''}
                                opacity = {this.state.filters.has('dir') ? '1' : '0.6'}
                                onClick = {() => {this.toggleFilter('dir')}}
                            >
                                    DIR
                            </FilterButton>
                            <FilterButton 
                                hoverColor = {'#C679DD'}
                                color = {this.state.filters.has('file') ? '#C679DD' : ''}
                                opacity = {this.state.filters.has('file') ? '1' : '0.6'}
                                onClick = {() => {this.toggleFilter('file')}}
                            >
                                FILE
                            </FilterButton>
                            <FilterButton 
                                hoverColor = {'#19E5BE'}
                                color = {this.state.filters.has('class') ? '#19E5BE' : ''}
                                opacity = {this.state.filters.has('class') ? '1' : '0.6'}
                                onClick = {() => {this.toggleFilter('class')}}
                            >
                                CLASS
                            </FilterButton>
                            <FilterButton 
                                hoverColor = {'#5534FF'}
                                onClick = {() => {this.toggleFilter('function')}}
                                opacity = {this.state.filters.has('function') ? '1' : '0.6'}
                                color = {this.state.filters.has('function') ? '#5534FF' : ''}
                            >
                                FUNC
                            </FilterButton>
                            <FilterButton 
                                hoverColor = {'#E6C07A'}
                                onClick = {() => {this.toggleFilter('variable')}}
                                opacity = {this.state.filters.has('variable') ? '1' : '0.6'}
                                color = {this.state.filters.has('variable') ? '#E6C07A' : ''}
                            >
                                VAR
                            </FilterButton>
                        </MenuFilter>
                       
                    </MenuHeader>
                    
                    <MenuButtonContainer>
                        {this.renderAll()}
                    </MenuButtonContainer>
                </Menu>
            )
        } 
        return null
    }
}


const mapStateToProps = (state) => {
    return {
        references: state.repositories.references
    }
}

export default connect(mapStateToProps, { getRepositoryRefs })(ReferenceMenu);


const MenuHeader = styled.div`
    color: #262626;
    
    font-size: 1.4rem;
    margin-top: 0.3rem;
    margin-left: 0.2rem;
    padding: 1rem;
    border-bottom: 1px solid #D7D7D7;
`
const MenuTitle = styled.div`
    opacity: 0.6;
`

const MenuFilter = styled.div`
    font-size: 1.4rem;
    margin-top: 0.8rem;
    display: flex;
`

const FilterButton = styled.div`
    border: 1px solid black;
    margin-right: 0.8rem;
    font-size: 1.2rem;
    padding: 0.1rem 1rem;
    border-radius: 3px;
    opacity: 0.6;
    &:hover {
        color: ${props => props.hoverColor};
        border-color: ${props => props.hoverColor};
        opacity: 1;
    }
    cursor: pointer;
    color: ${props => props.color};
    opacity: ${props => props.opacity};
    border-color: ${props => props.color};
`

const MenuButtonText = styled.div`
  margin-left: 1.5rem;
  font-size: 1.55rem;
  color:  black;
  opacity: 0.9;
  
`

const Name = styled.span`
    font-weight: bold;
    font-size: 1.55rem;
    color: #172A4E;
`

const MenuButton = styled.div`
    height: 4rem;
    cursor: pointer;
    display: flex;
    background-color: ${props => props.backgroundColor};
    align-items: center;
    padding: 1.2rem;
    margin: 0 0.2rem;
    border-bottom: 1px solid rgba(215, 215, 215, 0.6);
    &:hover {
        background-color: #F4F4F6;
    }
`


const Menu = styled.div`
  position: absolute;
  z-index: 1;
  opacity: 0;
  top: -10000px;
  left: -10000px;
  background-color: white;
  border-radius: 3px;
  transition: opacity 0.75s;
  display: flex;
  flex-direction: column;
  box-shadow: rgba(15, 15, 15, 0.05) 0px 0px 0px 1px, rgba(15, 15, 15, 0.1) 0px 3px 6px, rgba(15, 15, 15, 0.2) 0px 9px 24px;
  overflow-y: scroll;
  width: 57rem;
`


const IconBorder = styled.div`
  border: 2px solid black;
  border-radius: 7px;
  width: 4.5rem;
  height: 4.5rem;
  background-color: white;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 1rem;
  padding-left: 1.5rem;
  padding-right: 1.5rem;
`

const ReferenceClassName = styled.div`
	text-transform: uppercase;
	color: #19E5BE;
	font-size: 1.5rem;
    width: 6rem;
    color: ${props => props.color};
`

const MenuButtonContainer = styled.div`
    display: flex;
    flex-direction: column; 
    max-height: 28rem;
    overflow-y: scroll;
`

const Source = styled.div`
	font-size: 1.3rem;
	cursor: pointer;
	opacity: 0.5;
	transition: opacity 0.13s ease-in;
	&:hover {
		color: #172A4E;
		opacity: 1;
	}
	
`

const CodeLine2 = styled.div`
	font-family: 'Roboto Mono', monospace !important;
	font-size: 1.4rem;
	boxShadow: 0 0 60px rgba(0, 0, 0, 0.08) !important;
	white-space: pre-wrap !important;
	margin-left: 1.5rem;
    width: 40rem;
    color: #262626;
`