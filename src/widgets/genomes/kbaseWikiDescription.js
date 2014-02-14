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
                    this.renderFromTaxonomy(taxonomy.reverse());
                }, this),

                this.renderError
            );

            return this;
        },

        /**
         * Needs to be given in reverse order. Calling function should handle
         * what are valid names. E.g.
         * ['Escherichia coli K-12', 'Escherichia coli', 'Escherichia', 'Enterobacteriaceae', 'Enterobacteriales', 'Gammaproteobacteria', ...]
         * Start with most descriptive name, proceed on down to least descriptive (usually kingdom name, if available).
         * 
         * This will try to fetch wiki content for the first valid name in that list.
         */
        renderFromTaxonomy: function(taxonomy) {
            console.debug("renderFromTaxonomy - begin");
            console.debug(taxonomy);

            var searchTerms = taxonomy;
            var strainName = taxonomy[0];

            // var tokens = strainName.split(" ");
            // if (tokens.length > 2);
            // searchTerms.push(tokens[0] + " " + tokens[1]);
            // searchTerms = searchTerms.concat(taxonomy.reverse());
            console.debug("renderFromTaxonomy - scraping");
            console.debug(searchTerms);

            // step 2: do the wiki scraping
            this.wikiClient.scrape_first_hit(searchTerms, {endpoint: "dbpedia.org"}, 
                $.proxy(function(desc) {
                    console.debug('renderFromTaxonomy-returned from wikiClient');
                    console.debug(desc);

                    if (desc.hasOwnProperty('description') && desc.description != null) {
                        if (desc.description.length > this.options.maxNumChars) {
                            desc.description = desc.description.substr(0, this.options.maxNumChars);
                            var lastBlank = desc.description.lastIndexOf(" ");
                            desc.description = desc.description.substr(0, lastBlank) + "...";
                        }

                        var descStr = "<p style='text-align:justify;'>" + desc.description + "</p>"

                        var descHtml;
                        if (strainName === desc.redirect_from) {
                            descHtml = this.redirectHeader(strainName, desc.redirect_from, desc.term) + descStr + this.descFooter(desc.wiki_url);
                        }
                        else if (desc.term === strainName) {
                            descHtml = descStr + this.descFooter(desc.wiki_uri);
                        }
                        else {
                            descHtml = this.notFoundHeader(strainName, desc.term, desc.redirect_from) + descStr + this.descFooter(desc.wiki_uri);
                        }

                        var imageHtml = "Unable to find an image. If you have one, you might consider <a href='" + desc.wiki_uri + "' target='_new'>adding it to Wikipedia</a>.";
                        if (desc.image_uri != null)
                            imageHtml = "<img src='" + desc.image_uri + "' />";
                    }
                    else {
                        descHtml = this.notFoundHeader(strainName, desc.term, desc.redirect_from) + descStr + this.descFooter(desc.wiki_uri);
                    }


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
                console.log(genome);
                genome = genome[0];

                var tax = genome.data.taxonomy;
                var taxList = [];
                var nameTokens = genome.data.scientific_name.split(/\s+/);
                for (var i=nameTokens.length; i>0; i--) {
                    taxList.push(nameTokens.slice(0, i).join(' '));
                }
                if (taxList && taxList !== "Unknown") {
                    // parse the taxonomy, however it's munged together. semicolons, i think?
                    taxList = taxList.concat(tax.split(/\;\s*/).reverse());
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

        notFoundHeader: function(strainName, term, redirectFrom) {
            var underscoredName = strainName.replace(/\s+/g, "_");
            var str = "<p><b><i>" +
                      strainName + 
                      "</i> not found. You can start a new page for this genome on <a href='http://en.wikipedia.org/wiki/" + 
                      underscoredName + 
                      "' target='_new'>Wikipedia</a>.</b></p>";
            if (term) {
                str += "<p><b>Showing description for <i>" +
                       term +
                       "</i></b>";
                if (redirectFrom) {
                    str += "<br>redirected from <i>" + redirectFrom + "</i>";
                }
                str += "</p>";
            }
            return str;
        },

        redirectHeader: function(strainName, redirectFrom, term) {
            var underscoredName = redirectFrom.replace(/\s+/g, "_");
            var str = "<p><b>" +
                      "Showing description for <i>" + term + "</i></b>" +
                      "<br>redirected from <i>" + underscoredName + "</i>" +
                      "</p>";

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