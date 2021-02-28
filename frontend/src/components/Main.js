import React, {Component}  from 'react';

// react-redux
import { connect } from 'react-redux';

//router
import { Router, Route } from 'react-router-dom';
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

        if (this.checkValid(authenticated)) {

            if (!(authenticated && user)) {
                // NOT LOGGED IN
                if (splitPath.length < 2 || splitPath[1] !== 'login') history.push('/login');
                return
            } else {
                // LOGGED IN
                const { user : { onboarded } } = this.props;

                if (!onboarded) {
                    // NOT ONBOARDED
                    if (splitPath.length < 2 || splitPath[1] !== 'onboarding') history.push('/onboarding');
                    return 
                } else if (splitPath.length < 2 || splitPath[1] !== 'workspaces') {
                    history.push('/workspaces');
                    return
                }
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

export default connect(mapStateToProps, { checkLogin })(Main);

