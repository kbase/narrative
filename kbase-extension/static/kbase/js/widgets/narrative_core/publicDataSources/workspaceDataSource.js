define([
    'bluebird',
    'handlebars',
    'kb_common/utils',
    'kb_common/jsonRpc/dynamicServiceClient',
    './common'
], function (
    Promise,
    Handlebars,
    Utils,
    DynamicServiceClient,
    common
) {
    'use strict';

    var WorkspaceDataSource = Object.create({}, {
        init: {
            value: function (arg) {
                common.requireArg(arg, 'config');
                common.requireArg(arg, 'token');
                common.requireArg(arg, 'urls.ServiceWizard');
                common.requireArg(arg, 'pageSize');

                this.pageSize = arg.pageSize;
                this.currentPage = null;
                this.config = arg.config;
                this.queryExpression = null;
                this.availableData = null;
                this.filteredData = null;
                this.narrativeService = new DynamicServiceClient({
                    module: 'NarrativeService',
                    url: arg.urls.ServiceWizard, 
                    token: arg.token
                });
                // without filter
                this.availableDataCount = null;
                this.fetchedDataCount = null;
                // with filter
                this.totalResults = null;
                this.titleTemplate = Handlebars.compile(this.config.templates.title);             
                this.metadataTemplates = common.compileTemplates(this.config.templates.metadata);
                // search state
                this.searchState = {
                    lastSearchAt: null,
                    inProgress: false,
                    lastQuery: null,
                    queryState: null
                };
                this.currentQueryExpression = null;
                return this;
            }
        },
        query: {
            value: function(query) {
                this.setQuery(query);
                return this.applyQuery();
            }
        },
        parseQuery: {
            value: function(newQueryInput) {
                return newQueryInput.replace(/[*]/g,' ').trim().toLowerCase();
            }
        },
        setPage: {
            value: function(newPage) {
                var page;
                if (newPage) {
                    page = newPage - 1;
                } else {
                    page = 0;
                }
                this.page = page;
            }
        },
        search: {
            value: function (query) {
                return Promise.try(function () {
                    if (this.searchState.inProgress) {
                        return null;
                    }
                    this.searchState.inProgress = true;
                    var now = new Date().getTime();
                    var queryState = {
                        query: query,
                        page: query.page,
                        started: now,
                        promise: null,
                        canceled: false
                    };

                    this.searchState.queryState = queryState;

                    queryState.promise = this.loadData()
                        .then(function () {
                            // Prepare page number
                            this.setPage(query.page);

                            // Prepare search input
                            var searchExpression = this.parseQuery(query.input);

                            this.applyQuery(searchExpression);

                            var paged = this.applyPage();

                            this.fetchedDataCount = this.page * this.pageSize + paged.length;

                            return this.transform();
                        }.bind(this))
                        .finally(function () {
                            queryState.promise = null;
                            this.searchState.queryState = null;
                            this.searchState.inProgress = false;
                        }.bind(this));

                    return queryState.promise;
                }.bind(this));                        
            }
        },        
        applyQuery: {
            value: function (queryExpression) {                
                if (!queryExpression) {
                    this.filteredData = this.availableData;
                    this.filteredDataCount = this.filteredData.length;
                    return this.availableData;
                }
                if (!this.availableData) {
                    throw new Error('No data to query');
                }
                if (queryExpression === this.currentQueryExpression) {
                    return this.filteredData;
                }
                this.filteredData = this.availableData.filter(function (item) {
                    return (this.config.searchFields.some(function (field) {
                        var value = Utils.getProp(item, field);
                        if (value && value.toLowerCase().indexOf(queryExpression) >= 0) {
                            return true;
                        }
                        return false;
                    }.bind(this)));
                }.bind(this));
                this.filteredDataCount = this.filteredData.length;
                return this.filteredData;
            }
        },  
        applyPage: {
            value: function() {
                // get page range.
                var start = this.pageSize * this.page;
                var end = start + this.pageSize;

                this.currentResultData = this.filteredData.slice(start, end);
                return this.currentResultData;
            }
        },
        loadData: {
            value: function() {
                return Promise.try(function () {
                    if (this.availableData) {
                        return this.availableData;
                    }
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
                            return this.availableData
                                .sort(function (a, b) {
                                    var sortField = this.config.sort[0].field;
                                    var direction = this.config.sort[0].ascending ? 1 : -1;
                                    var aValue = Utils.getProp(a, sortField);
                                    var bValue = Utils.getProp(b, sortField);
                                    if (aValue < bValue) {
                                        return direction * -1;
                                    } else if (aValue === bValue) {
                                        return 0;
                                    } else {
                                        return direction;
                                    }
                                }.bind(this));
                        }.bind(this));                        
                }.bind(this));
            }
        },
        // TODO: look at this structure, fold into above.
        transform: {
            value: function () {
                return this.currentResultData.map(function (item) {
                    var name = this.titleTemplate(item);
                    var metadata = common.applyMetadataTemplates(this.metadataTemplates, item);
                    var ref = {
                        workspaceId: item.info[6],
                        objectId: item.info[0],
                        version: item.info[4]                      
                    };
                    ref.ref = [ref.workspaceId, ref.objectId, ref.version].join('/');
                    ref.dataviewId = ref.ref;
                    return {
                        info: item.info,
                        id: item.info[0],
                        objectId: item.info[0],
                        name: name,
                        objectName: item.info[1],
                        metadata: metadata,
                        ws: this.config.workspaceName,
                        type: this.config.type,
                        attached: false,
                        workspaceReference: ref
                    };
                }.bind(this));
            }
        }
    });

    return WorkspaceDataSource;
});