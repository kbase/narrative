/*
search2DataSource

The search data source performs a fresh search with every new query.
Whereas the workspace data source fetches the data once, and then performs
a search against these cached results
*/
define(['bluebird', 'handlebars', 'common/searchAPI2', './common'], function (
    Promise,
    Handlebars,
    SearchAPI2,
    common
) {
    'use strict';

    class RefDataSearch {
        constructor({ url, token, timeout }) {
            this.url = url;
            this.token = token;
            this.searchAPI2 = new SearchAPI2({ url: this.url, token: this.token });
            this.timeout = timeout;
        }

        referenceGenomeTotal({ source }) {
            const params = {
                query: {
                    bool: {
                        must: [
                            {
                                term: {
                                    tags: 'refdata',
                                },
                            },
                            {
                                term: {
                                    source,
                                },
                            },
                        ],
                    },
                },
                only_public: true,
                indexes: ['genome'],
                size: 0,
                from: 0,
                track_total_hits: true,
            };
            return this.searchAPI2
                .search_objects({ params, timeout: this.timeout })
                .then((result) => {
                    return result.count;
                });
        }

        referenceGenomeDataSearch({ source, query, offset, limit }) {
            const params = {
                query: {
                    bool: {
                        must: [
                            {
                                term: {
                                    tags: 'refdata',
                                },
                            },
                            {
                                term: {
                                    source,
                                },
                            },
                        ],
                    },
                },
                sort: [
                    { 'scientific_name.raw': { order: 'asc' } },
                    { genome_id: { order: 'asc' } },
                ],
                only_public: true,
                indexes: ['genome'],
                size: limit,
                from: offset,
                track_total_hits: true,
            };
            if (query !== null) {
                // Note that this rather convoluted-looking filter how one implements a required "or" filter.
                // Having the "should" within a "must" ensures that the at least one of the "should" matches
                // must succeed. We want a filter here because we don't care about scoring.
                // There may be better ways to form this query, but this one does work.
                params.query.bool.filter = {
                    bool: {
                        must: {
                            bool: {
                                should: [
                                    {
                                        match: {
                                            scientific_name: {
                                                query: query,
                                                operator: 'AND',
                                            },
                                        },
                                    },
                                    {
                                        match: {
                                            source_id: query,
                                        },
                                    },
                                    {
                                        match: {
                                            genome_id: query,
                                        },
                                    },
                                    {
                                        match: {
                                            taxonomy: {
                                                query: query,
                                                operator: 'AND',
                                            },
                                        },
                                    },
                                ],
                            },
                        },
                    },
                };
            }
            return this.searchAPI2.search_objects({ params, timeout: this.timeout });
        }

        referenceGenomeSearch({ source, query, page, pageSize }) {
            const offset = page * pageSize;
            const limit = pageSize;
            return Promise.all([
                this.referenceGenomeTotal({ source }),
                this.referenceGenomeDataSearch({ source, query, offset, limit }),
            ]).then(([totalAvailable, result]) => {
                return {
                    totalAvailable,
                    result,
                };
            });
        }
    }

    function parseGenomeSearchResultItem(item) {
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
            object_name: item.doc.obj_name,
        };
    }

    return Object.create(
        {},
        {
            init: {
                value: function (arg) {
                    common.requireArg(arg, 'config');
                    common.requireArg(arg, 'token');
                    common.requireArg(arg, 'urls.searchapi2');
                    common.requireArg(arg, 'pageSize');
                    const {
                        config,
                        token,
                        urls: { searchapi2 },
                        pageSize,
                    } = arg;

                    this.pageSize = pageSize;

                    this.currentPage = null;
                    this.page = null;
                    this.config = config;
                    this.queryExpression = null;
                    this.availableData = null;
                    this.fetchedDataCount = null;
                    this.filteredData = null;
                    this.searchApi = new RefDataSearch({
                        url: searchapi2,
                        token,
                        timeout: config.timeout,
                    });
                    this.searchState = {
                        lastSearchAt: null,
                        inProgress: false,
                        lastQuery: null,
                        currentQueryState: null,
                    };
                    this.titleTemplate = Handlebars.compile(this.config.templates.title);
                    this.metadataTemplates = common.compileTemplates(
                        this.config.templates.metadata
                    );
                    return this;
                },
            },
            search: {
                value: function (query) {
                    return Promise.try(() => {
                        if (this.searchState.currentQueryState) {
                            return null;
                        }

                        // Prepare page number
                        let page;
                        if (query.page) {
                            page = query.page;
                        } else {
                            page = 1;
                        }
                        this.page = page;

                        // Prepare search input
                        const queryInput = query.input;
                        let newQuery;
                        if (!queryInput) {
                            newQuery = null;
                        } else if (queryInput === '*') {
                            newQuery = null;
                        } else {
                            // strip off "*" suffix from any terms in this search; it does not
                            // act as a wildcard for search2, and would be interpreted as a
                            // literal part of the search string.
                            // The "*" will have been added by the generic search ui code handling
                            // itself, not the user.
                            newQuery = queryInput
                                .split(/[ ]+/)
                                .map((term) => {
                                    if (term.charAt(term.length - 1) === '*') {
                                        return term.slice(0, -1);
                                    } else {
                                        return term;
                                    }
                                })
                                .join(' ');
                        }
                        this.queryExpression = newQuery;

                        // Create state for this specific search
                        const now = new Date().getTime();

                        const queryState = {
                            query,
                            page,
                            started: now,
                            promise: null,
                            canceled: false,
                        };

                        // And update the uber-search-state.
                        this.searchState.currentQueryState = queryState;
                        this.searchState.lastSearchAt = now;
                        this.searchState.lastQuery = newQuery;

                        queryState.promise = this.searchApi
                            .referenceGenomeSearch({
                                source: this.config.source,
                                pageSize: this.pageSize,
                                query: this.queryExpression,
                                page: this.page - 1,
                            })
                            .then((result) => {
                                this.availableDataCount = result.totalAvailable;
                                this.filteredDataCount = result.result.count;
                                this.availableData = result.result.hits.map((item, index) => {
                                    // This call gives us a normalized genome result object.
                                    // In porting this over, we are preserving the field names.
                                    const genomeRecord = parseGenomeSearchResultItem(item);

                                    const name = this.titleTemplate(genomeRecord);
                                    const metadata = common.applyMetadataTemplates(
                                        this.metadataTemplates,
                                        genomeRecord
                                    );
                                    return {
                                        rowNumber: index + (this.page - 1) * this.pageSize + 1,
                                        info: null,
                                        id: genomeRecord.genome_id,
                                        objectId: null,
                                        name,
                                        objectName: genomeRecord.object_name,
                                        metadata,
                                        ws: this.config.workspaceName,
                                        type: this.config.type,
                                        attached: false,
                                        workspaceReference: { ref: genomeRecord.ws_ref },
                                    };
                                });
                                // assume that all items before the page have been fetched
                                this.fetchedDataCount =
                                    (this.page - 1) * this.pageSize + this.availableData.length;
                                return this.availableData;
                            })
                            .catch((error) => {
                                if (error instanceof DOMException && error.name === 'AbortError') {
                                    const errorMsg = `Request canceled - perhaps timed out after ${this.config.timeout}ms`;
                                    throw new Error(errorMsg);
                                }
                                throw error;
                            });

                        return queryState.promise;
                    }).finally(() => {
                        this.searchState.currentQueryState = null;
                    });
                },
            },
        }
    );
});
