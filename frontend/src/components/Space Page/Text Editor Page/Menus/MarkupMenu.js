import React, { useRef, useEffect, useCallback, useState } from 'react'

// slate
import {  ReactEditor, useSlate } from 'slate-react'
import { Transforms } from 'slate'

//styles
import styled from 'styled-components'

//lodash
import _ from 'lodash'


const MarkupMenu = (props) => {
	const ref = useRef()
	const editor = useSlate()

	const typeMapping = {
							"paragraph": {name: "Text", icon: "text-outline", description: "Paragraph style text markup"},
							"heading-one": {name: "Heading 1", icon: "filter-outline", description: "Large sized header for titles"},
							"heading-two": {name: "Heading 2", icon: "filter-outline", description: "Medium sized header"},
							"heading-three": {name: "Heading 3", icon: "filter-outline", description: "Subheader to delineate sections"},
							"list-item": {name: "Bullet list", icon: "list-outline", description: "Bulleted list to order items"},
							"code-line": {name: "Code snippet", icon: "code-slash-outline", description: "Block of inline, editable code"},
							"code-reference": {name: "Code reference", icon: "cube-outline", description: "Pointer to repository declarations"}
						}


	const toggleBlock = useCallback(
		(event, editor, props, blocktype) => { /*selection_then, setActive, range, start_path) => {*/
			event.preventDefault()

			let range = props.range
			if (props.range.focus.offset !== props.range.anchor.offset) {
				range = _.cloneDeep(props.range)
				range.focus.offset += 1
			}

			Transforms.select(editor, range)
			Transforms.delete(editor)

			if (blocktype === 'code-reference') {
				props.dispatch({type: 'markupMenuOff'})
				Transforms.insertText(editor, '*')
				ReactEditor.focus(editor)
				props.dispatch({type: 'referenceMenuOn'})
			} else {
				editor.insertBlock({type: blocktype}, range)
				ReactEditor.focus(editor)
				props.dispatch({ type: 'markupMenuOff' })
			}
		}, []
	)


	useEffect(() => {
		const el = ref.current
		if (!el) {
			return
		}
		if (!props.state.markupMenuActive || !props.state.rect) {
			el.removeAttribute('style')
			return
		}

		el.style.opacity = 1
		el.style.top = `${props.state.rect.top - props.state.scrollTop + props.state.prevScrollTop + window.pageYOffset + 15 + props.state.rect.height}px`
		el.style.left = `${props.state.rect.left + window.pageXOffset + 2.5}px`
	})

	
	

	const renderMenu = () => {
		return props.state.blocktypes.map((type, i) => {
			let icon = type === "paragraph" ? "Aa" : type === "heading-one" ? "H1" 
				: type === "heading-two" ? "H2" : type === "heading-three" ? "H3" : 
				<ion-icon  name= {typeMapping[type].icon} style= {{ 'fontSize': '2rem !important' }} ></ion-icon>
			return (
				<MenuButton  
					onMouseEnter = {() => props.dispatch({type: 'setHovered', payload: {position: i, ui: 'mouse'}})}
					backgroundColor = {i === props.state.hovered.position ? '#F4F4F6' : '#FFFFFF'} 
					onClick={(e) => { toggleBlock(e, editor, props, type) }}
				>
					<IconBorder>
						{icon}
					</IconBorder>
					<MenuButtonText>
						<MenuButtonTitle>{typeMapping[type].name}</MenuButtonTitle>
						<MenuButtonDescription>{typeMapping[type].description}</MenuButtonDescription>
					</MenuButtonText>
				</MenuButton>
			)
		})
	}
	
		
	return (<Menu ref={ref}>
		  <HeaderContainer>Add Markup</HeaderContainer>
		  	<ListItemContainer>
			  {renderMenu()}
			</ListItemContainer>
			{checkScroll(ref, props.state.hovered)}
		</Menu>
	)
}


const checkScroll = (ref, hovered) => {
	if (ref.current && hovered.ui === 'key') {
		if (hovered.position * 100 > ref.current.clientHeight) {
			let scr = hovered.position * 100 - ref.current.clientHeight
			ref.current.scrollTop = scr
		} else {
			ref.current.scrollTop = 0
		}
	}
}

const getScrollParent = (node) => {
	if (node == null) {
	  return null;
	}
  
	if (node.scrollHeight > node.clientHeight) {
	  return node;
	} else {
	  return getScrollParent(node.parentNode);
	}
}

export default MarkupMenu

const ListItemContainer = styled.div`
	display: flex;
	flex-direction: column;
	padding: 0rem 1rem;
	max-height: 31.5rem;
	overflow-y: scroll;
	padding-bottom: 1rem;
`

const Menu = styled.div`
	width: 32rem;
    position: absolute;
    z-index: 1;
    top: -10000px;
    left: -10000px;
    margin-top: -6px;
    opacity: 0;
    background-color: white;
	border-radius: 0.3rem;
    transition: opacity 0.75s;
    display: flex;
    flex-direction: column;
	box-shadow: 0 2px 6px 2px rgba(60,64,67,.15);
	color:  #172A4e;
`



const HeaderContainer = styled.div`
    height: 3.5rem;
    display: flex;
    align-items: center;
    font-size: 1.3rem;
    padding: 1rem;
    color: #172A4E;
`

const MenuHeader = styled.div`
	font-size: 1.5rem;
	
    opacity: 0.6;
    margin-top: 0.3rem;
    margin-bottom: 1rem;
    margin-left: 0.4rem;
`

const MenuButtonText = styled.div`
    margin-left: 2.5rem;
	
`

const MenuButtonTitle = styled.div`
	font-size: 1.5rem;
	margin-bottom: 0.5rem;
	font-weight: 500;
`

const MenuButtonDescription = styled.div`
	font-size: 1.3rem;
	opacity: 0.6;
`

const IconBorder = styled.div`
    border-radius: 0.4rem;
    width: 4.5rem;
    height: 4.5rem;
    background-color: white;
    display: flex;
    justify-content: center;
    align-items: center;
	border: 1px solid #EDEFF1;
	font-size: 2rem;
    /*box-shadow: 0 3px 6px 0 rgba(0,0,0,.1), 0 1px 3px 0 rgba(0,0,0,.08);*/
`

const MenuButton = styled.div`
    height: 6rem;
    cursor: pointer;
    display: flex;
    background-color: ${props => props.backgroundColor};
    align-items: center;
    padding: 1rem;
	border-radius: 0.5rem;
	transition: background-color 0.15s ease-out;
`