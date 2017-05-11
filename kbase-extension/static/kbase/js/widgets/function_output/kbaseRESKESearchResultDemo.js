 define (
	[
		'kbwidget',
		'bootstrap',
		'jquery',
		'narrativeConfig',        
		'kbaseAuthenticatedWidget',
        'kbase-generic-client-api'        
	], function(
		KBWidget,
		bootstrap,
		$,
        Config,
		kbaseAuthenticatedWidget,
        GenericClient
	) {
    var loadingImage = Config.get('loading_gif');
        
    return KBWidget({
        name: 'kbaseRESKESearchResultDemo',
        parent : kbaseAuthenticatedWidget,
        version: '1.0.0',

        options: {
            query: null
        },

        searchEngineURL: "https://ci.kbase.us/services/relationengine/",
        // searchEngineURL: "http://192.168.99.100:29999/",
        srvVersion:"",
        genericClient: null,

        PAGE_SIZE: 20,
        searchText: "",
        searchObjectType: "",
        $container: null,
        $searchTypesResultPane: null,
        $searchObjectsResultPane: null,

        listTypesInput:{
            object_type:"data_type, but it is optional"
        },


        escapeSymbols: {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;',
            '/': '&#x2F;',
            '`': '&#x60;',
            '=': '&#x3D;',
            '\n': ' ',
            '\r': ''
        },

        // examples...
        listTypesOutput:{
            "types": {
                "Genome":{
                    type_name: "Genome",
                    type_ui_title: "Genome",
                    keys: [{key_name:"key1", key_ui_title: "title1", key_value_type:"value_type"}],
                },
                "Feature":{
                    type_name: "Feature",
                    type_ui_title: "Feature",
                    keys: [{key_name:"key1", key_ui_title: "title1", key_value_type:"value_type"}],
                },
                "Domain":{
                    type_name: "Domain",
                    type_ui_title: "Domain",
                    keys: [{key_name:"key1", key_ui_title: "title1", key_value_type:"value_type"}],
                }
            }
        },
        searchTypesInput:{
            match_filter:{
                full_text_in_all: "text",
                access_group_id: 123,
                object_name: "name",
                parent_guid: 234234,
                timestamp: {},
                lookupInKeys: {}
            },
            access_filter:{}
        },

        searchTypesOutput:{
            type_to_count: {
                "Genome": 140,
                "Feature": 120,
                "Domain": 10,
            },
            search_time: 123
        },

        searchObjectsInput:{
            object_type: "object type",
            match_filter: {
                full_text_in_all: "text",
                access_group_id: 123,
                object_name: "name",
                parent_guid: 234234,
                timestamp: {},
                lookupInKeys: {}
            },
            sorting_rules: [],
            access_filter: {},
            pagination: {
                start: 0,
                count: 0    
            },
            post_processing:{
                ids_only: false,
                skip_info: false,
                skip_keys: false,
                skip_data: false,
                data_includes: [] 
            }
        },
        searchObjectsOutput: {
            pagination :{
                start: 21,
                count: 40        
            },
            sorting_rules: [],
            objects: [
                {
                    guid:"234.432",
                    parent_guid:"",
                    object_name: "crp ",
                    timestamp: 1341834148,
                    parent_data: {},
                    data : {},
                    key_props: {"key1":"prop1", "key2":"prop2"}
                },
                {
                    guid:"234.536",
                    parent_guid:"5455323.3454",
                    object_name: "lexA",
                    timestamp: 1341834148,
                    parent_data: {},
                    data : {},
                    key_props: {"key1":"prop1", "key2":"prop2"}
                }
            ],
            total: 100,
            search_time: 1234
        },


        init: function(options) {
            this._super(options);
            this.pref = this.uuid();

            // Create a message pane
            this.$messagePane = $("<div/>")
                .addClass("kbwidget-message-pane kbwidget-hide-message")
                .appendTo(this.$elem);

            return this;
        },


        buildKBaseSearchPanel: function(){
            var self = this;
            var $panel = $(
                `
                <div class="container" style="margin-top:70px; margin-bottom:70px">
                <div class="row align-items-center">
                    <div class="col col-sm-2">
                    </div>
                    <div class="col col-sm-6">
                        <div class="input-group input-group-sm">
                            <span class="input-group-addon" id="sizing-addon1">KBase</span>
                            <input id="searchTypesImput" type="text" class="form-control" placeholder="search term" aria-describedby="sizing-addon1">
                            <span class="input-group-btn">
                                <button id="searchTypesBtn" class="btn btn-default" type="button">Go!</button>
                            </span>  
                        </div>                
                    </div>
                    <div class="col col-sm-4">
                    </div>
                </div>
                </div>
                <hr>
                `
            );

            self.$container.append($panel);

            var query = self.options.query;
            if( query != null && query.length > 0){
                $('#searchTypesImput').val(query);
            }

            $('#searchTypesBtn')
            .on('click', function (e) {
                self.onSearchTypesClick();
            });

            $('#searchTypesImput').keyup(function(e){
                if(e.keyCode == 13)
                {
                    self.onSearchTypesClick();
                }
            });

        },

        onSearchTypesClick: function(){
            var self = this;            
            self.searchText = $("#searchTypesImput").val().trim();

            if( self.$searchObjectsResultPane != null){
                self.$searchObjectsResultPane.remove();
                self.$searchObjectsResultPane = null;                
            }

            if( self.$searchTypesResultPane != null){
                self.$searchTypesResultPane.remove();
                self.$searchTypesResultPane = null;                
            }

            self.searchTypesInput = {
                match_filter:{
                },
                access_filter:{
                    with_private: 1
                }
            };

            if(self.searchText.length != 0 ){
                self.searchTypesInput.match_filter['full_text_in_all'] = self.searchText;
            }

            self.genericClient.sync_call("KBaseRelationEngine.search_types",
                    [self.searchTypesInput], function(data){
                    self.searchTypesOutput = data[0];
                    self.buildSearchTypesResultPane(self.searchTypesOutput);
                },
                function(error){
                    // self.clientError(error);
                });
        },


        buildSearchTypesResultPane: function(searchTypesOutput){
            var self = this;
            self.$searchTypesResultPane = $(
                `
                <div class="container" style="margin-top:70px; margin-bottom:70px">
                <div class="row align-items-center">
                    <div class="col col-sm-2">
                    </div>
                    <div class="col col-sm-6">
                        <div style="text-align: center;">
                            <span style="color: red;">-- Search time: ${searchTypesOutput.search_time} ms --</span>
                        </div>
                        <ul  id="searchTypeRestulsListGroup" class="list-group-bg">
                        </ul>      
                    </div>
                    <div class="col col-sm-4">
                    </div>
                </div>
                </div>  
                <hr>        
                `
            );
            self.$container.append(self.$searchTypesResultPane);

            var $searchTypeRestulsListGroup = $("#searchTypeRestulsListGroup");

            var types2counts = searchTypesOutput.type_to_count;
            Object.keys(types2counts).forEach(function (dtype) { 
                var count = types2counts[dtype]
                $searchTypeRestulsListGroup.append(
                    $(
                        `
                            <li class="list-group-item search_type_results">
                                <span class="badge">${count}</span>
                                <a  href="#">${dtype}</a>
                            </li>
                        `
                    )
                );
            });
            $('.search_type_results a').click(function(evt) {
                self.searchObjectType = evt.target.text;
                self.onSelectTypeResultClick(evt.target.text,{
                    start: 0,
                    count: self.PAGE_SIZE    
                });
            });

        },

        onSelectTypeResultClick: function(dType, pagination){
            var self = this;

            if( self.$searchObjectsResultPane != null){
                self.$searchObjectsResultPane.remove();
                self.$searchObjectsResultPane = null;                
            }

            self.searchObjectsInput = {
                object_type: dType,
                match_filter: {
                },
                access_filter:{
                    with_private: 1
                },
                pagination: pagination
            };

            if(self.searchText.length != 0 ){
                self.searchObjectsInput.match_filter['full_text_in_all'] = self.searchText;
            }

            console.log("searchObjectsInput: ",  self.searchObjectsInput);
            self.genericClient.sync_call("KBaseRelationEngine.search_objects",
                    [self.searchObjectsInput], function(data){
                    self.searchObjectsOutput = data[0];
                    self.buildSearchObjectsResultPane(self.searchObjectsOutput);
                },
                function(error){
                    // self.clientError(error);
                });
        },

        buildPagenator: function($container, searchObjectsOutput){
            var self = this;
            var start  = searchObjectsOutput.pagination.start + 1;
            var count = searchObjectsOutput.objects.length;
            var end = searchObjectsOutput.pagination.start + 1 + count - 1;
            var total = searchObjectsOutput.total;
            var pageIndex = Math.floor((end-1)/self.PAGE_SIZE) + 1;
            var pageTotal = Math.floor((total-1)/self.PAGE_SIZE) + 1;

            var firstClass = (start > 1) ? "enabled" : "disabled";
            var prevClass = (start > 1) ? "enabled" : "disabled";

            // TODO problem with elasticsearch scroll            
            var nextClass = (end < total && end < 10000 - self.PAGE_SIZE) ? "enabled" : "disabled";
            var lastClass = (end < total && end < 10000 - self.PAGE_SIZE) ? "enabled" : "disabled";


            $container.append(
                 $(
            `                
                <div class="row align-items-center" style="margin-top:30px">
                    <div class="col col-sm-1"></div>
                    <div class="col col-sm-11">                
                        <ul class="pagination">
                            <li id="firstItem" class="${firstClass}"><a href="#">&lt;&lt; First</a> </li>
                            <li id="prevItem" class="${prevClass}"><a href="#">&lt; Prev</a> </li>
                            <li class="disabled">  <span>Page ${pageIndex} of ${pageTotal}</span></li>
                            <li id="nextItem" class="${nextClass}"><a href="#">Next &gt;</a> </li>
                            <li id="lastItem" class="${lastClass}"><a href="#">Last &gt;&gt;</a> </li>
                        </ul>
                    </div>
                </div>
            `));


            $("#firstItem").click(function(e){
                self.onSelectTypeResultClick(self.searchObjectType, {
                    start: 0,
                    count: self.PAGE_SIZE
                });
            });

            $("#prevItem").click(function(e){
                var newStart = searchObjectsOutput.pagination.start - self.PAGE_SIZE;
                if(newStart < 0) newStart = 0;
                self.onSelectTypeResultClick(self.searchObjectType, {
                    start: newStart,
                    count: self.PAGE_SIZE
                });
            });


            $("#nextItem").click(function(e){
                var newStart = searchObjectsOutput.pagination.start + searchObjectsOutput.pagination.count;
                self.onSelectTypeResultClick(self.searchObjectType, {
                    start:newStart,
                    count: self.PAGE_SIZE
                });
            });

            $("#lastItem").click(function(e){
                var newStart = Math.floor( searchObjectsOutput.total/self.PAGE_SIZE )*self.PAGE_SIZE;    

                // TODO problem with elasticsearch scroll                
                if(newStart > 10000 - self.PAGE_SIZE){
                    newStart = 10000 - self.PAGE_SIZE;
                }
                self.onSelectTypeResultClick(self.searchObjectType, {
                    start:newStart,
                    count: self.PAGE_SIZE
                });
            });
        },

        buildSearchObjectsResultPane: function(searchObjectsOutput){
            var self = this;
            var dtype = self.searchObjectType;
            var start  = searchObjectsOutput.pagination.start + 1;
            var count = searchObjectsOutput.objects.length;
            var end = searchObjectsOutput.pagination.start + 1 + count - 1;
            var total = searchObjectsOutput.total;

            self.$searchObjectsResultPane = $(
            `
                <div class="panel panel-default" style="margin-top:20px;">
                    <div class="panel-heading">...</div>
                    <div id="searchResultPanel" class="panel-body" >

                        <div style="text-align: center;">
                            <span style="color: red;">-- Search time: ${searchObjectsOutput.search_time} ms --</span>
                        </div>
                    
                        <div class="row" style="margin-bottom:30px">
                            <div class="col col-sm-1"></div>
                            <div class="col col-sm-11">                            
                                <h2>Search Results: ${dtype}</h2>
                                <pre>Items: ${start} to ${end} of ${total}</pre>
                            </div>                            
                        </row>

                    </div>
                </div>
            `);   


            self.$container.append(self.$searchObjectsResultPane);
            var $searchResultPanel = $("#searchResultPanel");

            $.each( searchObjectsOutput.objects, function(i, value){
                $searchResultPanel.append($(
                    `
                      <div class="row" style="margin-top:30px;">
                        <div class="col col-sm-1">
                        </div>
                        <div class="col col-sm-1">
                            <b>${ (i+start) }. </b>
                        </div>
                        <div id="row${i}" class="col col-sm-8" style="background-color:#EEFFEE;">
                            <b>GUID:</b> ${value.guid} <br>
                            <b>object_name:</b> ${value.object_name} <br>
                        </div>
                        <div class="col col-sm-3">
                        </div>
                      </div>
                    `
                ));
                var $row = $(`#row${i}`);
                Object.keys(value.key_props).forEach(function (key) {
                    var val = self.escapeHtml(value.key_props[key]);
                    if(val.length > 100){
                        val = val.substring(0,100) + "...";
                    }
                    $row.append($(` <b>${key}:</b> ${val}  <br> `));
                 });


            });
            $searchResultPanel.append($('<hr>'));
            self.buildPagenator($searchResultPanel, searchObjectsOutput);


            var $searchTypeRestulsListGroup = $("#searchTypeRestulsListGroup");
        },


        loggedInCallback: function(event, auth) {

            this.genericClient = new GenericClient(this.searchEngineURL, auth, null, false);
            this.render();
            return this;
        },

        render: function(){
            var self = this;
            var $container = $("<div/>");
            self.$elem.append( $container );
            self.$container = $container;

            self.loading(false);
            self.buildKBaseSearchPanel();
        },

        loading: function(isLoading) {
            if (isLoading)
                this.showMessage("<img src='" + loadingImage + "'/>");
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

        escapeHtml:  function(string) {
            var self = this;
            return String(string).replace(/[&<>"'`=\/]/g, function (s) {
                return self.escapeSymbols[s];
            });
        }        
    });
});

