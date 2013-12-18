var geneClickListener = null;
var contigClickListener = null;

function onGeneClick(data) {
	if (geneClickListener != null)
		geneClickListener(data);
}

function onContigClick(data) {
	if (contigClickListener != null)
		contigClickListener(data);
}

var timer = null;

(function( $, undefined ) {
    $.KBWidget({
        name: "GenomeAnnotation",
        parent: "kbaseWidget",
        version: "1.0.0",
        options: {
            ws_id: null,
            ws_name: null,
            token: null,
            job_id: null,
            width: 1150
        },

        init: function(options) {
            this._super(options);
            var self = this;
        	var pref = (new Date()).getTime();

            //var wsUrl = 'http://140.221.84.170:7058/';								// WS2
            var wsUrl = "http://kbase.us/services/workspace/";
            var container = this.$elem;

            //var kbws = new Workspace(wsUrl);											// WS2
            var kbws = new workspaceService(wsUrl);
            
            var ready = function() {
            
            //var request = [{workspace: options.ws_name, objid: options.ws_id}];		// WS2
            var request = {auth: options.token, workspace: options.ws_name, id: options.ws_id, type: 'Genome'};
            //kbws.get_objects(request, function(data) {								// WS2
            kbws.get_object(request, function(data) {
            	$('.loader-table').remove();
            	//var type = data[0].info[2];											// WS2
            	var type = data.metadata[1];
                if (type.indexOf('-') >= 0) {
                	type = type.substring(0, type.indexOf('-'));
                }
                //var reqType = 'KBGA.Genome';											// WS2
                var reqType = 'Genome';
                if (!(type === reqType)) {
                    container.append('<p>[Error] Object is of type "' + type + '" but expected type is "' + reqType + '"</p>');
                    return;
                }
            	//var gnm = data[0].data;
            	var gnm = data.data;
            	var tabPane = $('<div id="'+pref+'tab-content">');
            	container.append(tabPane);
                tabPane.kbaseTabs({canDelete : true, tabs : []});
            	var tabNames = ['Overview', 'Contigs', 'Genes'];  //, 'Element'];
            	var tabIds = ['overview', 'contigs', 'genes'];  //, 'elem'];
            	for (var i=0; i<tabIds.length; i++) {
                	var tabDiv = $('<div id="'+pref+tabIds[i]+'"> ');
                    tabPane.kbaseTabs('addTab', {tab: tabNames[i], content: tabDiv, canDelete : false, show: (i == 0)});
            	}
            	
            	////////////////////////////// Overview Tab //////////////////////////////
            	$('#'+pref+'overview').append('<table class="table table-striped table-bordered" \
                        style="margin-left: auto; margin-right: auto;" id="'+pref+'overview-table"/>');
            	var overviewLabels = ['Id', 'Name', 'Domain', 'Genetic code', 'Source', "Source id", "GC", "Taxonomy", "Size"];
            	var tax = gnm.taxonomy;
            	if (tax == null)
            		tax = '';
            	var overviewData = [gnm.id, gnm.scientific_name, gnm.domain, gnm.genetic_code, gnm.source, gnm.source_id, gnm.gc, tax, gnm.size];
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
            	
            	geneClickListener = function(aHref) {
            		showGene($(aHref).data('geneid'));
            	};
            	
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
            		genesData[genesData.length] = {id: '<a onclick="onGeneClick(this); return false;" data-geneid="'+geneId+'">'+geneId+'</a>', 
            				contig: contigName, start: geneStart, dir: geneDir, len: geneLen, type: geneType, func: geneFunc};
            		geneMap[geneId] = gene;
            		var contig = contigMap[contigName];
            		if (contigName != null && !contig) {
            			contig = {name: contigName, length: 0, genes: []};
            			contigMap[contigName] = contig;
            		}
            		if (contig) {
            			var geneStop = Number(geneStart) + Number(geneLen);
            			if (contig.length < geneStop) {
            				contig.length = geneStop;
            			}
            			contig.genes.push(gene);
            		}
            	}
                var genesSettings = {
                        "sPaginationType": "full_numbers",
                        "iDisplayLength": 10,
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
                        }
                    };
                var genesTable = $('#'+pref+'genes-table').dataTable(genesSettings);
                genesTable.fnAddData(genesData);

            	////////////////////////////// Contigs Tab //////////////////////////////
            	$('#'+pref+'contigs').append('<table cellpadding="0" cellspacing="0" border="0" id="'+pref+'contigs-table" \
                		class="table table-bordered table-striped" style="width: 100%; margin-left: 0px; margin-right: 0px;"/>');
            	var contigsData = [];
            	
            	contigClickListener = function(aHref) {
            		showContig($(aHref).data('contigname'));
            	};

            	for (var key in contigMap) {
            		var contig = contigMap[key];
            		contigsData.push({name: '<a onclick="onContigClick(this); return false;" data-contigname="'+contig.name+'">'+contig.name+'</a>', 
            				length: contig.length, genecount: contig.genes.length});
            		
            	}
            	var contigsSettings = {
                        "sPaginationType": "full_numbers",
                        "iDisplayLength": 10,
                        "aoColumns": [
                                      {sTitle: "Contig name", mData: "name"},
                                      {sTitle: "Length", mData: "length"},
                                      {sTitle: "Genes", mData: "genecount"}
                                     ],
                        "aaData": [],
                        "oLanguage": {
                            "sSearch": "Search contig:",
                            "sEmptyTable": "No contigs found."
                        }
                    };
                var contigsTable = $('#'+pref+'contigs-table').dataTable(contigsSettings);
                contigsTable.fnAddData(contigsData);

            	////////////////////////////// Overview Tab //////////////////////////////
            	//$('#'+pref+'elem').append('<p class="' + pref + 'elemstyle">Click on any element in Contigs or Genes tab</p>');

                var lastElemTabNum = 0;
                
                function openTabGetId(tabName) {
                	if (tabPane.kbaseTabs('hasTab', tabName))
                		return null;
                	lastElemTabNum++;
                	var tabId = '' + pref + 'elem' + lastElemTabNum;
                	var tabDiv = $('<div id="'+tabId+'"> ');
                    tabPane.kbaseTabs('addTab', {tab: tabName, content: tabDiv, canDelete : true, show: (i == 0)});
                    return tabId;
                }
                
            	function showGene(geneId) {
                	//$('.'+pref+'elemstyle').remove();
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
                	$('#'+tabId).append('<table class="table table-striped table-bordered" \
                            style="margin-left: auto; margin-right: auto;" id="'+tabId+'-table"/>');
                	var elemLabels = ['Gene ID', 'Contig name', 'Gene start', 'Strand', 'Gene length', "Gene type", "Function"];
                	var elemData = [geneId, '<a class="'+tabId+'-click2" data-contigname="'+contigName+'">' + contigName + '</a>', geneStart, geneDir, geneLen, geneType, geneFunc];
                    var elemTable = $('#'+tabId+'-table');
                    for (var i=0; i<elemData.length; i++) {
                    	if (elemLabels[i] === 'Function') {
                        	elemTable.append('<tr><td>' + elemLabels[i] + '</td> \
                        			<td><textarea style="width:100%;" cols="2" rows="5" readonly>'+elemData[i]+'</textarea></td></tr>');
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
                	//$('.'+pref+'elemstyle').remove();
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
                    cgb.data.options.svgWidth = self.options.width - 28;
                    cgb.data.options.onClickFunction = function(svgElement, feature) {
                    	showGene(feature.feature_id);
                    };
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
            		console.log(text);
            	}
            	
            }, function(data) {
            	$('.loader-table').remove();
                container.append('<p>[Error] ' + data.error.message + '</p>');
                return;
            });            	
            };
            
            var panel = $('<div class="loader-table"/>');
            container.append(panel);
            var table = $('<table class="table table-striped table-bordered" \
                    style="margin-left: auto; margin-right: auto;" id="'+pref+'overview-table"/>');
            panel.append(table);
            table.append('<tr><td>Job was created with id</td><td>'+options.job_id+'</td></tr>');
            table.append('<tr><td>Genome will have the id</td><td>'+options.ws_id+'</td></tr>');
            table.append('<tr><td>Current job state is</td><td id="'+pref+'job"></td></tr>');
            var timeLst = function(event) {
            	kbws.get_jobs({auth: options.token, jobids: [options.job_id]}, function(data) {
            		var status = data[0]['status'];
            		if (status === 'done') {
            			clearInterval(timer);
            			ready();
            		} else {
            			var tdElem = $('#'+pref+'job');
            			tdElem.html(status);
            			if (status === 'error') {
                			clearInterval(timer);
            			}
            		}
            	}, function(data) {
            		alert("Error: " + data.error.message)
            	});
            };
            timeLst();
            timer = setInterval(timeLst, 5000);
            		
            return this;
        },
        
        getData: function() {
                    return {
                        type: "NarrativeTempCard",
                        id: this.options.ws_name + "." + this.options.ws_id,
                        workspace: this.options.ws_name,
                        title: "Temp Widget"
                    };
        }
    });
})( jQuery );
