import React, { Component } from 'react';

import 'antd/dist/antd.css';
import 'highlight.js/styles/atom-one-dark.css'

import { connect } from 'react-redux';
import { Button} from 'antd';

import ReferenceSearch from './ReferenceSearch';
import InlineReference from './InlineReference';
import DocumentContentEditor from './DocumentContentEditor';

class DocumentCreate extends Component {

	constructor() {
		super()
	  };

	render() {

		return (
			<div>
                <ReferenceSearch/>
				<DocumentContentEditor/>
				<InlineReference name='Test' kind='class' file='test.py' lineNum='58'/>
			</div>
				
    	);
  	}
}

export default DocumentCreate

/*<ContentEditable
						html={item}
						data-column="item"
						className="content-editable"
						onChange={this.handleContentEditable}
					/> */