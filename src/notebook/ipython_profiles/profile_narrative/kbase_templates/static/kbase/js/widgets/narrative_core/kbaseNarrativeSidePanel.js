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
            ]);

            this.$elem.addClass('kb-side-panel');
            this.$elem.append($tabs.header).append($tabs.body);

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

        buildTabs: function(tabs) {
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

            $header.find('div').click(function(event) {
                event.preventDefault();
                event.stopPropagation();
                var $headerDiv = $(event.currentTarget);

                if (!$headerDiv.hasClass('active')) {
                    var idx = $headerDiv.index();
                    $header.find('div').removeClass('active');
                    $headerDiv.addClass('active');
                    $body.find('div.kb-side-tab').removeClass('active');
                    $body.find('div:nth-child(' + (idx+1) + ').kb-side-tab').addClass('active');
                }
            });

            $header.find('div:first-child').addClass('active');
            $body.find('div:first-child.kb-side-tab').addClass('active');

            return {
                header: $header,
                body: $body
            };
        },

        initOverlay: function() {
            var $overlayHeader = $('<div>')
                                 .addClass('kb-side-overlay-header')
                                 .append('Header!')
                                 .append($('<div>')
                                        .addClass('pull-right')
                                        .append($('<span>')
                                                .addClass('kb-side-overlay-close glyphicon glyphicon-remove')
                                        .click($.proxy(function(event) {
                                           this.toggleOverlay();
                                        }, this))));

            // styling is easier if there is a class for containers
            this.$overlayBody = $('<div class="kb-overlay-body">');

            this.$overlayFooter  = $('<div class="kb-overlay-footer">');

            this.$overlay = $('<div>')
                            .addClass('kb-side-overlay-container')
                            //.append($overlayHeader)
                            .append(this.$overlayBody)
                            .append(this.$overlayFooter);

            $('body').append(this.$overlay);
            this.$overlay.hide();

            this.$narrativeDimmer = $('<div>')
                                    .addClass('kb-overlay-dimmer');
            $('body').append(this.$narrativeDimmer);
            this.$narrativeDimmer.hide();
            this.updateOverlayPosition();

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

            // models for filter selections
            var query;

            // models for options in type and workspace dropdowns
            var types = [];
                workspaces =[];

            // tab panels
            var minePanel = $('<div class="kb-import-panel">'),
                sharedPanel = $('<div class="kb-import-panel">'),
                publicPanel = $('<div class="kb-import-panel">'),
                importPanel = $('<div class="kb-import-panel">');

            // content wrapper
            var content = $('<div class="kb-import-content">');

            // add tabs
            var $tabs = this.buildTabs([
                    {tabName: 'My Data', content: minePanel},
                    {tabName: 'Shared', content: sharedPanel},
                    {tabName: 'Public', content: publicPanel},
                    {tabName: 'Import', content: importPanel},
                ]);

            sharedPanel.append('<div class="kb-import-content"><br>coming soon.</div>');
            publicPanel.append('<div class="kb-import-content"><br>coming soon.</div>');
            importPanel.append('<div class="kb-import-content"><br>coming soon.</div>');

            body.addClass('kb-side-panel');
            body.append($tabs.header).append($tabs.body);

            // It is silly to invoke a new object for each widget
            var auth = {token: $("#signin-button").kbaseLogin('session', 'token')}
            var ws = new Workspace(this.options.workspaceURL, auth);            


            // get possible types (not used)
            /*
            ws.list_all_types({}).done(function(res) {
                console.log('types', res)

                var types = [];
                for (var mod in res) {
                    var typeNames = res[mod]
                    for (var type in typeNames) {
                        types.push(type);
                    }
                }
                console.log('type_names', types)
            })*/
            

            // add footer status container and button
            var importStatus = $('<div class="pull-left kb-import-status">');
            footer.append(importStatus)            
            var btn = $('<button class="btn btn-primary pull-right" disabled>Add to Narrative</button>');
            footer.append(btn);

            body.append(footer);
            updateView('mine');


            // function used to update my data list
            function getMyData(workspaces) {
                // clear view
                content.html('');
                content.loading();

                var ws_ids = []
                for (var i in workspaces) ws_ids.push(workspaces[i].id);


                var p = ws.list_objects({ids: ws_ids});
                return $.when(p).then(function(d) {
                    content.rmLoading();                    

                    myData = d;
                    renderAllData();

                    // update view
                    minePanel.append(content);
                    events()
                    
                })

            }

            function updateView(view) {
                //if (view == 'mine') var p = getMyWS();
                //} else if 11

                return getMyWS().done(function(workspaces) {
                    // update workspace dropdown model
                    workspaces = workspaces; 

                    getMyData(workspaces).done(function(filterOptions) {
                        // possible filters via input
                        var type, ws, query;

                        // create workspace filter
                        var wsInput = $('<select class="form-control kb-import-filter">');
                        wsInput.append('<option>All narratives...</option>');
                        for (var i=1; i < workspaces.length-1; i++) {
                            wsInput.append('<option data-id="'+workspaces[i].id+'" data-name="'+workspaces[i].name+'">'+
                                                  workspaces[i].name+
                                            '</option>');
                        }
                        var wsFilter = $('<div class="col-md-4">').append(wsInput);

                        // event for type dropdown
                        wsInput.change(function() {
                            ws = $(this).children('option:selected').data('name');
                            renderFilteredData(type, ws, query);
                            events();
                        })


                        // create type filter
                        var typeInput = $('<select class="form-control kb-import-filter">');
                        typeInput.append('<option>All types...</option>');
                        for (var i=1; i < types.length-1; i++) {
                            typeInput.append('<option data-type="'+types[i]+'">'+
                                                  types[i].split('.')[1]+
                                             '</option>');
                        }
                        var typeFilter = $('<div class="col-md-3">').append(typeInput);

                        // event for type dropdown
                        typeInput.change(function() {
                            type = $(this).children('option:selected').data('type');
                            renderFilteredData(type, ws, query);
                            events();                            
                        })


                        // create filter (search)
                        var filterInput = $('<input type="text" class="form-control kb-import-search" placeholder="Filter objects">');
                        var searchFilter = $('<div class="col-md-4">').append(filterInput);

                        // event for filter (search)
                        filterInput.keyup(function(e){
                            renderFilteredData(type, ws, this.value);
                            events();                            
                        });

                        // add search, type, ws filter to dom
                        var row = $('<div class="row">').append(searchFilter, typeFilter, wsFilter);
                        minePanel.prepend(row);     
                    });


                });
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

            function getMyWS() {
                return ws.list_workspace_info({owners: [user]})
                        .then(function(d) {
                            var workspaces = [];
                            for (var i in d) workspaces.push({id: d[i][0], name: d[i][1]});
                            return workspaces;
                        })
            }

            function getSharedWS() {
                return ws.list_workspace_info({perm: 'w'})
                        .then(function(d) {
                            var workspaces = [];
                            for (var i in d) workspaces.push({id: d[i][0], name: d[i][1]});
                            return workspaces;
                        })
            }

            function events() {
                var selected = [];
                $('.kb-import-checkbox').unbind('change');
                $('.kb-import-checkbox').change(function(){
                    var item = $(this).parent('.kb-import-item');
                    var ref = item.data('ref').replace(/\./g, '/');
                    var name = item.data('obj-name');

                    // update model for selected items
                    if ($(this).is(":checked")) {
                        selected.push({ref: ref, name: name});
                    }
                    else {
                        for (var i=0; i<selected.length; i++) {
                            if (selected[0].ref == ref) 
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

            function renderFilteredData(typeFilter, wsFilter, queryFilter) {
                content.html('');
                console.log('filtering on', typeFilter, wsFilter, queryFilter)

                // add each item to view
                for (var i in myData) {
                    var obj = myData[i];

                    var mod_type = obj[2].split('-')[0];
                    var item = {id: obj[0],
                                name: obj[1],
                                mod_type: mod_type,
                                version: obj[4],
                                kind: mod_type.split('.')[1],
                                module: mod_type.split('.')[0],
                                wsID: obj[6],
                                ws: obj[7],
                                relativeTime: self.prettyTimestamp(obj[3]) }   


                    // filter conditions
                    if (queryFilter && item.name.toLowerCase().indexOf(queryFilter.toLowerCase()) == -1) 
                        continue;
                    if (typeFilter && typeFilter.split('.')[1] != item.kind) 
                        continue;
                    if (wsFilter && wsFilter != item.ws)
                        continue;

                    var item = rowTemplate(item);

                    // update DOM
                    content.append(item);
                }               
            }

            function renderAllData() {
                content.html('');
                // add each item to view
                for (var i in myData) {
                    var obj = myData[i];

                    var mod_type = obj[2].split('-')[0];
                    var item = {id: obj[0],
                                name: obj[1],
                                mod_type: mod_type,
                                version: obj[4],
                                kind: mod_type.split('.')[1],
                                module: mod_type.split('.')[0],
                                wsID: obj[6],
                                ws: obj[7],
                                relativeTime: self.prettyTimestamp(obj[3]) }                             

                    // update model for types dropdown
                    if (types.indexOf(mod_type) == -1) types.push(mod_type);

                    var item = rowTemplate(item);

                    // update DOM
                    content.append(item);                   
                }
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
                item.append('<div class="kb-import-info">'+
                                '<span>NARRATIVE</span><br>'+
                                '<b>'+obj.ws+'<b>'+   //<a class="" href="'+wsURL(obj.ws)+'">'
                            '</div>');
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


        }, 

        prettyTimestamp: function(timestamp) {
            var format = function(x) {
                if (x < 10)
                    x = '0' + x;
                return x;
            };

            var d = new Date(timestamp);
            var hours = format(d.getHours());

            var minutes = format(d.getMinutes());
            var seconds = format(d.getSeconds());
            var month = d.getMonth()+1;
            var day = format(d.getDate());
            var year = d.getFullYear();

            return month + "/" + day + "/" + year + ", " + hours + ":" + minutes + ":" + seconds;
        },
    })
})( jQuery );