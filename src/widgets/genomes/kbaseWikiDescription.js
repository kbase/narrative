/**
 * Shows a species description taken from Wikipedia.
 * Also includes a picture, but that'll be under a tab or something.
 */
(function( $, undefined ) {
	$.KBWidget({
		name: "KBaseWikiDescription",
		parent: "kbaseWidget",
		version: "1.0.0",

		options: {
			genomeID: null,
			workspaceID: null,
			title: "Description",
			maxNumChars: 500,
			width: 500
		},

		wikiScraperURL: "http://140.221.85.80:7051",
		cdmiURL: "https://kbase.us/services/cdmi_api",
		workspaceURL: "https://kbase.us/services/workspace",

		init: function(options) {
			this._super(options);

			if (this.options.featureID === null) {
				//throw an error.
				return this;
			}

			this.cdmiClient = new CDMI_API(this.cdmiURL);
			this.entityClient = new CDMI_EntityAPI(this.cdmiURL);
			this.workspaceClient = new workspaceService(this.workspaceURL);
			this.wikiClient = new WikiScraper(this.wikiScraperURL);

			return this.render();
		},

		render: function(options) {
			var self = this;

			/*
			 * A couple nested callbacks here.
			 * 1. Run genomes_to_taxonomies
			 * 2. Deal with the taxonomy structure and send it to scrape_first_hit
			 * 3. Print out the output.
			 */

			if (this.options.genomeID === null) {
				// make an error.
				return;
			}

			// step 1: get the taxonomy
			this.cdmiClient.genomes_to_taxonomies([this.options.genomeID], 
				function(taxonomy) {
					taxonomy = taxonomy[self.options.genomeID];
					var searchTerms = [];
					var strainName = taxonomy.pop();
					searchTerms.push(strainName);

					var tokens = strainName.split(" ");
					if (tokens.length > 2);
					searchTerms.push(tokens[0] + " " + tokens[1]);
					searchTerms.concat(taxonomy.reverse());

					// step 2: do the wiki scraping
					self.wikiClient.scrape_first_hit(searchTerms, {}, 
						function(desc) {
							if (desc.hasOwnProperty('description') && desc.description != null) {
								if (desc.description.length > self.options.maxNumChars) {
									desc.description = desc.description.substr(0, self.options.maxNumChars);
									var lastBlank = desc.description.lastIndexOf(" ");
									desc.description = desc.description.substr(0, lastBlank) + "...";
								}

								var descStr = "<p style='text-align:justify;'>" + desc.description + "</p>"

								var descHtml;
								if (desc.term === strainName || strainName === desc.redirect_from) {
									descHtml = descStr + self.descFooter(desc.wiki_uri);
								}
								else {
									descHtml = self.notFoundHeader(strainName, desc.term) + descStr + self.descFooter(desc.wiki_uri);
								}

								var imageHtml = "Unable to find an image. If you have one, you might consider <a href='" + desc.wiki_uri + "'>adding it to Wikipedia</a>.";
								if (desc.image_uri != null)
									imageHtml = "<img src='" + desc.image_uri + "' />";


								var descId = self.uid();
								var imageId = self.uid();

								var $contentDiv = $("<div class='tab-content' />")
												  .append($("<div id='" + descId + "' class='tab-pane fade active in' />")
												  		  .append(descHtml)
												  )
												  .append($("<div id='" + imageId + "' class='tab-pane fade' />")
												  		  .append(imageHtml)
												  );

								var $descTab = $("<a href='#" + descId + "' data-toggle='tab'>Description</a>");

								var $imageTab = $("<a href='#" + imageId + "' data-toggle='tab'>Image</a>");

								var $tabSet = $("<ul class='nav nav-tabs' />")
											  .append($("<li class='active' />")
											  		  .append($descTab)
											  		 )
											  .append($("<li />")
											  	      .append($imageTab)
											  	     );



								self.$elem.append($tabSet).append($contentDiv);


								// self.$elem.html("<ul class='nav nav-tabs'>" +
								// 				"<li class='active'><a href='#desc' data-toggle='tab'>Description</a></li>" +
								// 				"<li><a href='#pict' data-toggle='tab'>Image</a></li>" +
								// 				"</ul>" +
								// 				"<div class='tab-content'>" +
								// 				"<div class='tab-pane fade active in' id='desc'>" +
								// 				descHtml +
								// 				"</div>" +
								// 				"<div class='tab-pane fade' id='pict'>" + 
								// 				imageHtml +
								// 				"</div>" +
								// 				"</div>");
							}

						},

						self.clientError
					);

				},

				this.clientError
			);

			return this;
		},

		uid: function() {
			var id='';
			for(var i=0; i<32; i++)
				id += Math.floor(Math.random()*16).toString(16).toUpperCase();
			return id;
		},

		descFooter: function(wikiUri) {
			return "<p>[<a href=\"" + wikiUri + "\" target=\"_new\">more at Wikipedia</a>]</p>";
		},

		notFoundHeader: function(strainName, term) {
			var underscoredName = strainName.replace(/\s+/g, "_");
			var str = "<p><b><i>" +
					  strainName + 
					  "</i> not found. You can start a new page for this genome on <a href=\"http://en.wikipedia.org/wiki/" + 
					  underscoredName + 
					  "\" target=\"_new\">Wikipedia</a>.</b></p>";
			if (term) {
				str += "<p><b>Showing description for <i>" +
					   term +
					   "</i></b></p>";
			}
			return str;
		},

		printDescription: function(str) {
			$('#wiki_desc').html(str)
		},
        
        getData: function() {
            return {
                type: "Description",
                id: this.options.genomeID,
                workspace: this.options.workspaceID
            };
        },

		clientError: function(error) {

		},

	})
})( jQuery );