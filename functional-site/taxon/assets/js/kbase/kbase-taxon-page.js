(function($) {

	var loggedIn = false;

	// Info Window for clicking on a marker in the metagenome map.
	// There's just one of these that gets updated - clicking on a new marker closes
	// the old info window.
	var infoWindow = null;

	var taxId = "kb|taxon.7";
	var maxDescChars = 1500;

	// structure {
	// 	TaxonomyID taxonomy_id;  /* including version; e.g., kb|taxon.123.1 */
	// 	TaxonomyID parent; /* phylogenetic */
	// 	string common_name;
	// 	list<string> other_names; /* optional */
	// 	int ncbi_taxid; /* optional */
	// 	int genetic_code; //enum type
	// 	TaxonomyID predecessor; /* prior version, if any.  How do we know which is latest? */
	// 	boolean is_active;
	// } Taxonomy; /* or should we call this “strain” */

	// var taxon = {
	// 	taxonomy_id : taxId,
	// 	parent : "kb|taxon.0",
	// 	common_name : "Bacillus subtilis subsp. subtilis 168",
	// 	other_names : ["Vibrio subtilis", "Bacillus globigii"],
	// 	ncbi_taxid : 224308,
	// 	genetic_code : 11,
	// 	predecessor : "",
	// 	is_active : true
	// };

	var taxUrl = "http://140.221.85.80:7081";
	var wikiScraperURL = "http://140.221.85.80:7051"; //http://140.221.84.230:7047";
	var taxClient = new Taxonomy(taxUrl);
	var wikiScraper = new WikiScraper(wikiScraperURL);

	var currentUrl = location.protocol + "//" + location.host + location.pathname;

    // $('#fizzlefazzle').login(
    //     {
    //         style : (button|slim|micro|hidden) // try 'em all out! button is the default.
    //         loginURL : the URL we're logging into
    //         login_callback : a function to be called upon login, success or failure. Gets an args hash  (user_id, kbase_sessionid)
    //         logout_callback : a function to be called upon logout, gets no args
    //         prior_login_callback : a function to be called upon loading a page, if the user was already logged in. Gets an args hash (user_id, kbase_sessionid)
    //         user_id : a string with which to pre-populate the user_id on the forms.
    //     }
    // );



	$(function() {
		$("#signin").kbaseLogin({ 
									style: "text",

									login_callback: function(args) {
										taxClient = new Taxonomy(taxUrl, args.kbase_sessionid);
										loggedIn = true;
									},

									logout_callback: function(args) {
										taxClient = new Taxonomy(taxUrl);
										// flag as not logged in.
										loggedIn = false;

									},

									prior_login_callback: function(args) {
										taxClient = new Taxonomy(taxUrl, args.kbase_sessionid);
										loggedIn = true;
									}

								});

		taxId = getTaxonIdFromUrl();
		taxClient.get_taxon(taxId, populateTaxonomy);
	});

	var getTaxonIdFromUrl = function() {
		var id = location.href.match(/id\=(kb\|taxon\.\d+)/);
		if (!id || id.length != 2) {
			window.alert("No valid taxon id found! Loading an example:\nkb|taxon.7");
			return "kb|taxon.7";
		}
		else
			return id[1];
	};

	var populateDescription = function(taxon, lineage) {
		/* Algorithm:
		 * Go up the lineage chain.
		 * Start by trying to fetch the last one.
		 * If that fails, try to fetch the previous one.
		 * ...and so on until the end, or until something is hit.
		 */
		var terms = {
//			"endpoint" : "live.dbpedia.org"
		};

		var descFooter = function(wikiUri) {
			return "<p>[<a href=\"" + wikiUri + "\" target=\"_new\">more at Wikipedia</a>]</p>";
		}

		var notFoundHeader = function(term) {
			var underscoredName = taxon.common_name.replace(/\s+/g, "_");
			var str = "<p><b><i>" +
					  taxon.common_name +
					  "</i> not found. You can start a new page for this taxon on <a href=\"http://en.wikipedia.org/wiki/" + 
					  underscoredName + 
					  "\" target=\"_new\">Wikipedia</a>.</b></p>";
			if (term) {
				str += "<p><b>Showing description for <i>" +
					   term +
					   "</i></b></p>";
			}
			return str;
		}

		var printDescription = function(str) {
			fillDataBox("description-box", "Description", str);
		}

		var wikiScraperSuccess = function(desc) {
			/* cases.
			 * 1. we have a non-null description
			 *    a. the search name = the taxon name. --> print as normal.
			 *    b. the search name != the taxon name. --> print with caveat.
			 * 2. we have a null description
			 *    a. there are lineage points remaining. --> search the next one up. 
			 *    b. there are no lineage points remaining. --> print an error message.
			 */

			// We have a non-null description
			if (desc.hasOwnProperty('description') && desc.description != null) {
				// chomp desc.description to be < maxDescChars

				if (desc.description.length > 1500) {
					desc.description = desc.description.substr(0, 1500);
					var lastBlank = desc.description.lastIndexOf(" ");
					desc.description = desc.description.substr(0, lastBlank) + "...";
				}

				var descStr = "<p style='text-align:justify;'>" + desc.description + "</p>"

				if (desc.term === taxon.common_name || taxon.common_name === desc.redirect_from) {
					printDescription(descStr + descFooter(desc.wiki_uri));
				}
				else {
					printDescription(notFoundHeader(desc.term) + descStr + descFooter(desc.wiki_uri));
				}
			}

			// We have a null description
			else {
				printDescription(notFoundHeader(false));
			}
		};

		// reverse the term list for first-hit scraping
		var termList = [];
		for (var i=0; i<lineage.length; i++) {
			termList.unshift(lineage[i].common_name);
		}

		wikiScraper.scrape_first_hit(termList, terms, wikiScraperSuccess, function(error) { console.log("wiki scraper error!\n"); console.log(error); });
	};

	var populateTaxonomy = function(taxon) {

		var ncbiUrl = function() {
			return "<a href=\"http://www.ncbi.nlm.nih.gov/Taxonomy/Browser/wwwtax.cgi?mode=Info&id=" + 
				   taxon.ncbi_taxid + 
				   "&lvl=3&lin=f&keep=1&srchmode=1&unlock\" target=\"_new\">" + 
				   taxon.ncbi_taxid +
				   "</a>";
		};


		/******* NAME AND ID FIELDS ******/
		var str = "<div class='row'>" +
				  	"<div class='span6'>" +
				  		"<h2 style:'color: #000;'>" + taxon.common_name + "</h2>" +
				  	"</div>" + 
				  	"<div class='span2 offset3 pull-right'>" +
				  		"KBase ID: " + taxon.taxon_id + "<br/>" +
				  		"NCBI ID: " + (taxon.ncbi_taxid != null ? ncbiUrl() : "Not found") + 
				  	"</div>" +
				  "</div>";

		$(".taxon-header").html(str);


		/********** SYNONYMS ***********/
		synonymStr = "No synonyms found.";
		if (taxon.other_names.length > 0)
			synonymStr = taxon.other_names.join("<br>");
		fillDataBox("synonym-box", "Synonyms", synonymStr);

		/*********** VERSION STUFF ***********/
		taxClient.get_taxon_versioning(taxon.taxonomy_id, function(version) {
			fillDataBox("version-box", "Version", "Version " + version + "<br><a href=''>Version History</a>");
		});
		

		/********** PROPERTIES ************/
		taxClient.get_taxon_properties(taxon.taxon_id, function(props) {
			if (props.length === 0) {
				fillDataBox("property-box", "Properties", "No properties found");
				return;
			}

			fillDataBox("property-box", "Properties", "<div id='property-table'/>");

			var propRows = [];
			for (var i in props) {
				propRows.push({
					'Property' : props[i][0],
					'Value' : props[i][1]
				});
			}
			$("#property-table").kbaseTable({
				structure : {
					header : [
						{ 'value' : 'Property', 'sortable' : 'true' },
						{ 'value' : 'Value', 'sortable' : 'true' }
					],
					rows : propRows
				}
			});

			$("#property-box .box-body > table").addClass("table table-striped table-bordered");
		});

		/********* LINEAGE TABLE *********/
		taxClient.get_taxon_lineage(taxon.taxon_id, function(lineage) {
			var lineageLink = function(t) {
				var link = "<a href=\"" + currentUrl + "?id=" + t.taxon_id + "\">" + t.common_name + "</a>";
				return link;
			};

			var str = "";
			for (var i=0; i<lineage.length-1; i++) {
				str += lineageLink(lineage[i]) + "<br>";
			}
			str += "<b>" + taxon.common_name + "</b>";
			fillDataBox("lineage-box", "Taxonomic Lineage", str);

			/******** DESCRIPTION *********/
			populateDescription(taxon, lineage);
		});

		
		/********** ENVIRONMENT MAP ***********/		
		taxClient.get_taxon_environment_locations(taxon.taxon_id, function(environments) {
			var envHeader = "Metagenome Environments (" + environments.location_list.length + ")";
			fillDataBox("environment-box", envHeader, "");
			initializeMetagenomeMap([environments]);
		});
		
		/********* LOCALIZED SPECIES TREE **********/
		// need some kind of tree widget. kinda out of scope for now.
		fillDataBox("spp-tree-box", "Species Tree", "Not implemented yet.");

		/********** NEARBY TAXA WITH DATA ************/
		// need an arbitrary, paintable (small) tree widget. also out of scope for now.
		fillDataBox("nearby-taxa-box", "Related Nearby Taxa", "Not implemented yet.");

		/********** VARIANTS *************/
		fillDataBox("variants-box", "Variants", "<div id='variants-widget'/>");
		taxClient.get_taxon_variants(taxon.taxon_id, populateVariantsWidget, function(error) { console.log(error); });

		/************ GENOME STUFF ***************/
		fillDataBox("genome-box", "Genomes");
		populateGenomesBox();
		
		
		fillDataBox("taxon-data-box", "Taxon associated data", "Not implemented yet! Needs a way to align taxa with data.");
		fillDataBox("models-box", "Models", "Not implemented yet! Needs a way to search through workspaces.");

	};

	var fillDataBox = function(boxId, headerStr, boxInner) {
		$("#" + boxId).addClass('tbox');

		$("#" + boxId).html(
			$("<div/>", {
				class: 'box-header',
				html: headerStr
			})
		);
		
		$("#" + boxId).append(
			$("<div/>", {
				class: 'box-body',
				html: boxInner
			})
		);
	};

	var initializeMetagenomeMap = function(environments) {
		var myLatlng = new google.maps.LatLng(0, 0);
		var colors = ["red", "orange", "yellow", "green", "blue", "grey", "white", "brown", "purple"];

		$('#environment-box .box-body').addClass('map-container');

        var mapOptions = {
          zoom: 1,
          center: myLatlng,
          mapTypeId: google.maps.MapTypeId.ROADMAP
        }

        var map = new google.maps.Map($('#environment-box .box-body').get(0), mapOptions);

        for (var i in environments) {
        	for (var j in environments[i].location_list) {
        		var contentString = environments[i].taxon_id + 
        							"<p>" + 
        							environments[i].location_list[j].description + 
        							"<p>(" +
        							environments[i].location_list[j].geolocation[1] +
        							", " +
        							environments[i].location_list[j].geolocation[0] +
        							")";
				var markerParams = {
	        		position: new google.maps.LatLng(environments[i].location_list[j].geolocation[1],
	        										 environments[i].location_list[j].geolocation[0]),
	        		map: map,
	        		title: environments[i].taxon_id + "\n" + environments[i].location_list[j].description,
	        		icon: {
	        				path: google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
				            fillOpacity: 1,
				            strokeWeight: 0.5,
				            strokeColor: "black",
				            scale: 4,
				            fillColor: colors[(i % colors.length)]
				    },
	        	};

	        	addMarker(map, markerParams, contentString);
	        }
        }
	};

	var addMarker = function(map, options, message) {
		var marker = new google.maps.Marker(options);

		google.maps.event.addListener(marker, 'click', function() {
			if (infoWindow) {
				infoWindow.close();
			}
			infoWindow = new google.maps.InfoWindow({
				content: message
			});
			infoWindow.open(map, marker);
		});

	};

	var populateVariantsWidget = function(variantList) {
		// The variants structure is pretty flat.
		// Just a variant name and entry for each one, right?
		// Well, for now, at least.
		if (variantList.length === 0) {
			$('#variants-widget').html("No variants found");
			return;
		}

		var variants = {};
		variantList.forEach(function(v) {
			if (!variants.hasOwnProperty(v[1]))
				variants[v[1]] = [];
			variants[v[1]].push("<a href=\"" + currentUrl + "?id=" + v[0] + "\">" + v[0] + "</a>");
		});

		for (v in variants) {
			if (variants.hasOwnProperty(v)) {
				var newName = v + " (" + variants[v].length + ")";
				variants[newName] = variants[v];
				delete variants[v];
			}
		}

		$('#variants-widget').kbaseTreeView(variants);

// 		var testObj = {
// 			'top1' : ['file1', 
// 					  'file2', 
// 					  {
// 						'mid1' : ['file3', 'file4', 'file5']
// 					  },
// 					  'file6',
// 					  {
// 					  	'mid2' : [
// 					  		'file 7',
// 					  		{'deep1' : [{
// 					  			'deep2' : ['file8', 'file9']
// 					  		}]},
// 					  		'fileN'
// 					  		]
// 					  },
// 					  'file-LAST!'
// 					  ]
// 		};
// 		$('#variants-widget').kbaseTreeView(testObj);
	};

	var populateGenomesBox = function() {
		var $favoritesTable = $("<div></div>");
		$favoritesTable.kbaseTable({
						 			structure : {
						 				header : [
						 					{ 'value' : ' '},
						 					{ 'value' : 'ID', 'sortable' : 'true' },
						 					{ 'value' : 'Owner', 'sortable' : 'true' },
						 					{ 'value' : 'Name', 'sortable' : 'true' }
						 				],
						 				rows : [
						 					{
						 						' ' : 'X',
						 						'ID' : 'kb|g.234',
						 						'Owner' : 'KBase Central Store',
						 						'Name' : 'Bacillus subtilis 16B'
						 					},
						 					{
						 						' ' : 'X',
						 						'ID' : 'kb|g.82720',
						 						'Owner' : 'wjriehl',
						 						'Name' : 'Bill\'s B. subtilis annotation'
						 					}
						 				]
						 			}
						 		});
		$favoritesTable.addClass("table table-striped")

		var $favorites = $("<div></div>")
						 .append("<b>Favorites</b>")
						 .append($favoritesTable);




		var $popularTable = $("<div></div>");
		$popularTable.kbaseTable({
						 			structure : {
						 				header : [
						 					{ 'value' : ' '},
						 					{ 'value' : 'ID', 'sortable' : 'true' },
						 					{ 'value' : 'Owner', 'sortable' : 'true' },
						 					{ 'value' : 'Name', 'sortable' : 'true' }
						 				],
						 				rows : [
						 					{
						 						' ' : 'O',
						 						'ID' : 'kb|g.71648',
						 						'Owner' : 'mprice',
						 						'Name' : 'Best B. subtilis 16B'
						 					},
						 					{
						 						' ' : 'O',
						 						'ID' : 'kb|g.4387',
						 						'Owner' : 'mprice',
						 						'Name' : 'Velvet B. subtilis 16B'
						 					}
						 				]
						 			}
						 		});
		$popularTable.addClass("table table-striped")

		var $popular = $("<div></div>")
						 .append("<b>Most Popular</b>")
						 .append($popularTable);

		var $genomeTree = $("<div></div>");

		var dummyData = {
			'Assembly (2)' : [
				{ 'kb|assy.73827 (Phrap, NCBI, published)' : [] },
				{ 'kb|assy.5436 (Velvet, JGI, published)' : [
					{ 'Datasets (7)' : [ 'Dataset 1', 'Dataset 2', 'Dataset 3', 'Dataset 4', 'Dataset 5', 'Dataset 6', 'Dataset 7' ] },
					{ 'Structural Annotations (3)' : [
						{ 'kb|anno.328 (RAST v1.3, private)' : [] },
						{ 'kb|anno.93 (RAST v2.8, published)' : [
							{ 'Datasets (3)' : [ 'Dataset 8', 'Dataset 9', 'Dataset 10' ] },
							{ 'Functional Annotations (1)' : [ 'kb|g.84671 (RAST v2.8, public)' ] }
						]},
						{ 'kb|anno.23429 (mprice, 2013, <b>Shared with me</b>)' : [] }
					]}
				]}
			]
		};

		$genomeTree.kbaseTreeView(dummyData);

		var $genomes = $("<div><b>Available Genomes</div>")
					   .append($genomeTree.addClass("tbox box-body"));

		$("#genome-box .box-body").append($favorites)
								  .append($popular)
								  .append($genomes);


	};

})(jQuery);