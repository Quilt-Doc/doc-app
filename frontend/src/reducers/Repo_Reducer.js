import {
    REPO_REFRESH_PATH,
    REPO_GET_FILE,
    REPO_PARSE_FILE,
    REPO_CLEAR_FILE,
    REPO_UPDATE_REFS
} from '../actions/types/Repo_Types';


import _ from 'lodash';

const initialContents = {
                        path_contents: {},
                        references: []
                        }

export default (state = initialContents, action) => {
    switch (action.type) {
        case REPO_REFRESH_PATH:
            console.log('PAYLOAD: ')
            console.log(action.payload)
            return { 
                    ...state, repo_name: action.repo_name,
                    repo_current_path: action.repo_current_path,
                    path_contents: action.payload
                    };
        case REPO_GET_FILE:
            return { 
                ...state, file_name: action.file_name,
                file_contents: action.payload
                };
        case REPO_PARSE_FILE:
            return {
                ...state, parsed_data: action.parsed_data
            }
        case REPO_CLEAR_FILE:
            return {
                ...state, file_name: '', file_contents: ''
            };
        case REPO_UPDATE_REFS:
            return {
                ...state, references: action.references
            }
        
        default: 
            return state;
    }
}