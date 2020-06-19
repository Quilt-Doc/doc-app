import {
    REFRESH_REPOSITORY_PATH,
    GET_REPOSITORY_FILE,
    PARSE_REPOSITORY_FILE,
    CLEAR_REPOSITORY_FILE,
    REFRESH_REPOSITORY_PATH_NEW,
    UPDATE_REPOSITORY_REFS,
    CREATE_REPOSITORY,
    GET_REPOSITORY,
    DELETE_REPOSITORY,
    RETRIEVE_REPOSITORIES
} from '../actions/types/Repository_Types';


import _ from 'lodash';

const initialContents = {
                        pathContents: {},
                        references: [],
                        repositories: {}
                        }

export default (state = initialContents, action) => {
    let repositories = state.repositories
    switch (action.type) {
        case REFRESH_REPOSITORY_PATH:
            return { 
                    ...state, repositoryName: action.repositoryName,
                    repositoryCurrentPath: action.repositoryCurrentPath,
                    pathContents: action.payload
                    };
        case REFRESH_REPOSITORY_PATH_NEW:
            return { ...state, pathContents: action.payload };
        case GET_REPOSITORY_FILE:
            return { 
                ...state, fileName: action.fileName,
                fileContents: action.payload
                };
        case PARSE_REPOSITORY_FILE:
            return {
                ...state, parsedData: action.parsed_data
            }
        case CLEAR_REPOSITORY_FILE:
            return {
                ...state, fileName: '', fileContents: ''
            };
        case UPDATE_REPOSITORY_REFS:
            return {
                ...state, references: action.payload
            }
        case CREATE_REPOSITORY:
            
            repositories = {...repositories, [action.payload._id]: action.payload}
            return { ...state, repositories };
        case GET_REPOSITORY:
            repositories = {...repositories, [action.payload._id]: action.payload}
            return { ...state, repositories };
        case DELETE_REPOSITORY:
            repositories = {...repositories, [action.payload._id]: action.payload}
            repositories = _.omit(repositories, action.payload._id);
            return { ...state, repositories };
        case RETRIEVE_REPOSITORIES:
            repositories = { ..._.mapKeys(action.payload, '_id') };
            return { ...state, repositories };
        
        default: 
            return state;
    }
}

