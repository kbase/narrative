/**
 * Output widget for visualization of genome annotation.
 * @author Roman Sutormin <rsutormin@lbl.gov>
 * @public
 */

define(['jquery', 'ContigBrowserPanel', 'kbwidget', 'kbaseAuthenticatedWidget'], 
    function($, ContigBrowserPanel) {
    $.KBWidget({
        name: "kbaseGenomeView",
        parent: "kbaseAuthenticatedWidget",
        version: "1.0.0",
        ws_id: null,
        ws_name: null,
        token: null,
        width: 1150,
        options: {
            ws_id: null,
            ws_name: null
        },
        loadingImage: "static/kbase/images/ajax-loader.gif",
        wsUrl: window.kbconfig.urls.workspace,
        timer: null,
        lastElemTabNum: 0,

        init: function(options) {
            this._super(options);

            this.ws_name = options.ws_name;
            this.ws_id = options.ws_id;
            if (options.ws && options.id) {
                  this.ws_id = options.id;
                  this.ws_name = options.ws;
            }
            return this;
        },

        //Sam says that it's considered a transcriptome if there are no contigs, or if the features lack locations.
        genomeType : function(genome) {
            //return 'genome';

            if (
                (! genome.contig_ids || genome.contig_ids.length == 0)
            ) {

                var has_location = false;
                $.each(
                    genome.features,
                    function (idx, feature) {

                        if (feature.location && feature.location.length) {
                            has_location = true;
                            return;
                        }
                    }
                );

                if (! has_location) {
                    return 'transcriptome';
                }
            }

            return 'genome';
        },

        tabData : function(genome) {

            var type = this.genomeType(genome);

            if (type == 'transcriptome') {
                return {
                    names : ['Overview', 'Genes'],
                    ids : ['overview', 'genes']
                };
            }
            else {
                return {
                    names : ['Overview', 'Contigs', 'Genes'],
                    ids : ['overview', 'contigs', 'genes']
                };
            }
        },

        render: function() {
            var self = this;
        	var pref = this.uuid();

            var container = this.$elem;
            if (self.token == null) {
            	container.empty();
            	container.append("<div>[Error] You're not logged in</div>");
            	return;
            }

            var kbws = new Workspace(self.wsUrl, {'token': self.token});

            var ready = function(gnm, ctg) {
            		container.empty();
            		var tabPane = $('<div id="'+pref+'tab-content">');
            		container.append(tabPane);
            		tabPane.kbaseTabs({canDelete : true, tabs : []});

                    var genomeType = self.genomeType(gnm);

            		var tabData = self.tabData(gnm);
            		var tabNames = tabData.names;
            		var tabIds = tabData.ids;

            		for (var i=0; i<tabIds.length; i++) {
            			var tabDiv = $('<div id="'+pref+tabIds[i]+'"> ');
            			tabPane.kbaseTabs('addTab', {tab: tabNames[i], content: tabDiv, canDelete : false, show: (i == 0)});
            		}

                    var contigCount = 0;
                    if (gnm.contig_ids && gnm.contig_lengths && gnm.contig_ids.length == gnm.contig_lengths.length) {
                        contigCount = gnm.contig_ids.length;
                    } else if (ctg && ctg.contigs) {
                        contigCount = ctg.contigs.length;
                    }

                    ////////////////////////////// Overview Tab //////////////////////////////
                    $('#'+pref+'overview').append('<table class="table table-striped table-bordered" \
                            style="margin-left: auto; margin-right: auto;" id="'+pref+'overview-table"/>');
                    var overviewLabels = ['KBase ID', 'Name', 'Domain', 'Genetic code', 'Source', "Source ID", "GC", "Taxonomy", "Size",
                                          "Number of Contigs", "Number of Genes"];
                    var tax = gnm.taxonomy;
                    if (tax == null)
                        tax = '';
                    var gc_content = gnm.gc_content;
                    if (gc_content) {
                        gc_content = Number(gc_content);
                        if (gc_content < 1.0)
                            gc_content *= 100;
                        gc_content = gc_content.toFixed(2) + " %";
                    } else {
                        gc_content = "Unknown";
                    }
                    var overviewData = [gnm.id, '<a href="/functional-site/#/dataview/'+self.ws_name+'/'+self.ws_id+'" target="_blank">'+gnm.scientific_name+'</a>',
                                        gnm.domain, gnm.genetic_code, gnm.source, gnm.source_id, gc_content, tax, gnm.dna_size,
                                        contigCount, gnm.features.length];

                    //XXX this is hopelessly brittle since it relies upon injecting/removing specific fields at exact locations in the parallel arrays.
                    //these should be refactored - a single master list of all possible fields as objects ( { name : 'Kbase ID', value : gnm.id, id : 'kbase_id' } )
                    //and then different lists built with the lookup keys depending upon the genome type, the way that the tab ids are built up above. I don't want
                    //to do that right now. :-/

                    if (genomeType != 'genome') {
                        overviewLabels.splice(3, 0, 'Subtype');
                        overviewData.splice(3, 0, genomeType);
                    }

                    if (genomeType == 'transcriptome') {
                        overviewLabels.splice(7,1);
                        overviewData.splice(7,1);
                        overviewLabels.splice(9,1);
                        overviewData.splice(9,1);
                    }
                    //end brittleness.


                    var overviewTable = $('#'+pref+'overview-table');
                    for (var i=0; i<overviewData.length; i++) {
                        if (overviewLabels[i] === 'Taxonomy') {
                            overviewTable.append('<tr><td  width="33%">' + overviewLabels[i] + '</td> \
                                    <td><textarea style="width:100%;" cols="2" rows="3" readonly>'+overviewData[i]+'</textarea></td></tr>');
                        } else {
                            overviewTable.append('<tr><td>'+overviewLabels[i]+'</td> \
                                    <td>'+overviewData[i]+'</td></tr>');
                        }
                    }

                    ///////////////////// Contigs and Genes (lazy loading) /////////////////////
                    var contigsDiv = $('#'+pref+'contigs');
                    contigsDiv.append("<div><img src=\""+self.loadingImage+"\">&nbsp;&nbsp;loading contig data...</div>");

                    var genesDiv = $('#'+pref+'genes');
                    genesDiv.append("<div><img src=\""+self.loadingImage+"\">&nbsp;&nbsp;loading genes data...</div>");
                    var genesAreShown = false;

                    var liElems = tabPane.find('li');
                    for (var liElemPos = 0; liElemPos < liElems.length; liElemPos++) {
                        var liElem = $(liElems.get(liElemPos));
                        var aElem = liElem.find('a');
                        if (aElem.length != 1)
                            continue;
                        var dataTab = aElem.attr('data-tab');
                        if (dataTab === 'Contigs' || dataTab === 'Genes') {
                            aElem.on('click', function() {
                                if (!genesAreShown) {
                                    genesAreShown = true;
                                    self.prepareGenesAndContigs(pref, kbws, gnm, tabPane);
                                }
                            });
                        }
                    }
            };

            container.empty();
            container.append("<div><img src=\""+self.loadingImage+"\">&nbsp;&nbsp;loading genome data...</div>");

            var included = ["/complete","/contig_ids","/contig_lengths","contigset_ref","/dna_size",
                            "/domain","/gc_content","/genetic_code","/id","/md5","num_contigs",
                            "/scientific_name","/source","/source_id","/tax_id","/taxonomy",
                            "/features/[*]/unknownfield", "/features/[*]/location"];
            kbws.get_object_subset([{ref: self.ws_name + "/" + self.ws_id, included: included}], function(data) {
                var gnm = data[0].data;
                if (gnm.contig_ids && gnm.contig_lengths && gnm.contig_ids.length == gnm.contig_lengths.length) {
                    ready(gnm, null);
                } else {
                    var contigSetRef = gnm.contigset_ref;
                    if (gnm.contigset_ref) {
                        kbws.get_object_subset([{ref: contigSetRef, included: ['contigs/[*]/unknownfield']}], function(data2) {
                            var ctg = data2[0].data;
                            ready(gnm, ctg);
                        }, function(data2) {
                            container.empty();
                            container.append('<p>[Error] ' + data2.error.message + '</p>');
                        });
                    } else {
                        container.empty();
                        container.append('Genome object has unsupported structure (no contig-set)');
                    }
                }
            }, function(data) {
                container.empty();
                container.append('<p>[Error] ' + data.error.message + '</p>');
            });
            return this;
        },

        prepareGenesAndContigs: function(pref, kbws, gnm, tabPane) {
            var self = this;
            var subsetRequests = [{ref: self.ws_name + "/" + self.ws_id, included:
                ["/features/[*]/aliases","/features/[*]/annotations",
                 "/features/[*]/function","/features/[*]/id","/features/[*]/location",
                 "/features/[*]/protein_translation_length",
                 "/features/[*]/dna_translation_length","/features/[*]/type"]
            }];
            if (!(gnm.contig_ids && gnm.contig_lengths && gnm.contig_ids.length == gnm.contig_lengths.length)) {
                var contigSetRef = gnm.contigset_ref;
                subsetRequests.push({ref: contigSetRef, included: ['contigs/[*]/id', 'contigs/[*]/length']});
            }
            kbws.get_object_subset(subsetRequests, function(data) {
                gnm.features = data[0].data.features;

                ////////////////////////////// Genes Tab //////////////////////////////
                var geneTab = $('#'+pref+'genes');
                geneTab.empty();
                geneTab.append('<table cellpadding="0" cellspacing="0" border="0" id="'+pref+'genes-table" \
                class="table table-bordered table-striped" style="width: 100%; margin-left: 0px; margin-right: 0px;"/>');
                var genesData = [];
                var geneMap = {};
                var contigMap = {};

                if (data.length > 1) {
                    var ctg = data[1].data;
                    for (var pos in ctg.contigs) {
                        var contigId = ctg.contigs[pos].id;
                        var contigLen = ctg.contigs[pos].length;
                        contigMap[contigId] = {name: contigId, length: contigLen, genes: []};
                    }
                } else {
                    for (var pos in gnm.contig_ids) {
                        var contigId = gnm.contig_ids[pos];
                        var contigLen = gnm.contig_lengths[pos];
                        contigMap[contigId] = {name: contigId, length: contigLen, genes: []};
                    }
                }

                function geneEvents() {
                    $('.'+pref+'gene-click').unbind('click');
                    $('.'+pref+'gene-click').click(function() {
                        var geneId = [$(this).data('geneid')];
                        showGene(geneId);
                    });
                }

                var genomeType = self.genomeType(gnm);

                for (var genePos in gnm.features) {
                    var gene = gnm.features[genePos];
                    var geneId = gene.id;
                    var contigName = null;
                    var geneStart = null;
                    var geneDir = null;
                    var geneLen = null;
                    if (gene.location && gene.location.length > 0) {
                        contigName = gene.location[0][0];
                        geneStart = gene.location[0][1];
                        geneDir = gene.location[0][2];
                        geneLen = gene.location[0][3];
                    }

                    if (genomeType == 'transcriptome') {
                        geneLen = gene.dna_translation_length || gene.protein_translation_length || '';
                    }

                    var geneType = gene.type;
                    var geneFunc = gene['function'];
                    if (!geneFunc)
                        geneFunc = '-';
                    genesData.push({id: '<a class="'+pref+'gene-click" data-geneid="'+geneId+'">'+geneId+'</a>',
                            contig: contigName, start: geneStart, dir: geneDir, len: geneLen, type: geneType, func: geneFunc});
                    geneMap[geneId] = gene;
                    var contig = contigMap[contigName];
                    if (contigName != null && !contig) {
                        contig = {name: contigName, length: 0, genes: []};
                        contigMap[contigName] = contig;
                    }
                    if (contig) {
                        var geneStop = Number(geneStart);
                        if (geneDir == '+')
                            geneStop += Number(geneLen);
                        if (contig.length < geneStop) {
                            contig.length = geneStop;
                        }
                        contig.genes.push(gene);
                    }
                }
                var genesSettings = {
                        "sPaginationType": "full_numbers",
                        "iDisplayLength": 10,
                        "aaSorting": [[ 1, "asc" ], [2, "asc"]],
                        "aoColumns": [
                                      {sTitle: "Gene ID", mData: "id"},
                                      {sTitle: "Contig", mData: "contig"},
                                      {sTitle: "Start", mData: "start"},
                                      {sTitle: "Strand", mData: "dir"},
                                      {sTitle: "Length", mData: "len"},
                                      {sTitle: "Type", mData: "type"},
                                      {sTitle: "Function", mData: "func"}
                                      ],
                                      "aaData": [],
                                      "oLanguage": {
                                          "sSearch": "Search gene:",
                                          "sEmptyTable": "No genes found."
                                      },
                                      "fnDrawCallback": geneEvents
                };


                if (genomeType == 'transcriptome') {
                    genesSettings.aoColumns = [
                        {sTitle: "Gene ID", mData: "id"},
                        {sTitle: "Length", mData: "len"},
                        {sTitle: "Function", mData: "func"}
                    ];
                }

                var genesTable = $('#'+pref+'genes-table').dataTable(genesSettings);
                genesTable.fnAddData(genesData);

                ////////////////////////////// Contigs Tab //////////////////////////////
                var contigTab = $('#'+pref+'contigs');
                contigTab.empty();
                contigTab.append($('<div>').append('<table cellpadding="0" cellspacing="0" border="0" id="'+pref+'contigs-table" '+
                    'class="table table-bordered table-striped" style="width: 100%; margin-left: 0px; margin-right: 0px;"/>'));
                var contigsData = [];

                function contigEvents() {
                    $('.'+pref+'contig-click').unbind('click');
                    $('.'+pref+'contig-click').click(function() {
                        var contigId = [$(this).data('contigname')];
                        showContig(contigId);
                    });
                }

                for (var key in contigMap) {
                    if (!contigMap.hasOwnProperty(key))
                        continue;
                    var contig = contigMap[key];
                    contigsData.push({name: '<a class="'+pref+'contig-click" data-contigname="'+contig.name+'">'+contig.name+'</a>',
                        length: contig.length, genecount: contig.genes.length});
                }
                var contigsSettings = {
                        "sPaginationType": "full_numbers",
                        "iDisplayLength": 10,
                        "aaSorting": [[ 1, "desc" ]],
                        "aoColumns": [
                                      {sTitle: "Contig name", mData: "name"},
                                      {sTitle: "Length", mData: "length"},
                                      {sTitle: "Genes", mData: "genecount"}
                                      ],
                                      "aaData": [],
                                      "oLanguage": {
                                          "sSearch": "Search contig:",
                                          "sEmptyTable": "No contigs found."
                                      },
                                      "fnDrawCallback": contigEvents
                };
                var contigsTable = $('#'+pref+'contigs-table').dataTable(contigsSettings);
                contigsTable.fnAddData(contigsData);

                ////////////////////////////// New Tab //////////////////////////////
                var lastElemTabNum = 0;

                function openTabGetId(tabName) {
                    if (tabPane.kbaseTabs('hasTab', tabName))
                        return null;
                    lastElemTabNum++;
                    var tabId = '' + pref + 'elem' + lastElemTabNum;
                    var tabDiv = $('<div id="'+tabId+'"> ');
                    tabPane.kbaseTabs('addTab', {tab: tabName, content: tabDiv, canDelete : true, show: true, deleteCallback: function(name) {
                        tabPane.kbaseTabs('removeTab', name);
                    }});
                    return tabId;
                }

                function showGene(geneId) {
                    var tabId = openTabGetId(geneId);
                    if (tabId == null) {
                        tabPane.kbaseTabs('showTab', geneId);
                        return;
                    }
                    var gene = geneMap[geneId];
                    var contigName = null;
                    var geneStart = null;
                    var geneDir = null;
                    var geneLen = null;
                    if (gene.location && gene.location.length > 0) {
                        contigName = gene.location[0][0];
                        geneStart = gene.location[0][1];
                        geneDir = gene.location[0][2];
                        geneLen = gene.location[0][3];
                    }
                    var geneType = gene.type;
                    var geneFunc = gene['function'];
                    var geneAnn = '';
                    if (gene['annotations'])
                        geneAnn = gene['annotations'];
                    $('#'+tabId).append('<table class="table table-striped table-bordered" \
                            style="margin-left: auto; margin-right: auto;" id="'+tabId+'-table"/>');
                    var elemLabels = ['Gene ID', 'Contig name', 'Gene start', 'Strand', 'Gene length', "Gene type", "Function", "Annotations"];
                    var elemData = ['<a href="/functional-site/#/genes/'+self.ws_name+'/'+self.ws_id+'/'+geneId+'" target="_blank">'+geneId+'</a>',
                                    '<a class="'+tabId+'-click2" data-contigname="'+contigName+'">' + contigName + '</a>',
                                    geneStart, geneDir, geneLen, geneType, geneFunc, geneAnn];
                    var elemTable = $('#'+tabId+'-table');
                    for (var i=0; i<elemData.length; i++) {
                        if (elemLabels[i] === 'Function') {
                            elemTable.append('<tr><td>' + elemLabels[i] + '</td> \
                                    <td><textarea style="width:100%;" cols="2" rows="3" readonly>'+elemData[i]+'</textarea></td></tr>');
                        } else if (elemLabels[i] === 'Annotations') {
                            elemTable.append('<tr><td>' + elemLabels[i] + '</td> \
                                    <td><textarea style="width:100%;" cols="2" rows="3" readonly>'+elemData[i]+'</textarea></td></tr>');
                        } else {
                            elemTable.append('<tr><td>'+elemLabels[i]+'</td> \
                                    <td>'+elemData[i]+'</td></tr>');
                        }
                    }
                    $('.'+tabId+'-click2').click(function() {
                        showContig($(this).data('contigname'));
                    });
                    tabPane.kbaseTabs('showTab', geneId);
                }

                function showContig(contigName) {
                    var tabId = openTabGetId(contigName);
                    if (tabId == null) {
                        tabPane.kbaseTabs('showTab', contigName);
                        return;
                    }
                    var contig = contigMap[contigName];
                    $('#'+tabId).append('<table class="table table-striped table-bordered" \
                            style="margin-left: auto; margin-right: auto;" id="'+tabId+'-table"/>');
                    var elemLabels = ['Contig name', 'Length', 'Gene count'];
                    var elemData = [contigName, contig.length, contig.genes.length];
                    var elemTable = $('#'+tabId+'-table');
                    for (var i=0; i<elemData.length; i++) {
                        elemTable.append('<tr><td>'+elemLabels[i]+'</td><td>'+elemData[i]+'</td></tr>');
                    }
                    var cgb = new ContigBrowserPanel();
                    cgb.data.options.contig = contig;
                    cgb.data.options.svgWidth = self.width - 28;
                    cgb.data.options.onClickFunction = function(svgElement, feature) {
                        showGene(feature.feature_id);
                    };
                    cgb.data.options.token = self.token;
                    cgb.data.$elem = $('<div style="width:100%; height: 200px;"/>');
                    cgb.data.$elem.show(function(){
                        cgb.data.update();
                    });
                    $('#'+tabId).append(cgb.data.$elem);
                    cgb.data.init();
                    tabPane.kbaseTabs('showTab', contigName);
                }
            }, function(data) {
                container.empty();
                container.append('<p>[Error] ' + data.error.message + '</p>');
            });
        },

        getData: function() {
        	return {
        		type: "NarrativeTempCard",
        		id: this.ws_name + "." + this.ws_id,
        		workspace: this.ws_name,
        		title: "Temp Widget"
        	};
        },

        loggedInCallback: function(event, auth) {
            this.token = auth.token;
            this.render();
            return this;
        },

        loggedOutCallback: function(event, auth) {
            this.token = null;
            this.render();
            return this;
        },

        uuid: function() {
            return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g,
                function(c) {
                    var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
                    return v.toString(16);
                });
        }
    });
});
