(function($, undefined) {
    $.KBWidget({
        name: 'kbaseNarrativeSidePanel',
        parent: 'kbaseWidget',
        options: {
            loadingImage: "static/kbase/images/ajax-loader.gif",
            autorender: true,
            workspaceURL: "https://kbase.us/services/ws", //used for data importer
            landingPageURL: "/functional-site/#/", // used for data importer
        },
        $dataWidget: null,
        $methodsWidget: null,
        $narrativesWidget: null,
        $jobsWidget: null,
        $overlay: null,

        /**
         * Does the initial panel layout - tabs and spots for each widget
         * It then instantiates them, but not until told to render (unless autorender = true)
         */
        init: function(options) {
            this._super(options);

            // make sure we pick up the proper config urls
            if (window.kbconfig && window.kbconfig.urls) {
                this.options.workspaceURL = window.kbconfig.urls.workspace;
            }

            var analysisWidgets = this.buildPanelSet([
                {
                    name : 'kbaseNarrativeDataPanel',
                    params : {}
                },
                {
                    name : 'kbaseNarrativeMethodPanel',
                    params : { autopopulate: false }
                }
            ]);
            this.$dataWidget = analysisWidgets['kbaseNarrativeDataPanel'];
            this.$methodsWidget = analysisWidgets['kbaseNarrativeMethodPanel'];
            var $analysisPanel = analysisWidgets['panelSet'];

            var manageWidgets = this.buildPanelSet([
                {
                    name : 'kbaseNarrativeManagePanel',
                    params : { autopopulate: true }
                },
                {
                    name : 'kbaseNarrativeJobsPanel',
                    params : { autopopulate: false }
                }
            ]);

            this.$narrativesWidget = manageWidgets['kbaseNarrativeAppsPanel'];
            this.$jobsWidget = manageWidgets['kbaseNarrativeJobsPanel'];
            var $managePanel = manageWidgets['panelSet'];

            var $tabs = this.buildTabs([
                {
                    tabName : 'Analyze',
                    content : $analysisPanel
                },
                {
                    tabName : 'Manage',
                    content: $managePanel
                }
            ], true);

            this.$elem.addClass('kb-side-panel');
            this.$elem.append($tabs.header).append($tabs.body);

            $(document).on('showSidePanelOverlay.Narrative', $.proxy(function(event) {
                this.showOverlay();
            }, this));

            $(document).on('hideSidePanelOverlay.Narrative', $.proxy(function(event) {
                this.hideOverlay();
            }, this));

            $(document).on('toggleSidePanelOverlay.Narrative', $.proxy(function(event) {
                this.toggleOverlay();
            }, this));

            if (this.autorender) {
                this.render();
            }
            else {

            }
            // add the stuff to the tabs

            return this;
        },

        /**
         * @method
         * @private
         * Builds a very simple set of tabs.
         * @param {Array} tabs - a list of objects where each has a 'tabName' and 'content' property.
         * As you might expect, 'tabName' is the name of the tab that goes into the styled header,
         * and 'content' is the tab content, expected to be something that can be attached via .append()
         * @param isOuter - if true, treat these tabs as though they belong to the outer side panel,
         * not to an inner set of tabs. That is, when any new tab is selected, it hides the overlay,
         * if it's open.
         */
        buildTabs: function(tabs, isOuter) {
            var $header = $('<div>');
            var $body = $('<div>');

            for (var i=0; i<tabs.length; i++) {
                var tab = tabs[i];
                $header.append($('<div>')
                               .addClass('kb-side-header')
                               .css('width', (100/tabs.length)+'%')
                               .append(tab.tabName));
                $body.append($('<div>')
                             .addClass('kb-side-tab')
                             .append(tab.content));
            }

            $header.find('div').click($.proxy(function(event) {
                event.preventDefault();
                event.stopPropagation();
                var $headerDiv = $(event.currentTarget);

                if (!$headerDiv.hasClass('active')) {
                    var idx = $headerDiv.index();
                    $header.find('div').removeClass('active');
                    $headerDiv.addClass('active');
                    $body.find('div.kb-side-tab').removeClass('active');
                    $body.find('div:nth-child(' + (idx+1) + ').kb-side-tab').addClass('active');
                    if (isOuter)
                        this.hideOverlay();
                }
            }, this));

            $header.find('div:first-child').addClass('active');
            $body.find('div:first-child.kb-side-tab').addClass('active');

            return {
                header: $header,
                body: $body
            };
        },

        initOverlay: function() {
            var self = this;

            this.$overlayBody = $('<div class="kb-overlay-body">');
            this.$overlayFooter  = $('<div class="kb-overlay-footer">');
            this.$overlay = $('<div>')
                            .addClass('kb-side-overlay-container')
                            .append(this.$overlayBody)
                            .append(this.$overlayFooter);


            $('body').append(this.$overlay);
            this.$overlay.hide();

            this.$narrativeDimmer = $('<div>')
                                    .addClass('kb-overlay-dimmer');

            $('body').append(this.$narrativeDimmer);
            this.$narrativeDimmer.hide();
            this.updateOverlayPosition();

            // hide panel when clicking outside
            this.$narrativeDimmer.unbind('click');
            this.$narrativeDimmer.click(function() {
                self.hideOverlay();
            });

            // putting this here for now, just for testing
            this.dataImporter();
        },

        updateOverlayPosition: function() {
            this.$overlay.position({my: 'left top', at: 'right top', of: this.$elem});
            this.$narrativeDimmer.position({my: 'left top', at: 'right top', of: this.$elem});
        },

        toggleOverlay: function() {
            if (this.$overlay.is(':visible'))
                this.hideOverlay();
            else
                this.showOverlay();
        },

        showOverlay: function() {
            if (this.$overlay) {
                this.$narrativeDimmer.show();
                this.$elem.find('.kb-side-header').addClass('overlay-active');
                this.$overlay.show('slide', 'fast', $.proxy(function() {
                }, this));
            }
        },

        hideOverlay: function() {
            if (this.$overlay) {
                this.$narrativeDimmer.hide();
                this.$elem.find('.kb-side-header').removeClass('overlay-active');
                this.$overlay.hide('slide', 'fast', $.proxy(function() {
                }, this));
            }
        },

        /**
         * Builds the general structure for a panel set.
         * These are intended to start with 2 panels, but we can move from there if needed.
         *
         * (I'll jsdoc this up in a bit)
         * widgets = [
         *     {
         *         name: kbaseNarrativeDataPanel (for instance)
         *         params: {}
         *     }
         * ]
         * @param {object} widgets
         *
         */
        buildPanelSet: function(widgets) {
            var $panelSet = $('<div>')
                            .addClass('kb-narr-side-panel-set');
            if (!widgets || Object.prototype.toString.call(widgets) !== '[object Array]' || widgets.length === 0)
                return $panelSet;

            var height = 100 / widgets.length;
            var minHeight = 200;

            var retObj = {};
            for (var i=0; i<widgets.length; i++) {
                var widgetInfo = widgets[i];
                var $widgetDiv = $('<div>')
                                 .css({'height' : height + '%', 'border-bottom' : '5px solid #e0e0e0'});

                retObj[widgetInfo.name] = $widgetDiv[widgetInfo.name](widgetInfo.params);
                $panelSet.append($widgetDiv);
            }
            retObj['panelSet'] = $panelSet;
            return retObj;
        },

        render: function() {
            this.initOverlay();

            this.$methodsWidget.refreshFromService();
            setTimeout($.proxy(function() { this.$jobsWidget.refresh(); }, this), 750);

        },


        /**
         * Renders the data importer panel
         * I'm throwing this here because I have no idea how to
         * bind a sidepanel to a specific widget, since all the other panels "inherit" these widgets.
         */
        dataImporter: function() {
            var narWSName;
            $(document).on('setWorkspaceName.Narrative', function(e, info){
                narWSName = info.wsId;
            })

            var self = this;
            var user = $("#signin-button").kbaseLogin('session', 'user_id');

            var body = this.$overlayBody;
            var footer = this.$overlayFooter;

            // models
            var myData = [],
                sharedData = [],
                publicData = [];

            var myWorkspaces = [],
                sharedWorkspaces = [];

            // model for selected objects to import
            var mineSelected = [],
                sharedSelected = [],
                publicSelected = [];

            var types = ["KBaseGenomes.Genome",
                         "KBaseSearch.GenomeSet",
                         "KBaseFBA.FBA",
                         "KBaseExpression.ExpressionSample",
                         "KBaseFBA.FBAModel",
                         "KBaseFBA.ModelTemplate",
                         "KBaseFBA.ReactionSensitivityAnalysis",
                         "KBaseNarrative.Narrative",
                         "KBaseGenomes.Pangenome",
                         "KBaseGenomes.ContigSet",
                         "KBaseGenomes.MetagenomeAnnotation",
                         "KBaseAssembly.AssemblyInput",
                         "Communities.SequenceFile",
                         "KBaseFBA.PromConstraint",
                         "KBaseExpression.ExpressionSeries",
                         "KBasePhenotypes.PhenotypeSimulationSet",
                         "KBasePhenotypes.PhenotypeSet",
                         "KBaseBiochem.Media",
                         "KBaseTrees.Tree",
                         "KBaseGenomes.GenomeComparison",
                         "GenomeComparison.ProteomeComparison",
                         "KBaseRegulation.Regulome",
                         "KBaseGenomes.GenomeDomainData"];

            // tab panels
            var minePanel = $('<div class="kb-import-content kb-import-mine">'),
                sharedPanel = $('<div class="kb-import-content kb-import-shared">'),
                publicPanel = $('<div class="kb-import-content kb-import-public">'),
                importPanel = $('<div class="kb-import-content kb-import-import">'),
                examplePanel = $('<div class="kb-import-content">');

            // add tabs
            var $tabs = this.buildTabs([
                    {tabName: 'My Data', content: minePanel},
                    {tabName: 'Shared', content: sharedPanel},
                    {tabName: 'Public', content: publicPanel},
                    {tabName: 'Example', content: examplePanel},
                    {tabName: 'Import', content: importPanel},
                ]);

            importPanel.kbaseNarrativeSideImportTab({});
            examplePanel.kbaseNarrativeExampleDataTab({});

            body.addClass('kb-side-panel');
            body.append($tabs.header, $tabs.body);

            // It is silly to invoke a new object for each widget
            var auth = {token: $("#signin-button").kbaseLogin('session', 'token')}
            var ws = new Workspace(this.options.workspaceURL, auth);

            // add footer status container and buttons
            var importStatus = $('<div class="pull-left kb-import-status">');
            footer.append(importStatus)
            var btn = $('<button class="btn btn-primary pull-right" disabled>Add to Narrative</button>');
            var closeBtn = $('<button class="btn btn-default pull-right">Close</button>');

            closeBtn.click(function() { self.hideOverlay(); })
            footer.append(btn, closeBtn);

            // start with my data, then fetch other data
            // this is because data sets can be large and
            // makes things more fluid
            minePanel.loading();
            sharedPanel.loading();
            updateView('mine').done(function() {
                updateView('shared')
            });

            // some placeholder for the public panel
            publicView();

            // events for changing tabs
            $($tabs.header.find('.kb-side-header')).click(function() {
                // reset selected models when changing tabs, if that's what is wanted
                if ($(this).index() == 0)
                    mineSelected = [], btn.show();
                else if ($(this).index() == 1)
                    sharedSelected = [], btn.show();
                else if ($(this).index() == 2)
                    publicSelected = [], btn.show();
                else
                    btn.hide();

                // reset checkboxs... for any tabs.
                minePanel.find('.kb-import-checkbox').prop('checked', false);
                sharedPanel.find('.kb-import-checkbox').prop('checked', false);
                publicPanel.find('.kb-import-checkbox').prop('checked', false);
                btn.prop('disabled', true);
            })

            var narrativeNameLookup={};

            function updateView(view) {
                var p;
                if (view == 'mine') p = getMyWS();
                else if (view == 'shared') p = getSharedWS();

                return $.when(p).done(function(workspaces) {
                    if (view == 'mine') prom = getMyData(workspaces);
                    else if (view == 'shared') prom = getSharedData(workspaces);
                    $.when(prom).done(function() {
                        if (view == 'mine') {
                            minePanel.rmLoading();
                            addMyFilters();
                        } else if(view == 'shared') {
                            sharedPanel.rmLoading();
                            addSharedFilters();
                        }
                    });
                });
            }

            // function used to update my data list
            function getMyData(workspaces, type, ws_name) {
                var params = {};
                if (!ws_name) {
                    var ws_ids = [];
                    for (var i in workspaces) ws_ids.push(workspaces[i].id);

                    params.ids = ws_ids;
                } else
                    params.workspaces = [ws_name];

                if (type) params.type = type;

                var p = ws.list_objects(params);
                return $.when(p).then(function(d) {
                    // update model
                    myData = d;
                    render(myData, minePanel, mineSelected);
                })
            }


            // function used to update shared with me data list
            function getSharedData(workspaces, type, ws_name) {
                var params = {};
                if (!ws_name) {
                    var ws_ids = [];
                    for (var i in workspaces) ws_ids.push(workspaces[i].id);

                    params.ids = ws_ids;
                } else
                    params.workspaces = [ws_name];

                if (type) params.type = type;

                var p = ws.list_objects(params);
                return $.when(p).then(function(d) {
                    // update model
                    sharedData = d;
                    render(sharedData, sharedPanel, sharedSelected);
                })
            }

            // function used to update shared with me data list
            function getPublicData(workspace, template) {
                var p = ws.list_objects({workspaces: [workspace]});
                return $.when(p).then(function(d) {
                    // update model
                    publicData = d;
                    render(publicData, publicPanel, publicSelected, template);
                })
            }


            // This function takes data to render and
            // a container to put data in.
            // It produces a scrollable dataset
            function render(data, container, selected, template) {
                var start = 0, end = 9;

                // remove items from only current container being rendered
                container.find('.kb-import-items').remove();

                if (data.length == 0){
                    container.append('<div class="kb-import-items text-muted">No data found</div>');
                    return
                } else if (data.length-1 < end)
                    end = data.length;

                var rows = buildMyRows(data, start, end, template);
                container.append(rows);
                events(container, selected);

                // infinite scroll
                container.unbind('scroll');
                container.on('scroll', function() {
                    if($(this).scrollTop() + $(this).innerHeight() >= this.scrollHeight) {
                        var rows = buildMyRows(data, start, end, template);
                        container.append(rows);
                    }
                    events(container, selected);
                });
            }

            function getMyWS() {
                return ws.list_workspace_info({owners: [user]})
                        .then(function(d) {
                            var workspaces = [];
                            for (var i in d) {
                                 if (d[i][8].is_temporary) {
                                    if (d[i][8].is_temporary === 'true') { continue; }
                                }
                                var displayName = d[i][1];
                                if (d[i][8].narrative_nice_name) {
                                    displayName = d[i][8].narrative_nice_name;
                                }
                                // todo: should skip temporary narratives
                                workspaces.push({id: d[i][0], name: d[i][1], displayName:displayName});
                                narrativeNameLookup[d[i][1]] = displayName;
                            }

                            // add to model for filter
                            myWorkspaces = workspaces;
                            return workspaces;
                        })
            }

            function getSharedWS() {
                return ws.list_workspace_info({excludeGlobal: 1})
                        .then(function(d) {
                            var workspaces = [];
                            for (var i in d) {
                                // skip owned workspaced
                                if (d[i][2] == user) {
                                    continue;
                                }
                                if (d[i][8].is_temporary) {
                                    if (d[i][8].is_temporary === 'true') { continue; }
                                }
                                var displayName = d[i][1];
                                if (d[i][8].narrative_nice_name) {
                                    displayName = d[i][8].narrative_nice_name;
                                }
                                // todo: should skip temporary narratives
                                workspaces.push({id: d[i][0], name: d[i][1], displayName:displayName});
                                narrativeNameLookup[d[i][1]] = displayName;
                            }

                            // add to model for filter
                            sharedWorkspaces = workspaces;
                            return workspaces;
                        })
            }

            function typeList(data) {
                var types = [];

                for (var i in data) {
                    var mod_type = data[i][2].split('-')[0];
                    // update model for types dropdown
                    if (types.indexOf(mod_type) == -1) types.push(mod_type);
                }
                return types;
            }

            function copyObjects(objs, nar_ws_name) {
                importStatus.html('Adding <i>'+objs.length+'</i> objects to narrative...');

                var proms = [];
                for (var i in objs) {
                    var ref = objs[i].ref;
                    var name = objs[i].name;
                    console.log('copying ', ref, 'to', nar_ws_name);
                    proms.push( ws.copy_object({to: {workspace: nar_ws_name, name: name},
                                                from: {ref: ref} }) );
                }
                return proms;
            }


            function events(panel, selected) {
                panel.find('.kb-import-checkbox').unbind('change');
                panel.find('.kb-import-checkbox').change(function(){
                    var item = $(this).parent('.kb-import-item');
                    var ref = item.data('ref').replace(/\./g, '/');
                    var name = item.data('obj-name');

                    // update model for selected items
                    if ($(this).is(":checked")) {
                        selected.push({ref: ref, name: name});
                    }
                    else {
                        for (var i=0; i<selected.length; i++) {
                            if (selected[i].ref == ref)
                                selected.splice(i, 1);
                        }
                    }

                    // disable/enable button
                    if (selected.length > 0) btn.prop('disabled', false);
                    else btn.prop('disabled', true);
                });

                // import items on button click
                btn.unbind('click');
                btn.click(function() {
                    if (selected.length == 0) return;

                    //uncheck all checkboxes, disable b
                    $('.kb-import-checkbox').prop('checked', false);
                    $(this).prop('disabled', true);

                    var proms = copyObjects(selected, narWSName);
                    $.when.apply($, proms).done(function(data) {
                        importStatus.html('');
                        var status = $('<span class="text-success">done.</span>');
                        importStatus.append(status);
                        status.delay(1000).fadeOut();

                        // update sidebar data list
                        self.trigger('updateDataList.Narrative');
                    });
                });
            }

            function filterData(data, f) {
                if (data.length == 0) return [];

                var filteredData = [];
                // add each item to view
                for (var i=0; i<data.length; i< i++) {
                    var obj = data[i];

                    var mod_type = obj[2].split('-')[0],
                        ws = obj[7],
                        name = obj[1];
                    var kind = mod_type.split('.')[1];

                    // filter conditions
                    if (f.query && name.toLowerCase().indexOf(f.query.toLowerCase()) == -1)
                        continue;
                    if (f.type && f.type.split('.')[1] != kind)
                        continue;
                    if (f.ws && f.ws != ws)
                        continue;


                    filteredData.push(obj);

                }
                return filteredData;
            }


            function buildMyRows(data, start, end, template) {

                // add each set of items to container to be added to DOM
                var rows = $('<div class="kb-import-items">');

                for (var i=start; i< (start+end); i++) {
                    var obj = data[i];

                    var mod_type = obj[2].split('-')[0];
                    var item = {id: obj[0],
                                name: obj[1],
                                mod_type: mod_type,
                                version: obj[4],
                                kind: mod_type.split('.')[1],
                                module: mod_type.split('.')[0],
                                wsID: obj[6],
                                ws: obj[7],
                                relativeTime: kb.ui.relativeTime( kb.ui.getTimestamp(obj[3]) ) }

                    if (template)
                        var item = template(item);
                    else
                        var item = rowTemplate(item);

                    rows.append(item);
                }

                return rows;
            }


            function addMyFilters() {
                //var types = typeList(myData);
                var wsList = myWorkspaces;

                // possible filters via input
                var type, ws, query;

                // create workspace filter
                var wsInput = $('<select class="form-control kb-import-filter">');
                wsInput.append('<option>All narratives...</option>');
                for (var i=1; i < wsList.length-1; i++) {
                    wsInput.append('<option data-id="'+[i].id+'" data-name="'+wsList[i].name+'">'+
                                          wsList[i].displayName+
                                   '</option>');
                }
                var wsFilter = $('<div class="col-sm-4">').append(wsInput);

                // event for type dropdown
                wsInput.change(function() {
                    ws = $(this).children('option:selected').data('name');

                    // request again with filted type
                    minePanel.find('.kb-import-items').remove();
                    minePanel.loading();
                    getMyData(myWorkspaces, type, ws).done(function() {
                        minePanel.rmLoading();
                    })
                })

                // create type filter
                var typeInput = $('<select class="form-control kb-import-filter">');
                typeInput.append('<option>All types...</option>');
                for (var i=1; i < types.length-1; i++) {
                    typeInput.append('<option data-type="'+types[i]+'">'+
                                          types[i].split('.')[1]+
                                     '</option>');
                }
                var typeFilter = $('<div class="col-sm-3">').append(typeInput);

                // event for type dropdown
                typeInput.change(function() {
                    type = $(this).children('option:selected').data('type');

                    // request again with filted type
                    minePanel.find('.kb-import-items').remove();
                    minePanel.loading();
                    getMyData(myWorkspaces, type, ws).done(function() {
                        minePanel.rmLoading();
                    })
                })


                // create filter (search)
                var filterInput = $('<input type="text" class="form-control kb-import-search" placeholder="Filter data">');
                var searchFilter = $('<div class="col-sm-4">').append(filterInput);

                // event for filter (search)
                filterInput.keyup(function(e){
                    query = $(this).val();

                    var filtered = filterData(myData, {type: type, ws:ws, query:query})
                    render(filtered, minePanel, mineSelected);
                });


                // add search, type, ws filter to dom
                var row = $('<div class="row">').append(searchFilter, typeFilter, wsFilter);
                minePanel.prepend(row);
            }

            function addSharedFilters() {
                //var types = typeList(sharedData);
                var wsList = sharedWorkspaces

                // possible filters via input
                var type, ws, query;

                // create workspace filter
                var wsInput = $('<select class="form-control kb-import-filter">');
                wsInput.append('<option>All narratives...</option>');
                for (var i=1; i < wsList.length-1; i++) {
                    wsInput.append('<option data-id="'+wsList[i].id+'" data-name="'+wsList[i].name+'">'+
                                          wsList[i].displayName+
                                    '</option>');
                }
                var wsFilter = $('<div class="col-sm-4">').append(wsInput);

                // event for type dropdown
                wsInput.change(function() {
                    ws = $(this).children('option:selected').data('name');

                    // request again with filted type
                    sharedPanel.find('.kb-import-items').remove();
                    sharedPanel.loading();
                    getSharedData(sharedWorkspaces, type, ws).done(function() {
                        sharedPanel.rmLoading();
                    })
                })


                // create type filter
                var typeInput = $('<select class="form-control kb-import-filter">');
                typeInput.append('<option>All types...</option>');
                for (var i=1; i < types.length-1; i++) {
                    typeInput.append('<option data-type="'+types[i]+'">'+
                                          types[i].split('.')[1]+
                                     '</option>');
                }
                var typeFilter = $('<div class="col-sm-3">').append(typeInput);

                // event for type dropdown
                typeInput.change(function() {
                    type = $(this).children('option:selected').data('type');

                    // request again with filted type
                    sharedPanel.find('.kb-import-items').remove();
                    sharedPanel.loading();
                    getSharedData(sharedWorkspaces, type, ws).done(function() {
                        sharedPanel.rmLoading();
                    })
                })


                // create filter (search)
                var filterInput = $('<input type="text" class="form-control kb-import-search" placeholder="Filter objects">');
                var searchFilter = $('<div class="col-sm-4">').append(filterInput);

                // event for filter (search)
                filterInput.keyup(function(e){
                    query = $(this).val();

                    var filtered = filterData(sharedData, {type: type, ws:ws, query:query})
                    render(filtered, sharedPanel, sharedSelected);
                });

                // add search, type, ws filter to dom
                var row = $('<div class="row">').append(searchFilter, typeFilter, wsFilter);
                sharedPanel.prepend(row);
            }



            function rowTemplate(obj) {
                var item = $('<div class="kb-import-item">')
                                .data('ref', obj.wsID+'.'+obj.id)
                                .data('obj-name', obj.name);
                item.append('<input type="checkbox" value="" class="pull-left kb-import-checkbox">');
                item.append('<a class="h4" href="'+
                                objURL(obj.module, obj.kind, obj.ws, obj.name)+
                                '" target="_blank">'+obj.name+'</a>'+
                            '<span class="kb-data-list-version">v'+obj.version+'</span>');

                item.append('<br>');

                item.append('<div class="kb-import-info">'+
                                '<span>TYPE</span><br>'+
                                '<b>'+obj.kind+'</b>'+
                            '</div>');
                var narName = obj.ws;
                if (narrativeNameLookup[obj.ws]) {
                    narName = narrativeNameLookup[obj.ws];
                }
                item.append('<div class="kb-import-info">'+
                                '<span>NARRATIVE</span><br>'+
                                '<b>'+narName+'<b>'+   //<a class="" href="'+wsURL(obj.ws)+'">'
                            '</div>');
                item.append('<div class="kb-import-info">'+
                                '<span>LAST MODIFIED</span><br>'+
                                '<b>'+obj.relativeTime+'</b>'+
                            '</div>');
                item.append('<br><hr>')

                return item;
            }

            function publicTemplate(obj) {
                var item = $('<div class="kb-import-item">')
                                .data('ref', obj.wsID+'.'+obj.id)
                                .data('obj-name', obj.name);
                item.append('<input type="checkbox" value="" class="pull-left kb-import-checkbox">');
                item.append('<a class="h4" href="'+
                                objURL(obj.module, obj.kind, obj.ws, obj.name)+
                                '" target="_blank">'+obj.name+'</a>'+
                            '<span class="kb-data-list-version">v'+obj.version+'</span>');

                item.append('<br>');

                item.append('<div class="kb-import-info">'+
                                '<span>TYPE</span><br>'+
                                '<b>'+obj.kind+'</b>'+
                            '</div>');
                var narName = obj.ws;
                if (narrativeNameLookup[obj.ws]) {
                    narName = narrativeNameLookup[obj.ws];
                }

                item.append('<div class="kb-import-info">'+
                                '<span>LAST MODIFIED</span><br>'+
                                '<b>'+obj.relativeTime+'</b>'+
                            '</div>');
                item.append('<br><hr>')

                return item;
            }



            function objURL(module, type, ws, name) {
                var mapping = window.kbconfig.landing_page_map;
                if (mapping[module])
                    return self.options.landingPageURL+mapping[module][type]+'/'+ws+'/'+name;
                else
                    console.error('could not find a landing page mapping for', module);
            }

            function wsURL(ws) {
                return self.options.landingPageURL+'ws/'+ws;
            }


            function publicView() {
                getPublicData('pubSEEDGenomes', publicTemplate);

                var publicList = [{type: 'Genomes', ws: 'pubSEEDGenomes'},
                                  {type: 'Media', ws: 'KBaseMedia'},
                                  {type: 'Models', ws: 'KBasePublicModelsV4'},
                                  {type: 'RNA Seq', ws: 'KBasePublicRNASeq'}];

                var wsInput = $('<select class="form-control kb-import-filter">');
                for (var i=0; i < publicList.length; i++) {
                    wsInput.append('<option data-name="'+publicList[i].ws+'">'+
                                          publicList[i].type+
                                   '</option>');
                }
                var wsFilter = $('<div class="col-sm-4">').append(wsInput);

                var row = $('<div class="row">').append(wsFilter);
                publicPanel.append(row);

                // event for type (workspace) dropdown
                wsInput.change(function() {
                    var ws = $(this).children('option:selected').data('name');

                    // request again with filted type
                    publicPanel.find('.kb-import-items').remove();
                    publicPanel.loading();
                    getPublicData(ws, publicTemplate).done(function() {
                        publicPanel.rmLoading();
                    })
                })
            }

        }
    })
})( jQuery );
