import {
    RETRIEVE_CALLBACKS
} from '../types/Semantic_Types';

import { api } from '../../apis/api'

var urljoin = require('url-join');

export const retrieveCallbacks = (file_desc) => async dispatch => {
    console.log('file_desc: ', file_desc);
    var id = file_desc.repositoryId;
    const repository = await api.get(`/repositories/get/${id}`);


    console.log('Repository Object: ');
    console.log(repository);
    console.log(repository.data.name)

    var downloadLink = urljoin("https://raw.githubusercontent.com/", repository.data.name);
    downloadLink = urljoin(downloadLink, 'master/');
    downloadLink = urljoin(downloadLink, file_desc.pathInRepo);

    const response = await api.post(`/semantic/callbacks/retrieve`, {filepath: downloadLink});
    dispatch({ type: RETRIEVE_CALLBACKS, payload: response.data });
}