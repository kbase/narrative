(function( $, undefined ) {
    return KBWidget({
        name: "PhenotypeSimulation",
        parent : kbaseAuthenticatedWidget,
        version: "1.0.0",
        simulation_id: null,
        ws_name: null,
        width: 1150,
        options: {
            simulation_id: null,
            ws_name: null
        },
        wsUrl: window.kbconfig.urls.workspace,
        loadingImage: window.kbconfig.loading_gif,

        init: function(options) {
            this._super(options);
            this.ws_name = options.ws_name;
            this.simulation_id = options.simulation_id;
            return this;
        },
        
        render: function() {
            const self = this;

            const container = this.$elem;
        	container.empty();
            if (!self.authToken()) {
            	container.append("<div>[Error] You're not logged in</div>");
            	return;
            }
        	container.append("<div><img src=\""+self.loadingImage+"\">&nbsp;&nbsp;loading phenotype simulation data...</div>");

            const kbws = new Workspace(self.wsUrl, {'token': self.authToken()});
            
            //var request = {auth: self.authToken(), workspace: self.ws_name, id: self.simulation_id, type: 'KBasePhenotypes.PhenotypeSimulationSet'};
            kbws.get_objects([{ref: self.ws_name +"/"+ self.simulation_id}], (data) => {
            	container.empty();
            	const simList = data[0].data.phenotypeSimulations;
            	const table = $('<table class="table table-striped table-bordered" \
            			style="margin-left: auto; margin-right: auto;"/>');
            	const s = ' style="text-align: center"';
        		table.append('<tr><th'+s+'><b>KO genes</b></th><th'+s+'><b>Media</b></th><th'+s+'><b>Original growth</b></th>\
        				<th'+s+'><b>Simulated growth</b></th><th'+s+'><b>Simulation class</b></th></tr>');
            	container.append(table);
            	for (const pos in simList) {
            		const sim = simList[pos];
            		const pheno = sim[0];
            		let geneKO = '' + pheno[1];
            		if (geneKO.length == 0)
            			geneKO = '-';
            		let media = '' + pheno[1];
            		const addCmp = '' + pheno[3];
            		if (addCmp.length > 0)
            			media = media + '<br>(' + pheno[3] + ')';
            		const original = '' + pheno[4];
            		const simulated = '' + sim[1];
            		const simClass = '' + sim[3];
            		let color = '#00AA00';
            		if (original != simulated)
            			color = '#AA0000';
            		const st = ' style="vertical-align:middle"';
            		table.append('<tr><td'+st+'>'+geneKO+'</td><td'+st+'>'+media+'</td><td'+st+'><center>'+original+'</center></td>\
            				<td'+st+'><center><b><font color="'+color+'">'+simulated+'</font></b></center></td>\
            				<td'+st+'><center>'+simClass+'</center></td></tr>');
            	}
            }, (data) => {
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
            //this.token = auth.token;
            this.render();
            return this;
        },

        loggedOutCallback: function(event, auth) {
            //this.token = null;
            this.render();
            return this;
        }

    });
})( jQuery );
