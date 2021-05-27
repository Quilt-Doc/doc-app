const getRequestLists = ( num ) => {
    var forward_req_list = [];
    var backward_req_list = [];
    if (num == 0) {
        return { forward: forward_req_list, backward: backward_req_list };
    }
    var add_to_forward_list = true;
    while (num > 100) {
        if (add_to_forward_list == true) {
            forward_req_list.push(100);
            add_to_forward_list = false;
        } else {
            backward_req_list.push(100);
            add_to_forward_list = true;
        }
        num -= 100;
    }
    
    // Add any remaining requests (<= 100) to list with less total requests
    // forward_req_list by default
    if (forward_req_list.length <= backward_req_list.length) {
        forward_req_list.push(num);
    } else {
        backward_req_list.push(num);
    }
    
    return { forward: forward_req_list, backward: backward_req_list };
};

module.exports = {
    getRequestLists,
};