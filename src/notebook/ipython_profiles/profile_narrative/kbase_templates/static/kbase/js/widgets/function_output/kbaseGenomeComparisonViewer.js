(function( $, undefined ) {
    $.KBWidget({
        name: "kbaseGenomeComparisonViewer",
        parent: "kbaseAuthenticatedWidget",
        version: "1.0.0",
        id: null,
        ws: null,
        width: 1150,
        options: {
            id: null,
            ws: null
        },
        wsUrl: "https://kbase.us/services/ws/",
        loadingImage: "static/kbase/images/ajax-loader.gif",

        init: function(options) {
            this._super(options);
            this.ws = options.ws;
            this.id = options.id;
            return this;
        },
        
        render: function() {
            var self = this;

            var container = this.$elem;
        	container.empty();
            if (!self.authToken()) {
            	container.append("<div>[Error] You're not logged in</div>");
            	return;
            }
        	container.append("<div><img src=\""+self.loadingImage+"\">&nbsp;&nbsp;loading genome comparison data...</div>");

            var kbws = new Workspace(self.wsUrl, {'token': self.authToken()});
            
            //var request = {auth: self.authToken(), workspace: self.ws_name, id: self.simulation_id, type: 'KBasePhenotypes.PhenotypeSimulationSet'};
            kbws.get_objects([{ref: self.ws +"/"+ self.id}], function(data) {
            	object = data[0].data;
            	info = data[0].info;
            	container.empty();
				var genomes = object.genomes;
            	var genomeTable = $('<table class="table table-bordered table-striped" style="width: 100%;">');
				var s = ' style="text-align: center"';
				var st = ' style="vertical-align:middle"';
				var headings = [
					"Genome","Features","Homolog Families","Functions"
				];
				for (var i in genomes) {
					headings.push(genomes[i].name);
				}
				genomeTable.append('<tr><th'+s+'><b>'+headings.join('</b></th><th'+s+'><b>')+'</b></th></tr>');
				for (var i in genomes) {
            		var genome = genomes[i];
            		var row = [
            			genome.name,genome.features,genome.families,genome.functions
            		];
            		for (var j in genomes) {
            			var compgenome = genomes[j];
            			if (genome.genome_similarity[compgenome.name]) {
            				row.push(compgenome.genome_similarity[compgenome.name][0]+'<br>'+compgenome.genome_similarity[compgenome.name][1]);
            			} else {
            				row.push('0<br>0');
            			}
            		}
            		genomeTable.append('<tr><td'+st+'>'+row.join('</td><td'+st+'>')+'</td></tr>');
            	}
            	
				var functions = object.functions;
				var functionTable = $('<table class="table table-bordered table-striped" style="width: 100%;">');
        		headings = [
					"Function","Core","Subsystem","Primary class","Secondary class","Genomes"
				];
				for (var i in genomes) {
					headings.push(genomes[i].name);
				}
				functionTable.append('<tr><th'+s+'><b>'+headings.join('</b></th><th'+s+'><b>')+'</b></th></tr>');
				for (var i in functions) {
            		var func = functions[i];
            		var row = [
            			func.id,func.core,func.subsystem,func.primclass,func.subclass,func.number_genomes
            		];
            		var uniqueindecies;
            		var famindecies;
            		var high_score = 0;
            		for (var j in genomes) {
            			var compgenome = genomes[j];
            			if (func.genome_features[compgenome.name]) {
            				var genes = func.genome_features[compgenome.name];
            				for (var k in genes) {
            					gene = genes[k];
            					if (!famindecies[gene[1]]) {
            						uniqueindecies.push(gene[1]);
            						famindecies[gene[1]] = 0;
            					}
            					famindecies[gene[1]]++;
            					if (gene[2] > high_score) {
            						high_score = gene[2];
            					}
            				}
            			}
            		}
            		var color = d3.scale.ordinal().domain(uniqueindecies).range(colorbrewer.RdBu[4]);
            		for (var j in genomes) {
            			var compgenome = genomes[j];
            			if (func.genome_features[compgenome.name]) {
            				var item = "";
            				var genes = func.genome_features[compgenome.name];
            				for (var k in genes) {
            					gene = genes[k];
            					item += '<font color="'+color[gene[1]]+'">'+gene[0]+'</font>';
            					if (genes[k+1]) {
            						item += "<br>";
            					}
            				}
            				row.push(item);
            			} else {
            				row.push('none');
            			}
            		}
            		functionTable.append('<tr><td'+st+'>'+row.join('</td><td'+st+'>')+'</td></tr>');
            	}
            					
				var families = object.families;
				var sequenceTable = $('<table class="table table-bordered table-striped" style="width: 100%;">');
        		headings = [
					"Family","Core","Common function","Subsystem","Primary class","Secondary class","Genomes"
				];
				for (var i in genomes) {
					headings.push(genomes[i].name);
				}
				sequenceTable.append('<tr><th'+s+'><b>'+headings.join('</b></th><th'+s+'><b>')+'</b></th></tr>');
				for (var i in families) {
            		var fam = families[i];
            		var row = [
            			fam.id,fam.core,fam.subsystem,fam.primclass,fam.subclass,fam.number_genomes
            		];
            		var uniqueindecies;
            		var funcindecies;
            		var high_score = 0;
            		for (var j in genomes) {
            			var compgenome = genomes[j];
            			if (fam.genome_features[compgenome.name]) {
            				var genes = fam.genome_features[compgenome.name];
            				for (var k in genes) {
            					gene = genes[k];
            					var funcind = gene[1];
            					for (var m in funcind) {
            						if (!funcindecies[funcind[m]]) {
            							uniqueindecies.push(funcind[m]);
            							funcindecies[funcind[m]] = 0;
            						}
            						funcindecies[gene[1]]++;
            						if (gene[2] > high_score) {
            							high_score = gene[2];
            						}
            					}
            				}
            			}
            		}
            		var color = d3.scale.ordinal().domain(uniqueindecies).range(colorbrewer.RdBu[4]);
            		for (var j in genomes) {
            			var compgenome = genomes[j];
            			if (fam.genome_features[compgenome.name]) {
            				var item = "";
            				var genes = fam.genome_features[compgenome.name];
            				for (var k in genes) {
            					gene = genes[k];
            					item += '<font color="'+color[gene[1][0]]+'">'+gene[0]+'</font>';
            					if (genes[k+1]) {
            						item += "<br>";
            					}
            				}
            				row.push(item);
            			} else {
            				row.push('none');
            			}
            		}
            		sequenceTable.append('<tr><td'+st+'>'+row.join('</td><td'+st+'>')+'</td></tr>');
            	}
				
            	var tabs = container.kbTabs({tabs: [
                    {name: 'Overview', active: true},
                    {name: 'Genome comparison', content: genomeTable},
					{name: 'Function comparison', content: functionTable},
					{name: 'Sequence comparison', content: sequenceTable}
                ]})
            	
            	// Code to displaying overview data
				var keys = [
					{key: 'name'},
					{key: 'workspace'},
					{key: 'corefunc'},
					{key: 'corefam'},
					{key: 'sourceref'},
					{key: 'owner'},
					{key: 'creation'},
				];
				var GenCompOverview = {
					id: info[1],
					ws: info[7],
					corefunc: object.core_functions,
					corefam: object.core_families,
					protcomp: '', 
					pangen: '',
					owner: info[5],
					creation: info[3],
				};
				
				var labels;
				if (object.protcomp_ref) {
					GenCompOverview['protcomp'] = object.protcomp_ref;
					labels = ['Name','Workspace','Core functions','Core families','Proteome comparison','Owner','Creation date'];
				} else {
					GenCompOverview['pangen'] = object.pangenome_ref;
					labels = ['Name','Workspace','Core functions','Core families','Pangenome','Owner','Creation date'];
				} 
				var table = kb.ui.objTable('Overview',GenCompOverview,keys,labels);
				tabs.tabContent('Overview').append(table);
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
