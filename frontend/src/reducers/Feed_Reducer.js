import {
    RETRIEVE_FEEDS
 } from '../actions/types/Feed_Types'
 
 import _ from 'lodash';
 
 export default (state = {}, action) => {
     switch (action.type) {
         case RETRIEVE_FEEDS:
             return _.mapKeys(action.payload, '_id');
         default: 
             return state;
     }
 }