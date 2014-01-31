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
            kbCache: null,
            title: "Description",
            maxNumChars: 500,
            width: 500,
            loadingImage: null
        },

        wikiScraperURL: "http://140.221.85.43:7077",
        cdmiURL: "https://kbase.us/services/cdmi_api",

        init: function(options) {
            this._super(options);

            if (this.options.featureID === null) {
                //throw an error.
                return this;
            }
            this.$messagePane = $("<div/>")
                                .addClass("kbwidget-message-pane")
                                .addClass("kbwidget-hide-message");
            this.$elem.append(this.$messagePane);

            this.cdmiClient = new CDMI_API(this.cdmiURL);
            this.entityClient = new CDMI_EntityAPI(this.cdmiURL);
            this.wikiClient = new WikiScraper(this.wikiScraperURL);

            if (this.options.workspaceID) {
                this.renderWorkspace();
            }
            else
                this.render();
            return this;
        },

        render: function() {
            this.showMessage("<img src='" + this.options.loadingImage + "'/>");

            /*
             * A couple nested callbacks here.
             * 1. Run genomes_to_taxonomies
             * 2. Deal with the taxonomy structure and send it to scrape_first_hit
             * 3. Print out the output.
             */

            if (this.options.genomeID === null) {
                // make an error.
                this.renderError("Error: no genome identifier given!");
                return;
            }

            // step 1: get the taxonomy
            this.cdmiClient.genomes_to_taxonomies([this.options.genomeID], 
                $.proxy(function(taxonomy) {
                    taxonomy = taxonomy[this.options.genomeID];
                    this.renderFromTaxonomy(taxonomy);
                }, this),

                this.renderError
            );

            return this;
        },

        renderFromTaxonomy: function(taxonomy) {
            var searchTerms = [];
            var strainName = taxonomy.pop();
            searchTerms.push(strainName);

            var tokens = strainName.split(" ");
            if (tokens.length > 2);
            searchTerms.push(tokens[0] + " " + tokens[1]);
            searchTerms.concat(taxonomy.reverse());

            // step 2: do the wiki scraping
            this.wikiClient.scrape_first_hit(searchTerms, {endpoint: "dbpedia.org"}, 
                $.proxy(function(desc) {
                    if (desc.hasOwnProperty('description') && desc.description != null) {
                        if (desc.description.length > this.options.maxNumChars) {
                            desc.description = desc.description.substr(0, this.options.maxNumChars);
                            var lastBlank = desc.description.lastIndexOf(" ");
                            desc.description = desc.description.substr(0, lastBlank) + "...";
                        }

                        var descStr = "<p style='text-align:justify;'>" + desc.description + "</p>"

                        var descHtml;
                        if (desc.term === strainName || strainName === desc.redirect_from) {
                            descHtml = descStr + this.descFooter(desc.wiki_uri);
                        }
                        else {
                            descHtml = this.notFoundHeader(strainName, desc.term) + descStr + this.descFooter(desc.wiki_uri);
                        }

                        var imageHtml = "Unable to find an image. If you have one, you might consider <a href='" + desc.wiki_uri + "' target='_new'>adding it to Wikipedia</a>.";
                        if (desc.image_uri != null)
                            imageHtml = "<img src='" + desc.image_uri + "' />";


                        var descId = this.uid();
                        var imageId = this.uid();


                        var $contentDiv = $("<div />")
                                          .addClass("tab-content")
                                          .append($("<div />")
                                                  .attr("id", descId)
                                                  .addClass("tab-pane fade active in")
                                                  .append(descHtml)
                                          )
                                          .append($("<div />")
                                                  .attr("id", imageId)
                                                  .addClass("tab-pane fade")
                                                  .append(imageHtml)
                                          );

                        var $descTab = $("<a />")
                                         .attr("href", "#" + descId)
                                         .attr("data-toggle", "tab")
                                         .append("Description");

                        var $imageTab = $("<a />")
                                         .attr("href", "#" + imageId)
                                         .attr("data-toggle", "tab")
                                         .append("Image");

                        var $tabSet = $("<ul />")
                                      .addClass("nav nav-tabs")
                                      .append($("<li />")
                                              .addClass("active")
                                              .append($descTab)
                                             )
                                      .append($("<li />")
                                              .append($imageTab)
                                             );

                        this.hideMessage();
                        this.$elem.append($tabSet).append($contentDiv);
                    }

                }, this),

                this.renderError
            );
        },

        renderWorkspace: function() {
            this.showMessage("<img src='" + this.options.loadingImage + "'>");
            var obj = this.buildObjectIdentity(this.options.workspaceID, this.options.genomeID);
            var prom = this.options.kbCache.req('ws', 'get_objects', [obj]);

            // if it fails, error out!
            $.when(prom).fail($.proxy(function(error) {
                this.renderError(error);
            }, this));
            // if it succeeds, grab the taxonomy (or at least the scientific name) and roll out.
            $.when(prom).done($.proxy(function(genome) {
                genome = genome[0];

                var tax = genome.data.taxonomy;
                var taxList = [];
                if (!tax || tax === "Unknown") {
                    taxList.push(genome.data.scientific_name);
                }
                else {
                    // parse the taxonomy, however it's munged together. semicolons, i think?
                }
                this.renderFromTaxonomy(taxList);
            }, this));
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


        uid: function() {
            var id='';
            for(var i=0; i<32; i++)
                id += Math.floor(Math.random()*16).toString(16).toUpperCase();
            return id;
        },

        descFooter: function(wikiUri) {
            return "<p>[<a href='" + wikiUri + "'' target='_new'>more at Wikipedia</a>]</p>";
        },

        notFoundHeader: function(strainName, term) {
            var underscoredName = strainName.replace(/\s+/g, "_");
            var str = "<p><b><i>" +
                      strainName + 
                      "</i> not found. You can start a new page for this genome on <a href='http://en.wikipedia.org/wiki/" + 
                      underscoredName + 
                      "' target='_new'>Wikipedia</a>.</b></p>";
            if (term) {
                str += "<p><b>Showing description for <i>" +
                       term +
                       "</i></b></p>";
            }
            return str;
        },

        showMessage: function(message) {
            var span = $("<span/>").append(message);

            this.$messagePane.append(span);
            this.$messagePane.removeClass("kbwidget-hide-message");
        },

        hideMessage: function() {
            this.$messagePane.addClass("kbwidget-hide-message");
            this.$messagePane.empty();
        },
        
        getData: function() {
            return {
                type: "Description",
                id: this.options.genomeID,
                workspace: this.options.workspaceID,
                title: "Organism Description"
            };
        },

        clientError: function(error) {
            console.debug(error);
        },

    })
})( jQuery );