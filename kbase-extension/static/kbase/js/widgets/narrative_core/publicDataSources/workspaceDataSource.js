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
                common.requireArg(arg, 'dataSourceConfig');
                common.requireArg(arg, 'token');
                common.requireArg(arg, 'serviceWizardURL');
                common.requireArg(arg, 'pageSize');

                this.pageSize = arg.pageSize;
                this.currentPage = null;
                this.dataSourceConfig = arg.dataSourceConfig;
                this.queryExpression = null;
                this.availableData = null;
                this.filteredData = null;
                this.narrativeService = new DynamicServiceClient({
                    module: 'NarrativeService',
                    url: arg.serviceWizardURL, 
                    token: arg.token
                });
                // without filter
                this.availableDataCount = null;
                // with filter
                this.totalResults = null;
                this.titleTemplate = Handlebars.compile(this.dataSourceConfig.templates.title);             
                this.metadataTemplates = common.compileTemplates(this.dataSourceConfig.templates.metadata);
                return this;
            }
        },
        query: {
            value: function(query) {
                this.setQuery(query);
                return this.applyQuery();
            }
        },
        setQuery: {
            value: function(newQueryInput) {
                this.queryExpression = newQueryInput.replace(/[*]/g,' ').trim().toLowerCase();
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
                var _this = this;
                return Promise.try(function () {
                    // workspace based data sources load _all_ of the data first, 
                    // then search/filter over that.
                
                    if (_this.availableData === null) {
                        return _this.loadData();
                    }
                })
                    .then(function () {
                        // Prepare page number
                        _this.setPage(query.page);

                        // Prepare search input
                        _this.setQuery(query.input);

                        _this.applyQuery();

                        _this.applyPage();

                        return _this.render();
                    });
            }
        },
        applyQuery: {
            value: function () {                
                if (!this.queryExpression) {
                    this.filteredData = this.availableData;
                    this.filteredDataCount = this.filteredData.length;
                    return this.availableData;
                }
                if (!this.availableData) {
                    throw new Error('No data to query');
                    // return null;
                }
                this.filteredData = this.availableData.filter(function (item) {
                    return (this.dataSourceConfig.searchFields.some(function (field) {
                        var value = Utils.getProp(item, field);
                        if (value && value.toLowerCase().indexOf(this.queryExpression) >= 0) {
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
            }
        },
        loadData: {
            value: function() {
                return this.narrativeService.callFunc('list_objects_with_sets', [{
                    ws_name: this.dataSourceConfig.workspaceName,
                    types: [this.dataSourceConfig.type],
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
        },
        // TODO: look at this structure, fold into above.
        render: {
            value: function () {
                return this.currentResultData.map(function (item) {
                    var name = this.titleTemplate(item);
                    var metadata = common.applyMetadataTemplates(this.metadataTemplates, item);
                    return {
                        info: item.info,
                        id: item.info[0],
                        objectId: item.info[0],
                        name: name,
                        objectName: item.info[1],
                        metadata: metadata,
                        ws: this.dataSourceConfig.workspaceName,
                        type: this.dataSourceConfig.type,
                        attached: false
                    };
                }.bind(this));
            }
        }
    });

    return WorkspaceDataSource;
});