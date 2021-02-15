/*
search2DataSource

The search data source performs a fresh search with every new query.
Whereas the workspace data source fetches the data once, and then performs 
a search against these cached results
*/
define([
    'bluebird',
    'handlebars',
    'common/searchAPI2',
    './common'
], function (
    Promise,
    Handlebars,
    SearchAPI2,
    common
) {
    'use strict';
    class RefDataSearch {
        constructor({url, token, timeout}) {
            this.url = url;
            this.token = token;
            this.searchAPI2 = new SearchAPI2({url: this.url, token: this.token});
            this.timeout = timeout;
        }

        referenceGenomeTotal({source}) {
            const params = {
                query: {
                    bool: {
                        must: [
                            {
                                term: {
                                    tags: 'refdata'
                                }
                            },
                            {
                                term: {
                                    source: source
                                }
                            },
                        ]
                    }
                },
                only_public: true,
                indexes: ['genome'],
                size: 0,
                from: 0,
                track_total_hits: true
            };
            return this.searchAPI2.search_objects({params, timeout: this.timeout})
                .then((result) => {
                    return result.count;
                });
        }

        referenceGenomeDataSearch({source, query, offset, limit}) {
            const params = {
                query: {
                    bool: {
                        must: [
                            {
                                term: {
                                    tags: 'refdata'
                                }
                            },
                            {
                                term: {
                                    source: source
                                }
                            }
                        ]
                    }
                },
                sort: [
                    {'scientific_name.raw': {order: 'asc'}},
                    {'genome_id': {order: 'asc'}}
                ],
                only_public: true,
                indexes: ['genome'],
                size: limit,
                from: offset,
                track_total_hits: true
            };
            if (query !== null) {
                params.query.bool.must.push({
                    'match': {
                        'scientific_name': {
                            'query': query,
                            'operator': 'AND'
                        }
                    }
                });
            }
            return this.searchAPI2.search_objects({params, timeout: this.timeout});
        }

        referenceGenomeSearch({source, query, page, pageSize}) {
            var offset = page * pageSize;
            var limit = pageSize;
            return Promise.all([
                this.referenceGenomeTotal({source}),
                this.referenceGenomeDataSearch({source, query, offset, limit})
            ])
                .then(([totalAvailable, result]) => {
                    return {
                        totalAvailable,
                        result
                    };
                });
        }
    }

    function parseGenomeSearchResultItem (item) {
        return {
            genome_id: item.doc.genome_id,
            genome_source: item.doc.source,
            genome_source_id: item.doc.source_id,
            scientific_name: item.doc.scientific_name,
            num_contigs: item.doc.num_contigs,
            num_cds: item.doc.cds_count,
            num_features: item.doc.feature_count,
            ws_ref: [item.doc.access_group, item.doc.obj_id, item.doc.version].join('/'),
            workspace_name: null,
            taxonomy: item.doc.taxonomy,
            object_name: item.doc.obj_name
        };
    }

    return Object.create({}, {
        init: {
            value: function (arg) {
                common.requireArg(arg, 'config');
                common.requireArg(arg, 'token');
                common.requireArg(arg, 'urls.searchapi2');
                common.requireArg(arg, 'pageSize');

                this.pageSize = arg.pageSize;

                this.currentPage = null;
                this.page = null;
                this.config = arg.config;
                this.queryExpression = null;
                this.availableData = null;
                this.fetchedDataCount = null;
                this.filteredData = null;
                this.searchApi = new RefDataSearch({
                    url: arg.urls.searchapi2,
                    token: arg.token,
                    timeout: arg.config.timeout
                });
                this.searchState = {
                    lastSearchAt: null,
                    inProgress: false,
                    lastQuery: null,
                    currentQueryState: null
                };
                this.titleTemplate = Handlebars.compile(this.config.templates.title);             
                this.metadataTemplates = common.compileTemplates(this.config.templates.metadata);
                return this;
            }
        },
        search: {
            value: function(query) {
                return Promise.try(() => {
                    if (this.searchState.currentQueryState) {
                        return null;
                    }

                    // Prepare page number
                    var page;
                    if (query.page) {
                        page = query.page - 1;
                    } else {
                        page = 0;
                    }
                    this.page = page;

                    // Prepare search input
                    var queryInput = query.input;
                    var newQuery;
                    if (!queryInput) {
                        newQuery = null;
                    } else if (queryInput === '*') {
                        newQuery = null;
                    } else {
                        // strip off "*" suffix if it was added by the code which 
                        // calls this method.
                        newQuery = queryInput.split(/[ ]+/)
                            .map(function (term) {
                                if (term.charAt(term.length-1) === '*') {
                                    return term.slice(0, -1);
                                } else {
                                    return term;
                                }
                            }).join(' ');
                    }
                    this.queryExpression = newQuery;

                    // Create state for this specific search
                    var now = new Date().getTime();

                    var queryState = {
                        query: query,
                        page: page,
                        started: now,
                        promise: null,
                        canceled: false
                    };

                    // And update the uber-search-state.
                    this.searchState.currentQueryState = queryState;
                    this.searchState.lastSearchAt = now;
                    this.searchState.lastQuery = newQuery;
                
                    // this.setQuery(query);
                    queryState.promise  = this.searchApi.referenceGenomeSearch({
                        source: this.config.source,
                        pageSize: this.pageSize,
                        query: this.queryExpression,
                        page: this.page
                    })
                        .then((result) => {
                            this.availableDataCount = result.totalAvailable;
                            this.filteredDataCount = result.result.count;
                            this.availableData = result.result.hits.map((item) => {
                                // This call gives us a normalized genome result object.
                                // In porting this over, we are preserving the field names.
                                var genomeRecord = parseGenomeSearchResultItem(item);
    
                                var name = this.titleTemplate(genomeRecord);
                                var metadata = common.applyMetadataTemplates(this.metadataTemplates, genomeRecord);
                                return {
                                    info: null,
                                    id: genomeRecord.genome_id,
                                    objectId: null,
                                    name,
                                    objectName: genomeRecord.object_name,
                                    metadata,
                                    ws: this.config.workspaceName,
                                    type: this.config.type,
                                    attached: false,
                                    workspaceReference: {ref: genomeRecord.ws_ref}
                                };
                            });
                            // for now assume that all items before the page have been fetched
                            this.fetchedDataCount = (this.page + 1) * this.pageSize + this.availableData.length;
                            return this.availableData;
                        })
                        .catch((error) => {
                            if (error instanceof DOMException && error.name === 'AbortError') {
                                const errorMsg = `Request canceled - perhaps timed out after ${this.config.timeout}ms`;
                                throw new Error(errorMsg);
                            }
                            throw(error);
                        });

                    return queryState.promise;
                })
                    .finally(function () {
                        this.searchState.currentQueryState = null;      
                    }.bind(this));
            }
        },
        setQuery: {
            value: function(query) {
                this.queryExpression = query.replace(/[*]/g,' ').trim().toLowerCase();
            }
        },
        applyQuery: {
            value: () => {
                return this.searchApi.referenceGenomeSearch({
                    source: this.config.source,
                    pageSize: this.itemsPerPage,
                    query: this.queryExpression,
                    page: this.page
                })
                    .then((result) => {
                        this.availableDataCount = result.totalAvailable;
                        this.filteredDataCount = result.result.count;
                        this.availableData = result.result.objects.map(function (item) {
                            // This call gives us a normalized genome result object.
                            // In porting this over, we are preserving the field names.
                            var genomeRecord = parseGenomeSearchResultItem(item);

                            var name = this.titleTemplate(genomeRecord);
                            var metadata = common.applyMetadataTemplates(this.metadataTemplates, genomeRecord);
                            return {
                                info: null,
                                id: genomeRecord.genome_id,
                                objectId: null,
                                name: name,
                                objectName: genomeRecord.object_name,
                                metadata: metadata,
                                ws: this.config.workspaceName,
                                type: this.config.type,
                                attached: false
                            };
                        });
                        return this.availableData;
                    });
            }
        },
        load: {
            value: function() {
                return common.listObjectsWithSets(this.narrativeService, this.config.workspaceName, this.config.type)
                    .then((data) => {
                        this.availableData = data;
                        this.availableDataCount = this.availableData.length;
                    });
            }
        }
    });
});