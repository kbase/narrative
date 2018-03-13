define([
    'kb_common/jsonRpc/genericClient'
], function (
    ServiceClient
) {
    'use strict';

    function factory(config) {
        var url = config.url;
        var token = config.token;

        var searchApi = new ServiceClient({
            url: url,
            module: 'KBaseSearchEngine',
            token: token
        });

        // the actual call to the kbase search engine.
        // all inputs must be in their final form.
        function referenceDataSearch (arg) {
            var query = arg.query;
            var start = arg.page * arg.pageSize;
            var count = arg.pageSize;

            var param = {
                object_types: ['Genome'],
                match_filter: {
                    full_text_in_all: query,
                    exclude_subobjects: 1,
                    source_tags: ['refdata'],
                    source_tags_blacklist: 0,
                    // lookupInKeys: {
                    //     access_group_id: {
                    //         int_value: 15792
                    //     }
                    // }
                },
                pagination: {
                    start: start,
                    count: count
                },
                post_processing: {
                    ids_only: 0,
                    skip_info: 0,
                    skip_keys: 0,
                    skip_data: 0,
                    include_highlight: 1
                },
                access_filter: {
                    with_private: 0,
                    with_public: 1
                },
                // sorting_rules: [{
                //     is_object_property: 1,
                //     property: 'scientific_name',
                //     ascending: 0
                // }]
            };

            

            return searchApi.callFunc('search_objects', [param])
                .spread(function(result) {
                    return [query, result];
                });
        }

        return {
            referenceDataSearch: referenceDataSearch
        };
    }
    return {
        make: factory
    };
});