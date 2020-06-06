import {
    REPO_REFRESH_PATH,
    REPO_GET_FILE
} from '../actions/types/Repo_Types';


import _ from 'lodash';

const initialContents = {path_contents: {}}

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
        
        default: 
            return state;
    }
}