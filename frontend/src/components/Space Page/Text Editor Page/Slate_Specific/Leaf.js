import React from 'react'

//styles
import styled from 'styled-components'
import {useSelected} from 'slate-react'
const Leaf = ({ attributes, children, leaf }) => {

	if (useSelected(leaf) && leaf.text === '' && children.props.parent.type === "paragraph"){
		children = <Container>
						{children}
						<div className = 'paragraphPlaceholder' data-ph = {"Enter '/' to insert markup"}/>
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
	
	if (leaf.color) {
		children = <ColoredSpan color = {leaf.color}>{children}</ColoredSpan>
	}

	if (leaf.oblique) {
		children = <ObliqueSpan color = {leaf.color}>{children}</ObliqueSpan>
	}
	return <span {...attributes}>{children}</span>
}

export default Leaf;

const ColoredSpan = styled.span`
	color : ${props => props.color};
`

const ObliqueSpan = styled.span`
	font-style: italic;
`

const Container = styled.div`
	display : flex;
`