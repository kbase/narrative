/*global define*/
/*jslint white: true*/
/**
 * "Import" tab on data side panel.
 * @author Roman Sutormin <rsutormin@lbl.gov>
 * @public
 */
define(['jquery',
        'bluebird',
        'narrativeConfig',
        'kbwidget',
        'kbaseAuthenticatedWidget'],
function($, 
         Promise, 
         Config) {
    'use strict';
    $.KBWidget({
        name: "kbaseNarrativeSidePublicTab",
        parent: "kbaseAuthenticatedWidget",
        version: "1.0.0",
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
        wsClient: null,
        // categories: ['genomes', 
        //              //'metagenomes', 
        //              'media', 'plant_gnms'
        //              /*'gwas_populations', 'gwas_population_kinships', 'gwas_population_variations',
        //              'gwas_top_variations', 'gwas_population_traits', 'gwas_gene_lists'*/ ],
        // categoryDescr: {  // search API category -> {}
        //     'genomes': {name:'Genomes',type:'KBaseGenomes.Genome',ws:'KBasePublicGenomesV5',search:true},
        //     // 'metagenomes': {name: 'Metagenomes',type:'Communities.Metagenome',ws:'wilke:Data',search:true},
        //     'media': {name:'Media',type:'KBaseBiochem.Media',ws:'KBaseMedia',search:false},
        //     'plant_gnms': {name:'Plant Genomes',type:'KBaseGenomes.Genome',ws:'PlantCSGenomes',search:false}
            
        //     'gwas_populations': {name:'GWAS Populations',type:'KBaseGwasData.GwasPopulation',ws:'KBasePublicGwasDataV2',search:true},
        //     'gwas_population_kinships': {name:'GWAS Population Kinships',type:'KBaseGwasData.GwasPopulationKinship',ws:'KBasePublicGwasDataV2',search:true},
        //     'gwas_population_variations': {name:'GWAS Population Variations',type:'KBaseGwasData.GwasPopulationVariation',ws:'KBasePublicGwasDataV2',search:true},
        //     'gwas_top_variations': {name:'GWAS Top Variations',type:'KBaseGwasData.GwasTopVariations',ws:'KBasePublicGwasDataV2',search:true},
        //     'gwas_population_traits': {name:'GWAS Population Traits',type:'KBaseGwasData.GwasPopulationTrait',ws:'KBasePublicGwasDataV2',search:true},
        //     'gwas_gene_lists': {name:'GWAS Gene Lists',type:'KBaseGwasData.GwasGeneList',ws:'KBasePublicGwasDataV2',search:true}
        // },
        mainListPanelHeight: '535px',
        maxNameLength: 60,
        totalPanel: null,
        resultPanel: null,
        objectList: null,
        currentCategory: null,
        currentQuery: null,
        currentPage: null,
        totalResults: null,
        itemsPerPage: 20,
        maxAutoCopyCount: 1,

        init: function(options) {
            this._super(options);

            this.data_icons = Config.get('icons').data;
            this.icon_colors = Config.get('icons').colors;
            this.wsName = Jupyter.narrative.getWorkspaceName();
            this.categoryDescr = Config.get('publicCategories');
            if (this.categoryDescr)
                this.categories = Object.keys(this.categoryDescr);

            return this;
        },

        render: function() {
            if ((!this.token) || (!this.wsName))
                return;
            this.infoPanel = $('<div>');
            this.$elem.empty().append(this.infoPanel);
            if (!this.categories) {
                this.showError("Unable to load public data configuration! Please refresh your page to try again. If this continues to happen, please <a href='https://kbase.us/contact-us/'>click here</a> to contact KBase with the problem.");
                return;
            }

            this.wsClient = new Workspace(this.wsUrl, {'token': this.token});
            var mrg = {'margin': '10px 0px 10px 0px'};
            var typeInput = $('<select class="form-control kb-import-filter">').css(mrg);
            for (var catPos in this.categories) {
                var cat = this.categories[catPos];
                var catName = this.categoryDescr[cat].name;
                typeInput.append('<option value="'+cat+'">'+catName+'</option>');
            }
            var typeFilter = $('<div class="col-sm-3">').append(typeInput);
            var filterInput = $('<input type="text" class="form-control kb-import-search" placeholder="Search data...">').css(mrg);
            typeInput.change(function() {
                this.searchAndRender(typeInput.val(), filterInput.val());
            }.bind(this));
            filterInput.keyup(function(e) {
                this.searchAndRender(typeInput.val(), filterInput.val());
            }.bind(this));

            var searchFilter = $('<div class="col-sm-9">').append(filterInput);

            var header = $('<div class="row">').css({'margin': '0px 10px 0px 10px'}).append(typeFilter).append(searchFilter);
            this.$elem.append(header);
            this.totalPanel = $('<div>').css({'margin': '0px 0px 0px 10px'});
            this.$elem.append(this.totalPanel);

            var self = this;
            this.resultPanel = $('<div>')
                .css({'overflow-x' : 'hidden', 'overflow-y':'auto', 'height':this.mainListPanelHeight })
                .on('scroll', function() {
                    if($(this).scrollTop() + $(this).innerHeight() >= this.scrollHeight) {
                        self.renderMore();
                    }
                });
            this.$elem.append(this.resultPanel);
            this.searchAndRender(typeInput.val(), filterInput.val());
            return this;
        },

        searchAndRender: function(category, query) {
            var self = this;
            if (query) {
                query = query.trim();
                if (query.length == 0) {
                    query = '*';
                } else if (query.indexOf('"') < 0) {
                    var parts = query.split(/\s+/);
                    for (var i in parts)
                        if (parts[i].indexOf('*', parts[i].length - 1) < 0)
                            parts[i] = parts[i] + '*';
                    query = parts.join(' ');
                }
            } else {
                query = '*';
            }
            if (self.currentQuery && self.currentQuery === query && category === self.currentCategory)
                return;

            self.totalPanel.empty();
            self.resultPanel.empty();
            self.totalPanel.append($('<span>').addClass("kb-data-list-type").append('<img src="'+this.loadingImage+'"/> searching...'));
            self.objectList = [];
            self.currentCategory = category;
            self.currentQuery = query;
            self.currentPage = 0;
            self.totalResults = null;
            self.renderMore();
        },

        renderMore: function() {
            var cat = this.categoryDescr[this.currentCategory];
            if (!cat.search) {
                if (this.currentPage > 0)
                    return;
                this.currentPage++;
                var type = cat.type;
                var ws = cat.ws;

                var thisQuery = this.currentQuery;
                Promise.resolve(this.wsClient.list_objects({
                    workspaces: [ws],
                    type: type,
                    includeMetadata: 1,
                }))
                .then(function(data) {
                    if (thisQuery !== this.currentQuery)
                        return;
                    var query = this.currentQuery.replace(/[\*]/g,' ').trim().toLowerCase();
                    for (var i=0; i<data.length; i++) {
                        var info = data[i];
                        // object_info:
                        // [0] : obj_id objid // [1] : obj_name name // [2] : type_string type
                        // [3] : timestamp save_date // [4] : int version // [5] : username saved_by
                        // [6] : ws_id wsid // [7] : ws_name workspace // [8] : string chsum
                        // [9] : int size // [10] : usermeta meta
                        var name = info[1];
                        var id = info[0];
                        var metadata = {};
                        // the ws object size of the media doesn't seem useful!
                        //if (this.currentCategory === 'media') {
                        //    metadata['Size'] = info[9];
                        //} else
                        if (this.currentCategory === 'plant_gnms') {
                            if (info[10].Name) {
                                metadata['ID'] = id;
                                name = info[10].Name;
                            }
                            metadata['Source'] = info[10].Source;
                            metadata['Genes'] = info[10]['Number features'];
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
                            metadata: metadata,
                            ws: cat.ws,
                            type: cat.type,
                            attached: false
                        });
                        this.attachRow(this.objectList.length - 1);
                    }
                    data.totalResults = this.objectList.length;
                    this.totalPanel.empty();
                    this.totalPanel.append($('<span>').addClass("kb-data-list-type")
                            .append("Total results: " + data.totalResults));
                }.bind(this))
                .catch(function(error) {
                    console.error(error);
                    this.totalPanel.empty();
                    this.totalPanel.append($('<span>').addClass("kb-data-list-type").append("Total results: 0"));
                }.bind(this));

        // // list_objects: function(ws, type, query, okCallback, errorCallback) {
        // //     this.wsClient.list_objects({workspaces: [ws], type: type, includeMetadata: 1}, function(data) {

        //         self.list_objects(ws, type, self.currentQuery, function(data, origQuery) {
        //             if (thisQuery !== self.currentQuery)
        //                 return;
        //             //console.log(data);
        //             var query = self.currentQuery.replace(/[\*]/g,' ').trim().toLowerCase();
        //             for (var i in data) {
        //                 var info = data[i];
        //                 // object_info:
        //                 // [0] : obj_id objid // [1] : obj_name name // [2] : type_string type
        //                 // [3] : timestamp save_date // [4] : int version // [5] : username saved_by
        //                 // [6] : ws_id wsid // [7] : ws_name workspace // [8] : string chsum
        //                 // [9] : int size // [10] : usermeta meta
        //                 var name = info[1];
        //                 var id = info[1];
        //                 var metadata = {};
        //                 if (self.currentCategory === 'media') {
        //                     metadata['Size'] = info[9];
        //                 } else if (self.currentCategory === 'plant_gnms') {
        //                     if (info[10].Name) {
        //                         metadata['ID'] = id;
        //                         name = info[10].Name;
        //                     }
        //                     metadata['Source'] = info[10].Source;
        //                     metadata['Genes'] = info[10]['Number features'];
        //                 }
        //                 if (name.toLowerCase().indexOf(query) == -1)
        //                     continue;
        //                 self.objectList.push({
        //                     $div: null,
        //                     info: info,
        //                     id: id,
        //                     name: name,
        //                     metadata: metadata,
        //                     ws: cat.ws,
        //                     type: cat.type,
        //                     attached: false
        //                 });
        //                 self.attachRow(self.objectList.length - 1);
        //             }
        //             data.totalResults = self.objectList.length;
        //             self.totalPanel.empty();
        //             self.totalPanel.append($('<span>').addClass("kb-data-list-type")
        //                     .append("Total results: " + data.totalResults));
        //         }, function(error) {
        //             //console.log(error);
        //             self.totalPanel.empty();
        //             self.totalPanel.append($('<span>').addClass("kb-data-list-type").append("Total results: 0"));
        //         });
            } else {
                this.currentPage++;
                this.search(this.currentCategory, this.currentQuery, this.itemsPerPage, this.currentPage, function(query, data) {
                    if (query !== this.currentQuery) {
                        //console.log("Skip results for: " + query);
                        return;
                    }
                    this.totalPanel.empty();
                    if (!this.totalResults) {
                        this.totalResults = data.totalResults;
                    }
                    if (this.currentCategory === 'genomes') {
                        for (var i in data.items) {
                            var id = data.items[i].genome_id;
                            var name = data.items[i].scientific_name;
                            var domain = data.items[i].domain;
                            var contigs = data.items[i].num_contigs
                            var genes = data.items[i].num_cds
                            this.objectList.push({
                                $div: null,
                                info: null,
                                id: id,
                                name: name,
                                metadata: {'Domain': domain, 'Contigs': contigs, 'Genes': genes},
                                ws: cat.ws,
                                type: cat.type,
                                attached: false
                            });
                            this.attachRow(this.objectList.length - 1);
                        }
                    } else if (this.currentCategory === 'metagenomes') {
                        for (var i in data.items) {
                            var id = data.items[i].object_name;
                            var name = data.items[i].metagenome_name;
                            var sequence_type = data.items[i].sequence_type;
                            var mix_biome = data.items[i].mix_biome;
                            this.objectList.push({
                                $div: null,
                                info: null,
                                id: id,
                                name: name,
                                metadata: {'Sequence Type': sequence_type, 'Biome': mix_biome},
                                ws: cat.ws,
                                type: cat.type,
                                attached: false
                            });
                            this.attachRow(this.objectList.length - 1);
                        }
                    } /*else {
                        for (var i in data.items) {
                            var id = data.items[i].object_name;
                            var name = data.items[i].object_name;
                            var metadata = {};
                            if (this.currentCategory === 'gwas_populations') {
                                metadata['Genome'] = data.items[i].kbase_genome_name;
                                metadata['Source'] = data.items[i].source_genome_name;
                            } else if (this.currentCategory === 'gwas_population_kinships') {
                                metadata['Genome'] = data.items[i].kbase_genome_name;
                                metadata['Source'] = data.items[i].source_genome_name;
                            } else if (this.currentCategory === 'gwas_population_variations') {
                                metadata['Originator'] = data.items[i].originator;
                                metadata['Assay'] = data.items[i].assay;
                            } else if (this.currentCategory === 'gwas_top_variations') {
                                metadata['Trait'] = data.items[i].trait_name;
                                metadata['Ontology'] = data.items[i].trait_ontology_id;
                                metadata['Genome'] = data.items[i].kbase_genome_name;
                            } else if (this.currentCategory === 'gwas_population_traits') {
                                metadata['Trait'] = data.items[i].trait_name;
                                metadata['Ontology'] = data.items[i].trait_ontology_id;
                                metadata['Genome'] = data.items[i].kbase_genome_name;
                            } else if (this.currentCategory === 'gwas_gene_lists') {
                                metadata['Genes'] = data.items[i].gene_count;
                                metadata['SNPs'] = data.items[i].gene_snp_count;
                            }
                            this.objectList.push({
                                $div: null,
                                info: null,
                                id: id,
                                name: name,
                                metadata: metadata,
                                ws: cat.ws,
                                type: cat.type,
                                attached: false
                            });
                            this.attachRow(this.objectList.length - 1);
                        }
                    }*/
                    this.totalPanel.append($('<span>').addClass("kb-data-list-type")
                            .append("Total results: " + data.totalResults + " (" + this.objectList.length + " shown)"));
                }.bind(this), function(error) {
                    //console.log(error);
                    if (this.objectList.length == 0) {
                        this.totalPanel.empty();
                        this.totalPanel.append($('<span>').addClass("kb-data-list-type").append("Total results: 0"));
                    }
                }.bind(this));
            }
        },

        // list_objects: function(ws, type, query, okCallback, errorCallback) {
        //     this.wsClient.list_objects({workspaces: [ws], type: type, includeMetadata: 1}, function(data) {
        //         okCallback(data, query);
        //     }, function(error) {
        //         errorCallback(error);
        //     });
        // },
        
        attachRow: function(index) {
            var obj = this.objectList[index];
            if (obj.attached) { return; }
            if (obj.$div) {
                this.resultPanel.append(obj.$div);
            } else {
                obj.$div = this.renderObjectRowDiv(obj);
                this.resultPanel.append(obj.$div);
            }
            obj.attached = true;
            this.n_objs_rendered++;
        },

        escapeSearchQuery: function(str) {
            return str.replace(/[\%]/g, "").replace(/[\:\"\\]/g, "\\$&");
        },

        search: function (category, query, itemsPerPage, pageNum, ret, errorCallback) {
            var escapedQ = this.escapeSearchQuery(query);
            var url = this.searchUrlPrefix + '?itemsPerPage=' + itemsPerPage + '&' +
                'page=' + pageNum + '&q=' + encodeURIComponent(escapedQ) + '&category=' + category;

            return Promise.resolve($.get(url))
                .then(function(data) {
                    ret(query, data);
                })
                .catch(function(error) {
                    if(errorCallback) {
                        errorCallback(error);
                    }
                });
        },

        renderObjectRowDiv: function(object) {
            var self = this;
            var type_tokens = object.type.split('.')
            var type_module = type_tokens[0];
            var type = type_tokens[1].split('-')[0];

            var $addDiv =
                $('<div>').append(
                    $('<button>').addClass('kb-primary-btn').css({'white-space':'nowrap', padding:'10px 15px'})
                        .append($('<span>').addClass('fa fa-chevron-circle-left')).append(' Add')
                        .on('click',function() { // probably should move action outside of render func, but oh well
                            $(this).attr("disabled","disabled");
                            $(this).html('<img src="'+self.loadingImage+'">');

                            var thisBtn = this;
                            var targetName = object.name;
                            if (!isNaN(targetName))
                                targetName = self.categoryDescr[self.currentCategory].type.split('.')[1] + ' ' + targetName;
                            targetName = targetName.replace(/[^a-zA-Z0-9|\.\-_]/g,'_');
                            self.copy(object, targetName, thisBtn);
                        }));

            var shortName = object.name;
            var isShortened=false;
            if (shortName.length>this.maxNameLength) {
                shortName = shortName.substring(0,this.maxNameLength-3)+'...';
                isShortened=true;
            }
            var landingPageLink = this.options.lp_url + object.ws + '/' + object.id;
            var $name = $('<span>').addClass("kb-data-list-name").append('<a href="'+landingPageLink+'" target="_blank">' + shortName + '</a>');
            if (isShortened) { $name.tooltip({title:object.name, placement:'bottom'}); }

            var $btnToolbar = $('<span>').addClass('btn-toolbar pull-right').attr('role', 'toolbar').hide();
            var btnClasses = "btn btn-xs btn-default";
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
                                            window.open('/#objgraphview/'+object.ws+'/'+object.id);
                                        });
            $btnToolbar.append($openLandingPage).append($openProvenance);

            var titleElement = $('<span>').css({'margin':'10px'}).append($btnToolbar.hide()).append($name);

            var hasMetadata = false;
            for (var key in object.metadata) {
                if (!object.metadata.hasOwnProperty(key))
                    continue;
                var val = object.metadata[key];
                if (!val)
                    val = '-';
                var value = $('<span>').addClass("kb-data-list-type").append('&nbsp;&nbsp;' + key + ':&nbsp;' + val);
                titleElement.append('<br>').append(value);
                hasMetadata = true;
            }
            if(!hasMetadata) {
                titleElement.append('<br>').append('&nbsp;');
            }

                    // Set data icon
                    var $logo = $('<span>');
                    //console.debug("setDataIcon:public type=", type);
                    $(document).trigger('setDataIcon.Narrative', {elt: $logo, type: type});

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
                                //.addClass('kb-data-list-obj-row')
                                .append($('<div>').addClass('kb-data-list-obj-row-main')
                                            .append($topTable))
                                // show/hide ellipses on hover, show extra info on click
                                .mouseenter(function(){
                                    //if (!$moreRow.is(':visible')) { $toggleAdvancedViewBtn.show(); }
                                    $addDiv.show();
                                    $btnToolbar.show();
                                })
                                .mouseleave(function(){
                                    //$toggleAdvancedViewBtn.hide();
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

        copy: function(object, targetName, thisBtn, suffix) {
            if (suffix && suffix > this.maxAutoCopyCount) {
                this.copyPrompt(object, targetName, thisBtn);
                return;
            }
            var correctedTargetName = targetName;
            if (suffix) {
                correctedTargetName += "_" + suffix;
            } else {
                suffix = 1;
            }

            Promise.resolve(this.wsClient.get_object_info_new({
                objects: [{ref: this.wsName + '/' + correctedTargetName}]
            }))
            .then(function(info) {
                this.copy(object, targetName, thisBtn, suffix + 1);
            }.bind(this))
            .catch(function(error) {
                if (error.error && error.error.message && error.error.message.indexOf(
                    'No object with name ' + correctedTargetName + ' exists in workspace') === 0) {
                    this.copyFinal(object, correctedTargetName, thisBtn);
                }
                else {
                    this.copyPrompt(object, targetName, thisBtn, true);
                }
            }.bind(this));
            // this.wsClient.get_object_info_new({objects: [{ref: self.wsName + "/" + correctedTargetName}]}, function (info) {
            //     //console.log(correctedTargetName + ' exists:', info);
            //     // Object exists, increment suffix
            //     this.copy(object, targetName, thisBtn, suffix + 1);
            // }, function (error) {
            //     //console.log(error);
            //     if (error.error && error.error.message && error.error.message.indexOf(
            //             'No object with name '+correctedTargetName+' exists in workspace') == 0) {
            //         // Object doesn't exist, so we can copy over it
            //         self.copyFinal(object, correctedTargetName, thisBtn);
            //     } else {
            //         self.copyPrompt(object, targetName, thisBtn, true);
            //     }
            // });
        },
        
        copyPrompt: function(object, targetName, thisBtn, withError) {
            var self = this;
            $(thisBtn).prop("disabled", false);
            $(thisBtn).html('<span class="fa fa-chevron-circle-left"/> Add');
            var $input = $('<input/>').attr('type','text').addClass('form-control').val(targetName);
            var dialog = $('<div/>').append($("<p/>").addClass("rename-message")
                    .html('Enter target object name' + 
                            (withError ? ':' : ' (or leave current one for overwriting):')))
                            .append($("<br/>")).append($input);
            IPython.dialog.modal({
                title: withError ? 'There are some problems checking object existence' : 
                    'Object with this name already exists',
                body: dialog,
                buttons : {
                    "Cancel": {},
                    "OK": {
                        class: "btn btn-primary",
                        click: function () {
                            var newName = $(this).find('input').val();
                            self.copyFinal(object, newName, thisBtn);
                            return true;
                        }
                    }
                },
                open : function () {
                    var dlg = $(this);
                    // Upon ENTER, click the OK button.
                    dlg.find('input[type="text"]').keydown(function (event, ui) {
                        if (event.which === IPython.utils.keycodes.ENTER)
                            dlg.find('.btn-primary').first().click();
                    });
                    dlg.find('input[type="text"]').focus();
                }
            });
        },
        
        copyFinal: function(object, targetName, thisBtn) {
            console.log("Copying " + object.ws + "/" + object.id + " -> " + this.wsName + "/" + targetName);
            Promise.resolve(this.wsClient.copy_object({
                to:   {ref: this.wsName + "/" + targetName},
                from: {ref: object.ws +   "/" + object.id}
            }))
            .then(function(info) {
                $(thisBtn).prop("disabled", false);
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

        isCustomIcon: function (icon_list) {
            return (icon_list.length > 0 && icon_list[0].length > 4 &&
            icon_list[0].substring(0, 4) == 'icon');
        },

        showError: function(error) {
            console.log(error);
            var errorMsg = error;
            if (error.error && error.error.message)
                errorMsg = error.error.message;
            this.infoPanel.empty();
            this.infoPanel.append('<div class="alert alert-danger">Error: '+errorMsg+'</span>');
        },

        logoColorLookup:function(type) {
          var code = 0;
          for (var i=0; i < type.length; code += type.charCodeAt(i++));
          return this.icon_colors[ code % this.icon_colors.length ];
        },

        showInfo: function(message, spinner) {
            if (spinner)
                message = '<img src="'+this.loadingImage+'"/> ' + message;
            this.infoPanel.empty();
            this.infoPanel.append(message);
        },

        loggedInCallback: function(event, auth) {
            this.token = auth.token;
            return this;
        },

        loggedOutCallback: function(event, auth) {
            this.token = null;
            return this;
        },
    });
});
