/**
 * @author Andreas Wilke <wilke@anl.gov>
 * @public
 */

(function( $, undefined ) {
    $.KBWidget({
        name: "create_metagenome_set_public",
        parent: "kbaseNarrativeInput",
        version: "1.0.0",
        token: null,
        options: {},
        ws_id: window.kbconfig.workspaceId,
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
            this.ws_id = parseInt(this.ws_id, 10);
            return this;
        },

	    render: function() {
		    var self = this;
		    var container = this.$elem;
            var foots = container.parent().parent().children();
	foots[foots.length - 1].style.display='none';
	    container.empty();
            if (self.token == null) {
                container.append("<div>[Error] You're not logged in</div>");
                return;
            }
            var kbws = new Workspace(self.ws_url, {'token': self.token});
        
		    var lslen = 0;
        	if (window.hasOwnProperty('rendererListselect') && rendererListselect.length) {
        		lslen = rendererListselect.length;
       		}
		    container.append("<div id='inputListselect"+lslen+"'><img src='../../static/kbase/images/ajax-loader.gif'></div>");
		    var listSelect = standaloneListselect.create({index: lslen});
		    listSelect.settings.target = document.getElementById('inputListselect'+lslen);
		    listSelect.settings.callback = this.metagenomesSelected;
		    listSelect.settings.synchronous = false;//true;
			listSelect.settings.navigation_url = "http://api.metagenomics.anl.gov/metagenome?match=all&verbosity=mixs";
		    listSelect.settings.data = [];
		    listSelect.settings.filter = [ "id", "name", "project_id", "project_name", "PI_lastname", "biome", "feature", "material", "env_package_type", "location", "country", "longitude", "latitude", "collection_date", "sequence_type", "seq_method", "status", "created" ];//[ "id", "name", "project id", "project name", "PI lastname", "biome", "feature", "material", "env package", "location", "country", "longitude", "latitude", "collection date", "sequence type", "sequencing method", "status", "created" ];
		    listSelect.settings.multiple = true;
		    listSelect.settings.result_field = true;
		    listSelect.settings.result_field_placeholder = "collection name";
		    listSelect.settings.extra_wide = true;
		    listSelect.settings.return_object = true;
		    listSelect.settings.filter_attribute = 'name';
			listSelect.settings.asynch_limit = 100;
		    listSelect.settings.asynch_filter_attribute = 'name';
		    listSelect.settings.value = "id";
		    listSelect.settings.master = self;
		    listSelect.settings.index = lslen;
		    var r = document.createElement('div');
		    r.setAttribute('id', 'mgInputResultDiv'+lslen);
		    container.append(r);
			listSelect.render(lslen);
			listSelect.update_data({},1);

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
        },
    
	    metagenomesSelected: function(items, listName, index) {
	        var self = this.master;
	        var d = document.getElementById("mgInputResultDiv"+this.index);

		// check if amplicon and wgs are mixed
		var amplicon = 0;
		var wgs = 0;
		for (var i=0; i<items.length; i++) {
			if (items[i].sequence_type.toLowerCase() == "amplicon") {
			    amplicon++;
			} else {
				wgs++;
			}
		}
		if (wgs > 1 && amplicon > 1) {
			alert("You selection contains both amplicon and whole genome shotgun datasets, which are not comparable.\nSelect 'sequence type' from the dropdown to remove datasets of the undesired type.");
			return;
		}

	        // if data is selected create list and save it to ws
	        var date = new Date();
	        var collection = {
	    	    name: listName,
	    	    type: 'Metagenome',
	    	    created: date.toISOString(),
	    	    members: []
	        };
	    
	        for (var i=0 ; i<items.length;i++){
		        collection.members[i] = {'ID': items[i].id, 'URL': "2703/"+items[i].id+"."+items[i].sequence_type.toLowerCase()+".metagenome"};
	        }
	    
	        var object_data = {
	     	    type: 'Communities.Collection',
	     	    data: collection,
	     	    name: listName
	        };
	        var save_params = {
	     	    id: self.ws_id, //if only ws name is given change to workspace
	     	    objects: [object_data]
	        };
	        //console.log(save_params);
	   
	        var kbws = new Workspace(self.ws_url, {'token': self.token});
	        kbws.save_objects(save_params);
	        d.innerHTML += "<h5>collection "+listName+" saved.</h5>";
	    }
    });
})( jQuery );
