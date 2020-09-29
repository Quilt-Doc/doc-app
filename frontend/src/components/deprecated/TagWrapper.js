import React, { Component } from 'react';

//components
import MultiSelect from './MultiSelect';

//
import _ from 'lodash';

//styles
import styled from 'styled-components';

//redux
import { connect } from 'react-redux';

//actions
import { createTag, retrieveTags } from '../../actions/Tag_Actions';


class TagWrapper extends React.Component {
    constructor(props) {
        super(props)

        this.state = {
            tags: [],
            isLoading: false,
            attachedTags: [],
            loaded: false,
            defaultTags: []
        }
    }

    componentDidMount(){
        this.props.retrieveTags({limit: 9}).then(() => {
            this.setState({loaded: true, defaultTags: [...this.props.internalTags]})
        })
    }


    loadOptions = (inputValue, callback) => {
        //console.log("LOADING", inputValue)
        //this.props.setState({isLoading: true})

       this.props.retrieveTags({search: inputValue, limit: 9}).then(() => {
            setTimeout(() => {
                callback( this.props.internalTags)
            }, 200);
        })
    }

    createTag = (inputValue) => {
        this.props.createTag({label: inputValue}).then((tag) => {
            this.props.onChange([...this.props.tags, tag])
        })
    }

    onChange = (tags, action) => {
        console.log(action)
        
        if (action.action === 'remove-value'){
            tags = this.props.tags.filter(tag => tag._id !== action.removedValue._id).map(tag => tag._id)
            return this.props.onChange(tags)
        } else if (tags) {
            tags = tags.map(tag => tag._id)
            return this.props.onChange(tags)
        } else if (action.action === 'pop-value'){
            return this.props.onChange([])
        }
    }
    
    render(){
        //console.log("INTERNAL", this.props.internalTags)
        if (this.state.loaded) {
            return(
                    < MultiSelect 
                        optionData = {this.props.internalTags}
                        valueData = {this.props.tags} //coming from external
                        defaultOptions = {this.state.defaultTags} //coming from internal
                        onCreateOption = {this.createTag}
                        onChange = {this.onChange}
                        loadOptions = {this.loadOptions}
                        onBlur = {this.props.onBlur}
                        //isLoading = {this.state.isLoading}
                        //options = { this.props.internalTags}
                    />
            )
        }
        return null
    }
}

const mapStateToProps = (state, ownProps) => {
    return {
        internalTags: Object.values(state.tags)
    }
}

export default connect(mapStateToProps, { createTag, retrieveTags } )(TagWrapper);

const Container = styled.div`
    z-index: 100;
`