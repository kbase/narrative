/**
 * Output widget to vizualize DomainAnnotation object.
 * Pavel Novichkov <psnovichkov@lbl.gov>
 * @public
 */

(function($, undefined) {
    $.KBWidget({
        name: 'kbaseDomainAnnotation',
        parent: 'kbaseAuthenticatedWidget',
        version: '0.0.1',
        options: {
            domainAnnotationID: null,
            workspaceID: null,
            domainAnnotationVer: null,
            jobID: null,
            kbCache: null,
            workspaceURL: "https://kbase.us/services/ws/",  //"http://dev04.berkeley.kbase.us:7058",
            loadingImage: "static/kbase/images/ajax-loader.gif",
            height: null,
        },
        token: null,

        init: function(options) {
            this._super(options);

            // TEMPORARY
            this.options.domainAnnotationID = 12;
            this.options.workspaceID = 2959;
            this.options.domainAnnotationVer = 8;

            // Create a message pain
            this.$messagePane = $("<div/>").addClass("kbwidget-message-pane kbwidget-hide-message");
            this.$elem.append(this.$messagePane);

            // Let's go...
            this.render();           

            return this;
        },

        render: function() {
            var self = this;
            self.loading(true);

            // Get new instance of the Workspace client
            self.wsClient = new Workspace(this.options.workspaceURL, {token: this.token});

            // Data to be collected for visualization
            var vizData = {};

            vizData.domainAnnotationRef = self.options.workspaceID + "/" + self.options.domainAnnotationID + "/" + this.options.domainAnnotationVer ;


            // Get references to a genome and domain model set
            var subObjectIdentities = [
                { 'ref': vizData.domainAnnotationRef, 'included':['/genome_ref'] },
                { 'ref': vizData.domainAnnotationRef, 'included':['/used_dms_ref'] }
            ];
            self.wsClient.get_object_subset(subObjectIdentities, function(data){
                vizData.genomeRef = data[0].data.genome_ref;
                vizData.domainModelSetRef = data[1].data.used_dms_ref;


                // Job to get properties of AnnotationDomain object: 
                // 1. name and id of the annotated genome
                // 2. name and domain libs of the DomainModelSet object used for domain annotation
                var jobGetDomainAnnotationProperties = self.wsClient.get_object_subset(
                    [
                        { 'ref':vizData.genomeRef, 'included':['/id'] },
                        { 'ref':vizData.genomeRef, 'included':['/scientific_name'] },
                        { 'ref':vizData.domainModelSetRef, 'included':['/set_name'] },
                        { 'ref':vizData.domainModelSetRef, 'included':['/domain_libs'] }
                    ], 
                    function(data){
                        vizData.genomeId = data[0].data.id;
                        vizData.genomeName = data[1].data.scientific_name;
                        vizData.domainSetName = data[2].data.set_name;
                        vizData.domainSetLibs = data[3].data.domain_libs;
                    }, self.clientError
                );

                // Get number of annotated genes and domains
                var jobGetDomainAnnotationMetadata = self.wsClient.get_object_info_new(
                    {
                        'objects':[{'ref': vizData.domainAnnotationRef}], 
                        'includeMetadata': 1 
                    }, function(data){
                        vizData.annotatedDomainsCount = data[0][10].annotated_domains;
                        vizData.annotatedFeaturesCount = data[0][10].annotated_features;
                    }, self.clientError
                );

                // Launch jobs and vizualize data once they are done
                $.when.apply($, [jobGetDomainAnnotationProperties, jobGetDomainAnnotationMetadata]).done( function(){
                    self.loading(false);
                    self.buildPropertyTable(vizData);
                });
            }, self.clientError

            );
        },

        buildPropertyTable: function(vizData){
            var self = this;

            var $infoPanel = $("<div>").css("overflow","auto");
            var $infoTable = $("<table>")
                              .addClass("table table-striped table-bordered")
                              .css('margin-left', '0px');
            $infoPanel.append($infoTable);                  
            self.$elem.append($infoTable);

            $infoTable.append( self.makeRow( 
                    'Annotated genome', 
                    $('<span \>').append(vizData.genomeName).css('font-style', 'italic') ) );

            $infoTable.append( self.makeRow( 
                    'Domain models set', 
                    vizData.domainSetName + ' (' + vizData.domainModelSetRef + ')') );

            $infoTable.append( self.makeRow( 
                    'Annotated genes', 
                    vizData.annotatedFeaturesCount ) );

            $infoTable.append( self.makeRow( 
                    'Annotated domains', 
                    vizData.annotatedDomainsCount) );
        },

        makeRow: function(name, value) {
            var $row = $("<tr/>")
                       .append($("<th />").css('width','20%').append(name))
                       .append($("<td />").append(value));
            return $row;
        },

        getData: function() {
            return {
                type: 'DomainAnnotation',
                id: this.options.treeID,
                workspace: this.options.workspaceID,
                title: 'Domain Annotation'
            };
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
            console.log("Client error: to be implemented ");
            console.log(error);
        }        

    });
})( jQuery );