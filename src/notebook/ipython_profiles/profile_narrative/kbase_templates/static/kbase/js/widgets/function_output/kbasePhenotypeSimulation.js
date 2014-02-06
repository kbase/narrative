(function( $, undefined ) {
    $.KBWidget({
        name: "PhenotypeSimulation",
        parent: "kbaseWidget",
        version: "1.0.0",
        options: {
            simulation_id: null,
            ws_name: null,
            token: null,
            width: 1150
        },

        init: function(options) {
            this._super(options);
            var self = this;

            var wsUrl = "https://kbase.us/services/ws/";
            var container = this.$elem;
        	var panel = $('<div class="loader-table">Please wait...</div>');
        	container.append(panel);

            var kbws = new workspaceService(wsUrl);
            
            var request = {auth: options.token, workspace: options.ws_name, id: options.simulation_id, type: 'PhenotypeSimulationSet'};
            kbws.get_object(request, function(data) {
            	$('.loader-table').remove();
            	console.log(data);
            	var simList = data['data']['phenotypeSimulations'];
            	var table = $('<table class="table table-striped table-bordered" \
            			style="margin-left: auto; margin-right: auto;"/>');
            	var s = ' style="text-align: center"';
        		table.append('<tr><th'+s+'><b>KO genes</b></th><th'+s+'><b>Media</b></th><th'+s+'><b>Original growth</b></th>\
        				<th'+s+'><b>Simulated growth</b></th><th'+s+'><b>Simulation class</b></th></tr>');
            	container.append(table);
            	for (var pos in simList) {
            		var sim = simList[pos];
            		var pheno = sim[0];
            		var geneKO = '' + pheno[1];
            		if (geneKO.length == 0)
            			geneKO = '-';
            		var media = '' + pheno[1];
            		var addCmp = '' + pheno[3];
            		if (addCmp.length > 0)
            			media = media + '<br>(' + pheno[3] + ')';
            		var original = '' + pheno[4];
            		var simulated = '' + sim[1];
            		var simClass = '' + sim[3];
            		var color = '#00AA00';
            		if (original != simulated)
            			color = '#AA0000';
            		var st = ' style="vertical-align:middle"';
            		table.append('<tr><td'+st+'>'+geneKO+'</td><td'+st+'>'+media+'</td><td'+st+'><center>'+original+'</center></td>\
            				<td'+st+'><center><b><font color="'+color+'">'+simulated+'</font></b></center></td>\
            				<td'+st+'><center>'+simClass+'</center></td></tr>');
            	}
            }, function(data) {
            	$('.loader-table').remove();
                container.append('<p>[Error] ' + data.error.message + '</p>');
                return;
            });            	
            return this;
        },
        
        getData: function() {
            return {
                type: "PhenotypeSimulation",
                id: this.options.ws_name + "." + this.options.simulation_id,
                workspace: this.options.ws_name,
                title: "Phenotype Simulation Widget"
            };
        }
    });
})( jQuery );
