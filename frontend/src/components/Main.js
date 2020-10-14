import React, {Component}  from 'react';

// react-redux
import { connect } from 'react-redux';

//router
import { Router, Route, Switch } from 'react-router-dom';
import history from '../history';

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
    componentDidMount = async () => {
        const { checkLogin } = this.props;
        await checkLogin();

        const { authenticated, user } = this.props;

        let path = history.location.pathname;
        const splitPath = path.split('/');

        if (this.checkValid(authenticated) && !(authenticated && user)) {
            if (splitPath.length > 1) {
                if (splitPath[1] !== 'login') history.push('/login');
            } else {
                history.push('/login');
            }
        } else if (this.checkValid(authenticated) && (authenticated && user)) {
            if (splitPath.length > 1) {
                let section = splitPath[1];
                if (section !== "workspaces" && section !== "home") {
                    history.push('/home');
                }
            } else {
                history.push('/home');
            }
        }
    }

    checkValid = (item) => {
        if (item !== null && item !== undefined) {
            return true
        }
        return false
    }
    // depending on authentication, show the login view or the dashboard (core app)
    render(){
        const { authenticated, user } = this.props;
        return this.checkValid(authenticated) 
            ? (authenticated && user) ? <Application/> : 
                <Router history = {history}>
                     <Route path = "/login" component = {Login} />
                </Router>
            : null
    }
}

const mapStateToProps = (state) => {
    return {
        user: state.auth.user,
        authenticated: state.auth.authenticated
    }
}

export default connect(mapStateToProps, {checkLogin})(Main);

