(function( $, undefined ) {

$.KBWidget({
    name: "kbaseModelMetaNarrative",     
    parent: "kbaseAuthenticatedWidget",
    version: "1.0.0",
    options: {
    	data: null,			// if it's not null it's the main data to show
    	ws_name: null,		// it's used in case data == null
    	job_id: null,		// it's used in case data == null
    	model_id: null		// it's used in case data == null
    },

    glammURL: "http://140.221.84.217:7040/glamm/#",
    glammModelTag: "mod",
    glammWorkspaceTag: "ws",
    wsBrowserURL: "http://narrative.kbase.us/landing/landing-pages/#/cards/models/",
    wsUrl: window.kbconfig.urls.workspace,
    timer: null,

    init: function(options) {
        this._super(options);
        render(options);
    },
    
    render: function() {
        var self = this;
        var container = this.$elem;
    	container.empty();

        if (!self.authToken()) {
        	container.append("<div>[Error] You're not logged in</div>");
        	return;
        }

        var dataIsReady = function(data) {
        	var table = $('<table/>')
        	.addClass('table table-striped table-bordered')
        	.css({'margin-left': 'auto', 'margin-right': 'auto'});

        	var createTableRow = function(name, value) {
        		return "<tr><td>" + name + "</td><td>" + value + "</td></tr>";
        	};

        	table.append(createTableRow("<b>FBA Model Name</b>", "<b>" + data.name + "</b>"));
        	//table.append(createTableRow("FBA Model Name", data.name));
        	table.append(createTableRow("# of Genes", data.number_genes));
        	table.append(createTableRow("# of Compounds", data.number_compounds));
        	table.append(createTableRow("# of Reactions", data.number_reactions));
        	table.append(createTableRow("# of Compartments", data.number_compartments));
        	//table.append(createTableRow("Workspace", data[7]));

        	container.append(table);

            // removed because these don't seem to work, and views should probably be within the narrartive sidebar -mike
        	//var wsBrowserLink = "<a href='" + self.wsBrowserURL + data[7] + "/" + data[0] + "' target='_blank' class='btn btn-primary' style='text-decoration:none; color: #fff'>View Model Details</a>";
        	//var glammLink = "<a href='" + self.glammURL + self.glammWorkspaceTag + "=" + data[7] + "&" + self.glammModelTag + "=" + data[0] + "' target='_blank' class='btn btn-primary' style='text-decoration:none; color: #fff'>View in GLAMM</a>";
        	
        	//container.append(wsBrowserLink);
        	//container.append(" " + glammLink);
        };
        
    	var data = self.options.data;
    	if (data) {
    		dataIsReady(data);
    	} else {
            var kbws = new workspaceService(this.wsUrl);
        	var panel = $('<div class="loader-table"/>');
        	container.append(panel);
        	var table = $('<table class="table table-striped table-bordered" \
        			style="margin-left: auto; margin-right: auto;" id="'+pref+'overview-table"/>');
        	panel.append(table);
        	table.append('<tr><td>Job was created with id</td><td>'+self.options.job_id+'</td></tr>');
        	table.append('<tr><td>Output model will have the id</td><td>'+self.options.model_id+'</td></tr>');
        	table.append('<tr><td>Current job state is</td><td id="'+pref+'job"></td></tr>');
        	var timeLst = function(event) {
        		kbws.get_jobs({auth: self.authToken(), jobids: [self.options.job_id]}, function(data) {
        			var status = data[0]['status'];
    				var tdElem = $('#'+pref+'job');
    				tdElem.html(status);
        			if (status === 'done') {
        				clearInterval(self.timer);
        	            kbws.get_object({auth: self.authToken(), workspace: self.options.ws_name, id: self.options.model_id, type: 'Model'}, function(ret) {
        	            	$('.loader-table').remove();
        	            	dataIsReady(ret.data);
        	            }, function(data) {
                			alert("Error: " + data.error.message)
        	            });
        			} else {
        				if (status === 'error') {
        					clearInterval(self.timer);
        				}
        			}
        		}, function(data) {
        			alert("Error: " + data.error.message)
        		});
        	};
        	timeLst();
        	self.timer = setInterval(timeLst, 5000);
    	}
        
        return this;

    },
    
    loggedInCallback: function(event, auth) {
        this.render();
        return this;
    },

    loggedOutCallback: function(event, auth) {
        this.render();
        return this;
    }

})
}( jQuery ) );
