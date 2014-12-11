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
            this.widgetPanel = $('<div>').addClass('panel kb-func-panel kb-cell-run');

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
            
            var $inputDiv = $('<div>');

            // These are the 'delete' and 'run' buttons for the cell
            var $runButton = $('<button>')
                             .attr('id', this.cellId + '-run')
                             .attr('type', 'button')
                             .attr('value', 'Run')
                             .addClass('btn btn-primary btn-sm')
                             .append('Run');
            var $runButton.click(
                $.proxy(function(event) {
                    event.preventDefault();
                }, this)
            );

            var $buttons = $('<div>')
                           .addClass('buttons pull-right')
                           .append($runButton);

            var $progressBar = $('<div>')
            .attr('id', 'kb-func-progress')
            .addClass('pull-left')
            .css({'display' : 'none'})
            .append($('<div>')
                    .addClass('progress progress-striped active kb-cell-progressbar')
                    .append($('<div>')
                            .addClass('progress-bar progress-bar-success')
                            .attr('role', 'progressbar')
                            .attr('aria-valuenow', '0')
                            .attr('aria-valuemin', '0')
                            .attr('aria-valuemax', '100')
                            .css({'width' : '0%'})))
            .append($('<p>')
                    .addClass('text-success'));

            var methodId = 'import-method-details-'+this.uuid();
            var buttonLabel = 'details';
            var methodDesc = this.methodSpec.info.tooltip;
            var $menuSpan = $('<div class="pull-right">');
            var $methodInfo = $('<div>')
            .addClass('kb-func-desc')
            .append('<h1><b>' + this.methodSpec.info.name + '</b></h1>')
            .append($menuSpan)
            .append($('<span>')
                    .addClass('pull-right kb-func-timestamp')
                    .attr('id', 'last-run'))
            .append($('<button>')
                    .addClass('btn btn-default btn-xs')
                    .attr('type', 'button')
                    .attr('data-toggle', 'collapse')
                    .attr('data-target', '#' + methodId)
                    .append(buttonLabel))
            .append($('<h2>')
                    .attr('id', methodId)
                    .addClass('collapse')
                    .append(methodDesc));

            
            this.widgetPanel
            .append($('<div>')
                    .addClass('panel-heading')
                    .append($methodInfo))
            .append($('<div>')
                    .addClass('panel-body')
                    .append($inputDiv))
            .append($('<div>')
                    .addClass('panel-footer')
                    .css({'overflow' : 'hidden'})
                    .append($progressBar)
                    .append($buttons));
            
            this.inputWidget = $inputDiv[inputWidgetName]({ method: methodJson, isInSidePanel: true });
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
