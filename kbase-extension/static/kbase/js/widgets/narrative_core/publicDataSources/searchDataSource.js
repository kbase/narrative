/*
searchDataSource

The search data source performs a fresh search with every new query.
Whereas the workspace data source fetches the data once, and then performs 
a search against these cached results
*/
define([
    'bluebird',
    'handlebars',
    'kb_common/utils',
    'kb_common/jsonRpc/dynamicServiceClient',
    'common/kbaseSearchEngine',
    './common'
], function (
    Promise,
    Handlebars,
    Utils,
    DynamicServiceClient,
    KBaseSearchEngine,
    common
) {
    'use strict';

    function objectGuidToRef (guid) {
        var m = guid.match(/^WS:(\d+)\/(\d+)\/(\d+)$/);
        var objectRef = m.slice(1, 4).join('/');
        return {
            workspaceId: parseInt(m[1]),
            objectId: parseInt(m[2]),
            version: parseInt(m[3]),
            ref: objectRef,
            dataviewId: objectRef
        };
    }

    function parseGenomeIndexV1 (item) {
        return {
            genome_id: item.data.id,
            genome_source: item.data.source,
            genome_source_id: item.data.source_id,
            scientific_name: item.data.scientific_name,
            domain: item.data.domain,
            num_contigs: item.data.num_contigs,
            num_cds: item.data.cdss,
            num_features: item.data.features,
            ws_ref: objectGuidToRef(item.guid),
            workspace_name: null,
            taxonomy: item.data.taxonomy,
            object_name: item.object_name
        };
    }

    function parseGenomeIndexV2 (item) {
        // oh, lordy, people messing with the metadata...
        return {
            genome_id: item.data.id,
            genome_source: item.data.source,
            genome_source_id: item.data.source_id,
            scientific_name: item.data.scientific_name,
            domain: item.data.domain,
            num_contigs: item.data.num_contigs,
            num_cds: item.data.cdss,
            num_features: item.data.feature_counts.gene,
            ws_ref: objectGuidToRef(item.guid),
            workspace_name: null,
            taxonomy: item.data.taxonomy,
            object_name: item.object_name
        };
    }

    function parseGenomeSearchResultItem (item) {
        // get the type and version
        var indexType = item.type.toLowerCase();
        var indexTypeVersion = item.type_ver;

        if (indexType !== 'genome') {
            throw new Error('Item is not a genome: ' + indexType);
        }

        switch (indexTypeVersion) {
        case 1:
            return parseGenomeIndexV1(item);
        case 2:
            return parseGenomeIndexV2(item);
        default:
            throw new Error('Unsupported genome index version: ' + indexTypeVersion);
        }
    }

    var SearchDataSource = Object.create({}, {
        init: {
            value: function (arg) {
                common.requireArg(arg, 'config');
                common.requireArg(arg, 'token');
                common.requireArg(arg, 'urls.KBaseSearchEngine');
                common.requireArg(arg, 'pageSize');

                this.pageSize = arg.pageSize;

                this.currentPage = null;
                this.page = null;
                this.config = arg.config;
                this.queryExpression = null;
                this.availableData = null;
                this.fetchedDataCount = null;
                this.filteredData = null;
                this.searchApi = KBaseSearchEngine.make({
                    url: arg.urls.KBaseSearchEngine,
                    token: arg.token
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
                return Promise.try(function () {
                    if (this.searchState.currentQueryState) {
                        return;
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
                        .then(function (result) {
                            this.availableDataCount = result.totalAvailable;
                            this.filteredDataCount = result.result.total;
                            this.availableData = result.result.objects.map(function (item) {
                                // This call givs us a normalized genome result object.
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
                                    attached: false,
                                    workspaceReference: genomeRecord.ws_ref
                                };
                            }.bind(this));
                            // for now assume that all items before the page have been fetched
                            this.fetchedDataCount = (this.page + 1) * this.pageSize + this.availableData.length;
                            return this.availableData;
                        }.bind(this));

                    return queryState.promise;
                }.bind(this))
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
            value: function () {
                // if (!this.queryExpression) {
                //     this.filteredData = this.availableData;
                //     return this.availableData;
                // }
                // if (!this.availableData) {
                //     throw new Error('No data to query');
                // }
                var _this = this;

                return this.searchApi.referenceGenomeSearch({
                    source: this.config.source,
                    pageSize: this.itemsPerPage,
                    query: this.queryExpression,
                    page: this.page
                })
                    .then(function (result) {
                        _this.availableDataCount = result.totalAvailable;
                        _this.filteredDataCount = result.result.total;
                        _this.availableData = result.result.objects.map(function (item) {
                            // This call givs us a normalized genome result object.
                            // In porting this over, we are preserving the field names.
                            var genomeRecord = parseGenomeSearchResultItem(item);

                            var name = _this.titleTemplate(genomeRecord);
                            var metadata = common.applyMetadataTemplates(_this.metadataTemplates, genomeRecord);
                            return {
                                info: null,
                                id: genomeRecord.genome_id,
                                objectId: null,
                                name: name,
                                objectName: genomeRecord.object_name,
                                metadata: metadata,
                                ws: _this.config.workspaceName,
                                type: _this.config.type,
                                attached: false
                            };
                        });
                        return _this.availableData;
                    }.bind(this));
            }
        },
        load: {
            value: function() {
                return this.narrativeService.callFunc('list_objects_with_sets', [{
                    ws_name: this.config.workspaceName,
                    types: [this.config.type],
                    includeMetadata: 1
                }])
                    .spread(function(data) {
                        this.availableData = data.data.map(function (item) {
                            var info = item.object_info;
                            var objectName = info[1];
                            var objectMeta = info[10] || {};
                            return {
                                info: info,
                                objectName: objectName,
                                metadata: objectMeta
                            };
                        });
                        this.availableDataCount = this.availableData.length;                        
                    }.bind(this));
            }
        }
    });

    return SearchDataSource;
});