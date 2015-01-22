/**
 * @author Andreas Wilke <wilke@anl.gov>
 * @public
 */

(function( $, undefined ) {
    $.KBWidget({
        name: "create_metagenome_set",
        parent: "kbaseNarrativeInput",
        version: "1.0.0",
        token: null,
        options: {},
        ws_name: window.kbconfig.workspaceId;
        ws_url: window.kbconfig.urls.workspace,
        loading_image: "static/kbase/images/ajax-loader.gif",

        /**
         * Builds the input div for a function cell, based on the given method object.
         * @param {Object} method - the method being constructed around.
         * @returns {String} an HTML string describing the available parameters for the cell.
         * @private
         */
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
        
		var lslen = 0;
        	if (window.hasOwnProperty('rendererListselect') && rendererListselect.length) {
        		lslen = rendererListselect.length;
       		}
		container.append("<div id='inputListselect"+lslen+"'><img src='../../static/kbase/images/ajax-loader.gif'></div>");
		var listSelect = standaloneListselect.create({index: lslen});
		listSelect.settings.target = document.getElementById('inputListselect'+lslen);
		listSelect.settings.callback = this.metagenomesSelected;
		listSelect.settings.synchronous = true;
		listSelect.settings.data = [];
		listSelect.settings.filter = [ "id", "name", "project id", "project name", "PI lastname", "biome", "feature", "material", "env package", "location", "country", "longitude", "latitude", "collection date", "sequence type", "sequencing method", "status", "created" ];
		listSelect.settings.multiple = true;
		listSelect.settings.result_field = true;
		listSelect.settings.result_field_placeholder = "collection name";
		listSelect.settings.extra_wide = true;
		listSelect.settings.return_object = true;
		listSelect.settings.filter_attribute = 'name';
		listSelect.settings.asynch_filter_attribute = 'name';
		listSelect.settings.value = "id";
		listSelect.settings.master = self;
		var r = document.createElement('div');
		r.setAttribute('id', 'myResultDiv');
		container.append(r);

                // Get list of metagenome ids from workspace
                var response = kbws.list_objects({ ids : [self.ws_name] , type : 'Communities.Metagenome'} , function(data) {
                        var idList = [];
                        for (var i=0; i<data.length; i++) {
                                idList.push({ref: self.ws_name+"/"+data[i][0] });
                        }
		        // get the metadata for the ids
                        kbws.get_objects(idList, function(resData) {
                                var listSelectData = [];
                                for (var i=0; i<resData.length; i++) {
                                        listSelectData.push({
					        "wsid": resData[i].info[6],
						"wsitem": resData[i].info[0],
                                                "id": resData[i].data.id,
                                                "name": resData[i].data.name,
                                                "project id": resData[i].data.mixs.project_id,
                                                "project name": resData[i].data.mixs.project_name,
                                                "PI lastname": resData[i].data.mixs.PI_lastname,
                                                "biome": resData[i].data.mixs.biome,
                                                "feature": resData[i].data.mixs.feature,
                                                "material": resData[i].data.mixs.material,
                                                "env package": resData[i].data.mixs.env_package,
                                                "location": resData[i].data.mixs["location"],
                                                "country": resData[i].data.mixs.country,
                                                "longitude": resData[i].data.mixs.longitude,
                                                "latitude": resData[i].data.mixs.latitude,
                                                "collection date": resData[i].data.mixs.collection_date,
                                                "sequence type": resData[i].data.mixs.sequence_type,
                                                "sequencing method": resData[i].data.mixs.seq_method,
                                                "status": resData[i].data["status"],
                                                "created": resData[i].data.created
                                        });
                                }
			        // render the listselect
				listSelect.settings.data = listSelectData;
				listSelect.render(lslen);
                        });
                });

	},
	metagenomesSelected: function(items, listName) {
	    var self = this.master;
	
	    var d = document.getElementById("myResultDiv");

	    // if data is selected create list and save it to ws
	    var collection = {
	    	name: listName,
	    	type: 'Metagenome',
	    	created: 'no timestamp available',
	    	members: []
	    };
	    
	    for (var i=0 ; i<items.length;i++){
		
	    	var member = {
	    	    ID: items[i].wsitem,
	    	    URL: items[i].wsid
	    	};
		
	    	collection.members.push(member);
	    }
	    
	    var object_data = {
	     	type: 'Communities.Metagenome',
	     	data: collection,
	     	name: listName,
	    };
	    
	    var save_params = {
	     	id: self.ws_name, //if only ws name is given change to workspace
	     	objects: [object_data]
	    };
	   
	    var kbws = new Workspace(self.ws_url, {'token': self.token});
	    console.log(save_params);
	    kbws.save_objects(save_params);
	    
	    d.innerHTML = "<h5>collection "+listName+" saved.</h5>";
	}
    });

})( jQuery );
