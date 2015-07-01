/**
 * Output widget to vizualize ExpressionMatrix object.
 * Pavel Novichkov <psnovichkov@lbl.gov>
 * @public
 */

define(['jquery', 
        'kbwidget', 
        'kbaseAuthenticatedWidget', 
        'kbaseTabs',
        'jquery-dataTables'
        ,'jquery-dataTables-bootstrap'
//        ,'jquery-dataScroller'
        ], function($) {
    $.KBWidget({
        name: 'kbaseExpressionMatrix',
        parent: 'kbaseAuthenticatedWidget',
        version: '1.0.2',
        options: {
            expressionMatrixID: null,
            workspaceID: null,
            expressionMatrixVer: null,
            workspaceURL: window.kbconfig.urls.workspace,
            loadingImage: "static/kbase/images/ajax-loader.gif",
            height: null,
	       maxDescriptionLength: 200
        },

        // Data for vizualization
        expressionMatrix: null,
        genomeRef: null,
        conditionsetRef: null,

        genomeID: null,
        genomeName: null,
        features: null,


        init: function(options) {
            this._super(options);

            // Create a message pane
            this.$messagePane = $("<div/>").addClass("kbwidget-message-pane kbwidget-hide-message");
            this.$elem.append(this.$messagePane);
	    
            return this;
        },

        loggedInCallback: function(event, auth) {

//            this.options.workspaceID = 645;
//            this.options.expressionMatrixID = 8;
//            this.options.expressionMatrixVer = 1;

	        // error if not properly initialized

            if (this.options.expressionMatrixID == null) {
                this.showMessage("[Error] Couldn't retrieve expression matrix.");
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
            var pref = this.uuid();
            self.pref = pref;
            console.log("self.pref = ", self.pref);

            self.loading(true);

            var container = this.$elem;
            var kbws = this.ws;

            var expressionMatrixRef = self.buildObjectIdentity(this.options.workspaceID, this.options.expressionMatrixID, this.options.expressionMatrixVer);
            kbws.get_objects([expressionMatrixRef], function(data) {

                self.expressionMatrix = data[0].data;
                self.genomeRef = self.expressionMatrix.genome_ref;
                self.conditionsetRef = self.expressionMatrix.conditionset_ref;


                // Job to get properties of AnnotationDomain object: name and id of the annotated genome
                var jobGetGenomeProperties = kbws.get_object_subset(
                    [
                        { 'ref':self.genomeRef, 'included':['/id'] },
                        { 'ref':self.genomeRef, 'included':['/scientific_name'] },
                        { 'ref':self.genomeRef, 'included':['/features'] }
                    ], 
                    function(data){
                        self.genomeID = data[0].data.id;
                        self.genomeName = data[1].data.scientific_name;
                        self.features = data[2].data.features;
                    }, 
                    function(error){
                        self.clientError(error);
                    }                    
                );

/*
                var jobGetConditionSet =  kbws.get_objects(
                    [{ref: self.conditionsetRef}], 
                    function(data) {
                        // SHould be implemented once we have ConditionSet object defined..          
                    },
                    function(error){
                        self.clientError(error);
                    }
                );
*/                                

                // Launch jobs and vizualize data once they are done
                $.when.apply($, [jobGetGenomeProperties/*, jobGetConditionSet*/]).done( function(){
                    self.loading(false);

                    ///////////////////////////////////// Instantiating Tabs ////////////////////////////////////////////
                    container.empty();
                    var tabPane = $('<div id="'+pref+'tab-content">');
                    container.append(tabPane);

                    tabPane.kbaseTabs({canDelete : true, tabs : []});                    
                    ///////////////////////////////////// Overview table ////////////////////////////////////////////           
                    var tabOverview = $("<div/>");
                    tabPane.kbaseTabs('addTab', {tab: 'Overview', content: tabOverview, canDelete : false, show: true});
                    var tableOver = $('<table class="table table-striped table-bordered" '+
                        'style="width: 100%; margin-left: 0px; margin-right: 0px;" id="'+pref+'overview-table"/>');
                    tabOverview.append(tableOver);
                    tableOver
                        .append( self.makeRow( 
                            'Genome', 
                            $('<span />').append(self.genomeName).css('font-style', 'italic') ) )
                        .append( self.makeRow( 
                            'Description', 
                            self.expressionMatrix.description ) )
                        .append( self.makeRow( 
                            '# conditions', 
                            self.expressionMatrix.data.col_ids.length ) )
                        .append( self.makeRow( 
                            '# genes', 
                            self.expressionMatrix.data.row_ids.length ) )
                        .append( self.makeRow( 
                            'Scale', 
                            self.expressionMatrix.scale ) )
                        .append( self.makeRow( 
                            'Value type', 
                            self.expressionMatrix.type) )
                        .append( self.makeRow( 
                            'Row normalization', 
                            self.expressionMatrix.row_normalization) )
                        .append( self.makeRow( 
                            'Column normalization', 
                            self.expressionMatrix.col_normalization) )
                        ;

                    ///////////////////////////////////// Conditions tab ////////////////////////////////////////////          

                    var tabConditions = $("<div/>");
                    tabPane.kbaseTabs('addTab', {tab: 'Conditions', content: tabConditions, canDelete : false, show: false});

                    ///////////////////////////////////// Conditions table ////////////////////////////////////////////          

                    var tableConditions = $('<table id="'+pref+'conditions-table"></table>')
                    .appendTo(tabConditions)
                    .DataTable( {
                       "dom": 'fti<"'+pref+'conditions_toolbar">',
                        "data": self.buildConditionsTableData(),
                         "columns": [
                        //     {
                        //         width: "1em",
                        //         sortable: false,    
                        //         title: '<input type="checkbox" id="'+pref+'conditions_check_all"/>',
                        //         data: null,
                        //         render: function ( data, type, row ) {
                        //             return '<input type="checkbox" class="'+pref+'conditions_checkbox"/>';
                        //         }
                        //     }, 
                            { title: "Condition", data:"id" },
                            { title: "Min", data:"min" },
                            { title: "Max", data:"max" },
                            { title: "Std", data:"std"},
                            { title: "Missed", "class": "center", data:"missed" }
                        ]
                    } )
                    .on( 'click', 'tr', function () {
                        $(this).toggleClass('selected');
                    } );

                    // // Row selector    
                    // $("#"+pref+'conditions_check_all').click(function(){
                    //     tableConditions.rows().to$().prop('checked',this.checked);
                    // });   


                    // Toolbar
                    var toolbar = $('div.'+pref+'conditions_toolbar').css("float","right").css("padding-top","1.4em");                    
                    var btn_addToConditionsCart = $('<a>Add to cart</a>');    
                    toolbar.append(btn_addToConditionsCart);
                    self.toolbarAddButton(toolbar,tableConditions, "previous");
                    self.toolbarAddButton(toolbar,tableConditions, "next");

    

                    ///////////////////////////////////// Conditions cart table ////////////////////////////////////////////          

                    var tableConditionsCartDiv = $('<div style="margin-top:5em;"/>').appendTo(tabConditions);
                    var tableConditionsCart = $('<table  id="'+pref+'conditions-cart-table"></table>')                    
                    .appendTo(tableConditionsCartDiv)
                    .DataTable({
                       "dom": '<"'+pref+'conditions_cart_title">fti<"'+pref+'conditions_cart_toolbar">',
                        "data": [],
                        "columns": [
                        //     {
                        //         width: "1em",
                        //         sortable: false,    
                        //         title: '<input type="checkbox" id="'+pref+'conditions_check_all"/>',
                        //         data: null,
                        //         render: function ( data, type, row ) {
                        //             return '<input type="checkbox" class="'+pref+'conditions_checkbox"/>';
                        //         }
                        //     }, 
                            { title: "Condition", data:"id" },
                            { title: "Min", data:"min" },
                            { title: "Max", data:"max" },
                            { title: "Std", data:"std"},
                            { title: "Missed", "class": "center", data:"missed" }
                        ]
                    } )
                    .on( 'click', 'tr', function(){
                        $(this).toggleClass('selected');
                    });

                    // Title
                    var title = $('div.'+pref+'conditions_cart_title').css("float","left").css("display","inline-block");
                    title.append($('<span style="font-size:2em;">Selected conditions</span>'));

                    // Tool bar
                    var toolbar = $('div.'+pref+'conditions_cart_toolbar').css("float","right").css("padding-top","1.4em");
                    toolbar.append($('<input id="'+pref+'matrix_name"/>'));
                    toolbar.append($('<a>Create new matrix</a>')
                        .click( function () {
                            self.storeMatrix(tableConditionsCart);
                        })
                    );
                    toolbar.append(" | ");
                    toolbar.append($('<a>Remove</a>')
                        .click( function () {
                            tableConditionsCart.rows('.selected').remove().draw(false);                  
                        })
                    );
                    toolbar.append(" | ");
                    toolbar.append($('<a>Remove all</a>')
                        .click( function () {
                            tableConditionsCart.rows().remove().draw(false);                  
                        })
                    );
                    self.toolbarAddButton(toolbar,tableConditionsCart, "previous");
                    self.toolbarAddButton(toolbar,tableConditionsCart, "next");

                    // Add to cart 
                    btn_addToConditionsCart.click( function () {
                        tableConditionsCart.rows.add(tableConditions.rows('.selected').data()).draw();                        
                        tableConditions.$('.selected').toggleClass('selected');
                    } );

                    ///////////////////////////////////// Genes tab ////////////////////////////////////////////          
                    var tabGenes = $("<div/>");
                    tabPane.kbaseTabs('addTab', {tab: 'Genes', content: tabGenes, canDelete : false, show: false});

                    ///////////////////////////////////// Genes table ////////////////////////////////////////////          

                    var tableGenes = $('<table id="'+pref+'genes-table"></table>')
                    .appendTo(tabGenes)
                    .DataTable( {
                       "dom": 'fti<"'+pref+'genes_toolbar">',
                        "data": self.buildGenesTableData(),
                        "columns": [
                            { title: "Name", data: "id"},
                            { title: "Function", data: "function"},
                            { title: "Min", data:"min" },
                            { title: "Max", data:"max" },
                            { title: "Std", data:"std"},
                            { title: "Missed", "class": "center", data:"missed" }
                        ]
                    } )
                    .on( 'click', 'tr', function () {
                        $(this).toggleClass('selected');
                    } );

                    // Toolbar
                    var toolbar = $('div.'+pref+'genes_toolbar').css("float","right").css("padding-top","1.4em");                    
                    var btn_addToGenesCart = $('<a>Add to cart</a>');    
                    toolbar.append(btn_addToGenesCart);
                    self.toolbarAddButton(toolbar,tableGenes, "previous");
                    self.toolbarAddButton(toolbar,tableGenes, "next");

                    ///////////////////////////////////// Gene cart table ////////////////////////////////////////////   

                    var tableGenesCartDiv = $('<div style="margin-top:5em;"/>').appendTo(tabGenes);
                    var tableGenesCart = $('<table  id="'+pref+'genes-cart-table"></table>')                    
                    .appendTo(tableGenesCartDiv)
                    .DataTable({
                       "dom": '<"'+pref+'genes_cart_title">fti<"'+pref+'genes_cart_toolbar">',
                        "data": [],
                        "columns": [
                            { title: "Name", data:"id" },
                            { title: "Function", data:"function" }
                        ]
                    } )
                    .on( 'click', 'tr', function(){
                        $(this).toggleClass('selected');
                    });

                    // Title
                    var title = $('div.'+pref+'genes_cart_title').css("float","left").css("display","inline-block");
                    title.append($('<span style="font-size:2em;">Selected genes</span>'));

                    // Tool bar
                    var toolbar = $('div.'+pref+'genes_cart_toolbar').css("float","right").css("padding-top","1.4em");
                    toolbar.append($('<input id="'+pref+'gene_cart_name"/>'));
                    toolbar.append($('<a>Create new Feature Set</a>')
                        .click( function () {
                            self.storeFeatureSet(tableGenesCart);
                        })
                    );
                    toolbar.append(" | ");
                    toolbar.append($('<a>Remove</a>')
                        .click( function () {
                            tableGenesCart.rows('.selected').remove().draw(false);                  
                        })
                    );
                    toolbar.append(" | ");
                    toolbar.append($('<a>Remove all</a>')
                        .click( function () {
                            tableGenesCart.rows().remove().draw(false);                  
                        })
                    );
                    self.toolbarAddButton(toolbar,tableGenesCart, "previous");
                    self.toolbarAddButton(toolbar,tableGenesCart, "next");

                    // Add to cart 
                    btn_addToGenesCart.click( function () {
                        tableGenesCart.rows.add(tableGenes.rows('.selected').data()).draw();                        
                        tableGenes.$('.selected').toggleClass('selected');
                    } );
                });                
            });
        },
        storeFeatureSet: function(cartTable){
            var self = this;
            var objName = $('#'+self.pref+'gene_cart_name').val() ; 
            var featureSet = {
                description: "Feature Set created from ExpressionMatrix object: " 
                    + this.options.workspaceID 
                    + '/' +  this.options.expressionMatrixID
                    + '/' + this.options.expressionMatrixVer
            };

            var elements = {};
            cartTable.rows().every( function () {                
                var data = this.data();
                var feElement = {
                    ref: data['id'],

                    // This is huck: no genome_ref in spec so far (Mike's request): July 1, 2015 
                    genome_ref: self.expressionMatrix.genome_ref 
                };
                elements[data['id']] = feElement;
            } );
            featureSet['elements'] = elements;

            console.log("featureSet", featureSet);
            // Store object
            self.ws.save_objects(
                {   
                    workspace: this.options.workspaceID, 
                    objects: [{
                        name: objName,
                        type: 'KBaseSearch.FeatureSet',
                        data: featureSet
                    }]
                }, 
                function(data) {
                    alert("Stored!");
                    console.log("result", data);
                },
                function(error){
                    console.error('save_objects', error);
                }                        
            );
  
        },

        storeMatrix: function(cartTable){
            var self = this;
            var objName = $('#'+self.pref+'matrix_name').val() ; 
            var mtx = self.expressionMatrix;
            var newMatrix = {
                description:"new matrix object",
                type: mtx.type,
                scale: mtx.scale,
                row_normalization: mtx.row_normalization,
                col_normalization: mtx.col_normalization,
                genome_ref: mtx.genome_ref,
                feature_mapping: mtx.feature_mapping
//                conditionset_ref: null
//                condition_mapping                
            };


            // Build hash of seleted conditions
            var selConditions = {};
            cartTable.rows().every( function () {                
                var data = this.data();
                selConditions[data['id']] = "";
            } );

            // Build hash of column indexes 
            var columnIds = mtx.data['col_ids'];
            var newColumnIds = [];
            var selColumnIdeces = [];
            for(var i = 0 ; i < columnIds.length; i++){
                if( columnIds[i] in selConditions){
                    newColumnIds.push(columnIds[i]);
                    selColumnIdeces.push(i);
                }
            }

            // Build Matrix2D object
            var matrix2D = {};
            matrix2D['row_ids'] = mtx.data['row_ids'];
            matrix2D['col_ids'] = newColumnIds;

            var values = mtx.data.values;
            var newValues = [];
            for(var i = 0; i < values.length; i++){
                var rowValues = values[i];
                var newRowValues = [];
                for(var j = 0; j < selColumnIdeces.length; j++){
                    newRowValues.push( rowValues[selColumnIdeces[j]] );                    
                }
                newValues.push(newRowValues);
            }
            matrix2D['values'] = newValues;
            newMatrix.data = matrix2D;

            // Store object
            self.ws.save_objects(
                {   
                    workspace: this.options.workspaceID, 
                    objects: [{
                        name: objName,
                        type: 'KBaseFeatureValues.ExpressionMatrix',
                        data: newMatrix
                    }]
                }, 
                function(data) {
                    alert("Stored!");
                    console.log("result", data);
                },
                function(error){
                    console.error('save_objects', error);
                }                        
            );
        },

        toolbarAddButton: function(toolbar, table, type){
            var separator = " | ";
            if(type === "previous"){
                toolbar.append(separator);
                toolbar.append($('<a>Previous</a>').click( 
                    function () {
                            table.page('previous').draw(false);  
                    })
                );
            } else if(type === "next"){
                toolbar.append(separator);
                toolbar.append($('<a>Next</a>').click( 
                    function () {
                            table.page('next').draw(false);  
                    })
                );

            }
        },

        buildConditionsTableData: function(){
            var self = this;
            var row_ids = self.expressionMatrix.data.row_ids;
            var col_ids = self.expressionMatrix.data.col_ids;

            var values = self.expressionMatrix.data.values;
            var tableData = [];

            for(var cIndex = 0; cIndex < col_ids.length; cIndex++){

                var rLen = 0;
                var min = values[0][cIndex];
                var max = values[0][cIndex];
                var avg = 0;
                var std = 0;
                var missed = 0;

                // Calculate min, max, missed, sum         
                for(var rIndex = 0 ; rIndex < row_ids.length; rIndex++ ){

                    if(values[rIndex][cIndex] === null){
                        missed++;
                    } else{
                        rLen++;
                        if(values[rIndex][cIndex] < min || min === null) min = values[rIndex][cIndex];
                        if(values[rIndex][cIndex] > max || max === null) max = values[rIndex][cIndex];
                        avg += values[rIndex][cIndex];
                    }
                }

                // Calculate avg 
                if(rLen > 0 ){
                    avg /= rLen;
                } else{
                    avg = null;
                }

                // Calculate std
                if( rLen > 1){
                    for(var rIndex = 0 ; rIndex < row_ids.length; rIndex++ ){
                        if( values[rIndex][cIndex] !== null ){
                            std += (values[rIndex][cIndex] - avg)*(values[rIndex][cIndex] - avg);
                        }
                    }
                    std = Math.sqrt(std/(rLen-1));
                } else{
                    std = null;
                }


                tableData.push(
                    {
                        'id': col_ids[cIndex],
                        'min': min === null? ' ' : min.toFixed(2),
                        'max': max === null? ' ' : max.toFixed(2),
                        'avg': avg === null? ' ' : avg.toFixed(2),
                        'std': std === null? ' ' : std.toFixed(2),
                        'missed':missed
                    }
                );
            }
            return tableData;
        },

        buildGenesTableData: function(){
            var self = this;

            var featureId2Features = self.buildFeatureId2FeatureHash();
            var row_ids = self.expressionMatrix.data.row_ids;
            var col_ids = self.expressionMatrix.data.col_ids;

            var values = self.expressionMatrix.data.values;
            var tableData = [];

            for(var rIndex = 0; rIndex < row_ids.length; rIndex++){

                var cLen = 0;
                var min = values[rIndex][0];
                var max = values[rIndex][0];
                var avg = 0;
                var std = 0;
                var missed = 0;

                // Calculate min, max, missed, sum
                for(var cIndex = 0 ; cIndex < col_ids.length; cIndex++ ){

                    if(values[rIndex][cIndex] === null){
                        missed++;
                    } else{
                        cLen++;
                        if(values[rIndex][cIndex] < min || min === null) min = values[rIndex][cIndex];
                        if(values[rIndex][cIndex] > max || max === null) max = values[rIndex][cIndex];
                        avg += values[rIndex][cIndex];
                    }
                }

                // Calculate avg 
                if(cLen > 0 ){
                    avg /= cLen;
                } else{
                    avg = null;
                }

                // Calculate std
                if( cLen > 1){
                    for(var cIndex = 0 ; cIndex < col_ids.length; cIndex++ ){
                        if( values[rIndex][cIndex] !== null ){
                            std += (values[rIndex][cIndex] - avg)*(values[rIndex][cIndex] - avg);
                        }
                    }
                    std = Math.sqrt(std/(cLen-1));
                } else{
                    std = null;
                }


                featureId = row_ids[rIndex];
                tableData.push(
                    {
                        'id': row_ids[rIndex],
                        'function' : featureId2Features[featureId]['function'],
                        'min': min === null? ' ' : min.toFixed(2),
                        'max': max === null? ' ' : max.toFixed(2),
                        'avg': avg === null? ' ' : avg.toFixed(2),
                        'std': std === null? ' ' : std.toFixed(2),
                        'missed':missed
                    }
                );
            }
            return tableData;
        },

        buildFeatureId2FeatureHash: function(){
            var self = this;
            var features = self.features;
            var id2features = {};
            for(var i in features){
                id2features[features[i].id] = features[i];
            }
            return id2features;
        },

        makeRow: function(name, value) {
            var $row = $("<tr/>")
                       .append($("<th />").css('width','20%').append(name))
                       .append($("<td />").append(value));
            return $row;
        },

        getData: function() {
            return {
                type: 'ExpressionMatrix',
                id: this.options.expressionMatrixID,
                workspace: this.options.workspaceID,
                title: 'Expression Matrix'
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