/**
 * Output widget to vizualize DomainAnnotation object.
 * Pavel Novichkov <psnovichkov@lbl.gov>, John-Marc Chandonia <jmchandonia@lbl.gov>
 * @public
 */

define(['jquery', 'kbwidget', 'kbaseAuthenticatedWidget', 'kbaseTabs'], function($) {
    $.KBWidget({
        name: 'kbaseDomainAnnotation',
        parent: 'kbaseAuthenticatedWidget',
        version: '1.0.2',
        options: {
            domainAnnotationID: null,
            workspaceID: null,
            domainAnnotationVer: null,
            kbCache: null,
            workspaceURL: window.kbconfig.urls.workspace,
            loadingImage: "static/kbase/images/ajax-loader.gif",
            height: null,
	    maxDescriptionLength: 200
        },

        // Data for vizualization
        domainAnnotationData: null,
        genomeRef: null,
        genomeID: null,
        genomeName: null,
        domainModelSetRef: null,
        domainModelSetName: null,
        accessionToShortDescription: {},
        accessionToLongDescription: {},
	accessionToPrefix: {},
	prefixToURL: {},
        annotatedGenesCount: 0,
        annotatedDomainsCount: 0,

        init: function(options) {
            this._super(options);

            // Create a message pane
            this.$messagePane = $("<div/>").addClass("kbwidget-message-pane kbwidget-hide-message");
            this.$elem.append(this.$messagePane);
	    
            return this;
        },

        loggedInCallback: function(event, auth) {
	    // error if not properly initialized
            if (this.options.domainAnnotationID == null) {
		this.showMessage("[Error] Couldn't retrieve domain annotation data.");
		return this;
            }

            // Create a new workspace client
            this.ws = new Workspace(this.options.workspaceURL, auth);
           
            // Let's go...
            this.render();           
           
            return this;
        },

        loggedOutCallback: function(event, auth) {
            this.ws = null;
            this.isLoggedIn = false;
            return this;
        },
  
        render: function(){
            var self = this;
            self.pref = this.uuid();
            self.loading(true);

            var container = this.$elem;
            var kbws = this.ws;

            var domainAnnotationRef = self.buildObjectIdentity(this.options.workspaceID, this.options.domainAnnotationID, this.options.domainAnnotationVer);
            kbws.get_objects([domainAnnotationRef], function(data) {

                self.domainAnnotationData = data[0].data;
                self.genomeRef = self.domainAnnotationData.genome_ref;
                self.domainModelSetRef = self.domainAnnotationData.used_dms_ref;

                // Job to get properties of AnnotationDomain object: name and id of the annotated genome
                var jobGetDomainAnnotationProperties = kbws.get_object_subset(
                    [
                        { 'ref':self.genomeRef, 'included':['/id'] },
                        { 'ref':self.genomeRef, 'included':['/scientific_name'] }
                    ], 
                    function(data){
                        self.genomeID = data[0].data.id;
                        self.genomeName = data[1].data.scientific_name;
                    }, 
                    function(error){
                        self.clientError(error);
                    }                    
                );

                var jobGetDomainModelSet =  kbws.get_objects(
                    [{ref: self.domainModelSetRef}], 
                    function(data) {
                        self.accessionToShortDescription = data[0].data.domain_accession_to_description;
			// make regex for each prefix to map to external URLs
			$.each(data[0].data.domain_prefix_to_dbxref_url, function(prefix,url) {
			    self.prefixToURL['^'+prefix] = url;
			});
			// make short & long descriptions for ones that are too long
			$.each(self.accessionToShortDescription, function(domainID,description) {
			    self.accessionToLongDescription[domainID] = "";
			    if (description.length > self.options.maxDescriptionLength) {
				var pos = description.indexOf(" ",self.options.maxDescriptionLength);
				if (pos > -1) {
				    self.accessionToLongDescription[domainID] = description + ' <small><a class="show-less' + self.pref  + '" data-id="' + domainID + '">show&nbsp;less</a></small>';
				    self.accessionToShortDescription[domainID] = description.substring(0,pos) + ' <small><a class="show-more' + self.pref  + '" data-id="' + domainID + '">more&#8230;</a></small>';
				}
			    }
			});
                    },
                    function(error){
                        self.clientError(error);
                    }
                );

                // Launch jobs and vizualize data once they are done
                $.when.apply($, [jobGetDomainAnnotationProperties, jobGetDomainModelSet]).done( function(){
                    self.loading(false);
                    self.prepareVizData();

                    ///////////////////////////////////// Instantiating Tabs ////////////////////////////////////////////
                    container.empty();
                    var tabPane = $('<div id="'+self.pref+'tab-content">');
                    container.append(tabPane);
                    tabPane.kbaseTabs({canDelete : true, tabs : []});                    
                    ///////////////////////////////////// Overview table ////////////////////////////////////////////           
                    var tabOverview = $("<div/>");
                    tabPane.kbaseTabs('addTab', {tab: 'Overview', content: tabOverview, canDelete : false, show: true});
                    var tableOver = $('<table class="table table-striped table-bordered" '+
                        'style="width: 100%; margin-left: 0px; margin-right: 0px;" id="'+self.pref+'overview-table"/>');
                    tabOverview.append(tableOver);
                    tableOver
                        .append( self.makeRow( 
                            'Annotated genome', 
                            $('<span />').append(self.genomeName).css('font-style', 'italic') ) )
                        .append( self.makeRow( 
                            'Domain model set', 
                            self.domainSetName ) )
                        .append( self.makeRow( 
                            'Annotated genes', 
                            self.annotatedGenesCount ) )
                        .append( self.makeRow( 
                            'Annotated domains', 
                            self.annotatedDomainsCount) );

                    ///////////////////////////////////// Domains table ////////////////////////////////////////////          
                    var tabDomains = $("<div/>");
                    tabPane.kbaseTabs('addTab', {tab: 'Domains', content: tabDomains, canDelete : false, show: false});
                    var tableDomains = $('<table class="table table-striped table-bordered" '+
                        'style="width: 100%; margin-left: 0px; margin-right: 0px;" id="'+self.pref+'domain-table"/>');
                    tabDomains.append(tableDomains);
                    var domainTableSettings = {
                        "sPaginationType": "full_numbers",
                        "iDisplayLength": 10,
                        "aaData": [],
                        "aaSorting": [[ 3, "asc" ], [0, "asc"]],
                        "aoColumns": [
                            { sTitle: "Domain", mData: "id"},
                            { sTitle: "Description", mData: "domainDescription"},
                            { sTitle: "LongDescription", mData: "longDomainDescription", bVisible: false, bSearchable: true},
                            { sTitle: "#Genes", mData: "geneCount"},
                            { sTitle: "Genes", mData: "geneRefs"},
                        ],
                        "oLanguage": {
                                    "sEmptyTable": "No domains found!",
                                    "sSearch": "Search: "
                        },
                        'fnDrawCallback': eventsDomainsTab
                    };

                    var domainsTableData = [];
                    var domains = self.domains;
                    for(var domainID in domains){
                        var domain = domains[domainID];

			// try to map each domain to a prefix,
			// for external crossrefs and to show only
			// the most relevant match per set
			var domainRef = domainID;
			$.each(self.prefixToURL, function(prefix,url) {
			    if (domainID.match(prefix)) {
				self.accessionToPrefix[domainID] = prefix;
				domainRef += ' <small><a href="'+url+domainID+'" target="_blank">(more&nbsp;info)</a></small>';
				return false;
			    }
			});

                        // Build concatenated list of gene references
                        var geneRefs = "";
                        for(var i = 0; i < domain.genes.length; i++){
                            gene = domain.genes[i];
                            if( i > 0 ) {
                                geneRefs += '<br />';
                            }                            
                            geneRefs += '<a class="show-gene' + self.pref  + '"'
                                + ' data-id="' + gene['geneID'] + '"'
                                + ' data-contigID="' + gene['contigID']  + '"'
                                + ' data-geneIndex="' + gene['geneIndex']  + '"'
                                + '>' + gene['geneID'] + '</a>';
                        }
 
                        // add table data row            
                        domainsTableData.push(
                            {
                                'id': domainRef, 
                                'domainDescription' : self.accessionToShortDescription[domainID],
                                'longDomainDescription' : self.accessionToLongDescription[domainID],
                                'geneCount': domain.genes.length,
                                'geneRefs': geneRefs
                            }
                        );
                    };
                    domainTableSettings.aaData = domainsTableData;
                    tableDomains = tableDomains.dataTable(domainTableSettings);

                    ///////////////////////////////////// Domains Tab Events ////////////////////////////////////////////          
                    function eventsDomainsTab() {
                        $('.show-gene'+self.pref).unbind('click');
                        $('.show-gene'+self.pref).click(function() {
                            var id = $(this).attr('data-id');
                            var contigID = $(this).attr('data-contigID');
                            var geneIndex = $(this).attr('data-geneIndex');

                            if (tabPane.kbaseTabs('hasTab', id)) {
                                tabPane.kbaseTabs('showTab', id);
                                return;
                            }

                            ////////////////////////////// Build Gene Domains table //////////////////////////////
                            var tabContent = $("<div/>");

                            var tableGeneDomains = $('<table class="table table-striped table-bordered" '+
                                'style="width: 100%; margin-left: 0px; margin-right: 0px;" id="' + self.pref + id + '-table"/>');
                            tabContent.append(tableGeneDomains);
                            var geneDomainTableSettings = {
                                "sPaginationType": "full_numbers",
                                "iDisplayLength": 10,
                                "aaData": [],
                                "aaSorting": [[ 4, "asc" ], [6, "desc"]],
                                "aoColumns": [
                                    {sTitle: "Domain", mData: "domainID"},
                                    {sTitle: "Description", mData: "domainDescription", sWidth:"30%"},
                                    {sTitle: "LongDescription", mData: "longDomainDescription", bVisible: false, bSearchable: true},
                                    {sTitle: "Location", mData: "image"},
                                    {sTitle: "Start", mData: "domainStart"},
                                    {sTitle: "End", mData: "domainEnd"},
                                    {sTitle: "E-value", mData: "eValue"},
                                ],
                                "oLanguage": {
                                    "sEmptyTable": "No domains found!",
                                    "sSearch": "Search: "
                                },
				'fnDrawCallback': eventsGeneTab
                            };
                            var geneDomainsTableData = [];

                            var gene = self.domainAnnotationData.data[contigID][geneIndex];
                            var geneID = gene[0];
                            var geneStart = gene[1];
                            var geneEnd = gene[2];
                            var domainsInfo = gene[4];
			    var geneLength = (geneEnd - geneStart + 1)/3;

			    // hack to correct display bug in genes with incorrect stated lengths
                            for(var domainID in domainsInfo){
                                var domainsArray = domainsInfo[domainID];
                                for(var i = 0 ; i < domainsArray.length; i++){
                                    var domainEnd = domainsArray[i][1];
                                    if (domainEnd > geneLength)
					geneLength = domainEnd;
				}
			    }
			    
                            for(var domainID in domainsInfo){
                                var domainsArray = domainsInfo[domainID];
                                for(var i = 0 ; i < domainsArray.length; i++){
                                    var domainStart = domainsArray[i][0];
                                    var domainEnd = domainsArray[i][1];
                                    var eValue = domainsArray[i][2];

                                    var domainImgWidth = (domainEnd - domainStart)*100/geneLength;
                                    var domainImgleftShift = (domainStart)*100/geneLength;

				    var domainRef = '<a class="show-domain' + self.pref  + '"'
					+ ' data-id="' + domainID + '">'
					+ domainID + '</a>';

                                    geneDomainsTableData.push({
                                        'contigID' : contigID,
                                        'geneID' : geneID,
                                        'domainID' : domainRef,
                                        'domainDescription' : self.accessionToShortDescription[domainID],
                                        'longDomainDescription' : self.accessionToLongDescription[domainID],
                                        'domainStart': domainStart, 
                                        'domainEnd' : domainEnd, 
                                        'eValue' : eValue,
                                        'image' : 
                                                '<div style="width: 100%; height:100%; vertical-align: middle; margin-top: 1em; margin-bottom: 1em;">'
                                                + '<div style="position:relative; border: 1px solid gray; width:100%; height:2px;">' 
                                                + '<div style="position:relative; left: ' + domainImgleftShift +'%;' 
                                                + ' width:' + domainImgWidth + '%;'
                                                + ' top: -5px; height:10px; background-color:red;"/></div>'
                                                + '</div>'
                                    });
                                }
                            }                            
                            geneDomainTableSettings.aaData = geneDomainsTableData;
                            tabPane.kbaseTabs('addTab', {tab: id, content: tabContent, canDelete : true, show: true});
                            tableGeneDomains.dataTable(geneDomainTableSettings);
                        });
			eventsMoreDescription();
		    };

                    ///////////////////////////////////// Gene Tab Events ////////////////////////////////////////////          
                    function eventsGeneTab() {
                        $('.show-domain'+self.pref).unbind('click');
                        $('.show-domain'+self.pref).click(function() {
                            var domainID = $(this).attr('data-id');
			    tableDomains.fnFilter(domainID);
                            tabPane.kbaseTabs('showTab', 'Domains');
			});
			eventsMoreDescription();
                    };

                    //////////////////// Events for Show More/less Description  ////////////////////////////////////////////          
                    function eventsMoreDescription() {
                        $('.show-more'+self.pref).unbind('click');
                        $('.show-more'+self.pref).click(function() {
                            var domainID = $(this).attr('data-id');
			    $(this).closest("td").html(self.accessionToLongDescription[domainID]);
			    eventsLessDescription();
			});
		    }
                    function eventsLessDescription() {
                        $('.show-less'+self.pref).unbind('click');
                        $('.show-less'+self.pref).click(function() {
                            var domainID = $(this).attr('data-id');
			    $(this).closest("td").html(self.accessionToShortDescription[domainID]);
			    eventsMoreDescription();
			});
		    }
                });                
            });
        },
       
        prepareVizData: function(){
            var self = this;

            var dad = self.domainAnnotationData;

            var domains = {};
            var domainsCount = 0;
            var genesCount = 0;

            for(var contigID in dad.data){

                var genesArray = dad.data[contigID];
                for(var i = 0 ; i < genesArray.length; i++){
                    var geneID = genesArray[i][0];
//                    var geneStart = genesArray[i][1];
//                    var geneEnd = genesArray[i][2];
                    var domainsInfo = genesArray[i][4];
                    if($.isEmptyObject(domainsInfo)) continue;

                    // If we have something in domainsInfo, then the gene was anntoated
                    genesCount++;
                    for(var domainID in domainsInfo){
                        var domainData = domains[domainID];
                        if(typeof domainData === 'undefined'){
                            domainData = {
                                'id': domainID,
                                'genes': []
                            };
                            domains[domainID] = domainData;
                            domainsCount++;
                        }

                        domainData.genes.push(
                            {
                                'geneID': geneID,
                                'contigID': contigID, 
                                'geneIndex': i
                            }
                        );
                    }
                }
                self.domains = domains;
                self.annotatedDomainsCount = domainsCount; 
                self.annotatedGenesCount = genesCount;
            }
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
                id: this.options.domainAnnotationID,
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
        },        

        clientError: function(error){
            this.loading(false);
            this.showMessage(error.error.error);
        }        

    });
});