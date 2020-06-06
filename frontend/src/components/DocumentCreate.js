import React, { Component } from 'react';

import 'antd/dist/antd.css';
import 'highlight.js/styles/atom-one-dark.css'

import { connect } from 'react-redux';


class DocumentCreate extends Component {

	render() {

		return (
                <h1>TEST</h1>
    	);
  	}
}

const mapStateToProps = (state) => {
	// ', state.repos.path_contents)
	console.log('DOCUMENT CREATE LISTENER');
	if (!(typeof state.repos.file_contents == 'undefined' || state.repos.file_contents == null) &&
		(typeof state.repos.parsed_data == 'undefined' || state.repos.parsed_data == null)) {
		console.log('file_contents exists');
	}

    return {}
}

export default connect(mapStateToProps)(DocumentCreate);