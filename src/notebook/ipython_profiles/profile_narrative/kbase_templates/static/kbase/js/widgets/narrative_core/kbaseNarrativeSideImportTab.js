/**
 * "Import" tab on data side panel.
 * @author Roman Sutormin <rsutormin@lbl.gov>
 * @public
 */
(function( $, undefined ) {
    $.KBWidget({
        name: "kbaseNarrativeSideImportTab",
        parent: "kbaseAuthenticatedWidget",
        version: "1.0.0",
        options: {
        },
        token: null,
        loadingImage: "static/kbase/images/ajax-loader.gif",
        wsUrl: "https://kbase.us/services/ws/",
        methodStoreURL: 'http://dev19.berkeley.kbase.us/narrative_method_store',
        methClient: null,
        methods: null,
        types: null,
        widgetPanel: null,
        inputWidget: null,
        methodSpec: null,
        init: function(options) {
            this._super(options);
            return this;
        },
        
        render: function() {
        	var self = this;
            if (window.kbconfig && window.kbconfig.urls) {
                this.methodStoreURL = window.kbconfig.urls.narrative_method_store;
            }
            var upperPanel = $('<div>');
            this.widgetPanel = $('<div>');
            this.$elem.append(upperPanel);
            this.$elem.append(this.widgetPanel);
            this.methClient = new NarrativeMethodStore(this.methodStoreURL);
            this.methClient.list_categories({'load_methods': 1, 'load_apps' : 1, 'load_types' : 1}, 
                    $.proxy(function(data) {
                    	self.types = data[3];
                    	var methodIds = [];
                    	for (var key in self.types) {
                        	var methodId = self.types[key]["import_method_ids"][0];
                        	methodIds.push(methodId);
                    	}
                        self.methClient.get_method_spec({ 'ids' : methodIds },
                                $.proxy(function(specs) {
                                	self.methods = {};
                                	for (var i in specs) {
                                		self.methods[specs[i].info.id] = specs[i];
                                	}
                                	for (var key in self.types) {
                                		var btn = $('<button>' + self.types[key]["name"] + '</button>');
                                    	btn.click(function() {
                                        	self.showWidget(key);                                	
                                    	});
                                		upperPanel.append(btn);
                                	}
                                }, this),
                                $.proxy(function(error) {
                                    this.showError(error);
                                }, this)
                            );
                    }, this),
                    $.proxy(function(error) {
                        this.showError(error);
                    }, this)
                );
            return this;
        },

        showWidget: function(type) {
        	this.widgetPanel.empty();
        	var methodId = this.types[type]["import_method_ids"][0];
        	this.methodSpec = this.methods[methodId];
            var inputWidgetName = this.methodSpec.widgets.input;
            if (!inputWidgetName || inputWidgetName === 'null')
                inputWidgetName = "kbaseNarrativeMethodInput";
            var methodJson = JSON.stringify(this.methodSpec);
            this.inputWidget = this.widgetPanel[inputWidgetName]({ method: methodJson });
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
