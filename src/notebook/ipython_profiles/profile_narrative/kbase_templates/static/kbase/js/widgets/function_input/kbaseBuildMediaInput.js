/**
 * An input widget to handle building a media set.
 * This has the option of loading/modifying an existing media.
 * @author Bill Riehl <wjriehl@lbl.gov>
 * @public
 */

(function( $, undefined ) {
    $.KBWidget({
        name: "kbaseBuildMediaInput", 
        parent: "kbaseNarrativeInput",
        version: "1.0.0",
        options: {
            loadingImage: "static/kbase/images/ajax-loader.gif",
            //fbaURL: "https://kbase.us/services/fba_model_services",
            fbaURL: "http://140.221.84.183:7036",
        },
        mediaType: "KBaseBiochem.Media-1.0",
        IGNORE_VERSION: false,

        init: function(options) {
            this._super(options);
            this.fbaClient = new fbaModelServices(this.options.fbaURL);
            this.trigger("workspaceQuery.Narrative", $.proxy(
                function(wsId) {
                    this.wsId = wsId;
                    this.$fetchMediaDiv = this.buildFetchMediaDiv();
                    this.$headerInputDiv = this.buildHeaderInputs();
                    this.$mediaTable = this.buildMediaTable();
                    this.addEmptyMediaRow();

                    this.$elem.append(this.$fetchMediaDiv)
                              .append(this.$headerInputDiv)
                              .append(this.$mediaTable);

                    this.refresh();

                }, this));

            return this;
        },

        /**
         * Builds controls to fetch a media set and populate the current list.
         */
        buildFetchMediaDiv: function() {
            var $fetchMediaDiv = $("<div class='form-inline'>");
            $fetchMediaDiv.append("Select an existing media to modify (optional): ");

            var $mediaList = $("<select>")
                              .addClass('form-control')
                              .css({'max-width': '80%', 'margin-right' : '10px'});

            var $fetchButton = $("<button>")
                               .attr("type", "button")
                               .attr("value", "Fetch")
                               .addClass("btn btn-primary")
                               .append("Fetch")
                               .click($.proxy(
                                    function(event) {
                                        var mediaName = this.$elem.find("div > select").val();

                                        if (!mediaName) {
                                            this.fetchMediaError({
                                                status: -1,
                                                error: {
                                                    code: -1,
                                                    error: "Unable to fetch media - no name given",
                                                    message: "Unable to fetch media - no name given",
                                                    name: "NoMediaError",
                                                },
                                            });
                                            return;
                                        }
                                        if (!this.wsId) {
                                            this.fetchMediaError({
                                                status: -2,
                                                error: {
                                                    code: -2,
                                                    error: "Unable to fetch media - no workspace ID given",
                                                    message: "Unable to fetch media - no workspace ID given",
                                                    name: "NoWsIdError",
                                                }
                                            });
                                            return;
                                        }

                                        $fetchMediaDiv.find("img").show();
                                        $fetchMediaDiv.find("button.btn-danger").hide();
                                        this.fbaClient.get_media({
                                                auth: this.authToken(),
                                                medias: [mediaName],
                                                workspaces: [this.wsId],
                                            },
                                            $.proxy(function(media) { 
                                                this.updateMediaTable(media);
                                                $fetchMediaDiv.find("img").hide();

                                            }, this),
                                            $.proxy(function(error) {
                                                this.fetchMediaError(error);
                                                $fetchMediaDiv.find("img").hide();
                                            }, this)
                                        );
                                    },
                                    this));

            this.$errorPanel = $("<div>")
                               .css({
                                   "margin" : "20px 0",
                                   "padding" : "20px",
                                   "border-left" : "3px solid #d9534f",
                                   "background-color" : "#fdf7f7",
                               })
                               .append($("<p>")
                                       .addClass("text-danger")
                                       .append("<b>An error occurred while fetching media!</b>"))
                               .append($("<table>")
                                       .addClass("table table-bordered")
                                       .css({ 'margin-left' : 'auto', 'margin-right' : 'auto' }))
                               .append($("<div>")
                                       .attr("id", "error-accordion"));

            $fetchMediaDiv.append($mediaList)
                          .append($fetchButton)
                          .append($("<img>")
                                  .attr("src", this.options.loadingImage)
                                  .css("margin-left", "10px")
                                  .hide())
                          .append(this.$errorPanel);

            this.$errorPanel.find("#error-accordion").kbaseAccordion({
                    elements: [{ 
                        title: "Error Details", 
                        body: $("<pre>")
                              .addClass('kb-err-msg')
                              .append("ERROR'D!"),
                    }]
                });

            $mediaList.append("<option>No media found</option>");
            $fetchButton.hide();
            this.$errorPanel.hide();

            return $fetchMediaDiv;
        },

        /**
         * name and pH
         */
        buildHeaderInputs: function() {
            var $headerInputDiv = $("<div>");
            $headerInputDiv.append($("<b>")
                                   .append("Name (required): "))
                           .append($("<input>")
                                   .attr("type", "text")
                                   .attr("id", "media-name")
                                   .addClass("form-control"));
            $headerInputDiv.append($("<b>")
                                   .append("pH (optional): "))
                           .append($("<input>")
                                   .attr("type", "text")
                                   .attr("id", "media-ph")
                                   .addClass("form-control"));

            return $headerInputDiv;
        },

        buildMediaTable: function() {
            var $mediaTable = $("<table>")
                              .addClass("table table-striped table-bordered")
                              .css({"margin-right": "auto", "margin-left": "auto"})
                              .append($("<tr>")
                                      .append($("<th>")
                                              .append("Compound"))
                                      .append($("<th>")
                                              .append("Concentration"))
                                      .append($("<th>")
                                              .append("Min Flux"))
                                      .append($("<th>")
                                              .append("Max Flux"))
                                      .append($("<th>")));

            return $mediaTable;
        },

        buildRowControlButton: function(trashOnly) {
            var self = this;

            var deleteRow = function(event) {
                $(event.currentTarget).closest("tr").remove();
            };

            var addRow = function(event) {
                self.addEmptyMediaRow();
                $(event.currentTarget).find("span")
                                      .addClass("glyphicon-trash")
                                      .removeClass("glyphicon-plus");

                $(event.currentTarget).off("click")
                                      .click(deleteRow);
            };

            var $button = $("<button>")
                          .addClass("form-control")
                          .append($("<span>")
                                  .addClass("glyphicon")
                                  .addClass(trashOnly ? "glyphicon-trash" : "glyphicon-plus"));

            if (trashOnly)
                $button.click(deleteRow);
            else
                $button.click(addRow);

            return $button;
        },

        /**
         * Just a convenience function to add a media row with no elements.
         */
        addEmptyMediaRow: function() {
            this.addMediaRow();
        },

        addMediaRow: function(cpd) {
            var self = this;
            var $newRowBtn = this.buildRowControlButton(cpd);

            // little hack to make the ternary operators below a little cleaner.
            if (!cpd) cpd = {};

            var $row = $("<tr>")
                       .append($("<td>")
                               .append($("<input>")
                                       .addClass("form-control")
                                       .attr("placeholder", "Add Compound")
                                       .attr("value", (cpd.name ? cpd.name : ""))))
                       .append($("<td>")
                               .append($("<input>")
                                       .addClass("form-control")
                                       .attr("placeholder", "Add Concentration")
                                       .attr("value", (cpd.concentration ? cpd.concentration : ""))))
                       .append($("<td>")
                               .append($("<input>")
                                       .addClass("form-control")
                                       .attr("placeholder", "Add Min Flux")
                                       .attr("value", (cpd.min_flux ? cpd.min_flux : ""))))
                       .append($("<td>")
                               .append($("<input>")
                                       .addClass("form-control")
                                       .attr("placeholder", "Add Max Flux")
                                       .attr("value", (cpd.max_flux ? cpd.max_flux : ""))))
                       .append($("<td>")
                               .append($newRowBtn));

            this.$mediaTable.append($row);
        },

        updateMediaTable: function(media) {
            media = media[0];
            this.$mediaTable.find("tr > td").closest("tr").remove();

            for (var i=0; i<media.media_compounds.length; i++) {
                this.addMediaRow(media.media_compounds[i]);
            }
            this.addEmptyMediaRow();

            this.$headerInputDiv.find("#media-name").val(media.name);
            this.$headerInputDiv.find("#media-ph").val(media.pH);
        },

        /**
         * This puts together and returns an array with a single JSON string
         * representing a new media set. This gets passed to the IPython back end
         * to be processed into a new medium.
         * @public
         * @return 
         */
        getParameters: function() {
            var mediaName = this.$headerInputDiv.find("#media-name").val().trim().replace(/\s+/g, "_");
            if (!mediaName) {
                // stuuuuuuuuff...
            }

            var mediaParams = {
                // workspace and auth token will be handled by the IPython kernel.
                name : mediaName,
                media : mediaName,
                isDefined : 0,
                isMinimal : 0
            };

            var cpds = [],
                concs = [],
                minFluxes = [],
                maxFluxes = [];

            //$(cell.element).find("tr").each(function(a, b){ console.log($(b).find("td:nth-child(1) > input").val()); })

            // Find all <tr> in the table that has a <td> (e.g., NOT the header row - that has <th>)
            // and iterate over those rows.
            this.$mediaTable.find("tr:has('td')").each(function(idx, row) {
                var cpd = $(row).find("td:nth-child(1) input").val().trim();
                var conc = $(row).find("td:nth-child(2) input").val().trim();
                var min = $(row).find("td:nth-child(3) input").val().trim();
                var max = $(row).find("td:nth-child(4) input").val().trim();

                if (cpd) {
                    cpds.push(cpd);
                    concs.push(conc);
                    minFluxes.push(min);
                    maxFluxes.push(max);
                }
            });

            mediaParams['compounds'] = cpds;
            mediaParams['concentrations'] = concs;
            mediaParams['maxflux'] = maxFluxes;
            mediaParams['minflux'] = minFluxes;

            return [ JSON.stringify(mediaParams) ];
        },

        /**
         * Returns the current state of this widget as a single Javascript object.
         * This object is structured as:
         *
         * {
         *   'name' : <string name>,
         *   'ph' : <string ph>,
         *   'compounds' : 
         *       [
         *          {
         *              'name' : <cpd name>,
         *              'conc' : <cpd concentration>,
         *              'min' : <string>,
         *              'max' : <string>,
         *          },
         *          { ... as above ...},
         *       ],
         * }
         *
         * The compounds in the structure might contain nulls/blanks. So watch for that.
         * It also gives the compound list in the same order as on the screen. Hopefully.
         */
        getState: function() {
            var state = {};
            state['name'] = this.$headerInputDiv.find("#media-name").val();
            state['ph'] = this.$headerInputDiv.find("#media-ph").val();

            var cpds = [];
            this.$mediaTable.find("tr:has('td')").each(function(idx, row) {
                cpds.push({
                    'name' : $(row).find("td:nth-child(1) input").val(),
                    'conc' : $(row).find("td:nth-child(2) input").val(),
                    'min' : $(row).find("td:nth-child(3) input").val(),
                    'max' : $(row).find("td:nth-child(4) input").val(),
                });
            });
            state['compounds'] = cpds;
            return state;
        },

        /**
         * Loads up the previous state into the widget.
         * This expects to see the object generated with this widget's getState function.
         */
        loadState: function(state) {
            if (!state)
                return;

            this.$headerInputDiv.find("#media-name").val(state['name']);
            this.$headerInputDiv.find("#media-ph").val(state['ph']);

            var cpds = state['compounds'];
            this.$mediaTable.find("tr > td").closest("tr").remove();
            for (var i=0; i<cpds.length; i++) {
                var cpd = cpds[i];
                cpd.concentration = cpd.conc;
                cpd.min_flux = cpd.min;
                cpd.max_flux = cpd.max;
                this.addMediaRow(cpd);
            }
            this.addEmptyMediaRow();

        },

        refresh: function() {
            this.trigger("dataLoadedQuery.Narrative", [ [ this.mediaType ], this.IGNORE_VERSION,
                $.proxy(function(objects) {
                    var mediaList = objects[ this.mediaType ];
                    if (mediaList && mediaList.length > 0) {
                        this.$fetchMediaDiv.find('select').empty();
                        for (var i=0; i<mediaList.length; i++) {
                            this.$fetchMediaDiv.find('select').append($('<option>').append(mediaList[i][1]));
                        }
                        this.$fetchMediaDiv.find('button').hide();
                        this.$fetchMediaDiv.find('button.btn-primary').show();
                    }
                    else {
                        this.$fetchMediaDiv.find('select').empty().append($('<option>').append('No media found'));
                        this.$fetchMediaDiv.find('button').hide();
                    }
                },
                this)
            ]);
        },

        fetchMediaError: function(error) {
            var addRow = function(name, val) {
                return "<tr><td><b>" + name + "</b></td><td>" + val + "</td></tr>";
            };

            var esc = function(s) { 
                return String(s).replace(/'/g, "&apos;")
                                .replace(/"/g, "&quot;")
                                .replace(/</g, "&gt;")
                                .replace(/>/g, "&lt;");
            };

            $( this.$errorPanel.find('table') ).empty()
                                               .append(addRow('Status', esc(error.status)))
                                               .append(addRow('Code', esc(error.error.code)))
                                               .append(addRow('Name', esc(error.error.name)));
            $( this.$errorPanel.find('.kb-err-msg') ).empty()
                                                     .append(esc(error.error.error));

            this.$errorPanel.show();
        }

    });
})( jQuery );