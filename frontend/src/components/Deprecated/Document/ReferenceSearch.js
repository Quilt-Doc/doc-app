import React, { Component } from 'react';

import 'antd/dist/antd.css';
import 'highlight.js/styles/atom-one-dark.css'
import '../../css/autosuggest.css';

import { connect } from 'react-redux';

import {Button } from 'antd';

import Autosuggest from 'react-autosuggest';
import styled from 'styled-components';

import api from '../../../apis/api';

import { updateRepositoryRefs } from '../../../actions/Repository_Actions';


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
		  isLoading: false
		};
    
    	this.lastRequestId = null;
	  }

	loadSuggestions(value) {
	    /*
	    // Cancel the previous request
	    if (this.lastRequestId !== null) {
	      clearTimeout(this.lastRequestId);
	    }*/
	    
	    this.setState({
	      isLoading: true
	    });

	    /*fetch('http://localhost:3001/api/references/get', {
		  method: 'POST', // or 'PUT'
		  headers: {
		    'Content-Type': 'application/json',
		  },
		  body: JSON.stringify(value),
		})*/
		var that = this;
		api.post('/references/get', {text: value, repoLink: "kgodara/doc-app/"} )
		.then(function (response) {
			console.log('GET REFERENCES RESPONSE');
			console.log(response);
			updateRepositoryRefs({
				references: response.data
				});
			  console.log('RESPONSE');
			  console.log(response.data);
			  that.setState({
		        isLoading: false,
		        suggestions: response.data
		      });
			})
			.catch(function (error) {
			  console.log(error);
			});
		/*.then(response => response.json())
		.then(data => {
		  console.log('Success:', data);
		  this.setState({ suggestions: data })
		})
		.catch((error) => {
		  console.error('Error:', error);
		});*/
	    
	    // Fake request
	    /*this.lastRequestId = setTimeout(() => {
	      this.setState({
	        isLoading: false,
	        suggestions: getMatchingLanguages(value)
	      });
	    }, 1000);*/
  	}

	/*getSuggestions = (value) => {
		console.log('get suggestions called');
	  	const escapedValue = escapeRegexCharacters(value.trim());
	  	console.log('value: ', value)
	  
	  	if (escapedValue === '') {
			return [];
	  	}
<<<<<<< HEAD

	  	response = () => {
			  	api.post('/references/get', {text: escapedValue, repoLink: "/cewing/fizzbuzz/"} )
=======
  		console.log('Calling response')
	  	var get_response = (val, updateRepositoryRefs) => {
			  	api.post('/references/get', {text: val, repoLink: "kgodara/doc-app/"} )
>>>>>>> c2d76565361e743112290b4d3a0864f2fc75b645
					  .then(function (response) {
						  console.log('GET REFERENCES RESPONSE');
						  console.log(response);
						  updateRepositoryRefs({
										  references: response.data
						  });
						  return response.data
						  console.log('RESPONSE');
						  console.log(response.data);
						  return response.data
						})
						.catch(function (error) {
						  console.log(error);
						});
<<<<<<< HEAD
		}
	  	// console.log('RESPONSE');
	  	// console.log(response);
	  	return this.props.references;
=======
>>>>>>> c2d76565361e743112290b4d3a0864f2fc75b645
		}
		get_response(escapedValue, this.props.updateRepositoryRefs);
		}*/

	  onChange = (event, { newValue, method }) => {
		this.setState({
		  value: newValue
		});
	  };

	  onSuggestionsFetchRequested = ({ value }) => {
	  	var data = { repoLink: "kgodara/doc-app/", text: value };

	  	this.loadSuggestions(value);

		/*fetch('http://localhost:3001/api/references/get', {
		  method: 'POST', // or 'PUT'
		  headers: {
		    'Content-Type': 'application/json',
		  },
		  body: JSON.stringify(data),
		})
		.then(response => response.json())
		.then(data => {
		  console.log('Success:', data);
		  this.setState({ suggestions: data })
		})
		.catch((error) => {
		  console.error('Error:', error);
		});
	  	/*this.getSuggestions(value)
	  	.then(function(answer) {
	  		console.log('ANSWER')
	  		console.log(answer)
	  		this.setState({
		  		suggestions: answer
			});
	  	});*/
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
		const status = (this.isLoading ? 'Loading...' : 'Type to load suggestions');
	
		return (
		<div>
			<div className="status">
         		<strong>Status:</strong> {status}
        	</div>
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

		references: state.repositories.references
    }
}

export default connect(mapStateToProps, { updateRepositoryRefs })(ReferenceSearch);
