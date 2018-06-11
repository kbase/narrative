/**
 * "Public Data" tab on data side panel.
 * @author Roman Sutormin <rsutormin@lbl.gov>
 * @public
 */
define ([
    'kbwidget',
    'jquery',
    'numeral',
    'narrativeConfig',
    'kbaseAuthenticatedWidget',
    'base/js/namespace',
    'kb_common/jsonRpc/dynamicServiceClient',
    'kb_common/jsonRpc/genericClient',
    'kb_common/html',
    'util/icon',
    'widgets/narrative_core/publicDataSources/workspaceDataSource',
    'widgets/narrative_core/publicDataSources/searchDataSource',
    'yaml!kbase/config/publicDataSources.yaml',

    'bootstrap'
], function (
    KBWidget,
    $,
    numeral,
    Config,
    kbaseAuthenticatedWidget,
    Jupyter,
    DynamicServiceClient,
    ServiceClient,
    html,
    Icon,
    WorkspaceDataSource,
    SearchDataSource,
    DataSourceConfig
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

    /*
    getNextAutoSuffix
    For a given object target name, and a set of objects, and a suffix generated
    by a previous failed attempt to save the object, return either:
    - null if the target name is not found in the object set
    - 1 if the target name was found, but no target names with a suffix
    - the greatest of the failed suffix passed in or the greatest suffix in the data 
      set, incremented by one.
    */
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
    var dataSourceTypes = {
        search: {
            serviceDependencies: {
                KBaseSearchEngine: 'KBaseSearchEngine'
            },
            baseObject: SearchDataSource
        },
        workspace: {
            serviceDependencies: {
                ServiceWizard: 'service_wizard'
            },
            baseObject: WorkspaceDataSource
        }
    };

    return KBWidget({
        name: 'kbaseNarrativeSidePublicTab',
        parent : kbaseAuthenticatedWidget,
        version: '1.0.0',
        options: {
            $importStatus:$('<div>'),
            addToNarrativeButton: null,
            selectedItems: null,
            landingPageURL: Config.url('landing_pages'),
            provenanceViewerBaseURL: Config.url('provenance_view'),
            ws_name: null
        },
        token: null,
        wsName: null,
        searchUrlPrefix: Config.url('search'),
        loadingImage: Config.get('loading_gif'),
        workspaceUrl: Config.url('workspace'),
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
        narrativeObjects: {},
        narrativeObjectsClean: null,

        init: function(options) {
            this._super(options);

            this.data_icons = Config.get('icons').data;
            this.icon_colors = Config.get('icons').colors;
            this.wsName = Jupyter.narrative.getWorkspaceName();

            this.dataSourceConfigs = DataSourceConfig.sources;
            
            this.loaded = false;            

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
            if ((!this.token) || (!this.wsName)) {
                return;
            }
            
            // load data the first render.
            if (!this.loaded) {
                this.loadObjects();
                this.loaded = true;
                $(document).on('dataUpdated.Narrative', function() {
                    $(document).trigger('dataLoadedQuery.Narrative', [null, this.IGNORE_VERSION, function(objects) {
                        this.narrativeObjects = objects;
                        this.narrativeObjectsClean = true;
                    }.bind(this)]);
                }.bind(this));
            }

            this.infoPanel = $('<div>');
            this.dataPolicyPanel = $('<div>');
            this.$elem.empty()
                .append(this.infoPanel)
                .append(this.dataPolicyPanel);

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

            var margin = {margin: '10px 0px 10px 0px'};
            var $typeInput = $('<select class="form-control">')
                .css(margin);

            this.dataSourceConfigs.forEach(function (config, index) {
                $typeInput.append('<option value="' + String(index) + '">' + config.name + '</option>');
            });

            // for (var catPos in this.categories) {
            //     var cat = this.categories[catPos];
            //     var catName = this.dataSourceConfigs[cat].name;
            //     $typeInput.append('<option value="'+cat+'">'+catName+'</option>');
            // }

            var $dataSourceLogo = $('<span>')
                .addClass('input-group-addon')
                .css('width', '40px')
                .css('border', 'none')
                .css('padding', '0 4px')
                .css('border', 'none')
                .css('border-radius', '0')
                .css('background-color', 'transparent');
            this.$dataSourceLogo = $dataSourceLogo;

            var $inputGroup = $('<div>')
                .addClass('input-group')
                .css('width', '100%');

            var typeFilter = $('<div class="col-sm-4">')
                .append($inputGroup
                    .append($typeInput)
                    .append($dataSourceLogo));

            var $filterInput = $('<input type="text" class="form-control" placeholder="Filter data...">');
            var $filterInputField = $('<div class="input-group">')
                .css(margin)
                .append($filterInput)
                .append($('<div class="input-group-addon btn btn-default">')
                    .append($('<span class="fa fa-search">'))
                    .css('padding', '4px 8px')
                    .click(function () {
                        $filterInput.change();
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
                var newDataSourceID = parseInt($typeInput.val());
                var dataSource = this.dataSourceConfigs[newDataSourceID];
                this.$dataSourceLogo.empty();
                if (dataSource) {
                    if (dataSource.logoUrl) {
                        this.$dataSourceLogo.append($('<img>')
                            .attr('src', dataSource.logoUrl));
                    }
                }
                this.searchAndRender(newDataSourceID, $filterInput.val());
            }.bind(this));

            /*
                search and render only when input change is detected.
            */
            var inputFieldLastValue = null;
            $filterInput.change(function() {
                inputFieldLastValue = $filterInput.val();
                renderInputFieldState();
                var dataSourceID = parseInt($typeInput.val());
                this.searchAndRender(dataSourceID, $filterInput.val());
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

            // function inputFieldDirty() {
            //     if (inputFieldLastValue !== $filterInput.val()) {
            //         return true;
            //     } 
            //     return false;
            // }

            $filterInput.keyup(function () {
                renderInputFieldState();
            });

            /*
                search and render for every keystroke!
            */
            // filterInput.keyup(function() {
            //     this.searchAndRender(typeInput.val(), filterInput.val());
            // }.bind(this));

            var searchFilter = $('<div class="col-sm-8">').append($filterInputField);

            var header = $('<div class="row">').css({'margin': '0px 10px 0px 10px'})
                .append(typeFilter)
                .append(searchFilter);
            this.$elem.append(header);
            this.totalPanel = $('<div>').css({'margin': '0px 0px 0px 10px'});
            this.$elem.append(this.totalPanel);

            this.resultPanel = $('<div>');

            this.resultsFooterMessage = $('<div>');

            this.resultFooter = $('<div>')
                .css('background-color', 'rgba(200,200,200,0.5')
                .css('padding', '6px')
                .css('font-style', 'italic')
                .css('text-align', 'center')
                .append(this.resultsFooterMessage);              

            this.resultArea = $('<div>')
                .css('overflow-x', 'hidden')
                .css('overflow-y', 'auto')
                .css('height', this.mainListPanelHeight)
                .on('scroll', function(e) {
                    if (e.target.scrollTop + e.target.clientHeight >= e.target.scrollHeight) {
                        this.renderMore();
                    }
                }.bind(this))
                .append(this.resultPanel)
                .append(this.resultFooter);

            this.$elem.append(this.resultArea);
            var dataSourceID = parseInt($typeInput.val(), 10);
            this.searchAndRender(dataSourceID, $filterInput.val());
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
            if (this.currentQuery && this.currentQuery === query && category === this.currentCategory) {
                return;
            }

            // Reset the query data structures.
            this.objectList = [];
            this.currentCategory = category;
            this.currentQuery = query;
            this.currentPage = 0;
            this.totalAvailable = null;
            this.currentFilteredlResults = null;

            return this.renderInitial();
        },

        renderTotalsPanel: function () {
            var $totals = renderTotals(this.currentFilteredResults, this.totalAvailable);                    
            this.totalPanel.html($totals);
        },

        renderInitial: function() {
            // Get and render the first batch of data.
            // Note that the loading ui is only displayed on the initial load.
            // Reset the ui.
            this.totalPanel.empty();
            this.resultPanel.empty();
            this.resultsFooterMessage.empty();
            this.totalPanel
                .append($('<span>')
                    .addClass('kb-data-list-type')
                    .append('<img src="'+this.loadingImage+'"/> searching...'));

            this.hideError();
            this.currentPage = 1;

            return this.renderFromDataSource(this.currentCategory, true);
        },

        renderMore: function() {
            this.hideError();

            // suss out whether we really need more...
            if (this.currentPage !== null && this.currentFilteredResults !== null) {
                var maxPage = Math.ceil(this.currentFilteredResults / this.itemsPerPage);
                if (this.currentPage >= maxPage) {                    
                    return;
                }
            }

            this.currentPage += 1;

            return this.renderFromDataSource(this.currentCategory, false);
        },

        fetchFromDataSource: function(dataSource) {
            var _this = this;
           
            var query = {
                input: _this.currentQuery,
                page: _this.currentPage,
            };

            return dataSource.search(query);   
        },

        getDataSource: function (dataSourceID) {
            var dataSource;
            var dataSourceConfig = this.dataSourceConfigs[dataSourceID];
            if (this.currentDataSource && this.currentDataSource.config === dataSourceConfig) {
                dataSource = this.currentDataSource;
            } else {
                var dataSourceType = dataSourceTypes[dataSourceConfig.sourceType];
               
                var urls = Object.keys(dataSourceType.serviceDependencies).reduce(function (urls, key) {
                    var configKey = dataSourceType.serviceDependencies[key];
                    urls[key] = Config.url(configKey);
                    return urls;
                }, {});
                dataSource = Object.create(dataSourceType.baseObject).init({
                    config: dataSourceConfig,
                    urls: urls,
                    token: this.token,
                    pageSize: this.itemsPerPage
                });
                this.currentDataSource = dataSource;
            }
            return dataSource;
        },

        renderFromDataSource: function(dataSourceID, initial) {
            var _this = this;
            var dataSource = this.getDataSource(dataSourceID);
            _this.resultsFooterMessage.html(html.loading('fetching another ' + this.itemsPerPage));
            this.fetchFromDataSource(dataSource, initial)
                .then(function (result) {
                    // a null result means that the search was not run for some
                    // reason -- most likely it was canceled due to overlapping
                    // queries.
                    if (result) {
                        // _this.removeLastRowPlaceholder();
                        if (initial) {
                            _this.totalPanel.empty();
                            _this.resultPanel.empty();
                            _this.resultsFooterMessage.empty();                
                        }
                        result.forEach(function (item, index) {
                            _this.addRow(dataSource, item, index);
                        });
                        // _this.addLastRowPlaceholder();

                        _this.totalAvailable = dataSource.availableDataCount;
                        _this.currentFilteredResults = dataSource.filteredDataCount;

                        var message;
                        if (dataSource.fetchedDataCount === dataSource.filteredDataCount) {
                            message = 'all ' + _this.currentFilteredResults + ' fetched';
                        } else {
                            message = 'fetched ' + result.length + ' of ' + _this.currentFilteredResults;
                        }
                        _this.resultsFooterMessage.text(message);

                        _this.renderTotalsPanel();
                    }

                    _this.currentDataSource = dataSource;
                });
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

        clearRows: function () {
            this.resultPanel.empty();
        },

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

            var shortName = object.name;
            var isShortened=false;
            if (shortName.length>this.maxNameLength) {
                shortName = shortName.substring(0,this.maxNameLength-3)+'…';
                isShortened=true;
            }

            // TODO: more failsafe method for building these urls.
            // e.g. not clear wht the form of the config url is:
            // path or url?
            // terminal / or not?
            // absolute or relative (initial /)
            var objectRef = object.workspaceReference.ref;
            var landingPageLink = this.options.landingPageURL + objectRef;
            var provenanceLink = [this.options.provenanceViewerBaseURL, objectRef].join('/');

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
            $btnToolbar
                .append($openLandingPage)
                .append($openProvenance);

            // var $topTable = $('<div>')
            //     // set background to white looks better on DnD
            //     .css({'width':'100%','background':'#fff'})
            //     .append($('<tr>')
            //         .append($('<td>')
            //             .css({'width':'90px'})
            //             .append($addDiv.hide()))

            //         .append($('<td>')
            //             .css('width', '50px')
            //             .css('vertical-align', 'middle')
            //             .css('border-right', '1px rgba(200,200,200,0.6) solid')
            //             .append($logo))
                        
            //         .append($('<td>')
            //             .css('padding-left', '4px')
            //             .css('padding-right', '15px')
            //             .append($titleElement)
            //             .append($bodyElement)));

            // Action Column

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

                            var targetName = object.name;

                            // object name cannot start with digits.
                            if (/^[\d]/.test(targetName)) {
                                targetName = targetName.replace(/^[\d]+/,'_');
                            }

                            // to avoid weird object names, replace entities with underscores.
                            targetName = targetName.replace(/&[^;]*;/g,'_');

                            // replace characters which are invalid for a workspace object name with underscores.
                            targetName = targetName.replace(/[^a-zA-Z0-9.\-_]/g,'_');

                            self.copy(object, targetName, this);
                        }));

            var $actionColumn = $('<div>')
                .css('flex', '0 0 90px')
                .css('display', 'flex')
                .css('align-items', 'center')
                .css('vertical-align', 'middle')
                .append($addDiv.hide());

            // Icon Column
            var $logo = $('<span>');
            // if (dataSource.config.logoUrl) {
            //     $logo
            //         .append($('<img>')
            //             .attr('src', dataSource.config.logoUrl)
            //             .css('height', '32px'));                
            // } else {
            Icon.buildDataIcon($logo, type);
            // }
            var $iconColumn = $('<div>')
                .css('flex', '0 0 50px')
                .css('display', 'flex')
                .css('align-items', 'center')
                .css('border-right', '1px rgba(200,200,200,0.6) solid')
                .css('vertical-align', 'middle')
                .append($logo);

            // Main Column
            var $titleElement = $('<div>')
                .css('position', 'relative')
                .append($btnToolbar.hide())
                .append($name);

            var $bodyElement;
            if (object.metadata && object.metadata.length) {
                $bodyElement  = metadataToTable(object.metadata);
            } else {
                $bodyElement = null;
            }

            var $resultColumn = $('<div>')
                .css('flex', '1 1 0px')
                .css('padding-left', '4px')
                .css('padding-right', '15px')
                // .css('border-top', '1px rgba(200,200,200,0.6) solid')
                .append($titleElement)
                .append($bodyElement);

            var $row = $('<div>')
                .css('margin', '2px')
                .css('padding', '4px')
                .css('display', 'flex')
                .css('flex-direction', 'row')
                // .css('border-top', '1px rgba(200,200,200,0.6) solid')
                // .append($('<div>').addClass('kb-data-list-obj-row-main')
                //     .append($topTable))
                // show/hide ellipses on hover, show extra info on click
                .mouseenter(function(){
                    $addDiv.show();
                    $btnToolbar.show();
                })
                .mouseleave(function(){
                    $addDiv.hide();
                    $btnToolbar.hide();
                })
                .append($actionColumn)
                .append($iconColumn)
                .append($resultColumn);

            var $divider = $('<hr>')
                .addClass('kb-data-list-row-hr')
                .css('width', '100%');
            var $rowContainer = $('<div>')
                .append($divider)
                .append($row);

            return $rowContainer;
        },

        /*
            TODO: rethink the logic here.

            copy should only be applicable if the workspace is writable. This check should either
            be here or should be a precondition (just let if fail otherwise.)

            the check for existence fo the object should not throw an error; the null value
            means the object could not be read, and since we have read access to this narrative, 
            that is the only possible error.
        */

        copy: function(object, targetName, thisBtn, nextSuffix, tries) {
            if (tries > 10) {
                throw new Error('Too many rename tries (10)');
            }

            var type = 'KBaseGenomes.Genome';

            // Determine whether the targetName already exists, or if 
            // copies exist and if so the maximum suffix.
            // This relies upon the narrativeObjects being updated from the data list.

            // If there are other objects in this narrative, we need to first attempt to
            // see if other objects with this name exist, and if so, obtain a suffix which
            // may ensure this is a unique object name.
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
                    if (infos[0] !== null) {
                        return this.copy(object, targetName, thisBtn, suffix ? suffix + 1 : 1, tries ? tries + 1 : 1);
                    }
                    return this.copyFinal(object, correctedTargetName, thisBtn);
                }.bind(this))
                .catch(function(error) {
                    console.error('Error getting object info for copy', error);
                    this.showError(error);
                }.bind(this));
        },

        copyFinal: function(object, targetName, thisBtn) {
            return this.narrativeService.callFunc('copy_object', [{
                ref: object.workspaceReference.ref,
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
                    this.showError(error);
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
