import React, { Component } from 'react';

import 'antd/dist/antd.css';
import 'highlight.js/styles/atom-one-dark.css'

import { Button } from 'antd';

import { connect } from 'react-redux';

import { repoRefreshPath, repoGetFile } from '../actions/Repo_Actions';

import styled from "styled-components"

import Selection from '@simonwep/selection-js';


class FileViewer extends Component {

	componentDidMount() {
		// To disable submit button at the beginning.
		// this.props.form.validateFields();
		Selection.create({

			// Class for the selection-area
			class: 'selection',
		
			// All elements in this container can be selected
			selectables: ['.file-content-table > tr > td.file-line'],
		
			// The container is also the boundary in this case
			boundaries: ['table.file-content-table']
		}).on('start', ({inst, selected, oe}) => {
			console.log("Selection start");
		
			// Remove class if the user isn't pressing the control key or ⌘ key
			if (!oe.ctrlKey && !oe.metaKey) {
		
				// Unselect all elements
				for (const el of selected) {
					el.classList.remove('selected');
					inst.removeFromSelection(el);
				}
		
				// Clear previous selection
				inst.clearSelection();
			}
		
		}).on('move', ({changed: {removed, added}}) => {
			console.log("Selection move");
			// Add a custom class to the elements that where selected.
			for (const el of added) {
				el.classList.add('selected');
			}
		
			// Remove the class from elements that where removed
			// since the last selection
			for (const el of removed) {
				el.classList.remove('selected');
			}
		
		}).on('stop', ({inst}) => {
			console.log("Selection stop");
			// Remember selection in case the user wants to add smth in the next one
			inst.keepSelection();
		});
	}

	renderError({ error, touched }) {
		if (touched && error) {
			return (
				<div className = "ui error message">
					<div className = "header">{error}</div>
				</div>
			)
		}
	}
	
	getSnippetSelection() {
		var selection = window.getSelection();
		console.log(selection.toStr)
	}

	render() {
		console.log("HERE FILE")
		console.log(this.props.file_contents)
		const lines = this.props.file_contents.split("\n");
		const file_lines = lines.map((line, idx) =>{
			console.log(line)
			return (<tr>
				<FileLineNumber>{idx}</FileLineNumber> <FileLineContent className="file-line">{line}</FileLineContent>
			</tr>)
			}
		  );


		return (
			<SnippetComponents>
				<table className="file-content-table">
					{file_lines}
				</table>
				<Button type="primary">Create Snippet...</Button>

			</SnippetComponents>
    	);
  	}
}

// {this.renderContents()}

const mapStateToProps = (state) => {
    console.log('STATE.REPOS.PATH_CONTENTS: ', state.repos.path_contents)
    if (typeof state.repos.file_contents == 'undefined' || state.repos.file_contents == null){
        return {
            file_contents: ''
        }
    }

    return {
        file_contents: state.repos.file_contents,
        file_name: state.repos.file_name
    }
}

const SnippetComponents = styled.div`
	display: flex;
`

const FileLineNumber = styled.td`
	-webkit-user-select:none;
	-khtml-user-select:none;
	-moz-user-select:none;
	-ms-user-select:none;
	-o-user-select:none;
	user-select:none;
`
const FileLineContent = styled.td`
	white-space: pre-wrap;
	-webkit-user-select: auto;  /* Chrome 49+ */
	-moz-user-select: auto;     /* Firefox 43+ */
	-ms-user-select: auto;      /* No support yet */
	user-select: auto;          /* Likely future */
`



export default connect(mapStateToProps, {repoRefreshPath, repoGetFile})(FileViewer);