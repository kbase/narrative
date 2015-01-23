/**
 * Shows gene domains.
 */
(function( $, undefined ) {
    $.KBWidget({
        name: "KBaseGeneDomains",
        parent: "kbaseWidget",
        version: "1.0.1",

        options: {
            featureID: null,
            embedInCard: false,
            auth: null,
            loadingImage: "assets/img/loading.gif",
            genomeID: null,
            workspaceID: null,
            kbCache: null,
	    maxDescriptionLength: 100
        },

        init: function(options) {
            this._super(options);
            this.wsClient = this.options.kbCache.ws;

            this.render();

            return this;
        },

        render: function() {
            var self = this;

            self.$elem.append($('<div id="mainview">').css("overflow","auto"));
            var $maindiv = self.$elem.find('#mainview');
            $maindiv.append('<table cellpadding="0" cellspacing="0" border="0" id="ref-table" \
                            class="table table-bordered table-striped" style="width: 100%; margin-left: 0px; margin-right: 0px;"/>');

            // Launch the first step in processing the data for the table
            this.processDomainAnnotationObjects();
        },
            
        processDomainAnnotationObjects: function(){
            var self = this;

            // Get DomainAnnotation objects referenced by a given genome
            var genomeIdentityObj = self.buildObjectIdentity(self.options.workspaceID, self.options.genomeID);
            self.wsClient.list_referencing_objects([genomeIdentityObj], function(data){

                var domainAnnotationObjectRefs = {};

                var objectRefs = data[0];
                for(var i = 0; i < objectRefs.length; i++){

                    var objectType = objectRefs[i][2];

                    if( /.DomainAnnotation-/.exec(objectType) ){
                        var wsId = objectRefs[i][6];
                        var objId = objectRefs[i][0];
                        var objVer = objectRefs[i][4];

                        var objRef = wsId + "/" + objId;
                        domainAnnotationObjectRefs[objRef] = objectRefs[i];
                    }                    
                }

                // if there are domain annotation objects then proceed to the next step
                // which is collecting ContigIndexElements
                if( ! $.isEmptyObject(domainAnnotationObjectRefs)){
                    self.processContigIndexElements(domainAnnotationObjectRefs);
                }
            });
        },

        processContigIndexElements: function(domainAnnotationObjectRefs){
            var self = this;

            // Build subObjectIdentities that will be later used as parameters to get contig ids and gene indexes 
            // in DomainAnnotation objects
            var subObjectIdentities = [];
            var domainModelSetRefs = {};
            for(var objRef in domainAnnotationObjectRefs){
                subObjectIdentities.push({
                    'ref':objRef, 
                    'included':['/feature_to_contig_and_index/' + self.options.featureID, '/used_dms_ref']
                });
            }

            // Get contigAndIndexElements that will be later used to get actual domain annotations
            var contigAndIndexElements = [];
            self.wsClient.get_object_subset(subObjectIdentities, function(data){

                for(var i = 0 ; i < data.length; i++){
                    var feature_to_contig_and_index = data[i].data.feature_to_contig_and_index;
                    var wsId = data[i].info[6];
                    var objId = data[i].info[0];
                    var objVer = data[i].info[4];

                    var dmsRef = data[i].data.used_dms_ref;
                    if( dmsRef != undefined){
                        domainModelSetRefs[dmsRef] = dmsRef;
                    }

                    for(var fci in feature_to_contig_and_index){

                        contigAndIndexElements.push({
                            'annObjectRef' : wsId + "/" + objId,
                            'contigId' : feature_to_contig_and_index[fci][0],
                            'geneIndex' : feature_to_contig_and_index[fci][1]
                        });
                    }
                }   
                 
                // if there domain annotation objects then proceed to the next step
                // which is collecting ContigIndexElements
                if( contigAndIndexElements.length > 0){
                    self.processDomainAnnotations(contigAndIndexElements, domainModelSetRefs);
                }                 
            });
        },

        processDomainAnnotations: function(contigAndIndexElements, domainModelSetRefs){
          var self = this;

            // Build subObjectIdentities that will be later used as parameters to get contig ids and gene indexes 
            // in DomainAnnotation objects
            var subObjectIdentities = [];
            for(var i = 0; i < contigAndIndexElements.length; i++){
                var cgiElement = contigAndIndexElements[i];
                subObjectIdentities.push({
                    'ref':cgiElement['annObjectRef'], 
                    'included':['/data' + '/' + cgiElement['contigId'] + '/' + cgiElement['geneIndex'] ]
                });
            }

            // Get domain annotations
            var uniqueDomains = {};
            var annotatedDomainsArray = [];
            self.wsClient.get_object_subset(subObjectIdentities, function(data){
                
                for(var i = 0 ; i < data.length; i++){
                    var wsId = data[i].info[6];
                    var objId = data[i].info[0];
                    var objVer = data[i].info[4];

                    for(var contigId in data[i].data.data){
                        var genesArray = data[i].data.data[contigId];
                        for(var j = 0 ; j < genesArray.length; j++){
                            var geneId = genesArray[j][0];
                            var geneStart = genesArray[j][1];
                            var geneEnd = genesArray[j][2];
                            var domainsInfo = genesArray[j][4];
                            for(var domainId in domainsInfo){
                                var domainsArray = domainsInfo[domainId];
                                for(var k = 0 ; k < domainsArray.length; k++){
                                    var domainStart = domainsArray[k][0];
                                    var domainEnd = domainsArray[k][1];
                                    var eValue = domainsArray[k][2];


                                    var domainSignature = domainId + "_" + domainStart + "_" + domainEnd;
                                    if(uniqueDomains[domainSignature] == undefined){
                                        uniqueDomains[domainSignature] = "";
                                    } else {
                                        // Because we might have several SAME domain annotations that came from 
                                        // different DomainAnnotation objects linked to a given genome
                                        continue;
                                    } 


                                    var domainImgWidth = (domainEnd - domainStart)*100/(geneEnd - geneStart);
                                    var  domainImgleftShift = (domainStart)*100/(geneEnd - geneStart);

                                    annotatedDomainsArray.push({
                                        'wsId': wsId,
                                        'objId': objId,
                                        'objVer' : objVer,
                                        'objRef': wsId + '/' + objId + "/" + objVer,
                                        'contigId' : contigId,
                                        'geneId' : geneId,
                                        'geneStart' : geneStart,
                                        'geneEnd' : geneEnd,
                                        'domainId' : domainId,
                                        'domainDescription' : '',
                                        'domainStart': domainStart,
                                        'domainEnd' : domainEnd,
                                        'eValue' : eValue,
                                        'image' : '<div style="position:relative; border: 1px solid gray; width:100%; height:2px;">' 
                                                + '<div style="position:relative; left: ' + domainImgleftShift +'%;' 
                                                + ' width:' + domainImgWidth + '%;'
                                                + ' top: -5px; height:10px; background-color:red;"/></div>'
                                    });
                                }
                            }
                        }
                    }
                }   
                 
                // if there domain annotation objects then proceed to the next step: collect domain descriptions
                if( annotatedDomainsArray.length > 0){
                    self.processDomainDescirptions(annotatedDomainsArray, domainModelSetRefs);
                }
                               
            });          
        },

        processDomainDescirptions: function(annotatedDomainsArray, domainModelSetRefs){
            var self = this;

            var domainIds = {};
            for(var i = 0; i < annotatedDomainsArray.length; i++){
                domainIds[annotatedDomainsArray[i].domainId] = "";
            }

            // Build subObjectIdentities that will be later used as parameters to get contig ids and gene indexes 
            // in DomainAnnotation objects
            var subObjectIdentities = [];
            for(var dms in domainModelSetRefs){
                var domainRefs = [];
                for(var domainId in domainIds){
                    domainRefs.push('/domain_accession_to_description/' + domainId);      
                }
                subObjectIdentities.push({
                    'ref':dms, 
                    'included': domainRefs
                });
            }

            var domainDescriptions = {};
            var shortDomainDescriptions = {};
            // Get domain annotations
            self.wsClient.get_object_subset(subObjectIdentities, function(data){
                
                //Get a hash of domain description
                for(var i = 0 ; i < data.length; i++){
                    var _domainDescriptions = data[i].data.domain_accession_to_description;
                    if(_domainDescriptions == undefined) continue;
                    for(var domainId in _domainDescriptions){
                        domainDescriptions[domainId] = _domainDescriptions[domainId];
                        shortDomainDescriptions[domainId] = _domainDescriptions[domainId];
			if (shortDomainDescriptions[domainId].length > self.options.maxDescriptionLength) {
			    shortDomainDescriptions[domainId] = shortDomainDescriptions[domainId].substring(0,self.options.maxDescriptionLength) + "&#8230;";
			}
                    }
                }

                // Update descriptions of domains in annotatedDomainsArray
		for(var i = 0; i < annotatedDomainsArray.length; i++){
                    var domainDescription = shortDomainDescriptions[annotatedDomainsArray[i].domainId];
                    if(domainDescription != undefined){
                        annotatedDomainsArray[i].domainDescription = domainDescription;
                        annotatedDomainsArray[i].shortDomainDescription = domainDescription;
                        annotatedDomainsArray[i].longDomainDescription = domainDescriptions[annotatedDomainsArray[i].domainId];
                    }
                }

                // if there domain annotation objects then proceed to the next step: collect domain descriptions
                if( annotatedDomainsArray.length > 0){
                    self.bindDomainData(annotatedDomainsArray);
                }  
            }); 
        },

        bindDomainData: function(annotatedDomainsArray){
            var self = this;

            var sDom = 't<fip>'
            if (annotatedDomainsArray.length<=10) { 
                sDom = 'tfi'; 
            }

            var tblSettings = {
                //"sPaginationType": "full_numbers",
                "iDisplayLength": 10,
                "sDom": sDom,
                "aoColumns": [
                    {sTitle: "Domain", mData: "domainId"},
                    {sTitle: "Description", mData: "domainDescription", sWidth:"30%"},
                    {sTitle: "Location", mData: "image"},
                    {sTitle: "Start", mData: "domainStart"},
                    {sTitle: "End", mData: "domainEnd"},
                    {sTitle: "eValue", mData: "eValue"},
                    {sTitle: "DomainAnnotation object", mData: "objRef"}
                ],
                "aaData": annotatedDomainsArray
            };
            var domainTable = self.$elem.find('#ref-table').dataTable(tblSettings);
	    var showLong = [];
	    $('#ref-table tbody td').click(function(event) {
		var rowID = domainTable.fnGetPosition(event.target)[0];
		if (showLong[rowID] == undefined)
		    showLong[rowID] = 0;
		showLong[rowID] = 1-showLong[rowID];
		if (showLong[rowID]==1) {
		    domainTable.fnUpdate(annotatedDomainsArray[rowID].longDomainDescription,rowID,1);
		}
		else {
		    domainTable.fnUpdate(annotatedDomainsArray[rowID].shortDomainDescription,rowID,1);
		}
	    });
        },        

        buildObjectIdentity: function(workspaceID, objectID) {
            var obj = {};
            if (/^\d+$/.exec(workspaceID))
                obj['wsid'] = workspaceID;
            else
                obj['workspace'] = workspaceID;

            // same for the id
            if (/^\d+$/.exec(objectID))
                obj['objid'] = objectID;
            else
                obj['name'] = objectID;
            return obj;
        },

        getData: function() {
            return {
                type: "Feature",
                id: this.options.featureID,
                workspace: this.options.workspaceID,
                title: "Gene Domains"
            };
        },

        showMessage: function(message) {
            var span = $("<span/>").append(message);

            this.$messagePane.empty()
                             .append(span)
                             .removeClass("kbwidget-hide-message");
        },

        hideMessage: function() {
            this.$messagePane.addClass("kbwidget-hide-message");
        },

        renderError: function(error) {
            errString = "Sorry, an unknown error occurred";
            if (typeof error === "string")
                errString = error;
            else if (error.error && error.error.message)
                errString = error.error.message;

            
            var $errorDiv = $("<div>")
                            .addClass("alert alert-danger")
                            .append("<b>Error:</b>")
                            .append("<br>" + errString);
            this.$elem.empty();
            this.$elem.append($errorDiv);
        },
    })
})( jQuery );