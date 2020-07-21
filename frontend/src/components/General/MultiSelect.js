import React, { Component } from 'react';

import CreatableSelect from 'react-select/creatable';
import AsyncCreatableSelect from 'react-select/async-creatable';

import { removeDocument } from '../../actions/RepositoryItem_Actions';

import styled from 'styled-components';

class MultiSelect extends Component {
  constructor(props) {
    super(props)
  }


  handleChange = (newValue, actionMeta) => {
    this.props.changeMethod(newValue)
    //this.setState({ value: newValue });
  };

  handleCreate = (inputValue) => {
    //this.setState({ isLoading: true });
    console.log(inputValue)
    this.props.createMethod(inputValue)
      /*
      this.setState({
        isLoading: false,
        options: [...options, newOption],
        value: [...value, newOption],
      }); */
  };  



  handleInputChange = (inputValue, callback) => {
    this.props.loadOptions(inputValue, callback)
  }

  isOptionSelected = (value, selectedValues) => {
    for (let i = 0; i < selectedValues.length; i++){
      if (selectedValues[i]._id === value._id){
        return true
      }
    }
    return false
  } 

  render() {

    const customStyles = { 
      control: (provided, state) => ({
        ...provided,
        /*'width': '35rem',*/
        'fontSize': "1.5rem",
        /*"marginLeft": "1rem",*/
        /*'padding': "0.25rem",*/
        'z-index': '100',
        'cursor': 'pointer'
      }),
      option: (provided, state) => ({
        ...provided,
        cursor: 'pointer',
        
        'borderRadius':'0.3rem'
      }),
      container: (provided, state) => ({
        ...provided,
        'z-index': '100',
        'fontSize': "1.5rem",
        'marginTop': '0.75rem',
        'borderRadius': '0.3rem',
        'width': '37rem',
        

      }),

      menu: (provided, state) => ({
        ...provided,
         width: '37rem',
         padding: '0.5rem',
        /*'marginTop': "1.5rem",*/
        'boxShadow': '0 2px 6px 2px rgba(60,64,67,.15)',
      
      }),
      multiValue: (provided, state) => ({
        ...provided,
        'fontSize': '1.25rem',
        'color': '#2980b9',
        'padding': '0.4rem 0.8rem',
        'background-color': 'rgba(51, 152, 219, 0.1)',
        'borderRadius': '4px',
        'marginRight': '0.5rem',
      }),
      multiValueLabel: (provided, state) => ({
        'fontSize': '1.25rem',
        'color': '#2980b9'
      }),
      placeholder: (provided, state) => ({
        ...provided,
        color: '#172A4E',
        opacity: 0.5
      }),
      noOptionsMessage: (provided, state) => ({
        ...provided,
        color: '#172A4E',
        opacity: 0.5,
      })
    }

    
    

    return (
        
            <AsyncCreatableSelect
              isClearable
              isMulti
              autoFocus
              menuIsOpen
              noOptionsMessage = {() => "No matching tags"}
              placeholder = {<div>Search for tags</div>}
              components={{ DropdownIndicator: null, IndicatorSeparator: null }}
              styles = {customStyles}
              
              isOptionSelected = {this.isOptionSelected}
              //isLoading={isLoading}
              //onInputChange={this.props.loadOptions}
              onChange={this.props.onChange}
              onCreateOption={this.props.onCreateOption}//this.props.onCreateOption}
              loadOptions={this.props.loadOptions}
              defaultOptions={this.props.defaultOptions}
              //cacheOptions
              //options = {this.props.optionData}
              onBlur = {this.props.onBlur}
              value={this.props.valueData}
            />
      
    );
  }
}

export default MultiSelect

/*
 option: (styles, { data, isDisabled, isFocused, isSelected }) => {
        const color = chroma(data.color);
        return {
          ...styles,
          backgroundColor: isDisabled
            ? null
            : isSelected
            ? data.color
            : isFocused
            ? color.alpha(0.1).css()
            : null,
          color: isDisabled
            ? '#ccc'
            : isSelected
            ? chroma.contrast(color, 'white') > 2
              ? 'white'
              : 'black'
            : data.color,
          cursor: isDisabled ? 'not-allowed' : 'default',
    
          ':active': {
            ...styles[':active'],
            backgroundColor: !isDisabled && (isSelected ? data.color : color.alpha(0.3).css()),
          },
        };
      },
multiValue: (styles, { data }) => {
        const color = chroma(data.color);
        return {
          ...styles,
          backgroundColor: color.alpha(0.1).css(),
        };
      },
      multiValueLabel: (styles, { data }) => ({
        ...styles,
        color: data.color,
      }),
      multiValueRemove: (styles, { data }) => ({
        ...styles,
        color: data.color,
        ':hover': {
          backgroundColor: data.color,
          color: 'white',
        },
      }),
*/