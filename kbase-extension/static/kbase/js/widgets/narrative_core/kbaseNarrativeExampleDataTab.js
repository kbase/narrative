/*global define*/
/*jslint white: true*/
/**
 * @author Michael Sneddon <mwsneddon@lbl.gov>
 * @public
 */
define(['jquery',
        'narrativeConfig',
        'kbwidget',
        'kbaseAuthenticatedWidget',
        'kbaseNarrative'],
function($, Config) {
    'use strict';
    $.KBWidget({
        name: 'kbaseNarrativeExampleDataTab',
        parent: 'kbaseAuthenticatedWidget',
        version: '1.0.0',
        options: {
            ws_name: null, // must be the WS name, not the WS Numeric ID
            ws_url: Config.url('workspace'),
            loadingImage: Config.get('loading_gif'),
            exampleWsName: 'KBaseExampleData', // designed to be a workspace with just a handful of objects
	        $importStatus:$('<div>'),
            exampleTypeOrder: [
                {name:['SingleEndLibrary','PairedEndLibrary','ReferenceAssembly'], displayName: "Example Sequence Assembly Inputs", header:'Various types of read data configured for sequence assembly.'},
                {name:['ContigSet'], displayName: "Example Contig Sets", header:'A set of DNA sequences'},
                {name:['Genome'], displayName: "Example Genomes", header:'Genomic sequence generally with attached functional annotations'},
                {name:['FBAModel'], displayName: "Example FBAModels", header:'A metabolic model of an organism'},
                {name:['Media'], displayName: "Example Media", header:'Specification of an environmental condition'},
                {name:['ExpressionMatrix'], displayName: "Example ExpressionMatrix", header:'Gene expression data in a gene vs. condition matrix'},
                {name:['TranscriptomeHack'], displayName: "Example Sorghum Transcriptomes", header:'Sorghum bicolor transcriptome data in response to ABA and osmotic stress'}
                ]
        },

        ws: null,
        narWs: null,

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
            var self = this;

            this.$loadingDiv = $('<div>').addClass('kb-data-list-type')
                                 .append('<img src="' + this.options.loadingImage + '">');
            this.$elem.append(this.$loadingDiv);
            this.$mainPanel = $('<div>')
                .css({'overflow-y':'auto','height':'604px'});
            this.$elem.append(this.$mainPanel);

            var icons = Config.get('icons');
            this.data_icons = icons.data;
            this.icon_colors = icons.colors;
            this.showLoading();

            if (Jupyter && Jupyter.narrative) {
                this.narWs = Jupyter.narrative.getWorkspaceName();
                // this.getExampleDataAndRender();
            }

            return this;
        },

        refresh: function() { },

        objectList:null,

        getExampleDataAndRender: function() {
            var self = this;
            if (self.narWs && self.ws) {
                self.ws.list_objects({
                        workspaces : [self.options.exampleWsName],
                        includeMetadata: 1
                    },
                    function(infoList) {
                        self.objectList = [];
                        // object_info:
                        // [0] : obj_id objid // [1] : obj_name name // [2] : type_string type
                        // [3] : timestamp save_date // [4] : int version // [5] : username saved_by
                        // [6] : ws_id wsid // [7] : ws_name workspace // [8] : string chsum
                        // [9] : int size // [10] : usermeta meta
                        for (var i=0; i<infoList.length; i++) {
                            // skip narrative objects
                            if (infoList[i][2].indexOf('KBaseNarrative') == 0) { continue; }
                            if (infoList[i][1].indexOf('Transcriptome') == 0) {
                                infoList[i][2] = 'TranscriptomeHack';
                            }
                            self.objectList.push({
                                    $div:self.renderObjectRowDiv(infoList[i]), // we defer rendering the div until it is shown
                                    info:infoList[i]
                                }
                            );
                        }
                        self.renderData();
                    },
                    function(error) {
                        self.$mainPanel.show();
                        self.$mainPanel.append("error: ");
                        self.$mainPanel.append(error.error.message);
                        console.error(error);
                        self.hideLoading();
                    });
            }

        },


        renderData: function() {
            var self = this;
            if (!self.objectList) { return; }

            var typeDivs = {}; 
            var showTypeDiv = {};
            for(var t=0; t<self.options.exampleTypeOrder.length; t++) {
                var typeInfo = self.options.exampleTypeOrder[t];
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
            self.objectList.sort(function(a,b) {
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

            for(var t=0; t<self.options.exampleTypeOrder.length; t++) {
                var typeNames = self.options.exampleTypeOrder[t].name;
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
                var type_module = type_tokens[0];
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
                            self.ws.copy_object({
                                to:   {ref: self.narWs     + "/" + object_info[1]},
                                from: {ref: object_info[6] + "/" + object_info[0]} },
                                function (info) {
                                    $(thisBtn).html('Added');
                                    self.trigger('updateDataList.Narrative');
                                },
                                function(error) {
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

            var shortName = object_info[1]; var isShortened=false;
            /*if (shortName.length>this.options.max_name_length) {
                shortName = shortName.substring(0,this.options.max_name_length-3)+'...';
                isShortened=true;
            }*/
            var $name = $('<span>').addClass("kb-data-list-name").append(shortName);
            if (isShortened) { $name.tooltip({title:object_info[1], placement:'bottom'}); }
            var $type = $('<span>').addClass("kb-data-list-type").append(type);

            var metadata = object_info[10];
            var metadataText = '';
            for(var key in metadata) {
                if (metadata.hasOwnProperty(key)) {
                    metadataText += '<tr><th>'+ key +'</th><td>'+ metadata[key] + '</td></tr>';
                }
            }
            if (type==='Genome') {
                if (metadata.hasOwnProperty('Name')) {
                    $type.html('Genome: '+metadata['Name']);
                }
            }
            var icons = this.data_icons;
            var icon = _.has(icons, type) ? icons[type] : icons['DEFAULT'];
            var $logo = $('<span>');
            var $topTable = $('<table>')
                .css({'width':'100%','background':'#fff'})  // set background to white looks better on DnD
                .append($('<tr>')
                    .append($('<td>')
                        .css({'width':'90px'})
                        .append($addDiv.hide()))
                    .append($('<td>')
                        .css({'width':'50px'})
                        .append($logo))/*$('<span>')
                              .addClass("kb-data-list-logo")
                              .css({'background-color':this.logoColorLookup(type)})
                              .append(type.substring(0,1))))*/
                    .append($('<td>')
                         .append($name).append('<br>').append($type)));

	    var $row = $('<div>')
                                .css({margin:'2px',padding:'4px','margin-bottom': '5px'})
                                //.addClass('kb-data-list-obj-row')
                                .append($('<div>').addClass('kb-data-list-obj-row-main')
                                            .append($topTable))
                                .mouseenter(function(){
                                    $addDiv.show();
                                })
                                .mouseleave(function(){
                                    $addDiv.hide();
                                });
            // set icon
            $(document).trigger("setDataIcon.Narrative", {
                elt: $logo,
                type: type
            });

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
            this.ws = new Workspace(this.options.ws_url, auth);
            return this;
        },

        loggedOutCallback: function(event, auth) {
            this.ws = null;
            this.isLoggedIn = false;
            return this;
        },

    })

});