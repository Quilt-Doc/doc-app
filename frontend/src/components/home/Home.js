import React, { Component } from 'react';

//components
import Onboarding from './onboarding/Onboarding';
import Workspaces from './workspaces/Workspaces';

//styles
import styled from 'styled-components';

//react-redux
import { connect } from 'react-redux';

class Home extends Component {

    renderBody = () => {
        const {user: {onboarded}} = this.props;
        return onboarded ? <Workspaces/> : <Onboarding/>
    }

    render() {
        return (
            <Container>
                <Top>
                    <Company>quilt</Company>
                </Top>
                {this.renderBody()}
            </Container>
        )
    }
}

const mapStateToProps = (state) => {
    const {auth: {user}} = state;
    return {
        user
    }
}

export default connect(mapStateToProps, {})(Home);


const Container = styled.div`
    background-color:#16181d;
    display: flex;
    flex: 1;
    display: flex;
    flex-direction: column;
    color: white;
`


const Top = styled.div`
    height: 10rem;
    padding-left: 4rem;
    padding-right: 4rem;
    color:#D6E0EE;
    display: flex;
    align-items: center;
`

const StyledIcon = styled.img`
    width: 2.7rem;
    margin-left: 4.5rem;
    margin-right: 1rem;
`

const Company = styled.div`
    font-size: 3rem;
    color:white;
    font-weight: 500;
    letter-spacing: 1.5px;
    margin-right: 15rem;
    margin-top: -0.25rem;
`