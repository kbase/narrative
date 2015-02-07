/**
 * Output widget for visualization of genome annotation.
 * @author Roman Sutormin <rsutormin@lbl.gov>
 * @public
 */

(function( $, undefined ) {
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
            		var tabNames = ['Overview', 'Contigs', 'Genes'];
            		var tabIds = ['overview', 'contigs', 'genes'];
            		for (var i=0; i<tabIds.length; i++) {
            			var tabDiv = $('<div id="'+pref+tabIds[i]+'"> ');
            			tabPane.kbaseTabs('addTab', {tab: tabNames[i], content: tabDiv, canDelete : false, show: (i == 0)});
            		}

            		////////////////////////////// Overview Tab //////////////////////////////
            		$('#'+pref+'overview').append('<table class="table table-striped table-bordered" \
            				style="margin-left: auto; margin-right: auto;" id="'+pref+'overview-table"/>');
            		var overviewLabels = ['KBase ID', 'Name', 'Domain', 'Genetic code', 'Source', "Source ID", "GC", "Taxonomy", "Size"];
            		var tax = gnm.taxonomy;
            		if (tax == null)
            			tax = '';
            		var overviewData = [gnm.id, '<a href="/functional-site/#/dataview/'+self.ws_name+'/'+self.ws_id+'" target="_blank">'+gnm.scientific_name+'</a>', 
            		                    gnm.domain, gnm.genetic_code, gnm.source, gnm.source_id, gnm.gc_content, tax, gnm.dna_size];
            		var overviewTable = $('#'+pref+'overview-table');
            		for (var i=0; i<overviewData.length; i++) {
            			if (overviewLabels[i] === 'Taxonomy') {
            				overviewTable.append('<tr><td>' + overviewLabels[i] + '</td> \
            						<td><textarea style="width:100%;" cols="2" rows="5" readonly>'+overviewData[i]+'</textarea></td></tr>');
            			} else {
            				overviewTable.append('<tr><td>'+overviewLabels[i]+'</td> \
            						<td>'+overviewData[i]+'</td></tr>');
            			}
            		}

            		////////////////////////////// Genes Tab //////////////////////////////
            		$('#'+pref+'genes').append('<table cellpadding="0" cellspacing="0" border="0" id="'+pref+'genes-table" \
            		class="table table-bordered table-striped" style="width: 100%; margin-left: 0px; margin-right: 0px;"/>');
            		var genesData = [];
            		var geneMap = {};
            		var contigMap = {};

            		if (gnm.contig_ids && gnm.contig_lengths && gnm.contig_ids.length == gnm.contig_lengths.length) {
            			for (var pos in gnm.contig_ids) {
            				var contigId = gnm.contig_ids[pos];
            				var contigLen = gnm.contig_lengths[pos];
            				contigMap[contigId] = {name: contigId, length: contigLen, genes: []};
            			}
            		} else if (ctg && ctg.contigs) {
            		    for (var pos in ctg.contigs) {
                            var contigId = ctg.contigs[pos].id;
                            var contigLen = ctg.contigs[pos].length;
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
            			var geneType = gene.type;
            			var geneFunc = gene['function'];
            			if (!geneFunc)
            				geneFunc = '-';
            			genesData[genesData.length] = {id: '<a class="'+pref+'gene-click" data-geneid="'+geneId+'">'+geneId+'</a>', 
            					contig: contigName, start: geneStart, dir: geneDir, len: geneLen, type: geneType, func: geneFunc};
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
            		var genesTable = $('#'+pref+'genes-table').dataTable(genesSettings);
            		genesTable.fnAddData(genesData);

            		////////////////////////////// Contigs Tab //////////////////////////////
            		$('#'+pref+'contigs').append($('<div>').append('<table cellpadding="0" cellspacing="0" border="0" id="'+pref+'contigs-table" '+
            			'class="table table-bordered table-striped" style="width: 100%; margin-left: 0px; margin-right: 0px;"/>'));
            		$('#'+pref+'contigs').append($('<div style="margin: 14px 0px 0px 0px">').append($('<span style="font-size: 75%; color: #898989;">')
							.append('(only contigs containing features are shown)')));
            		var contigsData = [];

            		function contigEvents() {
            			$('.'+pref+'contig-click').unbind('click');
            			$('.'+pref+'contig-click').click(function() {
            				var contigId = [$(this).data('contigname')];
            				showContig(contigId);
            			});            
            		}

            		for (var key in contigMap) {
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
            			tabPane.kbaseTabs('addTab', {tab: tabName, content: tabDiv, canDelete : true, show: (i == 0), deleteCallback: function(name) {
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
            			var elemData = ['<a href="/functional-site/#/genes/'+self.ws_name+'/'+self.ws_id+'/'+geneId+'" target="_blank">'+geneId+'</a>', '<a class="'+tabId+'-click2" data-contigname="'+contigName+'">' + contigName + '</a>', geneStart, geneDir, geneLen, geneType, geneFunc, geneAnn];
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

            		function logObject(obj) {
            			var text = "";
            			for (var key in obj) {
            				var value = "" + obj[key];
            				if (value.indexOf("function ") == 0)
            					continue;
            				text += "" + key + "->" + value + " ";
            			}
            		}
            };
            
            container.empty();
            container.append("<div><img src=\""+self.loadingImage+"\">&nbsp;&nbsp;loading genome data...</div>");
            
            var included = ["/complete","/contig_ids","/contig_lengths","contigset_ref","/dna_size",
                            "/domain","/gc_content","/genetic_code","/id","/md5","num_contigs",
                            "/scientific_name","/source","/source_id","/tax_id","/taxonomy",
                            "/features/[*]/aliases","/features/[*]/annotations",
                            "/features/[*]/function","/features/[*]/id","/features/[*]/location",
                            "/features/[*]/protein_translation_length","/features/[*]/type"];
            kbws.get_object_subset([{ref: self.ws_name + "/" + self.ws_id, included: included}], function(data) {
                var gnm = data[0].data;
                if (gnm.contig_ids && gnm.contig_lengths && gnm.contig_ids.length == gnm.contig_lengths.length) {
                    ready(gnm, null);
                } else {
                    var contigSetRef = gnm.contigset_ref;
                    kbws.get_object_subset([{ref: contigSetRef, included: ['contigs/[*]/id', 'contigs/[*]/length']}], function(data2) {
                        var ctg = data2[0].data;
                        ready(gnm, ctg);
                    }, function(data2) {
                        container.empty();
                        container.append('<p>[Error] ' + data.error.message + '</p>');
                    });
                }
            }, function(data) {
                container.empty();
                container.append('<p>[Error] ' + data.error.message + '</p>');
            });            	
            return this;
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
})( jQuery );
