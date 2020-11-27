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
import { RiFileList2Line, RiFileTextLine } from 'react-icons/ri';


import { withRouter } from 'react-router-dom';
import { FiPlus } from 'react-icons/fi';
// find children and see lowest one -- only show that one
// put the ref on current reference, put style on children

const notChild = (item, document, gap) => {
	let path = item.document.path
	let path2 = document.path
	let bool = gap ?  path.length < path2.length : path.length <= path2.length

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

	// Dropping on document
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

	// Dropping on gap 
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
			
			let newIndex = (newParentId !== oldParentId) ? order + 1 : order;

			props.moveDocument( { 
				workspaceId, 
				documentId: item.document._id, 
				newParentId,
				oldParentId,
				newIndex } 
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

	//console.log("document", document);
	//console.log("children", props.children);
    return (
		<>
			<div ref = {gapDrop}>
				<Gap 
					marginLeft = {`${props.marginLeft}rem`} 
					backgroundColor = { isOver2 && canDrop2 ? "#6762df" : ""}
				/>
			</div>
			<div ref = {drop}>
				<CurrentReference 
					border = { isDragging ? "#EBECF0" : isOver && canDrop ? "2px solid #6762df" : ""}
					onDrag = {(e) => {  e.target.style.cursor = 'grabbing'; }}
					onDragEnd = {(e) => {  e.target.style.cursor = ''; }}
					ref = {drag} 
					onMouseEnter = {() => { setCreate(true) }} 
					onMouseLeave = {() => { setCreate(false) }} 
					onClick = {() => props.renderDocumentUrl()}
					marginLeft = {`${props.marginLeft}rem`}
					width = {`${props.marginLeft}`}
					active = {checkActive(document)}
					opacity = {isDragging ? "0.3": ""}
				>
					{props.renderLeftIcon()}
					<IconBorder3>
						<RiFileTextLine style = {{fontSize: "1.5rem", marginRight: "0.7rem"}}/>
					</IconBorder3>
					<Title >{extractTitle(document)}</Title>
					<IconContainer>
						<IconBorder display = {createDisplay} onClick = {(e) => {props.createDocument(e)}}>
							<FiPlus/>
						</IconBorder>
					</IconContainer>
				</CurrentReference>
			</div>
				
			{props.children.length !== 0 && props.open && props.renderChildren()}
			{props.last &&
					<div ref = {lastGapDrop}>
						<Gap 
							marginLeft = {`${props.marginLeft}rem`} 
							backgroundColor = { isOver3 && canDrop3 ? "#6762df" : ""}
						/>
					</div>
			}
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
	font-size: 1.25rem;
`

const Gap = styled.div`
	/*height: 0.3rem;*/
	height: 0.3rem;
	background-color: ${props => props.backgroundColor};
	transition:  background-color 0.05s ease-out;
	margin-left: ${props => props.marginLeft};
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
	background-color: #f7f9fb;
	cursor: pointer;
	font-size: 1.3rem;
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
        background-color: #e3e7ed
	}
	background-color: ${props => props.active ? "#e3e7ed" : ""};
    transition: background-color 0.05s ease-out;
	margin-left: ${props => props.marginLeft};
	padding-right: 1rem;
    height: 2.9rem;
	cursor: pointer;
	font-weight: 500;
	border: ${props => props.border};
	opacity: ${props => props.opacity};
	width: ${props => `${20.8 - props.marginLeft}rem`} ;
	border-radius: 0.3rem;
`
