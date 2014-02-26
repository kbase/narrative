(function( $, undefined ) {
    $.KBWidget({
        name: "PhenotypeSimulation",
        parent: "kbaseAuthenticatedWidget",
        version: "1.0.0",
        simulation_id: null,
        ws_name: null,
        width: 1150,
        options: {
            simulation_id: null,
            ws_name: null
        },
        wsUrl: "https://kbase.us/services/ws/",
        loadingImage: "static/kbase/images/ajax-loader.gif",

        init: function(options) {
            this._super(options);
            this.ws_name = options.ws_name;
            this.simulation_id = options.simulation_id;
            return this;
        },
        
        render: function() {
            var self = this;

            var container = this.$elem;
        	container.empty();
            if (self.token == null) {
            	container.append("<div>[Error] You're not logged in</div>");
            	return;
            }
        	container.append("<div><img src=\""+self.loadingImage+"\">&nbsp;&nbsp;loading phenotype simulation data...</div>");

            var kbws = new Workspace(self.wsUrl, {'token': self.token});
            
            //var request = {auth: self.token, workspace: self.ws_name, id: self.simulation_id, type: 'KBasePhenotypes.PhenotypeSimulationSet'};
            kbws.get_objects([{ref: self.ws_name +"/"+ self.simulation_id}], function(data) {
            	container.empty();
            	var simList = data[0].data.phenotypeSimulations;
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
            	container.empty();
                container.append('<p>[Error] ' + data.error.message + '</p>');
                return;
            });            	
            return this;
        },
        
        getData: function() {
            return {
                type: "PhenotypeSimulation",
                id: this.ws_name + "." + this.simulation_id,
                workspace: this.ws_name,
                title: "Phenotype Simulation Widget"
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
        }

    });
})( jQuery );
