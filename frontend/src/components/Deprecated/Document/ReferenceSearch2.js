import React, { Component } from 'react';

import 'antd/dist/antd.css';
import 'highlight.js/styles/atom-one-dark.css'
import '../../css/autosuggest.css';

import { connect } from 'react-redux';

import {Button } from 'antd';

import Autosuggest from 'react-autosuggest';
import styled from 'styled-components';

import api from '../../apis/api';

import { updateRepositoryRefs } from '../../actions/Repository_Actions';

/* ---------- */
/*    Data    */
/* ---------- */


/*function getMatchingLanguages(value) {
  const escapedValue = escapeRegexCharacters(value.trim());
  
  if (escapedValue === '') {
    return [];
  }
  
  const regex = new RegExp('^' + escapedValue, 'i');

  return languages.filter(language => regex.test(language.name));
}*/

/* ----------- */
/*    Utils    */
/* ----------- */

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

// https://developer.mozilla.org/en/docs/Web/JavaScript/Guide/Regular_Expressions#Using_Special_Characters
function escapeRegexCharacters(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/* --------------- */
/*    Component    */
/* --------------- */

function getSuggestionValue(suggestion) {
  return suggestion.name;
}

/*function renderSuggestion(suggestion) {
  return (
    <span>{suggestion.name}</span>
  );
}*/

class ReferenceSearch2 extends React.Component {
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
    // Cancel the previous request
    if (this.lastRequestId !== null) {
      clearTimeout(this.lastRequestId);
    }
    
    this.setState({
      isLoading: true
    });
    var that = this;
    api.post('/references/get', {text: value, repoLink: "cewing/fizzbuzz/"} )
            .then(function (response) {
              console.log('GET REFERENCES RESPONSE');
              console.log(response);
              that.setState({
                isLoading: false,
                suggestions: response.data //getMatchingLanguages(value)
              });
              /*updateRepositoryRefs({
                      references: response.data
              });*/
              /*return response.data
              console.log('RESPONSE');
              console.log(response.data);
              return response.data*/
            })
            .catch(function (error) {
              console.log(error);
            });
    
    // Fake request
    /*this.lastRequestId = setTimeout(() => {
      this.setState({
        isLoading: false,
        suggestions: getMatchingLanguages(value)
      });
    }, 1000);*/
  }

  onChange = (event, { newValue }) => {
    this.setState({
      value: newValue
    });
  };
    
  onSuggestionsFetchRequested = ({ value }) => {
    this.loadSuggestions(value);
  };

  onSuggestionsClearRequested = () => {
    this.setState({
      suggestions: []
    });
  };

  render() {
    const { value, suggestions, isLoading } = this.state;
    const inputProps = {
      placeholder: "Type 'c'",
      value,
      onChange: this.onChange
    };
    const status = (isLoading ? 'Loading...' : 'Type to load suggestions');
    
    return (
      <div>
        <div className="status">
          <strong>Status:</strong> {status}
        </div>
        <Autosuggest 
          suggestions={suggestions}
          onSuggestionsFetchRequested={this.onSuggestionsFetchRequested}
          onSuggestionsClearRequested={this.onSuggestionsClearRequested}
          getSuggestionValue={getSuggestionValue}
          renderSuggestion={renderSuggestion}
          inputProps={inputProps} />
      </div>
    );
  }
}

export default ReferenceSearch2;