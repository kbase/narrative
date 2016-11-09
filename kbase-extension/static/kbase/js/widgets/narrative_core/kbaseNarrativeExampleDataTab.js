/*global define*/
/*jslint white: true*/
/**
 * @author Michael Sneddon <mwsneddon@lbl.gov>
 * @author Bill Riehl <wjriehl@lbl.gov>
 * @public
 */
define ([
	'kbwidget',
	'bootstrap',
	'jquery',
    'underscore',
	'bluebird',
	'narrativeConfig',
	'kbaseAuthenticatedWidget',
	'kbaseNarrative',
    'kbase-generic-client-api',
    'base/js/namespace',
    'util/display',
    'util/icon'
], function (
	KBWidget,
	bootstrap,
	$,
    _,
	Promise,
	Config,
	kbaseAuthenticatedWidget,
	kbaseNarrative,
    GenericClient,
    Jupyter,
    DisplayUtil,
    Icon
) {
    'use strict';
    return KBWidget({
        name: 'kbaseNarrativeExampleDataTab',
        parent : kbaseAuthenticatedWidget,
        version: '1.0.0',
        options: {
            ws_name: null, // must be the WS name, not the WS Numeric ID
            loadingImage: Config.get('loading_gif'),
            $importStatus: $('<div>')
        },

        ws: null,
        narWs: null,
        serviceClient: null,

        $mainPanel:null,
        $loadingDiv:null,

        /**
         * @method init
         * Builds the DOM structure for the widget.
         * Includes the tables and panel.
         * If any data was passed in (options.data), that gets shoved into the datatable.
         * @param {Object} - the options set.
         * @returns {Object} this shiny new widget.
         * @private
         */
        init: function(options) {
            this._super(options);

            this.$loadingDiv = $('<div>').addClass('kb-data-list-type')
                                 .append('<img src="' + this.options.loadingImage + '">');
            this.$elem.append(this.$loadingDiv);
            this.$mainPanel = $('<div>')
                .css({'overflow-y':'auto','height':'604px'});
            this.$elem.append(this.$mainPanel);

            this.dataConfig = Config.get('exampleData');
            var icons = Config.get('icons');
            this.data_icons = icons.data;
            this.icon_colors = icons.colors;
            this.showLoading();

            this.narWs = Jupyter.narrative.getWorkspaceName();

            return this;
        },

        refresh: function() { },

        objectList:null,

        getExampleDataAndRender: function() {
            if (!this.dataConfig) {
                this.showError("Unable to load example data configuration! Please refresh your page to try again. If this continues to happen, please <a href='https://kbase.us/contact-us/'>click here</a> to contact KBase with the problem.");
                return;
            }

            if (this.narWs) {
                Promise.resolve(this.serviceClient.sync_call(
                    "NarrativeService.list_objects_with_sets",
                    [{
                        ws_name: this.dataConfig.ws
                    }]
                ))
                .then(function(infoList) {
                    infoList = infoList[0]['data'];
                    this.objectList = [];
                    // object_info:
                    // [0] : obj_id objid // [1] : obj_name name // [2] : type_string type
                    // [3] : timestamp save_date // [4] : int version // [5] : username saved_by
                    // [6] : ws_id wsid // [7] : ws_name workspace // [8] : string chsum
                    // [9] : int size // [10] : usermeta meta
                    for (var i=0; i<infoList.length; i++) {
                        // skip narrative objects
                        var obj = infoList[i].object_info;
                        if (obj[2].indexOf('KBaseNarrative') === 0) { continue; }
                        if (obj[1].indexOf('Transcriptome') === 0) {
                            obj[2] = 'TranscriptomeHack';
                        }
                        this.objectList.push({
                            $div:this.renderObjectRowDiv(obj), // we defer rendering the div until it is shown
                            info:obj
                        });
                    }
                    this.renderData();
                }.bind(this))
                .catch(function(error) {
                    this.showError('Sorry, we\'re unable to load example data', error);
                    alert(error);
                }.bind(this));
            }
        },

        showError: function(title, error) {
            this.$mainPanel.show();
            this.$mainPanel.append(DisplayUtil.createError(title, error));
            this.hideLoading();
        },

        renderData: function() {
            var self = this;
            if (!self.objectList) { return; }

            var typeDivs = {};
            var showTypeDiv = {};
            for(var t=0; t<this.dataConfig.data_types.length; t++) {
                var typeInfo = this.dataConfig.data_types[t];
                var $tc = $('<div>')
                            .append($('<div>').css({'margin':'15px'})
                                .append($('<div>').css({'margin':'4px','margin-top':'15px','color':'#555','font-size':'large','font-weight':'bold'})
                                        .append(typeInfo.displayName))
                                .append($('<div>').css({'margin':'4px','color':'#555'})
                                        .append(typeInfo.header)));
                for(var k=0; k<typeInfo.name.length; k++) {
                    typeDivs[typeInfo.name[k]] = $tc;
                    showTypeDiv[typeInfo.name[k]] = false;
                }
            }
            var $tc = $('<div>')
                      .append($('<div>').css({'margin':'15px'})
                          .append($('<div>').css({'margin':'4px','margin-top':'15px','color':'#555','font-size':'large','font-weight':'bold'})
                                  .append('Other Examples'))
                          .append($('<div>').css({'margin':'4px','color':'#555'})
                                  .append('Assorted data types used in more advanced analyses')));
            typeDivs['other.types'] = $tc;

            var hasOthers = false;
            self.objectList.sort(
                function(a,b) {
                    if (a.info[2].toUpperCase() > b.info[2].toUpperCase()) return -1; // sort by type
                    if (a.info[2].toUpperCase() < b.info[2].toUpperCase()) return 1;
                    if (a.info[1].toUpperCase() > b.info[1].toUpperCase()) return -1; // then by name
                    if (a.info[1].toUpperCase() < b.info[1].toUpperCase()) return 1;
                    return 0;
                });
            for (var k=0; k<self.objectList.length; k++) {
                var obj = self.objectList[k];
                var typeName='';
                if (obj.info[2]==='TranscriptomeHack') {
                    typeName=obj.info[2];
                } else {
                    typeName = obj.info[2].split('-')[0].split('.')[1];
                }

                if (typeDivs.hasOwnProperty(typeName)) {
                    typeDivs[typeName].append(obj.$div);
                    showTypeDiv[typeName] = true;
                } else {
                    typeDivs['other.types'].append(obj.$div);
                    hasOthers = true;
                }
            }

            for(var t=0; t<this.dataConfig.data_types.length; t++) {
                var typeNames = this.dataConfig.data_types[t].name;
                var showDiv = false;
                for(var k=0; k<typeNames.length; k++) {
                    if(showTypeDiv[typeNames[k]]) {
                        showDiv = true;
                    }
                }
                if(showDiv) {
                    self.$mainPanel.append(typeDivs[typeNames[0]]);
                }
            }
            if (hasOthers) {
                self.$mainPanel.append(typeDivs['other.types']);
            }

            self.hideLoading();
        },

        renderObjectRowDiv: function(object_info) {
            var self = this;
            // object_info:
            // [0] : obj_id objid // [1] : obj_name name // [2] : type_string type
            // [3] : timestamp save_date // [4] : int version // [5] : username saved_by
            // [6] : ws_id wsid // [7] : ws_name workspace // [8] : string chsum
            // [9] : int size // [10] : usermeta meta
            var type = '';
            if (object_info[2]==='TranscriptomeHack') {
                type='Genome';
            } else {
                var type_tokens = object_info[2].split('.')
                type = type_tokens[1].split('-')[0];
            }

            var $addDiv =
                $('<div>').append(
                    $('<button>').addClass('kb-primary-btn').css({'white-space':'nowrap', padding:'10px 15px'})
                        .append($('<span>').addClass('fa fa-chevron-circle-left')).append(' Add')
                        .on('click',function() { // probably should move action outside of render func, but oh well
                            $(this).attr("disabled","disabled");
                            $(this).html('<img src="'+self.options.loadingImage+'">');

                            var thisBtn = this;
                            Promise.resolve(self.serviceClient.sync_call(
                                "NarrativeService.copy_object",
                                [{
                                    ref: object_info[6] + "/" + object_info[0],
                                    target_ws_name: self.narWs,
                                }]
                            ))
                            .then(function(info) {
                                $(thisBtn).html('Added');
                                self.trigger('updateDataList.Narrative');
                            })
                            .catch(function(error) {
                                $(thisBtn).html('Error');
                                if (error.error && error.error.message) {
                                    if (error.error.message.indexOf('may not write to workspace')>=0) {
                                        self.options.$importStatus.html($('<div>').css({'color':'#F44336','width':'500px'}).append('Error: you do not have permission to add data to this Narrative.'));
                                    } else {
                                        self.options.$importStatus.html($('<div>').css({'color':'#F44336','width':'500px'}).append('Error: '+error.error.message));
                                    }
                                } else {
                                    self.options.$importStatus.html($('<div>').css({'color':'#F44336','width':'500px'}).append('Unknown error!'));
                                }
                                console.error(error);
                            });
                        }));

            var shortName = object_info[1],
                isShortened=false;
            var $name = $('<span>').addClass("kb-data-list-name").append(shortName);
            if (isShortened) {
                $name.tooltip({title:object_info[1], placement:'bottom'});
            }
            var $type = $('<span>').addClass("kb-data-list-type").append(type);

            var metadata = object_info[10] || {};
            if (type==='Genome') {
                if (metadata.hasOwnProperty('Name')) {
                    $type.html('Genome: '+metadata['Name']);
                }
            }
            var $logo = $('<span>');
            var $topTable = $('<table>')
                .css({'width':'100%','background':'#fff'})  // set background to white looks better on DnD
                .append($('<tr>')
                    .append($('<td>')
                        .css({'width':'90px'})
                        .append($addDiv.hide()))
                    .append($('<td>')
                        .css({'width':'50px'})
                        .append($logo))
                    .append($('<td>')
                         .append($name).append('<br>').append($type)));

            var $row = $('<div>')
                        .css({margin:'2px',padding:'4px','margin-bottom': '5px'})
                        .append($('<div>').addClass('kb-data-list-obj-row-main')
                                    .append($topTable))
                        .mouseenter(function(){
                            $addDiv.show();
                        })
                        .mouseleave(function(){
                            $addDiv.hide();
                        });
            Icon.buildDataIcon($logo, type);

            return $row;
        },

        showLoading : function() {
            this.$loadingDiv.show();
            this.$mainPanel.hide();
        },

        hideLoading : function() {
            this.$loadingDiv.hide();
            this.$mainPanel.show();
        },

        loggedInCallback: function(event, auth) {
            this.serviceClient = new GenericClient(Config.url('service_wizard'), auth);
            return this;
        },

        loggedOutCallback: function(event) {
            this.isLoggedIn = false;
            return this;
        },
    })
});
