import React, { Component } from 'react';

import 'antd/dist/antd.css';
import { Input, Form, Button} from 'antd';

import { Field, reduxForm } from 'redux-form';

import { connect } from 'react-redux';

import { repoRefreshPath } from '../actions/Repo_Actions';



class Repo_Search extends Component {

	componentDidMount() {
		// To disable submit button at the beginning.
		// this.props.form.validateFields();
		
	}

	onSubmit = (formValues) => {
		console.log(formValues);
		this.props.repoRefreshPath(formValues);
		// console.log(formValues);
		/*this.props.form.validateFields((err, values) => {
			if (!err) {
			  console.log('Received values of form: ', values);
			}
		  });*/
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

	renderRepoInput = ({input, label, meta}) => {
		const className = `field ${meta.error && meta.touched ? 'error' : ''}`
		return(
			<div className = {className}>
				<Form.Item>
            		<Input
						addonBefore="http://github.com/"
              			//prefix={<Icon type="file" style={{ color: 'rgba(0,0,0,.25)' }} />}
						placeholder="twbs/bootstrap/"
						{...input}
						required
            		/>
        		</Form.Item>
				{this.renderError(meta)}
			</div>
		);
	}


	render() {
		return (
			<div>
				<Form layout="inline" onSubmit= {this.props.handleSubmit(this.onSubmit)}>
					<Field name = "repo_name" component = {this.renderRepoInput} label = "Repo" />
					<Form.Item>
          				<Button type="primary" htmlType="submit">
            				Scan...
          				</Button>
        			</Form.Item>
            	</Form>
	  		</div>
    	);
  	}
}

const RepoSearch = Form.create({ name: 'repo_search' })(Repo_Search);

export default reduxForm({
    form: 'repo_search'
})(connect(null, { repoRefreshPath })(RepoSearch));
