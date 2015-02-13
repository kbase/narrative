/**
 * KBase widget to display a Metagenome Collection
 */
(function($, undefined) {
    $.KBWidget({
        name: 'CollectionView',
        parent: "kbaseAuthenticatedWidget",
        version: '1.0.0',
        token: null,
        options: {
	        id: null,
	        ws: null
        },
	    ws_url: window.kbconfig.urls.workspace,
	    loading_image: "static/kbase/images/ajax-loader.gif",
        
	    init: function(options) {
            this._super(options);
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
            container.append("<div><img src=\""+self.loading_image+"\">&nbsp;&nbsp;loading data...</div>");

	        var kbws = new Workspace(self.ws_url, {'token': self.token});
	        kbws.get_objects([{ref: self.options.ws+"/"+self.options.id}], function(data) {
		        // parse data
		        if (data.length == 0) {
		            var msg = "[Error] Object "+self.options.id+" does not exist in workspace "+self.options.ws;
		            container.empty();
		            container.append('<div><p>'+msg+'>/p></div>');
		        } else {
			        // parse data		            
			        var d = data[0]['data'];
			        var idList = [];
			        for (var i=0; i<d.members.length; i++) {
				        idList.push({ ref: d.members[i].URL });
			        }
                
                    if (idList.length > 0) {
			            kbws.get_objects(idList, function(resData) {
                            var tdata = [];
                            for (var i=0; i<resData.length; i++) {
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
                        
				            var tlen = 0;
                            if (window.hasOwnProperty('rendererTable') && rendererTable.length) {
                                tlen = rendererTable.length;
                            }
				        
				            var html = '<h4>Metagenome Collection '+d.name+'</h4><div id="collectionTable'+tlen+'" style="width: 95%;"></div>';
		            	    container.empty();
		            	    container.append(html);

				            var tableCollection = standaloneTable.create({index: tlen});
                            tableCollection.settings.target = document.getElementById("collectionTable"+tlen);
                            tableCollection.settings.data = { header: ["ID", "Name", "Project", "PI", "Biome", "Sequence Type", "Sequencing Method", "bp Count", "Created"], data: tdata };
                            tableCollection.render(tlen);
			            });
		            } else {
		                container.empty();
    		            var main = $('<div>');
    		            main.append($('<p>')
    		                .css({'padding': '10px 20px'})
    		                .text('[Error] collection is empty'));
    		            container.append(main);
		            }
	            }
	        }, function(data) {
		        container.empty();
		        var main = $('<div>');
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
})(jQuery);
