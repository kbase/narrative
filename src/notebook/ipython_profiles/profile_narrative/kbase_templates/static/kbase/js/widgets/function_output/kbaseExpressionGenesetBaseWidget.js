/**
 * Base class for viewers visualizaing expression of a set of genes from various aspects
 * 
 * The descendant classes should override:
 * 1. getSubmtrixParams - to set params for get_submatrix_stat method from the KBaseFeatureValues service
 * 2. buildWidget - to create a custom visuzualization
 *
 * 
 *
 *
 * Pavel Novichkov <psnovichkov@lbl.gov>
 * @public
 */

define(['jquery', 
        'kbwidget', 
        'kbaseAuthenticatedWidget', 
        'kbaseTabs',
        'jquery-dataTables',
        'jquery-dataTables-bootstrap',        
        'kbaseFeatureValues-client-api'
        ], function($) {
    $.KBWidget({
        name: 'kbaseExpressionGenesetBaseWidget',
        parent: 'kbaseAuthenticatedWidget',
        version: '1.0.0',
        options: {
            workspaceID: null,

            expressionMatrixID: null,
            geneIds: null,

            // Service URL: should be in window.kbconfig.urls.
            // featureValueURL: 'http://localhost:8889',
            featureValueURL: 'https://ci.kbase.us/services/feature_values/jsonrpc',
            loadingImage: "static/kbase/images/ajax-loader.gif"
        },

        // Prefix for all div ids
        pref: null,

        // KBaseFeatureValue client
        featureValueClient: null,

        // Matrix set stat
        submatrixStat: null,

        init: function(options) {
            this._super(options);
            this.pref = this.uuid();

            // Create a message pane
            this.$messagePane = $("<div/>").addClass("kbwidget-message-pane kbwidget-hide-message");
            this.$elem.append(this.$messagePane);       

            return this;
        },

        loggedInCallback: function(event, auth) {

           // Build a client
            this.featureValueClient = new KBaseFeatureValues(this.options.featureValueURL, auth);           

            // Let's go...
            this.loadAndRender();           
            return this;
        },

        loggedOutCallback: function(event, auth) {
            this.isLoggedIn = false;
            return this;
        },

        setTestParameters: function(){
            this.options.workspaceID = '645';
            this.options.expressionMatrixID = '9';
            this.options.geneIds = "VNG0001H,VNG0002G,VNG0003C,VNG0006G,VNG0013C,VNG0014C,VNG0361C,VNG0518H,VNG0868H,VNG0289H,VNG0852C";
        },

        // To be overriden to specify additional parameters
        getSubmtrixParams: function(){
            var self = this;
            self.setTestParameters();
            return{
                input_data: self.options.workspaceID + "/" + self.options.expressionMatrixID,
                row_ids: $.map(self.options.geneIds.split(","), $.trim),
                // specify your additional parameters
            };
        },

        loadAndRender: function(){
            var self = this;
            self.loading(true);
            self.featureValueClient.get_submatrix_stat(
                self.getSubmtrixParams(),
                function(data){
                    console.log("submatrixStat",data);
                    self.submatrixStat = data;
                    self.render();
                    self.loading(false);
                },
                function(error){
                    self.clientError(error);
                }
            );
        },

        render: function(){

            var $overviewContainer = $("<div/>");
            this.$elem.append( $overviewContainer );
            this.buildOverviewDiv( $overviewContainer );

            // Separator
            this.$elem.append( $('<div style="margin-top:1em"></div>') );

            var $vizContainer = $("<div/>");
            this.$elem.append( $vizContainer );
            this.buildWidget( $vizContainer );            
        },

        buildOverviewDiv: function($containerDiv){
            var self = this;
            var pref = this.pref;

            var $overviewSwitch = $("<a/>").html('[Selected genes]');
            $containerDiv.append($overviewSwitch);

            var $overvewContainer = $('<div hidden style="margin:1em 0 4em 0"/>');
            $containerDiv.append($overvewContainer);

            var tableGenes = $('<table id="'+pref+'genes-table"  \
                class="table table-bordered table-striped" style="width: 100%; margin-left: 0px; margin-right: 0px;">\
                </table>')
                .appendTo($overvewContainer)
                .dataTable( {
                    "sDom": 'lftip',
                    "iDisplayLength": 10,
                    "aaData": self.buildGenesTableData(),
                    "aoColumns": [
                        { sTitle: "Name", mData: "id"},
                        { sTitle: "Function", mData: "function"},
                        { sTitle: "Min", mData:"min" },
                        { sTitle: "Max", mData:"max" },  
                        { sTitle: "Avg", mData:"avg" },                                                      
                        { sTitle: "Std", mData:"std"},
                        { sTitle: "Missing", mData:"missing_values" }
                    ],
                    "oLanguage": {
                                "sEmptyTable": "No genes found!",
                                "sSearch": "Search: "
                    }                    
                } );

            $overviewSwitch.click(function(){
                $overvewContainer.toggle();
            });
        },
      
        buildGenesTableData: function(){
            var submatrixStat = this.submatrixStat;
            var tableData = [];
            var stat = submatrixStat.row_set_stats;
            for(var i = 0; i < submatrixStat.row_descriptors.length; i++){
                var desc = submatrixStat.row_descriptors[i];

                var gene_function = desc.properties['function'];
                tableData.push(
                    {
                        'index': desc.index,
                        'id': desc.id,
                        'name': desc.name,
                        'function' : gene_function,
                        'min': stat.mins[i] === null? ' ' : stat.mins[i].toFixed(2),
                        'max': stat.maxs[i] === null? ' ' : stat.maxs[i].toFixed(2),
                        'avg': stat.avgs[i] === null? ' ' : stat.avgs[i].toFixed(2),
                        'std': stat.stds[i] === null? ' ' : stat.stds[i].toFixed(2),
                        'missing_values': stat.missing_values[i]
                    }
                );
            }
            return tableData;
        },

        // To be overriden
        buildWidget: function($containerDiv){},

        makeRow: function(name, value) {
            var $row = $("<tr/>")
                       .append($("<th />").css('width','20%').append(name))
                       .append($("<td />").append(value));
            return $row;
        },
        
        loading: function(isLoading) {
            if (isLoading)
                this.showMessage("<img src='" + this.options.loadingImage + "'/>");
            else
                this.hideMessage();                
        },

        showMessage: function(message) {
            var span = $("<span/>").append(message);

            this.$messagePane.append(span);
            this.$messagePane.show();
        },

        hideMessage: function() {
            this.$messagePane.hide();
            this.$messagePane.empty();
        },

        clientError: function(error){
            this.loading(false);
            this.showMessage(error.error.error);
        },            

        uuid: function() {
            return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, 
                function(c) {
                    var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
                    return v.toString(16);
                });
        },

        buildObjectIdentity: function(workspaceID, objectID, objectVer, wsRef) {
            var obj = {};
            if (wsRef) {
                obj['ref'] = wsRef;
            } else {
                if (/^\d+$/.exec(workspaceID))
                    obj['wsid'] = workspaceID;
                else
                    obj['workspace'] = workspaceID;

                // same for the id
                if (/^\d+$/.exec(objectID))
                    obj['objid'] = objectID;
                else
                    obj['name'] = objectID;
                
                if (objectVer)
                    obj['ver'] = objectVer;
            }
            return obj;
        }

    });
});