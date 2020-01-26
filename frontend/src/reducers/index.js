import { combineReducers } from 'redux';
import documentReducer from './Document_Reducer'


export default combineReducers({
    documentState: documentReducer
});

