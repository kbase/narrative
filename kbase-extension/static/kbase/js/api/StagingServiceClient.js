define([
    'RestAPIClient'
], function(
    RestAPIClient
) {
    'use strict';

    return function constructor(args) {
        return new RestAPIClient({
            root  : args.root,
            token : args.token,

            routes : {
                testService : { method : 'get', path : 'test-service' },
                testAuth    : { method : 'get', path : 'test-auth' },
                list        : { method : 'get', path : 'list/${path}?${type}' },
                search      : { method : 'get', path : 'search/${query}' },
                metadata    : { method : 'get', path : 'metadata/${path}' },
                upload      : { method : 'post', path : 'upload' },
                delete      : { method : 'delete', path : 'delete/${path}' },
                rename      : { method : 'post', path : 'rename/${path}' },
            }
        });
    };
});
