(function($, undefined) {
    $.KBWidget({
        name: 'kbaseNarrativeSidePanel',
        parent: 'kbaseWidget',
        options: {
            loadingImage: "static/kbase/images/ajax-loader.gif",
            autorender: true,
            workspaceURL: "https://kbase.us/services/ws", //used for data importer
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

            this.$overlayBody = $('<div>');

            this.$overlay = $('<div>')
                            .addClass('kb-side-overlay-container')
                            //.append($overlayHeader)
                            .append(this.$overlayBody);
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
            var self = this;
            var minePanel = $('<div>');
            var publicPanel = $('<div>');
            var body = this.$overlayBody;   

            // add tabs
            var $tabs = this.buildTabs([
                {
                    tabName : 'My Data',
                    content : minePanel
                },
                {
                    tabName : 'Public',
                    content: publicPanel
                }
            ]);

            body.addClass('kb-side-panel');
            body.append($tabs.header).append($tabs.body);


            // It is silly to invoke a new object for each widget
            var auth = {token: $("#signin-button").kbaseLogin('session', 'token')}
            var ws = new Workspace(this.options.workspaceURL, auth);            

            console.log(ws)
            // get possible types
            ws.list_all_types({}).done(function(types) {
                console.log('types', types)
            })
            var selector = $('<selector>')


            // this could be used elswhere
            var footer = $('<div class="overlay-footer" style="position: absolute; bottom: 20px; right: 20px;">');
            footer.append('<button class="btn btn-primary" disabled>Add to Narrative</button>')
            body.append(footer);

            // populate list;
            ws.list_objects({type: 'KBaseGenomes.Genome', savedby: ['nconrad']})
                .done(function(d) {
                    console.log('heres the data', d)

                    minePanel.append('<div>')
                    for (var i in d.slice(0,10)) {
                        var obj = d[i];
                        var id = obj[0];
                        var name = obj[1];
                        var wsID = obj[6];
                        var ws = obj[7];
                        var relativeTime = self.prettyTimestamp(obj[3]);

                        var item = $('<div class="kb-import-item">');
                        item.append('<input type="checkbox" value="" class="pull-left">')
                        item.append('<span class="h4">'+name+'</span><br>');
                        item.append('<i>'+relativeTime+'</i>');
                        minePanel.append(item);
                    }

            })

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