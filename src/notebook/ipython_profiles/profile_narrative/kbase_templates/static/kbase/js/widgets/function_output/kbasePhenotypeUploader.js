(function( $, undefined ) {
    $.KBWidget({
        name: "PhenotypeUploader",
        parent: "kbaseWidget",
        version: "1.0.0",
        options: {
            phenotype_id: null,
            genome_id: null,
            ws_name: null,
            token: null,
            width: 1150
        },

        init: function(options) {
            this._super(options);
            var self = this;
        	var pref = (new Date()).getTime();

            var wsUrl = "http://kbase.us/services/workspace/";
            var fmUrl = "https://kbase.us/services/fba_model_services";
            var container = this.$elem;
        	var panel = $('<div class="loader-table">Please wait...</div>');
        	container.append(panel);

            //var kbws = new Workspace(wsUrl);											// WS2
            var kbws = new workspaceService(wsUrl);
            
            var request = {auth: options.token, workspace: options.ws_name, type: 'Media'};
            kbws.list_workspace_objects(request, function(data) {
            	$('.loader-table').remove();
            	var medias = [];
            	for (var tuplePos in data) {
            		var media = data[tuplePos][0];
            		medias.push(media);
            	}
            	container.append('<table class="table table-striped table-bordered" \
            			style="margin-left: auto; margin-right: auto;" id="'+pref+'pheno-table"/>');
            	var table = $('#'+pref+'pheno-table');
            	table.append('<tr><td>Storing phenotype set ID</td><td>' + options.phenotype_id + '</td></tr>');
            	table.append('<tr><td>Genome object ID</td><td>' + options.genome_id + '</td></tr>');
            	table.append('<tr><td>Your tab delimited data<br>(first line is header)</td> \
            			<td><textarea id="'+pref+'pheno-ta" style="width:100%;" cols="80" rows="25"></textarea></td></tr>');
            	container.append('<button class="btn" id="'+pref+'pheno-btn">Save in workspace</button>')
            	$('#'+pref+'pheno-btn').click(function() {
            		var val = $('#'+pref+'pheno-ta').val();
            		var lines = val.split(/\r\n|\r|\n/g);
            		var phenotypes = [];
            		var good = true;
            		for (var pos in lines) {
            			if (pos == 0)
            				continue;
            			var line = lines[pos];
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
            			var phenotype = []; // tuple<list<feature_id> geneKO,media_id baseMedia,workspace_id media_workspace,list<compound_id> additionalCpd,float normalizedGrowth,string label>
            			var geneKO = [];
            			if (parts[3] != 'none') {
            				geneKO = parts[3].split(',');
            			}
            			phenotype.push(geneKO);
            			phenotype.push(parts[0]);
            			phenotype.push(parts[1]);
            			var additionalCpd = [];
            			if (parts[4] != 'none') {
            				additionalCpd = parts[4].split(',');
            			}
            			phenotype.push(additionalCpd);
            			phenotype.push(Number(parts[2]) + 0.0);
            			phenotypes.push(phenotype);
            		}
            		if (good) {
            			/*var kbfm = new fbaModelServices(fmUrl, {'token': options.token});
            			var import_phenotypes_params = {
            					auth: options.token, 
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
            					genome: options.genome_id,
            					genome_workspace: options.ws_name,
            					phenotypes: phenotypes,
            					source: 'Narrative uploader',
            					name: options.phenotype_id,
            					importErrors: ''
            			};
            			kbws.save_object({auth: options.token, workspace: options.ws_name, type: 'PhenotypeSet', id: options.phenotype_id, data: pset}, function(data) {
            				alert('Data was stored in workspace');
                        }, function(data) {
                        	alert('Error: ' + data.error.message);
                        });            	
            		}
            	});
            }, function(data) {
            	$('.loader-table').remove();
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
        }
    });
})( jQuery );
