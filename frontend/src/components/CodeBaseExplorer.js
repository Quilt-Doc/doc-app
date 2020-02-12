import React, { Component } from 'react';

import 'antd/dist/antd.css';
import { Icon, List} from 'antd';

import { connect } from 'react-redux';

import { repoRefreshPath, repoGetFile} from '../actions/Repo_Actions';

var urljoin = require('url-join');


class CodeBaseExplorer extends Component {

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

    handleItemSelect(item) {
        console.log('Selected Item: ', item);
        if (item.type === 'dir') {
            this.props.repoRefreshPath({
                selectedItem: item, repo_name: this.props.repo_name,
                repo_path: urljoin(this.props.repo_current_path, item.name)
            });
        }
        if (item.type === 'file') {
            console.log('Trying to fetch file');
            this.props.repoGetFile({
                download_link: item.download_url,
                file_name: item.name
            });
        }
    }
    
    renderContentItem(item){
        var iconType = <Icon type='exclamation'/>;
        if (item.type === 'file') {
            iconType = <Icon type='file'/>;
        }
        if (item.type === 'dir') {
            iconType = <Icon type='folder'/>;
        }
        return (
            <List.Item onClick={() => this.handleItemSelect(item)}>
                {iconType} {item.name}
            </List.Item>
        )
    }

	render() {
		return (
			<div>
                <List
                    bordered
                    dataSource={this.props.contents}
                    renderItem={item => this.renderContentItem(item)}
                />
	  		</div>
    	);
  	}
}

// {this.renderContents()}

const mapStateToProps = (state) => {
    console.log('STATE.REPOS.PATH_CONTENTS: ', state.repos.path_contents)
    if (typeof state.repos.path_contents == 'undefined' || state.repos.path_contents == null){
        return {
            contents: []
        }
    }

    return {
        contents: Object.values(state.repos.path_contents),
        repo_name: state.repos.repo_name,
        repo_current_path: state.repos.repo_current_path
    }
}

export default connect(mapStateToProps, {repoRefreshPath, repoGetFile})(CodeBaseExplorer);