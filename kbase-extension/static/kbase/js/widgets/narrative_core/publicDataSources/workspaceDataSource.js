define([
    'bluebird',
    'handlebars',
    'kb_common/utils',
    'kb_common/jsonRpc/dynamicServiceClient',
    './common',
], (Promise, Handlebars, Utils, DynamicServiceClient, common) => {
    'use strict';

    return Object.create(
        {},
        {
            init: {
                value: function (arg) {
                    common.requireArg(arg, 'config');
                    common.requireArg(arg, 'token');
                    common.requireArg(arg, 'urls.ServiceWizard');

                    this.paging = false;
                    this.config = arg.config;
                    this.queryExpression = null;
                    this.availableData = null;
                    this.filteredData = null;
                    this.narrativeService = new DynamicServiceClient({
                        module: 'NarrativeService',
                        url: arg.urls.ServiceWizard,
                        token: arg.token,
                    });
                    // without filter
                    this.availableDataCount = null;
                    this.fetchedDataCount = null;
                    // with filter
                    this.totalResults = null;
                    this.titleTemplate = Handlebars.compile(this.config.templates.title);
                    this.metadataTemplates = common.compileTemplates(
                        this.config.templates.metadata
                    );
                    // search state
                    this.searchState = {
                        lastSearchAt: null,
                        inProgress: false,
                        lastQuery: null,
                        queryState: null,
                    };
                    this.currentQueryExpression = null;
                    return this;
                },
            },
            query: {
                value: function (query) {
                    this.setQuery(query);
                    return this.applyQuery();
                },
            },
            parseQuery: {
                value: function (newQueryInput) {
                    return newQueryInput.replace(/[*]/g, ' ').trim().toLowerCase();
                },
            },
            search: {
                value: function (query) {
                    return Promise.try(() => {
                        if (this.searchState.inProgress) {
                            return null;
                        }
                        this.searchState.inProgress = true;
                        const now = new Date().getTime();
                        const queryState = {
                            query: query,
                            started: now,
                            promise: null,
                            canceled: false,
                        };

                        this.searchState.queryState = queryState;

                        queryState.promise = this.loadData()
                            .then(() => {
                                // Prepare search input
                                const searchExpression = this.parseQuery(query.input);
                                return this.applyQuery(searchExpression);
                            })
                            .finally(() => {
                                queryState.promise = null;
                                this.searchState.queryState = null;
                                this.searchState.inProgress = false;
                            });

                        return queryState.promise;
                    });
                },
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
                    this.filteredData = this.availableData.filter((item) => {
                        return this.config.searchFields.some((field) => {
                            const value = Utils.getProp(item, field);
                            return !!(value && value.toLowerCase().indexOf(queryExpression) >= 0);
                        });
                    });
                    this.currentResultData = this.filteredData;
                    this.filteredDataCount = this.filteredData.length;
                    return this.filteredData;
                },
            },
            loadData: {
                value: function () {
                    return Promise.try(() => {
                        if (this.availableData) {
                            return this.availableData;
                        }

                        return common
                            .listObjectsWithSets(
                                this.narrativeService,
                                this.config.workspaceName,
                                this.config.type
                            )
                            .then((data) => {
                                this.availableDataCount = data.length;
                                this.fetchedDataCount = data.length;
                                this.availableData = data
                                    .sort((a, b) => {
                                        const sortField = this.config.sort[0].field;
                                        const direction = this.config.sort[0].ascending ? 1 : -1;
                                        const aValue = Utils.getProp(a, sortField);
                                        const bValue = Utils.getProp(b, sortField);
                                        if (aValue < bValue) {
                                            return direction * -1;
                                        } else if (aValue === bValue) {
                                            return 0;
                                        } else {
                                            return direction;
                                        }
                                    })
                                    .map((item) => {
                                        const name = this.titleTemplate(item);
                                        const metadataList = common.applyMetadataTemplates(
                                            this.metadataTemplates,
                                            item
                                        );
                                        const ref = {
                                            workspaceId: item.info[6],
                                            objectId: item.info[0],
                                            version: item.info[4],
                                        };
                                        ref.ref = [ref.workspaceId, ref.objectId, ref.version].join(
                                            '/'
                                        );
                                        ref.dataviewId = ref.ref;
                                        return {
                                            info: item.info,
                                            id: item.info[0],
                                            objectId: item.info[0],
                                            name: name,
                                            objectName: item.info[1],
                                            metadata: item.metadata,
                                            metadataList,
                                            ws: this.config.workspaceName,
                                            type: this.config.type,
                                            attached: false,
                                            workspaceReference: ref,
                                        };
                                    });
                                return this.availableData;
                            });
                    });
                },
            },
        }
    );
});
