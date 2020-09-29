import React, { Component } from 'react';

//components
import Onboarding from './onboarding/Onboarding';
import Workspaces from './workspaces/Workspaces';

//react-redux
import { connect } from 'react-redux';

class Home extends Component {

    renderBody = () => {
        const {user: {onboarded}} = props;
        return onboarded ? <Workspaces/> : <Onboarding/>
    }

    render() {
        return (
            <Container>
                <Top>
                    <StyledIcon src = {logo} />
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