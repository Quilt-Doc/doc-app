import React, { Component } from 'react';

import 'antd/dist/antd.css';
import 'highlight.js/styles/atom-one-dark.css'

import { Icon, List, Typography } from 'antd';

import { Field, reduxForm } from 'redux-form';

import { connect } from 'react-redux';

import { repoRefreshPath, repoGetFile } from '../actions/Repo_Actions';

import Highlight from 'react-highlight';

var urljoin = require('url-join');


class FileViewer extends Component {

	componentDidMount() {
		// To disable submit button at the beginning.
		// this.props.form.validateFields();
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

	render() {
		return (
			<div>
                <Highlight language='javascript'>
                    {this.props.file_contents}
                </Highlight>
	  		</div>
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

export default connect(mapStateToProps, {repoRefreshPath, repoGetFile})(FileViewer);