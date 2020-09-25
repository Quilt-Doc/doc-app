import React, {Component}  from 'react';

// react-redux
import { connect } from 'react-redux';

//actions
import { checkLogin } from '../actions/Auth_Actions'

//components
import Application from './Application';
import Login from './login/Login';

// root level component, used to identify whether user is logged in and thus, 
// can access core ui/product functionality
class Main extends Component {

    // checks to see whether the user is logged in
    // validated through a JWT in the backend
    componentDidMount(){
        const {checkLogin} = this.props;
        checkLogin();
    }

    // depending on authentication, show the login view or the dashboard (core app)
    render(){
        const { authenticated, user } = this.props;
        console.log("USER", user)
        return (authenticated && user) ? <Application/> : <Login/> 
    }
}

const mapStateToProps = (state) => {
    return {
        user: state.auth.user,
        authenticated: state.auth.authenticated
    }
}

export default connect(mapStateToProps, {checkLogin})(Main);

