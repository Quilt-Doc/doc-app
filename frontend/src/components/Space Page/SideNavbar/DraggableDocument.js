import React, { useRef, useState, useCallback } from 'react'

//react dnd
import { useDrag, useDrop} from 'react-dnd'
import {ItemTypes} from './Drag_Types';

//document
import Document from './Document';

//styles
import styled from 'styled-components'

// find children and see lowest one -- only show that one
// put the ref on current reference, put style on children

const notChild = (item, document, gap) => {
	let path = item.document.path
	let path2 = document.path
	let bool = gap ?  path.length < path2.length : path.length <= path2.length
	/*
	if (gap) {
		console.log("\n\n\n\n", "BIG MOVES")
		console.log(path)
		console.log(path2)
		console.log(bool)
	}*/
	if (bool && path2.slice(0, path.length) === path) {
		return false
	}
	return true
}

const DraggableDocument = (props) => {

	let [opacity, setOpacity] = useState(1)
	let [createOpacity, setCreateOpacity] = useState('0')

	let document = props.document;
    const [{ isOver, canDrop}, drop] = useDrop({
		accept: ItemTypes.DOCUMENT,
		canDrop: (item) => notChild(item, document, false),
		drop: (item) => {props.moveDocument({ documentId: item.document._id, parentId: document._id, order: 0} )},//props.moveDocument({ documentId: item.document._id, parentId: document._id} ),
		collect: (monitor) => ({
			  isOver: !!monitor.isOver(),
			  canDrop: !!monitor.canDrop()
		})
	})

	const [{ isOver2, canDrop2}, gapDrop] = useDrop({
		accept: ItemTypes.DOCUMENT,
		canDrop: (item) => notChild(item, document, true),
		drop: (item) => {
			let parentId = document.parentId !== null ? document.parentId : ""
			props.moveDocument({ documentId: item.document._id, parentId, order: document.order} );
		},//props.moveDocument({ documentId: item.document._id, parentId: document._id} ),
		collect: (monitor) => ({
			  isOver2: !!monitor.isOver(),
			  canDrop2: !!monitor.canDrop()
		})
	})

	const [{isDragging}, drag] = useDrag({
		item: { type: ItemTypes.DOCUMENT, document: document},
		collect: monitor => ({
			isDragging: !!monitor.isDragging()
		}),
	})
	console.log(document.path)
    return (
		
		<DocContainer >	
			<div ref = {gapDrop}>
				<Gap backgroundColor = { isOver2 && canDrop2 ? "#DEEBFF" : ""}/>
			</div>
		
			<div ref = {drop}>
				<CurrentReference 
					backgroundColor = { isDragging ? "#EBECF0" : isOver && canDrop ? "#DEEBFF" : ""}
					onDrag = {(e) => {  e.target.style.cursor = 'grabbing'; }}
					onDragEnd = {(e) => {  e.target.style.cursor = ''; }}
					ref = {drag} 
					onMouseEnter = {() => { setCreateOpacity('1') } } 
					onMouseLeave = {() => { setCreateOpacity('0') }} 
					onClick = {() => props.renderDocumentUrl()}
					width = {`${props.width}rem`} 
					marginLeft = {`${props.marginLeft}rem`}
				>
					{props.renderLeftIcon()}
					{document.path === "FinanceNewsApp" || document.path === "CIS 522 Project" || document.path === "Optical Learning" ? <ion-icon name="git-network-outline" style={{'fontSize': '1.7rem', marginRight: "0.8rem"}}></ion-icon> :
						<ion-icon name="document-text-outline" style={{'fontSize': '1.7rem', marginRight: "0.8rem"}}></ion-icon>
					}
					
					{props.renderTitle()}
					<IconBorder opacity = {createOpacity} onClick = {(e) => {props.createDocument(e)}}>
						<ion-icon style={{'fontSize': '1.5rem'}} name="add-outline"></ion-icon>
					</IconBorder>
				</CurrentReference>
			</div>
			{props.children.length !== 0 && props.open && props.renderChildren()}
		</DocContainer>
	)
}

export default DraggableDocument

const Gap = styled.div`
	height: 0.3rem;
	border-radius: 0.1rem;
	background-color: ${props => props.backgroundColor};
	transition:  background-color 0.05s ease-out;
`

const DocContainer = styled.div`
	background-color: ${props => props.backgroundColor}
`

const IconBorder = styled.div`
    margin-left: auto;
    margin-right: -0.3rem;
    display: flex;
    align-items: center;
    justify-content: center;

    width: 1.9rem;
    height: 1.9rem;

   
    border-radius: 0.3rem;

    color: #213A81;
    background-color: white;
    
    opacity: ${props => props.opacity};
    /*transition: all 0.05s ease-out;*/
    /*background-color: white;*/
    cursor: pointer;
    &: hover {
        opacity: 1;
        background-color: #F4F4F6; 
    }
`

const CurrentReference = styled.div`
    display: flex;
    align-items: center;
	font-size: 1.35rem;
	border: none;
    background-color: ${props => props.backgroundColor};
    &:hover {
        background-color: #EBECF0;
    }
    transition: background-color 0.05s ease-out;
    width: ${props => props.width};
    margin-left: ${props => props.marginLeft};
    padding: 1.2rem;
    border-radius: 0.3rem;
    height: 2.9rem;
    color: #172A4E;
	cursor: pointer;
`
