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
    'kb_common/utils',
    'util/icon',
    'util/string',
    'util/bootstrapDialog',
    'common/kbaseSearchEngine',
    'common/runtime',
    'text!kbase/templates/data_slideout/action_button_partial.html',
    'text!kbase/templates/data_slideout/data_policy_panel.html',
    'widgets/narrative_core/publicDataSources/workspaceDataSource',
    'widgets/narrative_core/publicDataSources/searchDataSource'
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
    Utils,
    Icon,
    StringUtil,
    BootstrapDialog,
    KBaseSearchEngine,
    Runtime,
    ActionButtonHtml,
    DataPolicyPanelHtml,
    WorkspaceDataSource,
    SearchDataSource
) {
    'use strict';

    function formatValue(value) {
        if (typeof value === 'undefined' || 
            (typeof value === 'string' && value.length === 0)) {
            return '<span style="color: #AAA; font-weight: normal; font-style: italic">n/a</span>';
        } else {
            return String(value);
        }
    }
    function formatItem(item) {
        return [
            '<span style="color: #AAA; font-weight: normal; font-style: italic">' + item.label + ':</span>', 
            '&nbsp;',
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
                }).join('&nbsp;&nbsp;&nbsp;');
            } else {
                value = formatValue(item.value);
            }

            $row = $('<tr>')
                .css('margin-bottom', '2px')
                .append($('<td>')
                    .css('width', '7em')
                    .css('font-weight', 'normal')
                    .css('font-style', 'italic')
                    .css('padding-right', '4px')
                    .css('color', '#AAA')
                    .css('vertical-align', 'top')
                    .css('padding-bottom', '2px')
                    .text(item.label))
                .append($('<td>')
                    // .css('font-weight', 'bold')
                    .css('vertical-align', 'top')
                    .css('padding-bottom', '2px')
                    .html(value));

            $table.append($row);
        });
        return $table;
    }

    // function metadataToRaggedTable(metadata) {
    //     var $table = $('<div>')
    //         .css('padding-bottom', '2px')
    //         .css('font-size', '100%');

    //     metadata.forEach(function (item) {
    //         var $row;
    //         var value;
    //         if (item.value instanceof Array) {
    //             value = item.value.map(function (item) {
    //                 return formatItem(item);
    //             }).join('&nbsp;&nbsp;&nbsp;');
    //         } else {
    //             value = formatValue(item.value);
    //         }

    //         $row = $('<div>')
    //             .append($('<span>')
    //                 .css('font-style', 'italic')
    //                 .css('padding-right', '4px')
    //                 .css('color', '#AAA')
    //                 .text(item.label))
    //             .append($('<span>')
    //                 .css('font-weight', 'bold')
    //                 .html(value));

    //         $table.append($row);
    //     });
    //     return $table;
    // }

    function renderTotals(found, total) {
        var $totals = $('<span>').addClass('kb-data-list-type');
        if (total === 0) {
            $totals
                .append($('<span>None available</span>'));
        } else if (found === 0) {
            $totals
                .append($('<span>').css('font-weight', 'bold').text('None'))
                .append($('<span>').text(' found out of '))
                .append($('<span>').css('font-weight', 'bold').text(numeral(total).format('0,0')))
                .append($('<span>').text(' available'));
        } else if (total > found) {
            $totals
                .append($('<span>').css('font-weight', 'bold').text(numeral(found).format('0,0')))
                .append($('<span>').text(' found out of '))
                .append($('<span>').css('font-weight', 'bold').text(numeral(total).format('0,0')))
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
       
        // The suffix logic is careflly crafted to accomodate retry (via nextSuffix)
        // and automatic next suffix via the max suffix determined above.
        if (maxSuffix) {
            if (nextSuffix) {
                // a previous attempt to copy failed due to the object already existing. 
                // We honor the maxSuffix found if greater, otherwise use this one.
                if (maxSuffix > nextSuffix) {
                    return maxSuffix + 1;
                }
                return nextSuffix;
            }
            return maxSuffix + 1;
        } else if (foundRoot) {
            if (nextSuffix) {
                return nextSuffix;
            }
            return 1;
        }
        return null;
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
        currentFilteredlResults: null,
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
            if (this.categoryDescr) {
                this.categories = Object.keys(this.categoryDescr);
            }

            // Cause the search to be re-run whenever the data state for this 
            // narrative changes.
            // TODO: disabled. since this is public data, the state of this narrative
            // should not affect any of the browser/searches!
            // $(document).on('dataUpdated.Narrative', function () {
            //     this.loadObjects();
            // }.bind(this));
            
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
                        $filterInput.change();
                        // this.searchAndRender($typeInput.val(), $filterInput.val());
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
            }.bind(this));

            /*
                search and render only when input change is detected.
            */
            var inputFieldLastValue = null;
            $filterInput.change(function() {
                inputFieldLastValue = $filterInput.val();
                renderInputFieldState();
                this.searchAndRender($typeInput.val(), $filterInput.val());
            }.bind(this));

            function renderInputFieldState() {
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
                renderInputFieldState();
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

        searching: false,
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
            this.currentFilteredlResults = null;

            // Get and render the first batch of data.
            // Note that the loading ui is only displayed on the initial load.
            this.totalPanel.append($('<span>').addClass('kb-data-list-type').append('<img src="'+this.loadingImage+'"/> searching...'));
            return this.renderMore(true);
        },

        renderTotalsPanel: function (arg) {
            var $totals = renderTotals(arg.totalFiltered, arg.totalAvailable);                    
            this.totalPanel.html($totals);
        },

        renderFromWorkspace: function (dataSourceConfig, initial) {
            var _this = this;
            var workspaceDS;
            if (this.currentDataSource && this.currentDataSource.dataSourceConfig === dataSourceConfig) {
                workspaceDS = this.currentDataSource;
            } else {
                workspaceDS = Object.create(WorkspaceDataSource).init({
                    dataSourceConfig: dataSourceConfig,
                    serviceWizardURL: Config.url('service_wizard'),
                    token: this.token,
                    pageSize: _this.itemsPerPage
                });
            }
            var query = {
                input: _this.currentQuery,
                page: _this.currentPage,
            };
            return workspaceDS.search(query)
                .then(function (result) {
                    result.forEach(function (item) {
                        _this.addRow(dataSourceConfig, item);
                    });

                    _this.totalAvailable = workspaceDS.availableDataCount;
                    _this.currentFilteredResults = workspaceDS.filteredDataCount;

                    _this.renderTotalsPanel({
                        totalFiltered:  _this.currentFilteredResults, 
                        totalAvailable: _this.totalAvailable
                    });
                });
        },

        formatInt: function (value, format, defaultValue) {
            if (typeof value === 'undefined' || value === null) {
                return defaultValue;
            }
            return numeral(value).format(format);
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
        renderFromSearch: function (dataSourceConfig) {
            var _this = this;
           
            var query = {
                input: _this.currentQuery,
                page: _this.currentPage,
            };

            var searchDS;
            if (this.currentDataSource && this.currentDataSource.dataSourceConfig === dataSourceConfig) {
                searchDS = this.currentDataSource;
            } else {
                searchDS = Object.create(SearchDataSource).init({
                    dataSourceConfig: dataSourceConfig,
                    searchUrl: Config.url('KBaseSearchEngine'),
                    token: this.token,
                    pageSize: _this.itemsPerPage
                });
            }

            return searchDS.search(query)
                .then(function (result) {
                    // a null result means that the search was not run for some
                    // reason -- most likely it was canceled due to overlapping
                    // queries.
                    if (result) {
                        result.forEach(function (item) {
                            _this.addRow(dataSourceConfig, item);
                        });

                        _this.totalAvailable = searchDS.totalAvailable;
                        _this.currentFilteredResults = searchDS.totalResults;

                        _this.renderTotalsPanel({
                            totalFiltered: searchDS.totalResults, 
                            totalAvailable: searchDS.totalAvailable
                        });
                    }

                    _this.currentDataSource = searchDS;
                });
        },

        renderMore: function(initial) {
            this.hideError();
            var cat = this.categoryDescr[this.currentCategory];
            // suss out whether we really need more...
            if (this.currentPage !== null && this.currentFilteredResults !== null && !initial) {
                var maxPage = Math.ceil(this.currentFilteredResults / this.itemsPerPage);
                if (this.currentPage >= maxPage) {                    
                    return;
                }
            }

            this.currentPage += 1;

            switch (cat.sourceType) {
            case 'search':
                return this.renderFromSearch(cat, initial);
            case 'workspace':
                return this.renderFromWorkspace(cat);
            default: 
                throw new Error('Invalid data source type: ' + cat.sourceType);
            }
        },

        // attachRow: function(dataSource, index, toStaging) {
        //     var obj = this.objectList[index];
        //     if (obj.attached) {
        //         return;
        //     }
        //     if (obj.$div) {
        //         this.resultPanel.append(obj.$div);
        //     } else {
        //         obj.$div = toStaging ? this.renderStagingObjectRowDiv(obj) : this.renderObjectRow(dataSource, obj);
        //         this.resultPanel.append(obj.$div);
        //     }
        //     obj.attached = true;
        //     this.n_objs_rendered++;
        // },

        addRow: function(dataSource, row) {
            var $row = this.renderObjectRow(dataSource, row);
            this.resultPanel.append($row);
        },

        escapeSearchQuery: function(str) {
            return str.replace(/[%]/g, '').replace(/[:"\\]/g, '\\$&');
        },

        /*
        renderObjectRow
        */
        renderObjectRow: function(dataSource, object) {
            var self = this;
            var type = object.type.split('.')[1].split('-')[0];
            var copyText = ' Add';

            var $addDiv =
                $('<div>').append(
                    $('<button>')
                        .addClass('kb-primary-btn')
                        .css({'white-space':'nowrap', padding: '10px 15px'})
                        .append($('<span>')
                            .addClass('fa fa-chevron-circle-left'))
                        .append(copyText)
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
                shortName = shortName.substring(0,this.maxNameLength-3)+'…';
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
            if (isShortened) { 
                $name.tooltip({title:object.name, placement:'bottom'}); 
            }

            // Mouseover toolbar
            var $btnToolbar = $('<span>')
                .addClass('btn-toolbar')
                .css('position', 'absolute')
                .css('right', '6px')
                .css('top', '0')
                .attr('role', 'toolbar')
                .hide();
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

            var $titleElement = $('<div>')
                .css('position', 'relative')
                .append($btnToolbar.hide())
                .append($name);

            // if (object.metadata && object.metadata.length) {
            //     titleElement.append(metadataToTable(object.metadata));
            // } else {
            //     titleElement.append('<br>').append('&nbsp;');
            // }

            var $bodyElement;
            if (object.metadata && object.metadata.length) {
                $bodyElement  = metadataToTable(object.metadata);
            } else {
                $bodyElement = null;
            }

            // Set data icon
            var $logo = $('<span>');
            if (dataSource.iconUrl) {
                $logo
                    .append($('<img>')
                        .attr('src', dataSource.iconUrl)
                        .css('height', '32px'));                
            } else {
                Icon.buildDataIcon($logo, type);
            }
            
            var $topTable = $('<table>')
                // set background to white looks better on DnD
                .css({'width':'100%','background':'#fff'})
                .append($('<tr>')
                    .append($('<td>')
                        .css({'width':'90px'})
                        .append($addDiv.hide()))
                    .append($('<td>')
                        .css('width', '50px')
                        .css('vertical-align', 'top')
                        .append($logo))
                        
                    .append($('<td>')
                        .css('padding-right', '15px')
                        .append($titleElement)
                        .append($bodyElement)));
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
                    .css('width', '100%'))
                // .css({'margin-left':'155px'}))
                .append($row);

            return $rowWithHr;
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
