import React from 'react'

//styles
import styled from 'styled-components'
import {Range} from 'slate'
import {useSelected, useSlate} from 'slate-react'

const Leaf = ({ attributes, children, leaf }) => {

	let editor = useSlate();
	let {selection} = editor;
	const isSelected = useSelected(leaf);
	const isEmpty = leaf.text === '';
	const type = children.props.parent.type;

	if (isEmpty) {
		if (type === "title") {
			children = <Container>
						{children}
						<span 
							style = {{
								position: "absolute",  
								pointerEvents: "none", 
								whiteSpace: "nowrap", 
								opacity: 0.5,
							}}
							contentEditable = {false}
						>
							Untitled
						</span>
					</Container>
		} else if (type === "paragraph") {
			if (editor.children.length === 2) {
				children = <Container>
						{children}
						<ContainedSpan
							style = {{
								position: "absolute",  
								pointerEvents: "none", 
								opacity: 0.5,
								fontWeight: 400 
							}}
							contentEditable = {false}
						>
							Get started by typing here! If you'd like to use quick commands, start by inserting	
							<span style = {{ fontWeight: 500,
								padding: "0.25rem 0.9rem",
								borderRadius: "0.3rem",
								cursor: "text",
								marginLeft: "0.5rem",
								marginRight: "0.5rem",
								backgroundColor: "#E7EAFC" }}>/</span>. If you'd like to switch between block types, you can
								use the sidebar on the left.
						</ContainedSpan>
					</Container>
			} else if (isSelected && Range.isCollapsed(selection)) {
				children = <Container>
						{children}
						<span 
							style = {{position: "absolute",  pointerEvents: "none", whiteSpace: "nowrap", opacity: 0.5,
							fontWeight: 400 }}
							contentEditable = {false}>
							Type 
							<span style = {{ fontWeight: 500,
											padding: "0.25rem 0.9rem",
											borderRadius: "0.3rem",
											cursor: "text",
											marginLeft: "0.5rem",
											marginRight: "0.5rem",
											backgroundColor: "#E7EAFC" }}>/</span>
							for quick commands
						</span>
					</Container>
			}
		}
	}
	
	if (leaf.bold) {
		children = <strong>{children}</strong>
	}

	if (leaf.italic) {
		children = <em>{children}</em>
	}

	if (leaf.underlined) {
		children = <u>{children}</u>
	}

	if (leaf.strike) {
		children = <strike>{children}</strike>
	}

	if (leaf.code) {
		children = <Code>{children}</Code>
	}

	if (leaf.backColor) {
		children = <BackColoredSpan backColor = {leaf.backColor}>{children}</BackColoredSpan>
	}
	
	if (leaf.color) {
		children = <ColoredSpan color = {leaf.color}>{children}</ColoredSpan>
	}

	if (leaf.oblique) {
		children = <ObliqueSpan color = {leaf.color}>{children}</ObliqueSpan>
	}
	return <span {...attributes}>{children}</span>
}

export default Leaf;

const ContainedSpan = styled.span`
	word-wrap: break-word;
	width: 80%;
	
`

const BackColoredSpan = styled.span`
	background-color: ${props => props.backColor};
`

const ColoredSpan = styled.span`
	color : ${props => props.color};
`

const ObliqueSpan = styled.span`
	font-style: italic;
`

const Container = styled.div`
	display : flex;
`

const SubContainer = styled.div`
	display: flex;
`	

const Code = styled.span`
	font-family: 'Roboto Mono', monospace !important;
	background-color: #F3F4F7;
	padding: 0.2rem 0.5rem;
	border-radius: 0.3rem;
	font-size: 1.4rem;
`