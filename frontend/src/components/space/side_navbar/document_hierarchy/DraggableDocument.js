import React, { useState } from 'react'

//react dnd
import { useDrag, useDrop} from 'react-dnd'
import {ItemTypes} from './types/Drag_Types';

//components
//import DocumentOptions from '../DocumentOptions';

//history
import history from '../../../../history';

//styles
import styled from 'styled-components';

//icons
import { RiFileList2Line } from 'react-icons/ri';


import { withRouter } from 'react-router-dom';
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

const checkActive = (document) => {
	let path = history.location.pathname.split("/")
	if (path.length > 4) {
		if (path[4] === document._id) {
			return true;
		} 
	}
	return false;
}

const extractTitle = (document) => {
	let { title } = document
	if (!title) {
		title = "Untitled"
	}
	return title 
}

const DraggableDocument = (props) => {
	let [createDisplay, setCreate] = useState(false)

	let document = props.document;
	const parent = props.parent;
	const order = props.order;
	let {workspaceId} = props.match.params;


    const [{ isOver, canDrop}, drop] = useDrop({
		accept: ItemTypes.DOCUMENT,
		canDrop: (item) => notChild(item, document, false),
		drop: (item) => {
			props.moveDocument({ 
				workspaceId, 
				documentId: item.document._id, 
				oldParentId: item.parent._id,
				newParentId: document._id, 
				newIndex: 0 
			})
		},
		collect: (monitor) => ({
			  isOver: !!monitor.isOver(),
			  canDrop: !!monitor.canDrop()
		})
	});

	const [{ isOver2, canDrop2}, gapDrop] = useDrop({
		accept: ItemTypes.DOCUMENT,
		canDrop: (item) => notChild(item, document, true),
		drop: (item) => {
			let newParentId = parent._id;
			let oldParentId = item.parent._id;

			let { workspaceId } = props.match.params;

			let newOrder = order;
			let oldOrder = item.order;

			if (newParentId === oldParentId && newOrder > oldOrder) {
				newOrder -= 1;
			}
			
			props.moveDocument({ 
				workspaceId, 
				documentId: item.document._id, 
				oldParentId,
				newParentId, 
				newIndex: newOrder,
			});
		},
		collect: (monitor) => ({
			  isOver2: !!monitor.isOver(),
			  canDrop2: !!monitor.canDrop()
		})
	});

	const [{ isOver3, canDrop3}, lastGapDrop] = useDrop({
		accept: ItemTypes.DOCUMENT,
		canDrop: (item) => notChild(item, document, true),
		drop: (item) => {

			let newParentId = parent._id;
			let oldParentId = item.parent._id;

			let { workspaceId } = props.match.params;

			props.moveDocument( { 
				workspaceId, 
				documentId: item.document._id, 
				newParentId,
				oldParentId,
				newIndex: order } 
			);
		},
		collect: (monitor) => ({
			  isOver3: !!monitor.isOver(),
			  canDrop3: !!monitor.canDrop()
		})
	});

	const [{isDragging}, drag] = useDrag({
		item: { type: ItemTypes.DOCUMENT, document, parent, order},
		collect: monitor => ({
			isDragging: !!monitor.isDragging()
		}),
	});

    return (
		<>
			<div ref = {gapDrop}>
				<Gap backgroundColor = { isOver2 && canDrop2 ? "#5B75E6" : ""}>
					{document.title}
				</Gap>
			</div>
			<div ref = {drop}>
				<CurrentReference 
					border = { isDragging ? "#EBECF0" : isOver && canDrop ? "2px solid #5B75E6" : ""}
					onDrag = {(e) => {  e.target.style.cursor = 'grabbing'; }}
					onDragEnd = {(e) => {  e.target.style.cursor = ''; }}
					ref = {drag} 
					onMouseEnter = {() => { setCreate(true) }} 
					onMouseLeave = {() => { setCreate(false) }} 
					onClick = {() => props.renderDocumentUrl()}
					marginLeft = {`${props.marginLeft}rem`}
					active = {checkActive(document)}
					opacity = {isDragging ? "0.3": ""}
				>
					{props.renderLeftIcon()}
					<IconBorder3>
						<RiFileList2Line style = {{fontSize: "1.5rem", marginRight: "1rem"}}/>
					</IconBorder3>
					<Title >{extractTitle(document)}</Title>
					<IconContainer>
						<IconBorder display = {createDisplay} onClick = {(e) => {props.createDocument(e)}}>
							<ion-icon style = {{fontSize: "1.5rem"}} name="add-outline"></ion-icon>
						</IconBorder>
					</IconContainer>
				</CurrentReference>
			</div>
				{props.last &&
					<div ref = {lastGapDrop}>
						<Gap backgroundColor = { isOver3 && canDrop3 ? "#5B75E6" : ""}>
							{`LAST ${document.title}`}
						</Gap>
					</div>
				}
			{props.children.length !== 0 && props.open && props.renderChildren()}
		</>
	)
}

export default withRouter(DraggableDocument);

const Title = styled.div`
    opacity: 1;
    text-overflow: ellipsis;
    white-space: nowrap;
    overflow: hidden;
	font-weight: 500;
	width: ${props => props.width}rem;
`

const Gap = styled.div`
	/*height: 0.3rem;*/
	padding: 1rem;
	background-color: ${props => props.backgroundColor};
	transition:  background-color 0.05s ease-out;
`

const IconContainer = styled.div`
	margin-left: auto;
	display: flex;
	align-items: center;
	padding-left: 0.5rem;
`

const IconBorder = styled.div`

    width: 1.9rem;
    height: 1.9rem;

   
    border-radius: 0.2rem;

	display: ${props => props.display ? "flex": "none"};
    opacity: 0.8;
	align-items: center;
    justify-content: center;
	background-color: #2B2F3A;
	cursor: pointer;
	
    &: hover {
        opacity: 1;
        
    }
`

const IconBorder3 = styled.div`
	display: flex;
	align-item: center;
	justify-content: center;
`

const CurrentReference = styled.div`
    display: flex;
    align-items: center;
	font-size: 1.35rem;
	border: none;

    &:hover {
        background-color: #414858;
	}
	background-color: ${props => props.active ? "#414858" : ""};

    transition: background-color 0.05s ease-out;
    padding-left: ${props => props.marginLeft};
    padding-right: 2rem;
    height: 2.9rem;
	cursor: pointer;
	font-weight: 500;
	border: ${props => props.border};
	opacity: ${props => props.opacity};
	width: 100%;
`
