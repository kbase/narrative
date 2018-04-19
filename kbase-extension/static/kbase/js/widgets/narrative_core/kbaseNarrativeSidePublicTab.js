/*global define*/
/*jslint white: true*/
/**
 * "Import" tab on data side panel.
 * @author Roman Sutormin <rsutormin@lbl.gov>
 * @public
 */
define ([
    'kbwidget',
    'bootstrap',
    'handlebars',
    'jquery',
    'bluebird',
    'numeral',
    'narrativeConfig',
    'kbaseAuthenticatedWidget',
    'base/js/namespace',
    'kb_common/jsonRpc/dynamicServiceClient',
    'kb_common/jsonRpc/genericClient',
    'util/icon',
    'util/string',
    'util/bootstrapDialog',
    'common/kbaseSearchEngine',
    'common/runtime',
    'text!kbase/templates/data_slideout/object_row.html',
    'text!kbase/templates/data_slideout/action_button_partial.html',
    'text!kbase/templates/data_slideout/jgi_data_policy.html',
    'text!kbase/templates/data_slideout/data_policy_panel.html'
], function (
    KBWidget,
    bootstrap,
    Handlebars,
    $,
    Promise,
    numeral,
    Config,
    kbaseAuthenticatedWidget,
    Jupyter,
    DynamicServiceClient,
    ServiceClient,
    Icon,
    StringUtil,
    BootstrapDialog,
    KBaseSearchEngine,
    Runtime,
    StagingRowHtml,
    ActionButtonHtml,
    JGIDataPolicyHtml,
    DataPolicyPanelHtml
) {
    'use strict';

    function formatValue(value) {
        if (typeof value === 'undefined' || 
            (typeof value === 'string' && value.length === 0)) {
            return '-';
        } else {
            return String(value);
        }
    }
    function formatItem(item) {
        return [
            item.label, 
            ':&nbsp;',
            formatValue(item.value)
        ].join('');
    }

    // metadata is represented as an array of simple objects with 
    // props label, value -or-
    // an array of the same.
    // 
    function metadataToTable(metadata) {
        var $table = $('<table>')
            .css('font-size', '80%');

        metadata.forEach(function (item) {
            var $row;
            var value;
            if (item.value instanceof Array) {
                value = item.value.map(function (item) {
                    return formatItem(item);
                }).join('; ');
            } else {
                value = formatValue(item.value);
            }

            $row = $('<tr>')
                .append($('<td>')
                    .css('font-style', 'italic')
                    .css('padding-right', '4px')
                    .css('color', '#AAA')
                    .text(item.label))
                .append($('<td>').html(value));

            $table.append($row);
        });
        return $table;
    }

    function renderTotals(found, total) {
        var $totals = $('<span>').addClass('kb-data-list-type');
        if (total === 0) {
            $totals
                .append($('<span>None available</span>'));
        } else if (found === 0) {
            $totals
                .append($('<span>').css('font-weight', 'bold').text('None found out of '))
                .append($('<span>').text(numeral(total).format('0,0')))
                .append($('<span>').text(' available'));
        } else if (total > found) {
            $totals
                .append($('<span>').css('font-weight', 'bold').text(numeral(found).format('0,0')))
                .append($('<span>').text(' found out of '))
                .append($('<span>').text(numeral(total).format('0,0')))
                .append($('<span>').text(' available'));
                
        } else {
            $totals
                .append($('<span>').text(numeral(total).format('0,0')))
                .append($('<span>').text(' available'));
        }
        return $totals;
    }

    function getNextAutoSuffix(targetName, narrativeObjects, nextSuffix) {
        var targetNameRe = new RegExp('^' + targetName + '$');
        var correctedTargetNameRe = new RegExp('^' + targetName + '_([\\d]+)$');
        var foundRoot;
        var maxSuffix;
        if (narrativeObjects) {
            narrativeObjects.forEach(function (object) {
                var name = object[1];
                var m = targetNameRe.exec(name);
                if (m) {
                    foundRoot = true;
                    return;
                }
                m = correctedTargetNameRe.exec(name);
                if (m) {
                    maxSuffix = Math.max(maxSuffix || 0, parseInt(m[1], 10));
                    return;
                }
            });
        }
       
        // The suffix logic is careflly crafted to accomodate retry (via nextSuffix)
        // and automatic next suffix via the max suffix determined above.
        var suffix;
        if (maxSuffix) {
            if (nextSuffix) {
                // a previous attempt to copy failed due to the object already existing. 
                // We honor the maxSuffix found if greater, otherwise use this one.
                if (maxSuffix > nextSuffix) {
                    suffix = maxSuffix + 1;
                } else {
                    suffix = nextSuffix;
                }
            } else  {
                suffix = maxSuffix + 1;
            }
        } else if (foundRoot) {
            if (nextSuffix) {
                suffix = nextSuffix;
            } else {
                suffix = 1;
            }
        }
        return suffix;
    }

    return KBWidget({
        name: 'kbaseNarrativeSidePublicTab',
        parent : kbaseAuthenticatedWidget,
        version: '1.0.0',
        options: {
            $importStatus:$('<div>'),
            addToNarrativeButton: null,
            selectedItems: null,
            lp_url: Config.url('landing_pages'),
            ws_name: null
        },
        token: null,
        wsName: null,
        searchUrlPrefix: Config.url('search'),
        loadingImage: Config.get('loading_gif'),
        wsUrl: Config.url('workspace'),
        workspace: null,
        jgiGateway: null,
        narrativeService: null,
        mainListPanelHeight: '535px',
        maxNameLength: 60,
        totalPanel: null,
        resultPanel: null,
        objectList: null,
        currentCategory: null,
        currentQuery: null,
        currentPage: null,
        totalAvailable: null,
        totalResults: null,
        itemsPerPage: 20,
        maxAutoCopyCount: 5,
        narrativeObjects: {},
        narrativeObjectsClean: null,

        init: function(options) {
            this._super(options);

            this.data_icons = Config.get('icons').data;
            this.icon_colors = Config.get('icons').colors;
            this.wsName = Jupyter.narrative.getWorkspaceName();
            this.categoryDescr = Config.get('publicCategories');
            if (!this.categoryDescr) {
                this.categoryDescr = {};
            }
            if (Config.get('features').jgiPublicStaging) {
                this.categoryDescr['jgi_gateway'] = {
                    name: 'JGI Public Data (TEST)',
                    type: null,
                    ws: null,
                    search: false,
                    source: 'jgi_gateway'
                };
            }
            if (this.categoryDescr)
                this.categories = Object.keys(this.categoryDescr);

            Handlebars.registerPartial('actionPartial', ActionButtonHtml);
            this.stagingRowTmpl = Handlebars.compile(StagingRowHtml);

            $(document).on('dataUpdated.Narrative', function () {
                this.loadObjects();
            }.bind(this));

            this.loadObjects();

            return this;
        },

        loadObjects: function () {
            this.narrativeObjectsClean = false;
            $(document).trigger('dataLoadedQuery.Narrative', [null, this.IGNORE_VERSION, function(objects) {
                this.narrativeObjects = objects;
                this.narrativeObjectsClean = true;
            }.bind(this)]);
        },

        render: function() {
            if ((!this.token) || (!this.wsName))
                return;
            this.infoPanel = $('<div>');
            this.dataPolicyPanel = $('<div>');
            this.$elem.empty()
                .append(this.infoPanel)
                .append(this.dataPolicyPanel);
            if (!this.categories) {
                this.showError('Unable to load public data configuration! Please refresh your page to try again. If this continues to happen, please <a href="https://kbase.us/contact-us/">click here</a> to contact KBase with the problem.');
                return;
            }

            this.jgiGatewayClient = new DynamicServiceClient({
                module: 'jgi_gateway',
                url: Config.url('service_wizard'), 
                token: this.token
            });
            this.narrativeService = new DynamicServiceClient({
                module: 'NarrativeService',
                url: Config.url('service_wizard'), 
                token: this.token
            });
            this.workspace = new ServiceClient({
                module: 'Workspace',
                url: Config.url('workspace'),
                token: this.token
            });

            var mrg = {margin: '10px 0px 10px 0px'};
            var $typeInput = $('<select class="form-control">').css(mrg);
            for (var catPos in this.categories) {
                var cat = this.categories[catPos];
                var catName = this.categoryDescr[cat].name;
                $typeInput.append('<option value="'+cat+'">'+catName+'</option>');
            }

            var typeFilter = $('<div class="col-sm-3">').append($typeInput);
            var $filterInput = $('<input type="text" class="form-control" placeholder="Filter data...">');
            var $filterInputField = $('<div class="input-group">').css(mrg)
                .append($filterInput)
                .append($('<div class="input-group-addon btn btn-default">')
                    .append($('<span class="fa fa-search">'))
                    .css('padding', '4px 8px')
                    .click(function () {
                        this.searchAndRender($typeInput.val(), $filterInput.val());
                    }.bind(this)))
                .append($('<div class="input-group-addon btn btn-default">')
                    .append($('<span class="fa fa-times">'))
                    .css('padding', '4px 8px')
                    .click(function () {
                        $filterInput.val('');
                        inputFieldLastValue = '';
                        $filterInput.change();
                    }));

            /*
                search and render when the type dropdown changes.
            */
            $typeInput.change(function() {
                this.searchAndRender($typeInput.val(), $filterInput.val());
                /** HACK TO SHOW DATA POLICY **/
                if (!this.agreeDataPolicy && $typeInput.val() === 'jgi_gateway') {
                    this.dataPolicyPanel.show();
                    this.showDataPolicy();
                }
                else {
                    this.dataPolicyPanel.hide();
                }
                /** END DATA POLICY HACK **/
            }.bind(this));

            /*
                search and render only when input change is detected.
            */
            var inputFieldLastValue = null;
            $filterInput.change(function() {
                inputFieldLastValue = $filterInput.val();
                inputFieldState();
                this.searchAndRender($typeInput.val(), $filterInput.val());
            }.bind(this));

            function inputFieldState() {
                if ($filterInput.val() === '') {
                    $filterInput.css('background-color', 'transparent');
                    return;
                }
                if (inputFieldLastValue !== $filterInput.val()) {
                    $filterInput.css('background-color', 'rgba(255, 245, 158, 1)');
                } else {
                    $filterInput.css('background-color', 'rgba(209, 226, 255, 1)');
                }            
            }

            $filterInput.keyup(function () {
                inputFieldState();
            });


            /*
                search and render for every keystroke!
            */
            // filterInput.keyup(function() {
            //     this.searchAndRender(typeInput.val(), filterInput.val());
            // }.bind(this));

            var searchFilter = $('<div class="col-sm-9">').append($filterInputField);

            var header = $('<div class="row">').css({'margin': '0px 10px 0px 10px'}).append(typeFilter).append(searchFilter);
            this.$elem.append(header);
            this.totalPanel = $('<div>').css({'margin': '0px 0px 0px 10px'});
            this.$elem.append(this.totalPanel);

            var self = this;
            this.resultPanel = $('<div>')
                .css({'overflow-x' : 'hidden', 'overflow-y':'auto', 'height':this.mainListPanelHeight })
                .on('scroll', function() {
                    if($(this).scrollTop() + $(this).innerHeight() >= this.scrollHeight) {
                        self.renderMore(false);
                    }
                });
            this.$elem.append(this.resultPanel);
            this.searchAndRender($typeInput.val(), $filterInput.val());
            return this;
        },

        searchAndRender: function(category, query) {
            if (query) {
                query = query.trim();
                if (query.length == 0) {
                    query = '*';
                } else if (query.indexOf('"') < 0) {
                    var parts = query.split(/\s+/);
                    for (var i in parts) {
                        if (parts[i].indexOf('*', parts[i].length - 1) < 0) {
                            parts[i] = parts[i] + '*';
                        }
                    }
                    query = parts.join(' ');
                }
            } else {
                query = '*';
            }

            // Duplicate queries are suppressed.
            if (self.currentQuery && self.currentQuery === query && category === self.currentCategory) {
                return;
            }

            // Reset the ui.
            this.totalPanel.empty();
            this.resultPanel.empty();

            // Reset the query data structures.
            this.objectList = [];
            this.currentCategory = category;
            this.currentQuery = query;
            this.currentPage = 0;
            this.totalAvailable = null;
            this.totalResults = null;

            // Get and render the first batch of data.
            // Note that the loading ui is only displayed on the initial load.
            this.totalPanel.append($('<span>').addClass('kb-data-list-type').append('<img src="'+this.loadingImage+'"/> searching...'));
            this.renderMore(true);
        },

        renderFromWorkspace: function(cat) {
            if (this.currentPage > 0) {
                return;
            }
            this.currentPage++;
            var type = cat.type;
            var ws = cat.ws;
            var that = this;

            var thisQuery = this.currentQuery;
            this.narrativeService.callFunc('list_objects_with_sets', [{
                ws_name: ws,
                types: [type]
            }])
                .spread(function(data) {
                    data = data.data;
                    if (thisQuery !== this.currentQuery)
                        return;
                    var query = this.currentQuery.replace(/[*]/g,' ').trim().toLowerCase();
                    for (var i=0; i<data.length; i++) {
                        var info = data[i].object_info;
                        // object_info:
                        // [0] : obj_id objid // [1] : obj_name name // [2] : type_string type
                        // [3] : timestamp save_date // [4] : int version // [5] : username saved_by
                        // [6] : ws_id wsid // [7] : ws_name workspace // [8] : string chsum
                        // [9] : int size // [10] : usermeta meta
                        var name = info[1];
                        var id = info[0];
                        var metadata = [];
                        var objectMeta = info[10] || {};
                        if (this.currentCategory === 'plant_gnms') {
                            if (objectMeta.Name) {
                                metadata.push({
                                    label: 'ID',
                                    value: objectMeta.Name
                                });
                            }
                            metadata.push({
                                label: 'Source',
                                value: objectMeta.Source
                            }, {
                                label: 'Genes',
                                value: objectMeta['Number features']
                            });
                        }
                        if(query) {
                            if (name.toLowerCase().indexOf(query) == -1)
                                continue;
                        }
                        this.objectList.push({
                            $div: null,
                            info: info,
                            id: id,
                            name: name,
                            objectName: name,
                            metadata: metadata,
                            ws: cat.ws,
                            type: cat.type,
                            attached: false
                        });
                        this.attachRow(this.objectList.length - 1);
                    }
                    // 
                    var totalAvailable = data.length;
                    that.totalResults = this.objectList.length;

                    var $totals = renderTotals(that.totalResults, totalAvailable);                    
                    this.totalPanel.html($totals);
                    
                }.bind(this))
                .catch(function(error) {
                    console.error(error);
                    var $total = $('<span class="kb-data-list-type">');
                    if (error.error && error.error.message.match(/^No workspace with name/)) {
                        $total.html('Error: Data source unavailable');
                    } else {
                        $total.html('Error fetching object info');
                    }
                    this.totalPanel.html($total);
                    // this.totalPanel.empty();
                    // this.totalPanel.append($('<span>').addClass('kb-data-list-type')
                    //     .append('Total results: 0'));
                }.bind(this));
        },
        
        objectGuidToRef: function (guid) {
            var m = guid.match(/^WS:(\d+)\/(\d+)\/(\d+)$/);
            var objectRef = m.slice(1, 4).join('/');
            return {
                workspaceId: parseInt(m[1]),
                objectId: parseInt(m[2]),
                version: parseInt(m[3]),
                ref: objectRef,
                dataviewId: objectRef
            };
        },

        formatInt: function (value, format, defaultValue) {
            if (typeof value === 'undefined' || value === null) {
                return defaultValue;
            }
            // return String(value);
            return numeral(value).format(format);
        },

        parseGenomeIndexV1: function (item) {
            return {
                genome_id: item.data.id,
                genome_source: item.data.source,
                genome_source_id: item.data.source_id,
                scientific_name: item.data.scientific_name,
                domain: item.data.domain,
                num_contigs: item.data.num_contigs,
                num_cds: item.data.cdss,
                num_features: item.data.features,
                ws_ref: this.objectGuidToRef(item.guid).ref,
                workspace_name: null,
                object_name: item.object_name
            };
        },

        parseGenomeIndexV2: function (item) {
            return {
                genome_id: item.data.id,
                genome_source: item.data.source,
                genome_source_id: item.data.source_id,
                scientific_name: item.data.scientific_name,
                domain: item.data.domain,
                num_contigs: item.data.num_contigs,
                num_cds: item.data.cdss,
                num_features: item.data.feature_counts,
                ws_ref: this.objectGuidToRef(item.guid).ref,
                workspace_name: null,
                object_name: item.object_name
            };
        },

        parseGenomeSearchResultItem: function (item) {
            // get the type and version
            var indexType = item.type.toLowerCase();
            var indexTypeVersion = item.type_ver;

            if (indexType !== 'genome') {
                throw new Error('Item is not a genome: ' + indexType);
            }

            switch (indexTypeVersion) {
            case 1:
                return this.parseGenomeIndexV1(item);
            case 2:
                return this.parseGenomeIndexV2(item);
            default:
                throw new Error('Unsupported genome index version: ' + indexTypeVersion);
            }
        },

        // nb: the data source is derived from the dropdown the user used to select
        // the public data source.

        /*
            Execute a search query, update the query results data structures,
            and update the ui.
            All in one!

            Supports query cancellation or suppression logic in this way:

            If it is an initial query it is expected to populate an empty display, 
            so any pending queries are canceled.

            If it is not an initial query, it is due to paging/scrolling, and we need
            to abandon a new query if one is already pending. Otherwise we may end up 
        */
        renderFromSearch: function(dataSource, initial) {
            var that = this;

            if (typeof this.renderFromSearchState === 'undefined') {
                this.renderFromSearchState = {
                    lastSearchAt: null,
                    inProgress: false,
                    lastQuery: null,
                    currentQueryState: null
                };
            }

            if (this.renderFromSearchState.currentQueryState) {
                if (initial) {
                    this.renderFromSearchState.currentQueryState.promise.cancel();
                    this.renderFromSearchState.currentQueryState.canceled = true;
                } else {
                    return;
                }
            }


            this.currentPage++;

            // Prepare the query and page.
            var query;
            if (this.currentQuery === '*') {
                query = null;
            } else {
                // strip off "*" suffix if it was added by the code which 
                // calls this method.
                query = this.currentQuery.split(/[ ]+/)
                    .map(function (term) {
                        if (term.charAt(term.length-1) === '*') {
                            return term.slice(0, -1);
                        } else {
                            return term;
                        } 
                    }).join(' ');
            }

            var page;
            if (this.currentPage) {
                page = this.currentPage - 1;
            } else {
                page = 0;
            }

            /*
            It is expected that a search data source specifies the 
            source id - the source id as specified in the object and propogated to the search index
            source label - the display name for the source
            type - kbase type for the refdata index; indexes are homogeneous

            note that the source id id is used to query search; if it spans indexes then the indexes 
            need to intersect on the fields used in the query/render method.

            */
            var now = new Date().getTime();

            if (this.renderFromSearchState.lastQuery !== query) {
                this.renderFromSearchState.lastQuery = query;
            }
            this.renderFromSearchState.lastSearchAt = now;

            var queryState = {
                query: query,
                page: page,
                started: now,
                promise: null,
                canceled: false
            };

            this.renderFromSearchState.currentQueryState = queryState;

            var searchCall = (function (dataSource, query, page, itemsPerPage, token) {
                
                var searchApi = KBaseSearchEngine.make({
                    url: Config.url('KBaseSearchEngine'),
                    token: token
                });

                // add debouncing here. it may not be appropriate for the general purpose 
                // search input.
                var methods = {
                    refseq: function () {
                        return searchApi.referenceGenomeSearch({
                            source: dataSource.source,
                            pageSize: itemsPerPage,
                            query: query,
                            page: page
                        });
                    }
                };
                return methods[dataSource.source];
            }(dataSource, query, page, this.itemsPerPage, this.token));

            queryState.promise = searchCall()
                .then(function(result) {
                    if (queryState.canceled) {
                        console.warn('query canceled');
                        return;
                    }

                    that.totalAvailable = result.totalAvailable;
                    that.totalResults = result.result.total;
                    result.result.objects.forEach(function (item) {
                        // This call givs us a normalized genome result object.
                        // In porting this over, we are preserving the field names.
                        var genomeRecord = that.parseGenomeSearchResultItem(item);

                        var id = genomeRecord.genome_id;
                        var genome_source_id = '';
                        if (genomeRecord.genome_source_id) {
                            genome_source_id = String(genomeRecord.genome_source_id);
                        }
                        var name = genomeRecord.scientific_name;
                        var domain = genomeRecord.domain;
                        var ws_ref = null;
                        if (genomeRecord.ws_ref) {
                            ws_ref = genomeRecord.ws_ref;
                        }
                        var ws_name = dataSource.ws;
                        if(genomeRecord.workspace_name) {
                            ws_name = genomeRecord.workspace_name;
                        }

                        // This creates the generic object results list item.
                        that.objectList.push({
                            $div: null,
                            info: null,
                            id: id,
                            name: name,
                            objectName: genomeRecord.object_name, 
                            // This is a problem, because ordering of the fields is in no way
                            // guaranteed.
                            metadata: [
                                {
                                    label: 'Domain',
                                    value: domain
                                },
                                // original one
                                // {
                                //     label: 'Source',
                                //     value: id + ' (' + source + ') ' + genome_source_id
                                // },
                                // but doesn't this make more sense?
                                {   
                                    label: 'KBase ID',
                                    value: id
                                },
                                {
                                    label: dataSource.sourceLabel + ' ID',
                                    value: genome_source_id
                                },
                                {
                                    label: 'Stats',
                                    value:  [
                                        {
                                            label: 'Contigs',
                                            value: that.formatInt(genomeRecord.num_contigs, '0,0', 'n/a')
                                        },
                                        {
                                            label: 'Features',
                                            value: that.formatInt(genomeRecord.num_features, '0,0', 'n/a')
                                        }
                                    ]
                                }
                                
                            ],
                            ws: ws_name,
                            type: dataSource.type,
                            attached: false,
                            ws_ref: ws_ref
                        });
                        that.attachRow(that.objectList.length - 1);
                    });

                    var $totals = renderTotals(that.totalResults, that.totalAvailable);
                    that.totalPanel.html($totals);

                    that.renderFromSearchState.currentQueryState = null;
                })
                .catch(function (error) {
                    console.error(error);
                    if (that.objectList.length == 0) {
                        that.totalPanel.empty();
                        that.totalPanel.append($('<span>    ').addClass('kb-data-list-type')
                            .append('Total results: 0'));
                    }
                });
        },

        searchInService: function(query, page, service) {
            if (service === 'jgi_gateway') {
                return this.jgiGateway.callFunc('search_jgi',[{
                    search_string: query,
                    limit: this.itemsPerPage,
                    page: page-1
                }])
                    .spread(function(results) {
                        return {
                            query: query,
                            results: results
                        };
                    });
            }
        },

        stageFile: function(source, id) {
            return function() {
                if (source === 'jgi') {
                    return this.jgiGateway.callFunc('stage_objects',[{ 
                        ids: [id] 
                    }]);
                }
            }.bind(this);
        },

        renderFromService: function(cat) {
            this.currentServiceQuery = this.currentQuery;
            this.currentPage++;
            this.searchInService(this.currentServiceQuery, this.currentPage, cat.source)
                .then(function(results) {
                    if (results.query !== this.currentQuery) {
                        return;
                    }
                    var items = results.results[0];

                    for (var i=0; i<items.hits.length; i++) {
                        var hit = items.hits[i];
                        this.objectList.push({
                            $div: null,
                            info: null,
                            id: hit._id,
                            name: hit._source.file_name,
                            ws: null,
                            type: 'JGI.File',
                            attached: false,
                            copyAction: this.stageFile('jgi', hit._id),
                            hitMetadata: hit._source.metadata,
                            metadata: [
                                {
                                    label: 'File Id',
                                    value: hit._id
                                },
                                {
                                    label: 'File Type',
                                    value: hit._source.file_type[0]
                                },
                                {
                                    label: 'Project Id',
                                    value: hit._source.metadata.sequencing_project_id
                                }
                            ]
                        });
                        this.attachRow(this.objectList.length - 1, true);
                    }
                    this.totalPanel.empty();
                    this.totalPanel.append($('<span>').addClass('kb-data-list-type')
                        .append('Results: ' + this.objectList.length + ' of ' + items.total));
                }.bind(this))
                .catch(function(error) {
                    console.error(error);
                    this.showError('Unable to retrieve public data.');
                    this.totalPanel.empty();
                }.bind(this));
        },

        showDataPolicy: function() {
            var showPolicyModal = function() {
                var policyDialog = new BootstrapDialog({
                    title: 'JGI Data Usage and Download Policy (October 1, 2013)',
                    body: JGIDataPolicyHtml,
                    closeButton: true,
                    enterToTrigger: true,
                    buttons: [$('<button class="kb-primary-btn">OK</button>').click(function() {
                        policyDialog.hide();
                    })]
                });
                policyDialog.getElement().one('hidden.bs.modal', function() {
                    policyDialog.destroy();
                });
                policyDialog.show();
            };

            var $dataPolicyAlert = $(Handlebars.compile(DataPolicyPanelHtml)());
            $dataPolicyAlert.find('#view_policy_btn')
                .click(function() {
                    showPolicyModal();
                });
            $dataPolicyAlert.find('#agree_policy_btn')
                .click(function() {
                    this.agreeDataPolicy = true;
                    $dataPolicyAlert.slideUp();
                }.bind(this));

            this.dataPolicyPanel.empty().append($dataPolicyAlert);
        },

        renderMore: function(initial) {
            this.hideError();
            var cat = this.categoryDescr[this.currentCategory];
            if (!cat.search && cat.ws) {
                this.renderFromWorkspace(cat);
            } else if (cat.search) {
                this.renderFromSearch(cat, initial);
            } else {
                this.renderFromService(cat);
            }
        },

        attachRow: function(index, toStaging) {
            var obj = this.objectList[index];
            if (obj.attached) {
                return;
            }
            if (obj.$div) {
                this.resultPanel.append(obj.$div);
            } else {
                obj.$div = toStaging ? this.renderStagingObjectRowDiv(obj) : this.renderObjectRowDiv(obj);
                this.resultPanel.append(obj.$div);
            }
            obj.attached = true;
            this.n_objs_rendered++;
        },

        escapeSearchQuery: function(str) {
            return str.replace(/[%]/g, '').replace(/[:"\\]/g, '\\$&');
        },

        renderObjectRowDiv: function(object) {
            var self = this;
            var type_tokens = object.type.split('.');
            var type = type_tokens[1].split('-')[0];
            var copyText = ' Add';

            var $addDiv =
                $('<div>').append(
                    $('<button>').addClass('kb-primary-btn').css({'white-space':'nowrap', padding:'10px 15px'})
                        .append($('<span>').addClass('fa fa-chevron-circle-left')).append(copyText)
                        .on('click',function() { // probably should move action outside of render func, but oh well
                            $(this).attr('disabled', 'disabled');
                            $(this).html('<img src="'+self.loadingImage+'">');

                            var thisBtn = this;
                            var targetName = object.name;
                            if (!isNaN(targetName)) {
                                targetName = self.categoryDescr[self.currentCategory].type.split('.')[1] + ' ' + targetName;
                            }
                            targetName = targetName.replace(/[^a-zA-Z0-9|.-_]/g,'_');
                            self.copy(object, targetName, thisBtn);
                        }));

            var shortName = object.name;
            var isShortened=false;
            if (shortName.length>this.maxNameLength) {
                shortName = shortName.substring(0,this.maxNameLength-3)+'...';
                isShortened=true;
            }
            var landingPageLink = this.options.lp_url + object.ws + '/' + object.id;
            var provenanceLink = '/#objgraphview/'+object.ws+'/'+object.id;
            if(object['ws_ref']) {
                landingPageLink = this.options.lp_url + object.ws_ref;
                provenanceLink = '/#objgraphview/' + object.ws_ref;
            }
            var $name = $('<span>')
                .addClass('kb-data-list-name')
                .append('<a href="'+landingPageLink+'" target="_blank">' + shortName + '</a>');
            if (isShortened) { $name.tooltip({title:object.name, placement:'bottom'}); }

            var $btnToolbar = $('<span>').addClass('btn-toolbar pull-right').attr('role', 'toolbar').hide();
            var btnClasses = 'btn btn-xs btn-default';
            var css = {'color':'#888'};
            var $openLandingPage = $('<span>')
                // tooltips showing behind pullout, need to fix!
                //.tooltip({title:'Explore data', 'container':'#'+this.mainListId})
                .addClass(btnClasses)
                .append($('<span>').addClass('fa fa-binoculars').css(css))
                .click(function(e) {
                    e.stopPropagation();
                    window.open(landingPageLink);
                });

            var $openProvenance = $('<span>')
                .addClass(btnClasses).css(css)
                //.tooltip({title:'View data provenance and relationships', 'container':'body'})
                .append($('<span>').addClass('fa fa-sitemap fa-rotate-90').css(css))
                .click(function(e) {
                    e.stopPropagation();
                    window.open(provenanceLink);
                });
            $btnToolbar.append($openLandingPage).append($openProvenance);

            var titleElement = $('<div>').css({'xmargin':'10px'}).append($btnToolbar.hide()).append($name);

            if (object.metadata && object.metadata.length) {
                titleElement.append(metadataToTable(object.metadata));
            } else {
                titleElement.append('<br>').append('&nbsp;');
            }

            // Set data icon
            var $logo = $('<span>');
            Icon.buildDataIcon($logo, type);
            var $topTable = $('<table>')
                // set background to white looks better on DnD
                .css({'width':'100%','background':'#fff'})
                .append($('<tr>')
                    .append($('<td>')
                        .css({'width':'90px'})
                        .append($addDiv.hide()))
                    .append($('<td>')
                        .css({'width':'50px'})
                        .append($logo))
                    .append($('<td>')
                        .append(titleElement)));
            var $row = $('<div>')
                .css({margin:'2px',padding:'4px','margin-bottom': '5px'})
                .append($('<div>').addClass('kb-data-list-obj-row-main')
                    .append($topTable))
                // show/hide ellipses on hover, show extra info on click
                .mouseenter(function(){
                    $addDiv.show();
                    $btnToolbar.show();
                })
                .mouseleave(function(){
                    $addDiv.hide();
                    $btnToolbar.hide();
                });

            var $rowWithHr = $('<div>')
                .append($('<hr>')
                    .addClass('kb-data-list-row-hr')
                    .css({'margin-left':'155px'}))
                .append($row);
            return $rowWithHr;
        },

        renderStagingObjectRowDiv: function(object) {
            // basic rendering
            var $row = $(this.stagingRowTmpl({
                displayName: object.name,
                objModDate: object.modDate,
                simpleMetadata: object.metadata,
                buttonIcon: 'fa-chevron-circle-right',
                buttonAction: 'Stage',
                actionLeft: false,
                detailedMetadata: object.hitMetadata
            }));
            Icon.buildDataIcon($row.find('#icon'), 'file');

            // event binding
            $row.mouseenter(function() {
                $row.find('#action-button-div').show();
                $row.find('.btn-toolbar').show();
                $row.find('#meta-toggle').show();
            })
                .mouseleave(function() {
                    $row.find('#action-button-div').hide();
                    $row.find('.btn-toolbar').hide();
                    $row.find('#meta-toggle').hide();
                });

            $row.find('#more-metadata').empty().html('<pre>' + StringUtil.prettyPrintJSON(object.hitMetadata) + '</pre>');
            $row.find('#meta-toggle button').click(function() {
                $row.find('#more-metadata').slideToggle();
            });

            var self = this;
            $row.find('#action-button-div button').click(function() {
                if (!self.agreeDataPolicy) {
                    alert('You must agree to the JGI Data Policy before copying.');
                    return;
                }
                $(this).attr('disabled', 'disabled');
                $(this).html('<img src="' + Config.get('loading_gif') + '">');

                object.copyAction().then(function() {
                    $(this).html('Copied!');
                }.bind(this))
                    .catch(function(error) {
                        console.error(error);
                        $(this).html('Error!');
                    }.bind(this));
            });
            return $row;
        },


        /*
            TODO: rethink the logic here.

            copy should only be applicable if the workspace is writable. This check should either
            be here or should be a precondition (just let if fail otherwise.)

            the check for existence fo the object should not throw an error; the null value
            means the object could not be read, and since we have read access to this narrative, 
            that is the only possible error.
        */

        copy: function(object, targetName, thisBtn, nextSuffix) {
            var type = 'KBaseGenomes.Genome';

            // Determine whether the targetName already exists, or if 
            // copies exist and if so the maximum suffix.
            // This relies upon the narrativeObjects being updated from the data list.

            var suffix;
            if (this.narrativeObjects[type]) {
                suffix = getNextAutoSuffix(targetName, this.narrativeObjects[type], nextSuffix);
            }

            // If we have determined a suffix (to try), append it to the base object name
            // like _<suffix>
            var correctedTargetName = suffix ? targetName + '_' + suffix : targetName;

            // Attempt to get object info for the target object name. If it exists,
            // we try again with a hopefully unique filename.
            // If it fails with a specific error message indicating that the object could
            // not be found, hoorah, we can at least try (still may fail if can't write.)
            // Otherwise if some other error occured, provide a prompt and the user may
            // try manually again. (Not sure about that ??)
            // TODO: request ws api changes to support this. It is bad that we force a 500
            // error for the failure case (which is actually success!)
            // There really should be an "stat_object" call which provides object info
            return this.workspace.callFunc('get_object_info_new', [{
                objects: [{
                    ref: this.wsName + '/' + correctedTargetName,
                }],
                ignoreErrors: 1
            }])
                .spread(function(infos) {
                    // If an object already exists with this name, the attempt again,
                    // incrementing the suffix by 1. NB this will loop until a unique
                    // filename is found.
                    if (infos[0] === null) {
                        return this.copyFinal(object, correctedTargetName, thisBtn);
                    }
                    return this.copy(object, targetName, thisBtn, suffix + 1);
                }.bind(this))
                .catch(function(error) {
                    console.error('Error getting object info for copy', error);
                    this.showError(error);
                }.bind(this));
        },

        copyFinal: function(object, targetName, thisBtn) {
            return this.narrativeService.callFunc('copy_object', [{
                ref: object.ws + '/' + object.id,
                target_ws_name: this.wsName,
                target_name: targetName
            }])
                .spread(function() {
                    $(thisBtn).prop('disabled', false);
                    $(thisBtn).html('<span class="fa fa-chevron-circle-left"/> Add');
                    this.trigger('updateDataList.Narrative');
                }.bind(this))
                .catch(function(error) {
                    $(thisBtn).html('Error');
                    if (error.error && error.error.message) {
                        if (error.error.message.indexOf('may not write to workspace')>=0) {
                            this.options.$importStatus.html($('<div>').css({'color':'#F44336','width':'500px'}).append('Error: you do not have permission to add data to this Narrative.'));
                        } else {
                            this.options.$importStatus.html($('<div>').css({'color':'#F44336','width':'500px'}).append('Error: '+error.error.message));
                        }
                    } else {
                        this.options.$importStatus.html($('<div>').css({'color':'#F44336','width':'500px'}).append('Unknown error!'));
                    }
                    console.error(error);
                }.bind(this));
        },

        showError: function(error) {
            var errorMsg = error;
            if (error.error && error.error.message)
                errorMsg = error.error.message;
            this.infoPanel.empty();
            this.infoPanel.append('<div class="alert alert-danger">Error: '+errorMsg+'</span>');
        },

        hideError: function() {
            this.infoPanel.empty();
        },

        loggedInCallback: function(event, auth) {
            this.token = auth.token;
            return this;
        },

        loggedOutCallback: function() {
            this.token = null;
            return this;
        }
    });
});
