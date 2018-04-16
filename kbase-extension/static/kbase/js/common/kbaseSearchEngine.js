define([
    'bluebird',
    'kb_common/jsonRpc/genericClient'
], function (
    Promise,
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

        function referenceGenomeTotal (arg) {
            var start = arg.page * arg.pageSize;
            var count = arg.pageSize;
            var source = arg.source;

            var param = {
                match_filter: {
                    full_text_in_all: null,
                    exclude_subobjects: 1,
                    source_tags: ['refdata'],
                    source_tags_blacklist: 0,
                    lookupInKeys: {
                        source: {
                            string_value: source
                        }
                    }
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
                    include_highlight: 0
                },
                access_filter: {
                    with_private: 0,
                    with_public: 1
                }
            };

            return searchApi.callFunc('search_types', [param])
                .spread(function(result) {
                    return result;
                });
        }

        // the actual call to the kbase search engine.
        // all inputs must be in their final form.
        function referenceGenomeDataSearch (arg) {
            var query = arg.query;
            var start = arg.page * arg.pageSize;
            var count = arg.pageSize;
            var source = arg.source;

            var param = {
                object_types: ['Genome'],
                match_filter: {
                    full_text_in_all: query,
                    exclude_subobjects: 1,
                    source_tags: ['refdata'],
                    source_tags_blacklist: 0,
                    lookupInKeys: {
                        source: {
                            string_value: source
                        }
                    }
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
                    include_highlight: 0
                },
                access_filter: {
                    with_private: 0,
                    with_public: 1
                },
                sorting_rules: [{
                    is_object_property: 1,
                    property: 'scientific_name_keyword',
                    ascending: 1
                }]
            };

            return searchApi.callFunc('search_objects', [param])
                .spread(function(result) {
                    return result;
                });
        }

        function referenceGenomeSearch(arg) {
            return Promise.all([
                referenceGenomeTotal(arg),
                referenceGenomeDataSearch(arg)
            ])
                .spread(function (total, data) {
                    return {
                        totalAvailable: total.type_to_count.Genome || 0,
                        result: data
                    };
                });
        }

        return {
            referenceGenomeDataSearch: referenceGenomeDataSearch,
            referenceGenomeTotal: referenceGenomeTotal,
            referenceGenomeSearch: referenceGenomeSearch
        };
    }
    return {
        make: factory
    };
});