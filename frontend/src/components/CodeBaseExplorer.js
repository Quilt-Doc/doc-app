import React, { Component } from 'react';

import 'antd/dist/antd.css';
import { Icon, List, Button} from 'antd';

import { connect } from 'react-redux';
import { Link } from 'react-router-dom';

import { repoRefreshPath, repoGetFile, repoParseFile, repoClearFile} from '../actions/Repo_Actions';

var urljoin = require('url-join');


class CodeBaseExplorer extends Component {

	componentDidMount() {
		// To disable submit button at the beginning.
		// this.props.form.validateFields();
	}

    componentDidUpdate(prevProps) {
      // Typical usage (don't forget to compare props):
      console.log('Codebase did update');
      if (this.props.file_contents !== prevProps.file_contents) {
        console.log('CALLING PARSE');
        console.log(this.props.file_contents);
        this.props.repoParseFile({
                    file_contents: this.props.file_contents,
                    file_name: this.props.file_name
                });
      }
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
        console.log(this.props.repo_name)
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
            return (
                <Link to = {this.renderLink(item)}>
                    <List.Item onClick={() => this.handleItemSelect(item)}>
                        {iconType} {item.name}
                    </List.Item>
                </Link>
            )
        }
        if (item.type === 'dir') {
            iconType = <Icon type='folder'/>;
            return (
                <List.Item onClick={() => this.handleItemSelect(item)}>
                    {iconType} {item.name}
                </List.Item>
            )
        }
    }

    renderLink(item) {
        if (item.download_url) {
            let url_items = item.download_url.split('/').slice(3)
            let final_path = url_items.join('/') 
            return `/codeview/${final_path}`
        } else {
            return `/codeview/`
        }
    }

    backButtonClick = () => {
        this.props.repoRefreshPath({
            repo_name: this.props.repo_name,
            repo_path: this.props.repo_current_path.substring(0, this.props.repo_current_path.lastIndexOf('/'))
        });
        this.props.repoClearFile();
    }

    disableBackButton = () => {
        if(this.props.repo_current_path) {
            if (this.props.repo_current_path.length > 0) {
                return false;
            }
        }
        if(this.props.file_name) {
            if(this.props.file_name.length > 0) {
                return false
            }
        }

        return true;
    }

    renderBackButton = () => {
		return (
			<Button type="text" onClick={this.backButtonClick} disabled = {this.disableBackButton()} style={{ background: "lightgrey", borderColor: "lightblue" }}>
        <Icon type='left'/>
      </Button>
		);
	}



	render() {

		return (
			<div>
                {this.renderBackButton(this.props.repo_current_path)}
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
        repo_current_path: state.repos.repo_current_path,
        file_contents: state.repos.file_contents,
        file_name: state.repos.file_name
    }
}

export default connect(mapStateToProps, {repoRefreshPath, repoGetFile, repoParseFile, repoClearFile})(CodeBaseExplorer);
