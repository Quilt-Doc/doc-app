
import React from 'react';

// react-redux
import { connect } from 'react-redux';

//styles
import styled from "styled-components";

//actions
import { retrieveCallbacks } from '../actions/Semantic_Actions';

class Test extends React.Component {
   
    componentDidMount() {
        this.props.retrieveCallbacks({filepath: "cewing/fizzbuzz/master/fizzbuzz.py"})
    }

    render() {
        return(
            <div>RAT</div>
        )
    }
    
}

const mapStateToProps = (state) => {
    return {
        
    }
}



export default connect(mapStateToProps, { retrieveCallbacks })(Test);