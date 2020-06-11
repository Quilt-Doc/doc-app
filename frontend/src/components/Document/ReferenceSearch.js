import React, { Component } from 'react';

import 'antd/dist/antd.css';
import 'highlight.js/styles/atom-one-dark.css'
import '../../css/autosuggest.css';

import { connect } from 'react-redux';

import {Button } from 'antd';

import Autosuggest from 'react-autosuggest';
import styled from 'styled-components';

import api from '../../apis/api';

import { repoUpdateRefs } from '../../actions/Repo_Actions';


  // https://developer.mozilla.org/en/docs/Web/JavaScript/Guide/Regular_Expressions#Using_Special_Characters
  function escapeRegexCharacters(str) {
	return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
  
  
  function renderSuggestion(suggestion) {
	console.log('renderSuggestion');
	console.log('Suggestion.kind: ', suggestion.kind);
	return (
		<div
		style={{
			display: 'flex',
			justifyContent: 'space-between',
		}}
    	>
			<span>
				{suggestion.kind}::{suggestion.name}
			</span>
			<span>
				{suggestion.file}::{suggestion.lineNum}
			</span>
    	</div>
	);
  }

  
  
  function renderSectionTitle(section) {
	console.log('renderSectionTitle');
	return (
	  <strong>{section.title}</strong>
	);
  }
  
  function getSectionSuggestions(section) {
	console.log('getSectionSuggestions');
	return section.results;
  }

  
class ReferenceSearch extends Component {
	constructor() {
		super();
	
		this.state = {
		  value: '',
		  suggestions: [],
		  references: []
		};
	  }

	getSuggestions = (value) => {

	  	const escapedValue = escapeRegexCharacters(value.trim());
	  
	  	if (escapedValue === '') {
			return [];
	  	}

	  	response = () => {
			  	api.post('/references/get', {text: escapedValue, repo_link: "/cewing/fizzbuzz/"} )
					  .then(function (response) {
						  console.log('GET REFERENCES RESPONSE');
						  console.log(response);
						  this.props.repos.repoUpdateRefs({
										  references: response.data
						  });
						})
						.catch(function (error) {
						  console.log(error);
						});
		}
	  	// console.log('RESPONSE');
	  	// console.log(response);
	  	return this.props.references;
		}

	  onChange = (event, { newValue, method }) => {
		this.setState({
		  value: newValue
		});
	  };

	  onSuggestionsFetchRequested = ({ value }) => {
		this.setState({
		  suggestions: this.getSuggestions(value, this.props.references)
		});
	  };
	
	  onSuggestionsClearRequested = () => {
		this.setState({
		  suggestions: []
		});
	  };

	getSuggestionValue = (suggestion) => {
		console.log('getSuggestionValue');

		return suggestion.name;
	  }

	  render() {
		const { value, suggestions } = this.state;
		const inputProps = {
		  placeholder: "Type 'c'",
		  value,
		  onChange: this.onChange
		};
	
		return (
		<div>
		  <Autosuggest 
			multiSection={true}
			suggestions={suggestions}
			onSuggestionsFetchRequested={this.onSuggestionsFetchRequested}
			onSuggestionsClearRequested={this.onSuggestionsClearRequested}
			getSuggestionValue={this.getSuggestionValue}
			renderSuggestion={renderSuggestion}
			renderSectionTitle={renderSectionTitle}
			getSectionSuggestions={getSectionSuggestions}
			inputProps={inputProps} />
		</div>
		);
	  }
}

const mapStateToProps = (state) => {
    
    return {

		references: state.repos.references
    }
}

export default connect(mapStateToProps, { repoUpdateRefs })(ReferenceSearch);
