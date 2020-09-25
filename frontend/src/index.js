import React from 'react';
import ReactDOM from 'react-dom';
import Root from './components/Root';
import { Provider } from 'react-redux';
import { createStore, applyMiddleware, compose } from 'redux';
import reduxThunk from 'redux-thunk';
import { createLogger } from 'redux-logger';

import reducers from '../src/reducers/index';



const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;
//const logger = createLogger();

const store = createStore(reducers,
    composeEnhancers(
        applyMiddleware(reduxThunk)
    )
);


ReactDOM.render(
    <Provider store={store}>
        <Root />
    </Provider>,
    document.querySelector('#root')
);
