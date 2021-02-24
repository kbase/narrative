/**
 * KBase widget to display a Metagenome Collection
 */
define (
	[
		'kbwidget',
		'bootstrap',
		'jquery',
        'narrativeConfig',
		'kbaseAuthenticatedWidget',
		'kbStandaloneTable'
	], (
		KBWidget,
		bootstrap,
		$,
        Config,
		kbaseAuthenticatedWidget,
		kbStandaloneTable
	) => {
    return KBWidget({
        name: 'CollectionView',
        parent : kbaseAuthenticatedWidget,
        version: '1.0.0',
        token: null,
        options: {
	        id: null,
	        ws: null
        },
        ws_url: Config.url('workspace'),
	    loading_image: Config.get('loading_gif'),

	    init: function(options) {
            this._super(options);
            return this;
        },

        render: function() {
	        const self = this;

	        const container = this.$elem;
	        container.empty();
            if (self.token == null) {
                container.append("<div>[Error] You're not logged in</div>");
                return;
            }
            container.append("<div><img src=\""+self.loading_image+"\">&nbsp;&nbsp;loading data...</div>");

	        const kbws = new Workspace(self.ws_url, {'token': self.token});
	        kbws.get_objects([{ref: self.options.ws+"/"+self.options.id}], (data) => {
		        // parse data
		        if (data.length == 0) {
		            const msg = "[Error] Object "+self.options.id+" does not exist in workspace "+self.options.ws;
		            container.empty();
		            container.append('<div><p>'+msg+'>/p></div>');
		        } else {
			        // parse data
			        const d = data[0]['data'];
			        const idList = [];
			        for (let i=0; i<d.members.length; i++) {
				        idList.push({ ref: d.members[i].URL });
			        }

                    if (idList.length > 0) {
			            kbws.get_objects(idList, (resData) => {
                            const tdata = [];
                            for (let i=0; i<resData.length; i++) {
                                tdata.push([
                                    resData[i].data.id,
                                    resData[i].data.name,
                                    resData[i].data.mixs.project_name,
                                    resData[i].data.mixs.PI_lastname,
                                    resData[i].data.mixs.biome,
                                    resData[i].data.mixs.sequence_type,
                                    resData[i].data.mixs.seq_method,
                                    resData[i].data.statistics.sequence_stats.bp_count_raw,
                                    resData[i].data.created
                                ]);
                            }

				            let tlen = 0;
                            if (window.hasOwnProperty('rendererTable') && rendererTable.length) {
                                tlen = rendererTable.length;
                            }

				            const html = '<h4>Metagenome Collection '+d.name+'</h4><div id="collectionTable'+tlen+'" style="width: 95%;"></div>';
		            	    container.empty();
		            	    container.append(html);

				            const tableCollection = standaloneTable.create({index: tlen});
                            tableCollection.settings.target = document.getElementById("collectionTable"+tlen);
                            tableCollection.settings.data = { header: ["ID", "Name", "Project", "PI", "Biome", "Sequence Type", "Sequencing Method", "bp Count", "Created"], data: tdata };
                            tableCollection.render(tlen);
			            });
		            } else {
		                container.empty();
    		            const main = $('<div>');
    		            main.append($('<p>')
    		                .css({'padding': '10px 20px'})
    		                .text('[Error] collection is empty'));
    		            container.append(main);
		            }
	            }
	        }, (data) => {
		        container.empty();
		        const main = $('<div>');
		        main.append($('<p>')
		            .css({'padding': '10px 20px'})
		            .text('[Error] '+data.error.message));
		        container.append(main);
	        });
	        return self;
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
});
