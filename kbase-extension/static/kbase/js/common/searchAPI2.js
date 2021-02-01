/*
    searchapi2
    A module implementing the searchapi2 api calls.
    See: https://github.com/kbase/search_api2
    This implementation is not complete, but functional enough for it's usages.
    Extend as need be.
*/
define([
    './JSONRPC20'
], function (
    JSONRPC20
) {
    'use strict';

    class SearchAPI2 extends JSONRPC20 {
        search_objects({params, timeout}) {
            return this.callMethod({
                method: 'search_objects',
                params, timeout
            });
        }
    }

    return SearchAPI2;
});