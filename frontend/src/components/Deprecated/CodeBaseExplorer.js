import React, { Component } from 'react';

import 'antd/dist/antd.css';
import { Icon, List, Button} from 'antd';

import { connect } from 'react-redux';
import { Link } from 'react-router-dom';

import { refreshRepositoryPath, getRepositoryFile, parseRepositoryFile, clearRepositoriyRefs, getRepositoryRefs} from '../../actions/Repository_Actions';
import { createCodebase } from '../../actions/Codebase_Actions';

var urljoin = require('url-join');


class CodeBaseExplorer extends Component {

	componentDidMount() {
		// To disable submit button at the beginning.
		// this.props.form.validateFields();
	}

    componentDidUpdate(prevProps) {
      // Typical usage (don't forget to compare props):
      console.log('Repository did update');
      if (this.props.fileContents !== prevProps.fileContents) {
        console.log('CALLING PARSE');
        console.log(this.props.fileContents);
        this.props.parseRepositoryFile({
                    fileContents: this.props.fileContents,
                    fileName: this.props.fileName
                });
      }

      console.log('Current repo name: ', this.props.repositoryName);
      console.log('Previous repo name: ', prevProps.repositoryName);

      if (this.props.repositoryName !== prevProps.repositoryName) {
        console.log('CALLING GET REFS');
        console.log(this.props);
        this.props.getRepositoryRefs({
                    repoLink: this.props.repositoryName
                });
        this.props.createCodebase ({
                    name: this.props.repositoryName,
                    link: this.props.repositoryName
        })
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
        console.log(this.props.repositoryName)
        if (item.type === 'dir') {
            this.props.refreshRepositoryPath({
                selectedItem: item, repositoryName: this.props.repositoryName,
                repositoryPath: urljoin(this.props.repositoryCurrentPath, item.name)
            });
        }
        if (item.type === 'file') {
            console.log('Trying to fetch file');
            this.props.getRepositoryFile({
                downloadLink: item.download_url,
                fileName: item.name
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
        this.props.refreshRepositoryPath({
            repositoryName: this.props.repositoryName,
            repositoryPath: this.props.repositoryCurrentPath.substring(0, this.props.repositoryCurrentPath.lastIndexOf('/'))
        });
        this.props.clearRepositoriyRefs();
    }

    disableBackButton = () => {
        if(this.props.repositoryCurrentPath) {
            if (this.props.repositoryCurrentPath.length > 0) {
                return false;
            }
        }
        if(this.props.fileName) {
            if(this.props.fileName.length > 0) {
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
                {this.renderBackButton(this.props.repositoryCurrentPath)}
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
    console.log('STATE.REPOSITORIES.pathContents: ', state.repositories.pathContents)
    if (typeof state.repositories.pathContents == 'undefined' || state.repositories.pathContents == null){
        return {
            contents: []
        }
    }

    return {
        contents: Object.values(state.repositories.pathContents),
        repositoryName: state.repositories.repositoryName,
        repositoryCurrentPath: state.repositories.repositoryCurrentPath,
        fileContents: state.repositories.fileContents,
        fileName: state.repositories.fileName
    }
}

export default connect(mapStateToProps, {refreshRepositoryPath, getRepositoryFile, createCodebase, parseRepositoryFile, clearRepositoriyRefs, getRepositoryRefs})(CodeBaseExplorer);
