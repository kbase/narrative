var cdmi_url = "http://kbase.us/services/cdmi_api/";
var login_url = "https://kbase.us/services/authorization/Sessions/Login/";
var workspace_url = "https://kbase.us/services/workspace_service/";
// fba_url = "https://bio-data-1.mcs.anl.gov/services/fbaModelServices"
var fba_url = "https://kbase.us/services/fba_model_services";
//var search_api_url = "https://niya.qb3.berkeley.edu/services/search?";
var search_api_url = "https://kbase.us/services/search?";

var genome_landing_page = "http://140.221.84.217/genome_info/showGenome.html?id=";
var feature_landing_page = "http://140.221.84.217/feature_info/feature.html?id=";

var cdmi_api = new CDMI_API(cdmi_url);
var cdmi_entity_api = new CDMI_EntityAPI(cdmi_url);
var workspace_service = new workspaceService(workspace_url);
var fba_service = new fbaModelServices(fba_url);

var numPageLinks = 10;

var selectedCategory = null;
var searchOptions;

var defaultSearchOptions = {"general": {"itemsPerPage": 25},
                            "perCategory": {}
                           };

var searchCategories = [];
var categoryGroups = {};
var categoryInfo = {};
var categoryCounts = {};
var numCounts = 0;
var token;
var selectedWorkspace;
var expandedView = false;

function GetUrlValue(VarSearch){
    var SearchString = window.location.search.substring(1);
    var VariableArray = SearchString.split('&');
    for(var i = 0; i < VariableArray.length; i++){
        var KeyValuePair = VariableArray[i].split('=');
        if(KeyValuePair[0] == VarSearch){
            return KeyValuePair[1];
        }
    }
}


$(window).load(function() {
    $("#searchspan").hide();

    var sentQuery = GetUrlValue('q');
    if(sentQuery != "") {
        $("#searchTextInput").val(sentQuery);
        startSearch(sentQuery);
    }

    //beginning of stuff copied from users.js

    // Function that sets a cookie compatible with the current narrative
    // (it expects to find user_id and token in the cookie)
    var set_cookie = function() {
        var c = $("#login-widget").kbaseLogin('get_kbase_cookie');
        console.log( 'Setting kbase_session cookie');
        $.cookie('kbase_session',
                 'un=' + c.user_id
                 + '|'
                 + 'kbase_sessionid=' + c.kbase_sessionid
                 + '|'
                 + 'user_id=' + c.user_id
                 + '|'
                 + 'token=' + c.token.replace(/=/g, 'EQUALSSIGN').replace(/\|/g,'PIPESIGN'),
                 { path: '/',
                   domain: 'kbase.us' });
    };




    $(function() {
      /*  $(document).on('loggedIn.kbase', function(event, token) {
            console.debug("logged in")
            loadPage();
        });

        */

        initToken();
        $(document).on('loggedOut.kbase', function() { delete searchOptions["general"]["token"]; });
        $(document).on('loggedIn.kbase', function() {
            searchOptions["general"]["token"] = $("#login-widget").kbaseLogin("session", "token");
        });

        var loginWidget = $("#login-widget").kbaseLogin({ 
            style: "narrative",
            rePrompt: false,

            login_callback: function(args) {
        set_cookie();
                loadPage();
            },

            logout_callback: function(args) {
                $.removeCookie( 'kbase_session');
            },

            prior_login_callback: function(args) {
        set_cookie();
                loadPage();
            },
        });


        $("#signinbtn").click(function() {

            showLoading();
            $("#login_error").hide();

            loginWidget.login(

                $('#kbase_username').val(),
                $('#kbase_password').val(), 
                function(args) {
                    console.log(args);
                    if (args.success === 1) {
                        
                        this.registerLogin(args);
                    set_cookie();
                    loadPage();
                        doneLoading();
                            $("#login-widget").show();
                        } else {
                            $("#loading-indicator").hide();
                    $("#login_error").html(args.message);
                    $("#login_error").show();
                        }
                }
            );
        });

        $('#kbase_password').keypress(function(e){
            if(e.which == 13){//Enter key pressed
                $('#signinbtn').click();
            }
        });


    });



    function loadPage() {

        var userName = $("#login-widget").kbaseLogin("get_kbase_cookie", "name");

        if (!userName)
            userName = "KBase User";
        $("#kb_name").html(userName);


    };
    //end of stuff copied from users.js


    $('.dropdown-toggle').dropdown();

    $("#searchTextInput").on("keypress", function (evt) {
        if (evt.keyCode === 13) {
            var input = $.trim($('#searchTextInput')[0].value);
            
            if (input !== null && input !== '') {
                startSearch(input);
            }
        }
    });
    
    
    loadCategories();
        
    $('#toggle-expanded').find('input').change(function (event){
        if ($(this).attr('id') === 'compact') {
            $(".typedRecord-expanded").addClass("hidden");
        }
        else {
            $(".typedRecord-expanded").removeClass("hidden");
        }
    
        expandedView = !expandedView;
    });    
});


function initToken() {
    searchOptions = defaultSearchOptions;

    try {
        searchOptions["general"]["token"] = $("#login-widget").kbaseLogin("session", "token");
        
        if (searchOptions["general"]["token"] === undefined) {
            delete searchOptions["general"]["token"];            
        } 
    }
    catch (e) {
        delete searchOptions["general"]["token"];
    }
}


function loadCategories() {
    var search_api_url = "";
    var queryOptions = {};

    $.getJSON("/static/js/categoryInfo_publicOnly.json", function (data) {
        categoryInfo = data;    
        
        for (var p in categoryInfo.structure) {
            if (categoryInfo.structure.hasOwnProperty(p)) {
                flattenCategories(categoryInfo.structure[p]);
                
                if (p === "unauthenticated" || (p === "authenticated" && searchOptions.general.hasOwnProperty("token"))) {
                    loadPreselectCategories(categoryInfo.structure[p], 0);
                }                
            }
        }                  
    });
    
}


function loadPreselectCategories(resource, indent) {
    if (resource.hasOwnProperty("category")) {
        if (indent === 1) {
            var styleString = "style='margin-left: " + (indent * 10) + "px;";            
            $("#category-preselect").append("<li><a onclick='preselectCategory(\"" + resource.category + "\",\"" + resource.label + "\")'>" + resource.label + "</a></li>");
        }
        else {
            var styleString = "style='margin-left: " + (indent * 10) + "px; font-size: 12px;'";
            $("#category-preselect").append("<li><a " + styleString + "onclick='preselectCategory(\"" + resource.category + "\",\"" + resource.label + "\")'>" + resource.label + "</a></li>");        
        }
            
        if (resource.hasOwnProperty("children")) {
            for (var i = 0; i < resource.children.length; i++) {
                loadPreselectCategories(resource.children[i], indent+1);
            }    
        }
    }
    else if (resource.hasOwnProperty("children")) {
        $("#category-preselect").append("<li><strong>" + resource.label + "</strong></li>");        

        for (var i = 0; i < resource.children.length; i++) {
            loadPreselectCategories(resource.children[i], indent+1);
        }    
    }
}


function flattenCategories(resource) {
    if (resource.hasOwnProperty("category")) {
        searchCategories.push(resource.category);
                        
        if (resource.hasOwnProperty("children")) {
            for (var i = 0; i < resource.children.length; i++) {
                flattenCategories(resource.children[i]);
            }    
        }
    }
    else if (resource.hasOwnProperty("children")) {
        for (var i = 0; i < resource.children.length; i++) {
            flattenCategories(resource.children[i]);
        }    
    }
}


function startSearch(queryString) {
    if (queryString === null || queryString === '') {
        return;
    }

    searchOptions = defaultSearchOptions;

    try {
        searchOptions["general"]["token"] = $("#login-widget").kbaseLogin("session", "token");
    }
    catch (e) {
        delete searchOptions["general"]["token"];
    }

    //selectedCategory = null;
    
    searchOptions["general"]['q'] = queryString;

    $("#categories").empty();
    $("#page-links").empty();
    $("#result-set-list").empty();

    getResults(selectedCategory, searchOptions);
}


function selectWorkspace(workspace_id) {
    selectedWorkspace = workspace_id;
}


function addAllGenomes() {
    if (selectedWorkspace === null || selectedWorkspace === undefined) {
        console.log("select a workspace first");
        return;
    }

    var genomes = {};

    $('.typedRecord').each(function () {
        if ($(this).find('input').prop('checked') === true) {
            var value = $(this).find('#gid')[0].innerText;
            
            if (!genomes.hasOwnProperty(value)) {
                genomes[value] = value;
            } 
        } 
    });
    
    for (var prop in genomes) {
        if (genomes.hasOwnProperty(prop)) {
            pushGenomeToWorkspace(genomes[prop], selectedWorkspace, searchOptions.general.token);
        }
    }
}


function pushGenomeToWorkspace(genome_id, workspace_id, token) {
    function success(result) {
        console.log("genome import success of " + genome_id + " to " + workspace_id);
        console.log(result);
    }
    
    function error(result) {
        console.log("genome import failed of " + genome_id + " to " + workspace_id);
        console.log(result);
    }

    fba_service.genome_to_workspace({"genome": genome_id, "workspace": workspace_id, "auth": token, "overwrite": true}, success, error);
}



function setResultsPerPage(category, value) {
    //calculate new starting page
    var itemsPerPage = parseInt(value);
    var page = parseInt(searchOptions["perCategory"][category]['page']);
    var startItem = (page - 1) * searchOptions["general"]['itemsPerPage'];
    
    searchOptions["general"]['itemsPerPage'] = value;    
    searchOptions["perCategory"][category]['page'] = Math.floor(startItem/itemsPerPage) + 1;
    
    getResults(category, searchOptions);
}


function setSortType(category, value) {
    searchOptions["perCategory"][category]['sortType'] = value;
    getResults(category, searchOptions);
}


function preselectCategory(category, label) {
    //update the button text
    $("#category-button").html(label + "<span class='caret'/>");

    // perform the category selection
    selectCategory(category);
}


function selectCategory(value) {
    selectedCategory = value;
    
    var lastCategory = $(".selected-category-link");    
    var children = $(lastCategory.attr("data-target"));
    
    if (lastCategory.attr("data-target") !== undefined && children.length > 0) { 
        // selected either the same category, a child, a parent, or a sibling
        if ((lastCategory.attr("id") === value) ||
            (lastCategory.attr("data-parent") === $("#" + value).attr("data-parent")) ||
            (lastCategory.attr("data-parent") === $("#" + value)) ||
            (("#" + lastCategory.attr("id")) === $("#" + value).attr("data-parent"))) {
            //console.log("last choice had children, selected same group");
            $("." + value + "-children").collapse('show');                
        }
        else {
            //console.log("last choice had children, selected different group");
            $("." + $(".selected-category-link")[0].attributes["id"].value + "-children").collapse('hide');
            $("." + value + "-children").collapse('show');
        }
    }
    else {
        // selected either the same category, a child, a parent, or a sibling
        if ((lastCategory.attr("id") === value) ||
            (lastCategory.attr("data-parent") === $("#" + value).attr("data-parent")) ||
            (lastCategory.attr("data-parent") === ("#" + value)) ||
            (("#" + lastCategory.attr("id")) === $("#" + value).attr("data-parent"))) {
            //console.log("last choice was an isolate, selected same group");
            $("." + value + "-children").collapse('show');                
        }
        else {
            //console.log("last choice was an isolate, selected different group");
            $($(lastCategory.attr("data-parent")).attr("data-target")).collapse('hide');
            $("." + value + "-children").collapse('show');        
        }
    }
    
    $(".selected-category-link").removeClass("selected-category-link");
    
    if (!searchOptions["perCategory"].hasOwnProperty(value)) {
        searchOptions["perCategory"][value] = {"page": 1};
    }

    $("#" + value).addClass("selected-category-link");
    
    $("#result-set-header").removeClass('hidden');
    getResults(value, searchOptions);
}


// move to a different page of results
function transitionToPageSet(category, page) {
    searchOptions["perCategory"][category]['page'] = page;
    getResults(category, searchOptions);
}


function selectAll() {
    if ($("#select-all").prop('checked') === true) {
        $("#result-set-list input").prop('checked', true);
    }
    else {
        $("#result-set-list input").prop('checked', false);    
    }
}



// all the markup for displaying a set of results for a single page
function displayResults(category, jsonResults) {
    $("#search-results").addClass("hidden");
    
    //console.log(category);
    //console.log(jsonResults);

    $("#result-set-area").addClass("hidden");    

    $("#result-position").empty();

    var currentPage = jsonResults['page'];
    var totalRecords = jsonResults['found'];
    var currentRecords = jsonResults['items'];
    var recordCount = jsonResults['itemCount'];    
    var currentRecordLocation = (currentPage - 1) * searchOptions["general"]['itemsPerPage'];
    var totalPages = Math.floor(totalRecords/searchOptions["general"]['itemsPerPage']) + 1;
    var currentPageMarker = currentPage % numPageLinks;
    var linksInserted = 0;
    
    
    if (recordCount > 0 && currentPage > 0) {        
        $("#result-position").html("Displaying results <strong>" + 
                                   (currentRecordLocation + 1) + "-" + (currentRecordLocation + recordCount) + 
                                   "</strong> out of <strong>" + totalRecords + "</strong>.");
        
        $("#result-per-page").val(searchOptions["general"]['itemsPerPage']);
        $("#result-sort-type").val(searchOptions["perCategory"][category]['sortType']);
        
        $("#result-set-list").empty();

        var resultItem = "";

        
        if ($.inArray(selectedCategory, categoryInfo.groupings.genomes) > -1) {
	        var ws_landing_page = "";

            $("#result-set-list").append("<thead><tr><th><label class='checkbox'><input type='checkbox' id='select-all' onchange='selectAll()'></input></label></th>" +
                                         "<th><span style='min-width:80px'><strong>Select all</strong></span></th>" + 
                                         "<th><strong>Data Type</strong></th>" + 
					                     "<th><strong>Genome Species</strong></th>" + 
					                     "<th><strong>Identifier</strong></th>" +
                                         "<th><strong>Length</strong></th>" + 
					                     "<th><strong>Contigs</strong></th>" + 
					                     "<th><strong>Coding Sequences</strong></th>" +
                                         "<th><strong>RNAs</strong></th>" + 
                                         "</tr></thead>");        

            $("#result-set-list").append("<tbody>");
                                                     
            for (var i = 0; i < recordCount; i++) {
                resultItem = "<tr class='typedRecord'>" +
		                     "<td><label class='checkbox' id='" + currentRecords[i]['gid'] + "'><input type='checkbox'></input></label></td>" + 
                             "<td><span class='space-right'>" + (currentRecordLocation + i + 1) + ".</span></td>" +
                             "<td><span class='label label-success space-right'><a style='color:white' target='_blank' href='" + genome_landing_page + currentRecords[i]['gid'] + "'>genome</a></span></td>" + 
                             "<td><span><a class='space-right' target='_blank' href='" + genome_landing_page + currentRecords[i]['gid'] + "'>" +
                             "<strong><em>" + currentRecords[i]['scientific_name'] + "</em></strong>" +
                             "</a></span></td>" +  
                             "<td><span id='gid' class='space-right'>" + currentRecords[i]['gid'] + "</span></td>" +  
                             "<td><span class='space-right'>" + currentRecords[i]['dna_size'] + " bp </span></td>" + 
                             "<td><span>" + currentRecords[i]['contigs'] + "</span></td>" +
                             "<td><span>" + currentRecords[i]['pegs'] + "</span></td>" +
                             "<td><span>" + currentRecords[i]['rnas'] + "</span></td>" +
                             "</tr>" +
		                     "<tr class='typedRecord-expanded'>" +
		                     "<td colspan=3></td>" + 
		                     "<td colspan=5><span>" + currentRecords[i]['taxonomy'] + "</span></td>" +
                             "</tr>";
                             
                             if (selectedCategory.indexOf("WS") === 0) {
                                 resultItem += "<tr class='typedRecord-expanded'>" +
                                               "<td colspan=3></td>" +
                                               "<td colspan=5><span>WS: <a target='_blank' href='" + ws_landing_page + currentRecords[i]['workspace_id'] + "'>" + currentRecords[i]['workspace_id'] + "</a></span></td>" +
                                               "</tr>";
		                     }
                $("#result-set-list").append(resultItem);                                                    
            }        
            $("#result-set-list").append("</tbody>");            
        }
        else if ($.inArray(selectedCategory, categoryInfo.groupings.features) > -1) {
	        var ws_landing_page = "";

            $("#result-set-list").append("<tr>" +
                                         "<th><label class='checkbox'><input type='checkbox' id='select-all' onchange='selectAll()'></input></label></th>" +
                                         "<th><span style='min-width:80px'><strong>Select all</strong></span></th>" + 
                                         "<th><div><strong>Data Type<strong></div></th>" +
                                         "<th><div><strong>Feature Type<strong></div></th>" +
                                         "<th><div><strong>Function<strong></div></th>" +
                                         "<th><div><strong>Identifier<strong></div></th>" +
                                         "<th><div><strong>Length<strong></div></th>" +
                                         "<th><div><strong>Genome Species<strong></div></th>" +
                                         "</tr>");        

            for (var i = 0; i < recordCount; i++) {
                resultItem = "<tr class='typedRecord'>" +
		                     "<td><label class='checkbox' id='" + currentRecords[i]['gid'] + "'><input type='checkbox'></input></label></td>" + 
                             "<td><span class='space-right'>" + (currentRecordLocation + i + 1) + ".</span></td>" +
                             "<td><span class='label label-success space-right'><a style='color:white' target='_blank' href='" + feature_landing_page + currentRecords[i]['fid'] + "'>feature</a></span></td>" + 
                             "<td><span>" + currentRecords[i]['feature_type'] + "</span></td>" +                           
                             "<td><span><a class='space-right' target='_blank' href='" + feature_landing_page + currentRecords[i]['fid'] + "'>" +
                             "<strong>" + currentRecords[i]['function'] + "</strong>" +
                             "</a></span></td>" +                           
                             "<td><span class='space-right'>" + currentRecords[i]['fid'] + "</span></td>" +                           
                             "<td><span class='nowrap'>" + currentRecords[i]['sequence_length'] + "bp</span></td>" +
                             "<td><span><a class='nowrap space-right' target='_blank' href='" + genome_landing_page + currentRecords[i]['gid'] + "'>" +
                             "<strong><em>" + currentRecords[i]['scientific_name'] + "</em></strong>" +
                             "</a></span></td>" +  
                             "</tr>";
                             
                             if (selectedCategory.indexOf("WS") !== 0) {
                                 if (currentRecords[i].hasOwnProperty('external_id')) {              
                                     resultItem += "<tr class='typedRecord-expanded'>" +
                                                   "<td colspan=3></td>" +
                                                   "<td colspan=5><span>" + currentRecords[i]['alias'] + " " + currentRecords[i]['external_id'] + "</span></td>" +
                                                   "</tr>";
                                 }
                                               
                                 if (currentRecords[i].hasOwnProperty('domain_display_descriptions')) {              
                                     resultItem += "<tr class='typedRecord-expanded'>" +
                                                   "<td colspan=3></td>" +
                                                   "<td colspan=5><span>" + currentRecords[i]['domain_display_descriptions'].replace(/!##!/g,",") + "</span></td>" +
                                                   "</tr>";
                                 }
                                 if (currentRecords[i].hasOwnProperty('interpro_display_descriptions')) {              
                                     resultItem += "<tr class='typedRecord-expanded'>" +
                                                   "<td colspan=3></td>" +
                                                   "<td colspan=5><span>" + currentRecords[i]['interpro_display_descriptions'].replace(/!##!/g,",") + "</span></td>" +
                                                   "</tr>";
                                 }
                             }

                             if (selectedCategory.indexOf("WS") === 0) {
                                 resultItem += "<tr class='typedRecord-expanded'>" +
                                               "<td colspan=3></td>" +
                                               "<td colspan=5><span>WS: <a target='_blank' href='" + ws_landing_page + currentRecords[i]['workspace_id'] + "'>" + currentRecords[i]['workspace_id'] + "</a></span></td>" +
                                               "</tr>";
		                     }
                $("#result-set-list").append(resultItem);                                 
            }                
        }
        else if ($.inArray(selectedCategory, categoryInfo.groupings.metagenomes) > -1) {
            var metagenome_landing_page = "";
        
            $("#result-set-list").append("<tr>" +
	    			                     "<th><span></span></th>" +
	    			                     "<th><span></span></th>" +
	                                     "<th><strong>Data Type</strong></th>" + 
	    			                     "<th><strong>MG Name</strong></th>" + 
	    			                     "<th><strong>MG Id</strong></th>" +
	                                     "<th><strong>Sequence Type</strong></th>" + 
	    			                     "<th><strong>Sequencing Method</strong></th>" + 
	                                     "</tr>");        
                                         
            for (var i = 0; i < recordCount; i++) {
                resultItem = "<tr class='typedRecord-expanded'>" +
		                     //"<td><label class='checkbox' id='" + currentRecords[i]['gid'] + "'><input type='checkbox'></input></label></td>" + 
		                     "<td colspan=2><span></span></td>" +
                             "<td colspan=7><span>Project: <a class='space-right' target='_blank' href='" + metagenome_landing_page + currentRecords[i]['project_id'] + "'>" +
                             "<strong><em>" + currentRecords[i]['mixs_project'] + "</em></strong>" +
                             "</a></span></td>" +  
		                     "</tr>" +
		                     "<tr class='typedRecord'>" +
		                     "<td><span></span></td>" +
                             "<td><span class='space-right'>" + (currentRecordLocation + i + 1) + ".</span></td>" +
                             "<td><span class='label label-success space-right'><a style='color:white' target='_blank' href='" + metagenome_landing_page + currentRecords[i]['mg_id'] + "'>metagenome</a></span></td>" + 
                             "<td><span><a class='space-right' target='_blank' href='" + metagenome_landing_page + currentRecords[i]['mg_id'] + "'>" +
                             "<strong><em>" + currentRecords[i]['mg_name'] + "</em></strong>" +
                             "</a></span></td>" +  
		                     "<td><span>" + currentRecords[i]['mg_id'] + "</span></td>" +
		                     "<td><span>" + currentRecords[i]['mixs_sequence_type'] + "</span></td>" +
		                     "<td><span>" + currentRecords[i]['mixs_sequence_method'] + "</span></td>" +
		                     "</tr>" +
		                     "<tr class='typedRecord-expanded'>" +
		                     "<td colspan=3></td>" + 
		                     "<td colspan=4><span>Sample: " + currentRecords[i]['metadata_sample_name'] + " (" + currentRecords[i]['sample_id'] + ")</span></td>" +
		                     "</tr>" +
		                     "<tr class='typedRecord-expanded'>" +
		                     "<td colspan=3></td>" + 
		                     "<td colspan=4><span>Biome: " + currentRecords[i]['mixs_biome'] + " (" + currentRecords[i]['mixs_feature'] + ")</span></td>" +
		                     "</tr>" +
		                     "<tr class='typedRecord-expanded'>" +
		                     "<td colspan=3></td>" + 
		                     "<td colspan=4><span>Location: <a class='space-right' target='_blank' href='http://maps.google.com/?ll=" + currentRecords[i]['mixs_latitude'] + "," + currentRecords[i]['mixs_longitude'] + "'>(" + currentRecords[i]['mixs_latitude'] + "," + currentRecords[i]['mixs_longitude'] + ")</a> (lat,lon) " + currentRecords[i]['mixs_location'] + "</span></td>" +
		                     "</tr>";
                $("#result-set-list").append(resultItem);                                                    
            }        
        }
        else if (selectedCategory === "WSModels") {
            var model_landing_page = "";
	        var ws_landing_page = "";
        
            $("#result-set-list").append("<tr>" +
	    			                     "<th><span></span></th>" +
	    			                     "<th><span></span></th>" +
	                                     "<th><strong>Data Type</strong></th>" + 
	    			                     "<th><strong>Model Type</strong></th>" + 
	    			                     "<th><strong>Model Name</strong></th>" +
	                                     "<th><strong>Model Identifier</strong></th>" + 
	    			                     "<th><strong>Genome Identifier</strong></th>" + 
	    			                     "<th><strong>Genome Name</strong></th>" + 
	                                     "</tr>");        
                                         
            for (var i = 0; i < recordCount; i++) {
                resultItem = "<tr class='typedRecord'>" +
		                     "<td><label class='checkbox' id='" + currentRecords[i]['gid'] + "'><input type='checkbox'></input></label></td>" + 
		                     "<td><span></span></td>" +
                             "<td><span class='space-right'>" + (currentRecordLocation + i + 1) + ".</span></td>" +
                             "<td><span class='label label-success space-right'><a style='color:white' target='_blank' href='" + model_landing_page + currentRecords[i]['model_id_uniq'] + "'>model</a></span></td>" + 
		                     "<td><span>" + currentRecords[i]['model_type'] + "</span></td>" +
                             "<td><span><a class='space-right' target='_blank' href='" + model_landing_page + currentRecords[i]['model_id_uniq'] + "'>" +
                             "<strong><em>" + currentRecords[i]['model_name'] + "</em></strong>" +
                             "</a></span></td>" +  
		                     "<td colspan=3><span>" + currentRecords[i]['model_id'] + "</span></td>" +
		                     "</tr>";
		                     /*
		                     "<tr class='typedRecord-expanded'>" +
		                     "<td colspan=3></td>" + 
		                     "<td colspan=5><span>" + currentRecords[i]['reaction_name'] + " : " + currentRecords[i]['reaction_definition'] + "</span></td>" +
		                     "</tr>" +
		                     "<tr class='typedRecord-expanded'>" +
		                     "<td colspan=3></td>" + 
		                     "<td colspan=5><span>" + currentRecords[i]['reaction_features'] + "</span></td>" +
		                     "</tr>";
		                     */
		                     
                             if (selectedCategory.indexOf("WS") === 0) {
                                 resultItem += "<tr class='typedRecord-expanded'>" +
                                               "<td colspan=3></td>" +
                                               "<td colspan=5><span>WS: <a target='_blank' href='" + ws_landing_page + currentRecords[i]['workspace_id'] + "'>" + currentRecords[i]['workspace_id'] + "</a></span></td>" +
                                               "</tr>";
		                     }
                $("#result-set-list").append(resultItem);                                                    
            }        
        }
        else if (selectedCategory === "WSMedia") {
            var media_landing_page = "";
	        var ws_landing_page = "";
        
            $("#result-set-list").append("<thead><tr>" +
	    			                     "<th><span></span></th>" +
	    			                     "<th><span></span></th>" +
	                                     "<th><strong>Data Type</strong></th>" + 
	    			                     "<th><strong>Media Name</strong></th>" + 
	    			                     "<th><strong>Temp</strong></th>" +
	                                     "<th><strong>pH</strong></th>" + 
	                                     "</tr></thead>");        
                                         
            $("#result-set-list").append("<tbody>");
            
            for (var i = 0; i < recordCount; i++) {
                resultItem = "<tr class='typedRecord'>" +
                             "<td><span class='space-right'>" + (currentRecordLocation + i + 1) + ".</span></td>" +
                             "<td><span class='label label-success space-right'><a style='color:white' target='_blank' href='" + media_landing_page + currentRecords[i]['media_id'] + "'>media</a></span></td>" + 
                             "<td><span><a class='space-right' target='_blank' href='" + media_landing_page + currentRecords[i]['media_id'] + "'>" +
                             "<strong><em>" + currentRecords[i]['media_name'] + "</em></strong>" +
                             "</a></span></td>" +  
		                     "<td><span>T= " + currentRecords[i]['temperature'] + " C</span></td>" +
		                     "<td><span>pH= " + currentRecords[i]['ph'] + " C</span></td>" +
		                     "</tr>" +
		                     "<tr class='typedRecord-expanded'>" +
		                     "<td></td>" + 
		                     "<td><span> [" + currentRecords[i]['compound_name'] + "] = " + currentRecords[i]['compound_concentration'] + "</span></td>" +
		                     "</tr>" +
		                     "<tr class='typedRecord-expanded'>" +
		                     "<td></td>" + 
		                     "<td><span>flux: " + currentRecords[i]['compound_min_flux'] + " <= " + currentRecords[i]['compound_name'] + " <= " + currentRecords[i]['compound_max_flux'] + "</span></td>" +
		                     "<tr class='typedRecord-expanded'>" +
		                     "<td></td>" + 
		                     "<td><span>WS: <a target='_blank' href='" + ws_landing_page + currentRecords[i]['workspace_id'] + "'>" + currentRecords[i]['workspace_id'] + "</a></span></td>" +
		                     "</tr>";
                $("#result-set-list").append(resultItem);                                                    
            }        
            $("#result-set-list").append("</tbody>");
        }
        else if (selectedCategory === "WSFBAs") {
        }
        else if (selectedCategory === "WSPhenotypes") {
        }
        else if (selectedCategory === "WSPhenotypeSets") {
        }
        else if (selectedCategory === "CSPublications") {
            $("#result-set-list").append("<thead><tr>" + 
                                         "<th><span></span></th>" +
                                         "<th><span></span></th>" +
                                         "<th class='nowrap'><button class='btn btn-default btn-sm' onclick='changeSort()'><strong>Pubmed Id</strong><span class='glyphicon glyphicon-sort space-left'></span></button></th>" + 
                                         "<th class='nowrap'><button class='btn btn-default btn-sm' onclick='changeSort()'><strong>Pub Date</strong><span class='glyphicon glyphicon-sort space-left'></span></button></th>" + 
                                         "<th class='nowrap'><button class='btn btn-default btn-sm' onclick='changeSort()'><strong>Article Title</strong><span class='glyphicon glyphicon-sort space-left'></span></button></th>" + 
                                         "</tr></thead>");        

            $("#result-set-list").append("<tbody>");

            for (var i = 0; i < recordCount; i++) {
                resultItem = "<tr class='typedRecord' onmouseover=''>" +
		                     "<td><span class='space-right'>" + (currentRecordLocation + i + 1) + ".</span></td>" +
                             "<td><span class='label label-success space-right'><a style='color:white' target='_blank' href='" + currentRecords[i]['pubmed_url'] + "'>publication</a></span></td>" + 
                             "<td><span class='nowrap'>" + currentRecords[i]['pubmed_id'] + "</span></td>" + 
                             "<td><span class='nowrap space-right'>" + currentRecords[i]['pubdate'] + "</span></td>" + 
                             "<td><span><em>" + currentRecords[i]['article_title'] + "</em></span></td>" + 
                             "</tr>" +
                             "<tr class='typedRecord-expanded'>" +
                             "<td colspan=4><span></span></td>" +
                             "<td><span>" + currentRecords[i]['authors'] + "</span></td>" + 
                             "</tr>" +
		                     "<tr class='typedRecord-expanded'>" +
		                     "<td colspan=4><span></span></td>" +
		                     "<td><span>" + currentRecords[i]['journal_title'] + "</span></td>" + 
                             "</tr>";                                                                 
                $("#result-set-list").append(resultItem);
            } 

            $("#result-set-list").append("</tbody>");
        }
        else {
            console.log("Unknown Type");
            console.log(selectedCategory);        
        }        
         
        // determine whether to show the expanded data view or not   
        if (!expandedView) {
            $(".typedRecord-expanded").addClass("hidden");
        }
        
        // set the pagination controls
        $("#page-links").empty();
        
        // if we are on page numPageLinks, we need to make sure the position is not 0
        if (currentPageMarker === 0) {
            currentPageMarker = numPageLinks;
        }
         
        // check to see if we should present a link to the last page of the previous page set       
        if (currentPage > 1 && currentPage > numPageLinks) {
            $("#page-links").append("<li><a onclick='transitionToPageSet(\"" + (selectedCategory) + "\"," + (currentPage - currentPageMarker) + ")'><</a></li>");            
        }
        
        // insert links for all the pages up to the current page in this page set
        for (var p = currentPage - currentPageMarker + 1; p < currentPage; p++, linksInserted++) {
            $("#page-links").append("<li><a onclick='transitionToPageSet(\"" + (selectedCategory) + "\"," + p + ")'>" +  p + "</a></li>");            
        }                 

        // insert the link for the current page and highlight it as the active page              
        $("#page-links").append("<li class='active'><a onclick='transitionToPageSet(\"" + (selectedCategory) + "\"," + currentPage + ")'>" + currentPage + "</a></li>");            
        linksInserted++;

        // make sure that we have results for all the remaining page links  
        if (totalPages > currentPage + (numPageLinks - linksInserted)) { 
            // insert the links for the default size page set
            for (var p = currentPage + 1; p < currentPage + (numPageLinks - linksInserted) + 1; p++) {
                $("#page-links").append("<li><a onclick='transitionToPageSet(\"" + (selectedCategory) + "\"," + p + ")'>" +  p + "</a></li>");            
            }                 
            // insert the link to the next set of pages
            $("#page-links").append("<li><a onclick='transitionToPageSet(\"" + (selectedCategory) + "\"," + (currentPage + (numPageLinks - linksInserted) + 1) + ")'>></a></li>");            
        }
        else {
            // insert the links for the actual remaining page set                
            for (var p = currentPage + 1; p < totalPages + 1; p++) {
                $("#page-links").append("<li><a onclick='transitionToPageSet(\"" + (selectedCategory) + "\"," + p + ")'>" + p + "</a></li>");            
            }
        }                                  
    }
    else {
        $("#result-position").html("No results found.");        
    }
        
    $("#result-set-area").removeClass("hidden");        
    $("#search-results").removeClass("hidden");    
}


function displayCategories() {
    $("#filters").addClass("hidden");
    $("#categories").empty();
    
    for (var p in categoryInfo.structure) {
        if (categoryInfo.structure.hasOwnProperty(p)) {
            if (p === "authenticated") {
                $("#categories").append("<div class='row accordion-group'><a data-toggle='collapse' data-target='." + p + "-children' id='" + p + "' class='collapse in category-link btn btn-link' style='text-align:left;font-size:18px;'><strong>" + categoryInfo.structure[p].label  + "</strong></a>");                            
            }
            else {
                $("#categories").append("<div class='row'><a data-toggle='collapse' data-target='." + p + "-children' id='" + p + "' class='collapse in category-link btn btn-link' style='text-align:left;font-size:18px;'><strong>" + categoryInfo.structure[p].label  + "</strong></a>");                            
            }
            
            for (var i = 0; i < categoryInfo.structure[p].children.length; i++) {
                //$("#categories").append("<div class='row'><h1><a data-toggle='collapse' id='" + categoryInfo.structure[p].children[i].label + "' class='category-link btn btn-link' style='padding-left:10px;font-size:18px;'>" + categoryInfo.structure[p].children[i].label  + "</a></h1></div>");    
                showLeftCategories(p,p,categoryInfo.structure[p].children[i],1);
            }            
            
            $("#categories").append("</div>");
        }
    }
    $("#filters").removeClass("hidden");
}


function showLeftCategories(ancestor, parent, categoryObject, nestingLevel) {
    var hasChildren = categoryObject.hasOwnProperty("children");

    // If a link is needed to display a category for this item, then decorate a new link
    if (categoryObject.hasOwnProperty("category")) {
        var linkType = "category-link";    
        var fontSize = "14px";
        
        // decrease the font size for inner categories
        if (nestingLevel > 1) {
            fontSize = "12px";
        }
        
        // highlight the active link
        if (categoryObject.category === selectedCategory) {
            linkType = "selected-category-link";
        }    
    
        var styleString = "style='font-size: " + fontSize + ";padding-left: "  + (10 + nestingLevel*10) + "px'";

        // don't display empty matches
        if (categoryCounts[categoryObject.category] === 0) {
            return;
        }

        $("#categories").append("<div class='row'>" + 
                                "<a id='" + categoryObject.category + "' data-toggle='collapse' data-parent='#" + parent + "' data-target='." + categoryObject.category + "-children' class='collapse " + parent + "-children " + linkType + " btn btn-link' " + styleString + 
                                " onclick='selectCategory(\"" + categoryObject.category + "\")'>" + categoryObject.label + "   (" + categoryCounts[categoryObject.category] + ")</a>" + 
                                "</div>");

        $("#" + categoryObject.category).on("hide.bs.collapse", function() {
            $("." + categoryObject.category + "-children").collapse('hide');
        });

    }    

    // recurse for each child of this item
    if (hasChildren === true) {
        for (var i = 0; i < categoryObject.children.length; i++) {
            showLeftCategories(ancestor, categoryObject.category, categoryObject.children[i], nestingLevel + 1);    
        }
    }    
}


/*
function displayCount(category) {
    $("#count-" + category).empty().append(categoryCounts[category]);    
}
*/


function getCount(options, category) {
    var queryOptions = {};

    for (var prop in options) {
        if (options.hasOwnProperty(prop)) {
            queryOptions[prop] = options[prop];
        }        
    }
    queryOptions["page"] = 1;
    queryOptions["itemsPerPage"] = 0;
    queryOptions["category"] = category;

    jQuery.ajax({
        type: 'GET',
        contentType: 'application/json',
        url: search_api_url + "callback=?",
        data: queryOptions,      
        dataType: 'jsonp',
        success: function success (jsonResult) {
            if (typeof jsonResult !== 'undefined') {
                categoryCounts[category] = jsonResult['found'];
            }
            else {
                categoryCounts[category] = 0;
            }
            
            displayCategories();
        },
        error: function (errorObject) {
            categoryCounts[category] = 0;
            numCounts += 1;
            
            displayCategories();
        }
    });
}


function getResults(category, options) {
    //console.log(category);
    //console.log(options);

    if (category === null) {
        var queryOptions = {'q': options["general"]['q']};

        try {
            options["general"]["token"].substr(0,20);//?
            queryOptions["token"] = options["general"]["token"];
        }
        catch (e) {            
            //console.log(e);
        }

        numCounts = 0;
        for (var i = 0; i < searchCategories.length; i++) {
            if (searchCategories[i].indexOf("WS") !== 0 || (searchCategories[i].indexOf("WS") === 0 && queryOptions.hasOwnProperty("token") && queryOptions.token !== null)) {
                getCount(queryOptions, searchCategories[i]);
            }
            else {
                categoryCounts[category] = 0;
            }
        }

        return;
    }

    var queryOptions = {};

    queryOptions["category"] = selectedCategory;
    for (var prop in options) {        
        if (prop === "general") {
            for (var gen_prop in options["general"]) {
                if (options["general"].hasOwnProperty(gen_prop)) {
                    queryOptions[gen_prop] = options["general"][gen_prop];
                }
            }
            
            if (!queryOptions.hasOwnProperty("token")) {
                queryOptions["token"] = "";
            }
        }        
        else if (prop === "perCategory") {
            for (var cat_prop in options["perCategory"][selectedCategory]) {
                if (options["perCategory"][selectedCategory].hasOwnProperty(cat_prop)) {
                    queryOptions[cat_prop] = options["perCategory"][selectedCategory][cat_prop];
                }
            }
        }    
    }
    console.log(queryOptions);
    
    jQuery.ajax({
        type: 'GET',
        contentType: 'application/json',    
        url: search_api_url + "callback=?",
        data: queryOptions,      
        dataType: 'jsonp',
        success: function success(jsonResult) {
            return typeof jsonResult === 'undefined' ? false : displayResults(category, jsonResult);
        },
        error: function(errorObject) {
            console.log(errorObject);
        }
    });        

}


function listWorkspaces() {
    try {
		workspace_service.list_workspaces({"auth": searchOptions.general.token}, 
			function (ws_list) { 
				var workspace_list = ws_list; 
				var navString = "";
				var writableWorkspaces = [];
			
				workspace_list = workspace_list.sort(function (a,b) {
					if (a[0].toLowerCase() < b[0].toLowerCase()) return -1;
					if (a[0].toLowerCase() > b[0].toLowerCase()) return 1;
					return 0;
				});
			
				$("#workspace-area").empty();
			
				navString += "<ul id='workspace-list' class='nav nav-pills nav-stacked scroll-menu' style='max-height:120px;'>";
				
				var username = searchOptions.general.token.substr(searchOptions.general.token.indexOf('un=')+3,searchOptions.general.token.indexOf('|')-3);
				for(var i = 0; i < workspace_list.length; i++) {
					// do not show workspaces that you cannot write to
					if (workspace_list[i][4] != "w" && workspace_list[i][4] != "a" && workspace_list[i][5] != "w" && workspace_list[i][5] != "a") {
						continue;
					}
				
				    if (workspace_list[i][1] !== username) {
                        continue;				    
				    }
				
					writableWorkspaces.push(workspace_list[i][0]);
				
					navString += "<li><a id='nav_" + workspace_list[i][0] + "' onclick='selectWorkspace(\"" + 
								 workspace_list[i][0] + "\")'" + "><span class='badge' style='margin: 5px'>" +
								 workspace_list[i][3] + "</span><span>" + workspace_list[i][0] + "</span></a></li>";			    
				}            
				navString += "</ul>";
				$("#workspace-area").append(navString);
			}, 
			function (error) {
			    //var trace = printStackTrace();
			    console.log(trace);
				console.log(error);
				//$("#application_error").append(error);
				//$("#application_error").removeClass("hidden"); 
			}
		);	    
	}
	catch (e) {
		//var trace = printStackTrace();
		//console.log(trace);

	    if (e.message && e.name) {
		    console.log(e.name + " : " + e.message);
		    //$("#application_error").append(e.message);
		}
		else {
		    console.log(e);
		    //$("#application_error").append(e);		    
		}
		
		//$("#application_error").removeClass("hidden"); 
	}
}



