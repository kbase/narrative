/**
 * "Import" tab on data side panel.
 * @author Roman Sutormin <rsutormin@lbl.gov>
 * @public
 */
(function( $, undefined ) {
    $.KBWidget({
        name: "kbaseNarrativeSidePublicTab",
        parent: "kbaseAuthenticatedWidget",
        version: "1.0.0",
        options: {
        	addToNarrativeButton: null,
        	selectedItems: null
        },
        token: null,
        wsName: null,
        loadingImage: "static/kbase/images/ajax-loader.gif",
        wsUrl: "https://kbase.us/services/ws/",
        categories: ['genomes'],
        categoryToName: {  // search API category -> UI name
        	'genomes': 'Genomes'
        },
        totalPanel: null,
        resultPanel: null,
        objectList: null,
        
        init: function(options) {
            this._super(options);
            var self = this;
            $(document).on(
            		'setWorkspaceName.Narrative', $.proxy(function(e, info) {
                        //console.log('side panel import tab -- setting ws to ' + info.wsId);
                        self.wsName = info.wsId;
            		}, this)
            );
            return this;
        },
        
        render: function() {
        	var self = this;
        	
            var typeInput = $('<select class="form-control kb-import-filter">');
            for (var catPos in self.categories) {
            	var cat = self.categories[catPos];
            	var catName = self.categoryToName[cat];
                typeInput.append('<option value="'+cat+'">'+catName+'</option>');
            }
            var typeFilter = $('<div class="col-sm-3">').append(typeInput);
            var filterInput = $('<input type="text" class="form-control kb-import-search" placeholder="Filter data">');
            var searchFilter = $('<div class="col-sm-7">').append(filterInput);
            var searchButton = $('<button>').attr('type', 'button').addClass('btn btn-primary kb-import-search').append('Search');
            searchButton.click(
            		$.proxy(function(event) {
            			event.preventDefault();
            			self.searchAndRender(typeInput.val(), filterInput.val());
            		}, this)
            );
            var buttonFilter = $('<div class="col-sm-2">').append(searchButton);
            
            var header = $('<div class="row">').append(typeFilter, searchFilter, buttonFilter);
            self.$elem.append(header);
            self.totalPanel = $('<div>');
            self.$elem.append(self.totalPanel);
            self.resultPanel = $('<div>');
            self.$elem.append(self.resultPanel);
            return this;
        },

        searchAndRender: function(category, query) {
        	var self = this;
        	self.totalPanel.empty();
        	self.resultPanel.empty();
        	if (!query)
        		return;
        	query = query.trim();
        	if (query.length == 0)
        		return;
            var table = $('<table>');
            self.resultPanel.append(table);
        	var itemsPerPage = 20;
        	var pageNum = 1;
        	//var query = 'coli';
        	//var category = 'genomes';
        	self.search(category, query, itemsPerPage, pageNum, function(data) {
        		console.log(data);
        		self.totalPanel.append("Total results: " + data.totalResults);
        		for (var i in data.items) {
        			var name = data.items[i].scientific_name;
        			table.append('<tr><td>' + name + '</td></tr>');
        			self.options.addToNarrativeButton.prop('disabled', false);
        		}
        	}, function(error) {
        		console.log(error);
        	});        	
        },
        
        search: function (category, query, itemsPerPage, pageNum, ret, errorCallback) {
        	//var url = 'http://kbase.us/services/search/getResults?itemsPerPage=' + itemsPerPage + '&page=' + pageNum + '&q=' + query + '&category=' + category;
        	var url = 'http://kbase.us/getResults?itemsPerPage=' + itemsPerPage + '&page=' + pageNum + '&q=' + query + '&category=' + category;
        	var promise = jQuery.Deferred();
        	jQuery.ajax(url, {
        		success: function (data) {
        			ret(data);
        			promise.resolve();
        		},
        		error: function(jqXHR, error){
        			if (errorCallback)
    					errorCallback(error);
        			promise.resolve();
        		},
        		headers: self.auth_header,
        		type: "GET"
        	});
        	
        	return promise;
        },

        showError: function(error) {
        	console.log(error);
        	var errorMsg = error;
        	if (error.error && error.error.message)
        		errorMsg = error.error.message;
        	this.infoPanel.empty();
        	this.infoPanel.append('<span class="label label-danger">Error: '+errorMsg+'"</span>');
        },

        showInfo: function(message, spinner) {
        	if (spinner)
        		message = '<img src="'+this.loadingImage+'"/> ' + message;
        	this.infoPanel.empty();
        	this.infoPanel.append(message);
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
        
        uuid: function() {
            return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, 
                function(c) {
                    var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
                    return v.toString(16);
                });
        }
    });
})( jQuery );
