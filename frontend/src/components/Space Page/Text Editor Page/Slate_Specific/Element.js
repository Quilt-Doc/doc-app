import React, { useRef } from 'react'

// slate
import { ReactEditor, useSlate } from 'slate-react'
import { Editor } from 'slate'

//styles
import styled from 'styled-components'

//icons
import menu_editor from '../../../../images/menu_editor.svg'


class Element extends React.Component {

	constructor(props){
		super(props)
		this.state = {
			opacity: '0'
		}
	}

	
	renderElement(element, attributes, children) {
		switch (element.type) {
			case 'heading-one':
				return (<Wrapper
							
							onMouseEnter = {() => this.setState({opacity: 1})}
							onMouseLeave = {() => this.setState({opacity: 0})}
						>
							<LeftNav contentEditable = {false} opacity = {this.state.opacity}>
								<BlockTool element = {element}/>
							</LeftNav>
							<H1  {...attributes}>{children}</H1>
						</Wrapper>)
			case 'heading-two':
				return (
						<Wrapper
							onMouseEnter = {() => this.setState({opacity: 1})}
							onMouseLeave = {() => this.setState({opacity: 0})}
						>
							<LeftNav contentEditable = {false} opacity = {this.state.opacity}>
								<BlockTool element = {element}/>
							</LeftNav>
							<H2 {...attributes}>{children}</H2>
						</Wrapper>
				)
			case 'heading-three':
				return (
						<Wrapper
							onMouseEnter = {() => this.setState({opacity: 1})}
							onMouseLeave = {() => this.setState({opacity: 0})}
						>
							<LeftNav contentEditable = {false} opacity = {this.state.opacity}>
								<BlockTool element = {element}/>
							</LeftNav>
							<H3 onClick = {() => {console.log('CHILDREN', children); console.log('ATTRIBUTES', attributes); console.log("ELEMENT", element)}} {...attributes}>{children}</H3>
						</Wrapper>
						) 
			case 'bulleted-list':
				return (
						<Wrapper
							onMouseEnter = {() => this.setState({opacity: 1})}
							onMouseLeave = {() => this.setState({opacity: 0})}
						>
							<LeftNav contentEditable = {false} opacity = {this.state.opacity}>
								<BlockTool element = {element}/>
							</LeftNav>
							<UL {...attributes}>{children}</UL>
						</Wrapper>
						)	
			case 'list-item':
				return <li {...attributes}>{children}</li>
			case 'code-block':
				return (
							<Wrapper
								onMouseEnter = {() => this.setState({opacity: 1})}
								onMouseLeave = {() => this.setState({opacity: 0})}
							
							>
								<LeftNav contentEditable = {false} opacity = {this.state.opacity}>
									<BlockTool element = {element}/>
								</LeftNav>
								<CodeBlock {...attributes}>{children}</CodeBlock>
							</Wrapper>
						)
				
			case 'code-line':
				return (
							
							<CodeLine {...attributes}>{children}</CodeLine>
						)
			case 'code-reference':
				return (
							<CodeReference  
								color = {element.color} 
								path = {element.path}
								name = {element.name}
								kind = {element.kind}
								{...attributes}>{children}
							</CodeReference>
								
						)
			default:
				return (
						<Wrapper
								onMouseEnter = {() => this.setState({opacity: 1})}
								onMouseLeave = {() => this.setState({opacity: 0})}
							>
								<LeftNav contentEditable = {false} opacity = {this.state.opacity}>
									<BlockTool element = {element}/>
								</LeftNav>
								<P   {...attributes}>{children}</P>
						</Wrapper>
					)
		}
	}

	checkEditor() {
		let editor = useSlate()
		let {selection} = editor
		console.log(selection)
	}


	render(){
		let attributes = this.props.attributes
		let children = this.props.children
		let element = this.props.element
		return (
			<>{this.renderElement(element, attributes, children)}</>
		)
	}
}

export default Element 
//Utility Components

const BlockTool = (props) => {
	let editor = useSlate()
	const toolRef = useRef()
	
	
	
	let checkRect = () => {
		let path = Editor.end(editor, ReactEditor.findPath(editor, props.element))
		let node = { type: 'paragraph', children: [] }
		let toolRect = toolRef.current.getBoundingClientRect()
		toolRect.y += 50
		toolRect.x += 20
		editor.rat(node, path, toolRect)
		//console.log(toolRef.current.getBoundingClientRect())
	}
//console.log("EDITOR", ReactEditor.findPath(editor, props.element)
	return (
			<StyledIcon ref = {toolRef} onClick = {() => {checkRect()}}  cursor = {'pointer'} width={'1.9'} src={menu_editor} />
	)
}

//Utility
const ToolbarContainer = styled.div`
	display: flex;
	align-items: center;
	margin-top: 0.3rem;
`

const CreateBlockButton = styled.div`
	width: 1.8rem;
	height: 1.8rem;
	margin-right: 0.3rem;
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 0.2rem;
	border-radius: 0.3rem;
	color: #19E5BE;
	border: 1px solid #19E5BE;;
`

const Wrapper = styled.div`
	position: relative;
`

const LeftNav = styled.span`
	position: absolute;
	left: -4rem;
	top: -0.2rem;
	padding-right: 1.1rem;
	padding-left: 1rem;
	opacity: ${props => props.opacity}; 
	transition: all .13s ease-in-out;
`

const StyledIcon = styled.img`
	width: ${props => props.width}rem;
	cursor: ${props => props.cursor};
`

//Markup Components

const H1 = styled.div`
  font-size: 3.5rem;
  font-weight: 300;
  letter-spacing: 1.78px;
  line-height: 1;
  margin-top: 3rem;
  color: #262626;
`

const H2 = styled.div`
  font-size: 2.8rem;
  letter-spacing: 1.33px;
  line-height: 1;
  text-transform: none;
  font-weight: 300;
  color: #262626;
  margin-top: 2.5rem;
`

const H3 = styled.div`
  font-size: 2.5rem;
  letter-spacing: -0.25px;
  line-height: 1;
  text-transform: none;
  margin-top: 2rem;
  color: #262626;
  font-weight: 300;
`

const P = styled.div`
  margin-top: 1rem !important;
  font-size: 1.6rem;
  line-height: 1.6;
  color: #262626;
  letter-spacing: 0.1px;
  font-weight: 350;
`

const UL = styled.ul`
	margin-left: 2rem;
`

const CodeBlock = styled.div`
    margin-top: 2.5rem;
    background-color: #F7F9FB;
	padding: 2.5rem;
	tab-size: 4;
`

const CodeLine = styled.div`
	font-family: 'Roboto Mono', monospace !important;
    font-size: 1.35rem;
    padding: 0.1rem !important;
    boxShadow: 0 0 60px rgba(0, 0, 0, 0.08) !important;
    white-space: pre-wrap !important;
`


/*
  for further --
      case 'block-quote':
      return <blockquote {...attributes}>{children}</blockquote>
*/

// Reference Component
const CodeReference = (props) => {
	return (
		<CodeReferenceBox contentEditable = {false} color = {props.color} >
			<ReferenceClassName color = {props.color} >{props.kind}</ReferenceClassName>
			<CodeLine2>{props.path}<Name>{props.name}</Name></CodeLine2>
			<Source>[SOURCE]</Source>
		</CodeReferenceBox>
	)
}

const Name = styled.span`
    font-weight: bold;
    font-size: 1.4rem;
    color: #172A4E;
`

const Source = styled.div`
	font-size: 1rem;
	cursor: pointer;
	opacity: 0.5;
	transition: opacity 0.13s ease-in;
	&:hover {
		color: #19E5BE;
		opacity: 1;
	}
	align-self: flex-end;
`

const CodeLine2 = styled.div`
	font-family: 'Roboto Mono', monospace !important;
	font-size: 1.4rem;
	boxShadow: 0 0 60px rgba(0, 0, 0, 0.08) !important;
	white-space: pre-wrap !important;
	margin-left: 1.2rem;
	width: 170rem;
`

const ReferenceClassName = styled.div`
	text-transform: uppercase;
	color: ${props => props.color};
	font-size: 1.5rem;
	width: 15rem;
`

const CodeReferenceBox = styled.div`
	margin-top: 2.5rem;
	background-color: #F7F9FB;
	padding: 2rem;
	border-top: 2.25px solid ${props => props.color};
	display: flex;
`