import React from 'react'

//styles
import styled from 'styled-components'
import {Range} from 'slate'
import {useSelected, useSlate} from 'slate-react'

const Leaf = ({ attributes, children, leaf }) => {

	let editor = useSlate()
	let {selection} = editor

	
	if (useSelected(leaf) && leaf.text === '' && children.props.parent.type === "paragraph" && Range.isCollapsed(selection)){
		children = <Container>
						{children}
						<span 
							style = {{position: "absolute",  pointerEvents: "none", whiteSpace: "nowrap", opacity: 0.6,
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
							for quick markup
						</span>
					

					</Container>
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