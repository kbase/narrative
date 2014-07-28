(function( $, undefined ) {
    $.KBWidget({
        name: "PhenotypeUploader",
        parent: "kbaseAuthenticatedWidget",
        version: "1.0.0",
        phenotype_id: null,
        genome_id: null,
        ws_name: null,
        width: 1150,
        options: {
            phenotype_id: null,
            genome_id: null,
            ws_name: null
        },
        wsUrl: "https://kbase.us/services/ws/",
        //fmUrl: "https://kbase.us/services/fba_model_services/",
        loadingImage: "static/kbase/images/ajax-loader.gif",

        init: function(options) {
            this._super(options);
            var self = this;
        	var pref = this.uuid();

            var container = this.$elem;
        	container.empty();
            if (!self.authToken()) {
            	container.append("<div>[Error] You're not logged in</div>");
            	return;
            }
        	container.append("<div><img src=\""+self.loadingImage+"\">&nbsp;&nbsp;loading media data...</div>");

            var kbws = new Workspace(this.wsUrl, {'token': self.authToken()});
            //var kbws = new workspaceService(wsUrl);
            
            var request = {workspaces: [options.ws_name], type: 'KBaseBiochem.Media'};
            kbws.list_objects(request, function(data) {
            	container.empty();
            	var medias = [];
            	for (var tuplePos in data) {
            		var media = data[tuplePos][1];
            		medias.push(media);
            	}
            	container.append('<table class="table table-striped table-bordered" \
            			style="margin-left: auto; margin-right: auto;" id="'+pref+'pheno-table"/>');
            	var table = $('#'+pref+'pheno-table');
            	table.append('<tr><td>Storing phenotype set ID</td><td>' + options.phenotype_id + '</td></tr>');
            	table.append('<tr><td>Genome object ID</td><td>' + options.genome_id + '</td></tr>');
            	table.append('<tr><td>Your tab delimited data<br>(first line is header)</td> \
            			<td><textarea id="'+pref+'pheno-ta" style="width:100%;" cols="80" rows="15"></textarea></td></tr>');
            	container.append('<button class="btn" id="'+pref+'pheno-btn">Save in workspace</button>');
            	container.append('&nbsp;<button class="btn" id="'+pref+'xmpl-btn">Show an example in text area above</button>');
            	$('#'+pref+'pheno-btn').click(function() {
            		var val = $('#'+pref+'pheno-ta').val();
            		var lines = val.split(/\r\n|\r|\n/g);
            		var phenotypes = [];
            		var good = true;
            		for (var pos in lines) {
            			if (pos == 0)
            				continue;
            			var line = lines[pos];
            			if (line == '')
            				continue;
            			var parts = line.split(/\t/g);
            			if (parts.length != 5) {
            				good = false;
            				alert('Data line has wrong format: [' + line + ']. It should be in format: media_id{TAB}workspace{TAB}growth(0_or_1){TAB}geneKO(or_none){TAB}addtlCpd(or_none)');
            				break;
            			}
            			if ($.inArray(parts[0], medias) < 0) {
            				good = false;
            				alert('Data line contains unknown media: [' + line + ']. Media could be one of: ' + medias);
            				break;
            			}
            			if (parts[1] != options.ws_name) {
            				good = false;
            				alert('Data line contains different workspace: [' + line + ']. It should refer to current workspace: ' + options.ws_name);
            				break;
            			}
            			if (parts[2] != '0' && parts[2] != '1') {
            				good = false;
            				alert('Data line contains wrong growth value: [' + line + ']. It should be 0 or 1');
            				break;
            			}
            			var phenotype = {}; // tuple<list<feature_id> geneKO,media_id baseMedia,workspace_id media_workspace,list<compound_id> additionalCpd,float normalizedGrowth,string label>
            			var geneKO = [];
            			if (parts[3] != 'none') {
            				geneKO = parts[3].split(',');
            			}
            			// ","","id","","
            			phenotype['geneko_refs'] = geneKO;
            			phenotype['media_ref'] = parts[1] + "/" + parts[0];
            			//phenotype['workspace'] = parts[1];
            			var additionalCpd = [];
            			if (parts[4] != 'none') {
            				additionalCpd = parts[4].split(',');
            			}
            			phenotype['additionalcompound_refs'] = additionalCpd;
            			phenotype['normalizedGrowth'] = Number(parts[2]) + 0.0;
            			phenotype['id'] = 'phenotype_' + options.phenotype_id + "_" + pos;
            			phenotypes.push(phenotype);
            		}
            		if (good) {
            			/*var kbfm = new fbaModelServices(fmUrl, {'token': self.authToken()});
            			var import_phenotypes_params = {
            					auth: self.authToken(), 
            					workspace: options.ws_name, 
            					phenotypeSet: options.phenotype_id, 
            					genome: options.genome_id, 
            					genome_workspace: options.ws_name, 
            					phenotypes: phenotypes,
            					source: 'Narrative uploader',
            					name: options.phenotype_id,
            					ignore_errors: 0
            			};
            			kbfm.import_phenotypes(import_phenotypes_params, function(data) {
            				alert('Data was stored in workspace');
                        }, function(data) {
                        	alert('Error storing data: ' + data.error.message);
                        });*/
            			var pset = {
            					id: options.phenotype_id,
            					genome_ref: options.ws_name + '/' + options.genome_id,
            					phenotype_set_id: options.phenotype_id,
            					genome_id: options.genome_id,
            					workspace_id: options.ws_name,
            					phenotypes: phenotypes,
            					source: 'Narrative phenotype uploader',
            					source_id: 'NarrativePhenotypeUploader',
            					name: options.phenotype_id,
            					importErrors: ''
            			};
            			kbws.save_objects({workspace: options.ws_name, objects: [{type: 'KBasePhenotypes.PhenotypeSet', name: options.phenotype_id, data: pset}]}, function(data) {
            				alert('Data was stored in workspace');
                        }, function(data) {
                        	alert('Error: ' + data.error.message);
                        });            	
            		}
            	});
            	$('#'+pref+'xmpl-btn').click(function() {
            		var ws = options.ws_name;
            		var text = "media	mediaws	growth	geneko	addtlCpd\n" +
            				"C-L-serine	"+ws+"	1	none	cpd00367,cpd00009,cpd00048\n" +
            				"C-L-serine	"+ws+"	1	none	cpd00023,cpd00009,cpd00048\n" +
            				"C-L-serine	"+ws+"	1	none	cpd00221,cpd00159,cpd00013,cpd00048,cpd00046\n" +
            				"C-L-serine	"+ws+"	1	none	cpd00221,cpd00159,cpd00013,cpd00048,cpd00080\n" +
            				"C-L-serine	"+ws+"	0	none	cpd00122,cpd00013,cpd00009,cpd00048\n" +
            				"C-L-serine	"+ws+"	0	none	cpd00013,cpd00009,cpd00048,cpd00141\n" +
            				"C-L-serine	"+ws+"	0	none	cpd00122,cpd00009,cpd00048\n" +
            				"C-L-serine	"+ws+"	0	none	cpd00161,cpd00009,cpd00048\n";
            		var val = $('#'+pref+'pheno-ta').val();
            		if (val != "")
            			val += "\n";
            		val += text;
            		$('#'+pref+'pheno-ta').val(val);
            	});
            }, function(data) {
            	container.empty();
                container.append('<p>[Error] ' + data.error.message + '</p>');
                return;
            });            	
            return this;
        },
        
        getData: function() {
                    return {
                        type: "NarrativeTempCard",
                        id: this.options.ws_name + "." + this.options.ws_id,
                        workspace: this.options.ws_name,
                        title: "Temp Widget"
                    };
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
