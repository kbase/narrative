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
                    name : 'kbaseNarrativeAppsPanel',
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
            var user = 'nconrad';

            var body = this.$overlayBody;
            var footer = this.$overlayFooter;

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

            body.addClass('kb-side-panel');
            body.append($tabs.header).append($tabs.body);


            // It is silly to invoke a new object for each widget
            var auth = {token: $("#signin-button").kbaseLogin('session', 'token')}
            var ws = new Workspace(this.options.workspaceURL, auth);            


            // get possible types (not used)
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
            })
            
            // useable types
            var types = ['Data type...',
                         'KBaseGenomes.Genome', 
                         'KBaseFBA.FBAModel',
                         'KBaseFBAModeling.FBA',
                         'KBaseGenomes.ContigSet',
                         'KBaseGenomes.Pangenome',                         
                         'KBaseFBA.Media'];

            // add search box
            var search = $('<input type="text" class="form-control kb-import-search" placeholder="Search objects" >');
            search = $('<div class="col-md-4">').append(search);
            minePanel.append(row);

            search.keyup(function(e, v){
                console.log(e, v, $(this).val())
            })

            // add type dropdown
            var typeFilter = $('<select class="form-control kb-import-type-filter">');
            typeFilter.append('<option>All types...</option>');
            for (var i=1; i<types.length -1; i++) {
                typeFilter.append('<option data-type="'+types[i]+'">'+
                                    types[i].split('.')[1]+
                                '</option>');
            }
            typeFilter = $('<div class="col-md-3">').append(typeFilter);

            var row = $('<div class="row">').append(search, typeFilter);
            minePanel.append(row);

            // evengt for type dropdown
            typeFilter.change(function(blah) {
                var type = $(this).children('option:selected').data('type');
                if (type) updateView(type);
            })

            // add footer status container and button
            var importStatus = $('<div class="pull-left kb-import-status">');
            footer.append(importStatus)            
            var btn = $('<button class="btn btn-primary pull-right" disabled>Add to Narrative</button>');
            footer.append(btn);

            body.append(footer);

            // get mapping to functional site
            var prom = $.ajax({
                url: '/static/kbase/js/widgets/landing_page_map.json',
                success: function(response) {
                    self.landingPageMap = response;
                },
                error: function() {
                    self.dbg("Unable to get any landing page map! Landing pages mapping unavailable...");
                    self.landingPageMap = null;
                },
            })

            // load data list
            $.when(prom).done(function() {
                // update without type filter on first load
                updateView(null);
            });

            // function used to update my data list
            function getMyData(ids, type, user) {
                // clear view
                content.html('');
                content.loading();

                if (type)
                    var p = ws.list_objects({ids: ids, type: type});
                else 
                    var p = ws.list_objects({ids: ids});

                $.when(p).done(function(d) {
                        content.rmLoading();
                        console.log('heres the data', d);
                        if (type) content.append('<i>'+d.length+'</i> '+ type.split('.')[1] + 's');

                        // add each item
                        for (var i in d) {
                            var obj = d[i];
                            var id = obj[0];
                            var name = obj[1];
                            var mod_type = obj[2].split('-')[0];
                            var kind = mod_type.split('.')[1]
                            var module = mod_type.split('.')[0];
                            var wsID = obj[6];
                            var ws = obj[7];
                            var relativeTime = self.prettyTimestamp(obj[3]);

                            var item = $('<div class="kb-import-item">')
                                            .data('ref', wsID+'.'+id)
                                            .data('obj-name', name);                                    
                            item.append('<input type="checkbox" value="" class="pull-left kb-import-checkbox">');
                            item.append('<a class="h4" href="'+
                                            objURL(module, kind, ws, name)+
                                            '" target="_blank">'+name+'</a>');
                            item.append('<br>');
                            item.append('<i>'+relativeTime+'</i>');

                            content.append(item);
                        }

                        // update view
                        minePanel.append(content);

                        // some events
                        var selected = [];
                        $('.kb-import-checkbox').change(function(){
                            $(this).is(":checked")

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
                })
            }


            function updateView(type) {
                getMyWSIDs().done(function(ids) {
                    getMyData(ids, (type ? type : null), user);
                });
            }

            function objURL(module, type, ws, name) {
                if (self.landingPageMap[module])
                    return self.options.landingPageURL+self.landingPageMap[module][type]+'/'+ws+'/'+name;
            }

            function wsURL(ws) {
                return self.options.landingPageURL+'ws/'+ws;
            }            

            function copyObjects(objs, nar_ws_name) {
                importStatus.html('Adding <i>'+objs.length+'</i> objects to narrative...');

                var proms = [];
                for (var i in objs) {
                    var ref = objs[i].ref;
                    var name = objs[i].name;
                    console.log('copying ', ref, 'to', nar_ws_name)
                    proms.push( ws.copy_object({to: {workspace: nar_ws_name, name: name},
                                                from: {ref: ref} }) );
                }
                return proms;
            }

            function getMyWSIDs() {
                return ws.list_workspace_info({owners: [user]})
                        .then(function(d) {
                            var ids = [];
                            for (var i in d) ids.push(d[i][0]);
                            return ids;
                        })
            }

            function getAllData() {

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