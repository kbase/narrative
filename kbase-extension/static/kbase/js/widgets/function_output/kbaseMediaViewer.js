/**
 * An input widget to handle building a media set.
 * This has the option of loading/modifying an existing media.
 * @author Bill Riehl <wjriehl@lbl.gov>
 * @public
 */

(function ($, undefined) {
    return KBWidget({
        name: 'kbaseMediaViewer',

        version: '1.0.0',
        options: {
            loadingImage: window.kbconfig.loading_gif,
            // fbaURL: "https://kbase.us/services/fba_model_services",
            fbaURL: window.kbconfig.urls.fba,
            metadata: null,
            media: null,
        },

        init: function (options) {
            this._super(options);

            if (!this.options.media) return this.renderError();
            else return this.render();
        },

        render: function () {
            this.$elem.append($('<h3>').append('New Media'));

            if (this.options.metadata) this.renderMetadata(this.options.metadata);

            this.renderMedia(this.options.media);
            return this;
        },

        /**
         * Renders a metadata block in some logical way.
         * Probably just a small table with a couple fields. name, date, etc.
         */
        renderMetadata: function (metadata) {
            const id = metadata[0];
            const timestamp = metadata[2];
            const owner = metadata[5];
            const workspace = metadata[7];
            const mediaMeta = metadata[10];
            const mediaName = metadata[1];
            const numCompounds = mediaMeta['number_compounds'];

            const tableRow = function (a, b) {
                return '<tr><td><b>' + a + '</b></td><td>' + b + '</td></tr>';
            };

            const $metaTable = $('<table>')
                .addClass('table table-striped table-bordered')
                .css({ 'margin-right': 'auto', 'margin-left': 'auto' })
                .append(tableRow('Name', mediaName))
                .append(tableRow('Owner', owner))
                .append(tableRow('Workspace', workspace))
                .append(tableRow('Time', timestamp));

            this.$elem.append($metaTable);
            return this;
        },

        /**
         * Renders the Media typed object passed into it.
         * This is just a table with each compound with min/max fluxes and concentration
         * in each row.
         * Simple, eh?
         */
        renderMedia: function (media) {
            const $mediaTable = $('<table>')
                .addClass('table table-striped table-bordered')
                .css({ 'margin-right': 'auto', 'margin-left': 'auto' })
                .append(
                    $('<tr>')
                        .append($('<th>').append('<b>Compound</b>'))
                        .append($('<th>').append('<b>Concentration</b>'))
                        .append($('<th>').append('<b>Min Flux</b>'))
                        .append($('<th>').append('<b>Max Flux</b>'))
                );

            for (let i = 0; i < media.media_compounds.length; i++) {
                const cpd = media.media_compounds[i];

                const $newRow = $('<tr>')
                    .append($('<td>').append(cpd.name))
                    .append($('<td>').append(cpd.concentration))
                    .append($('<td>').append(cpd.min_flux))
                    .append($('<td>').append(cpd.max_flux));

                $mediaTable.append($newRow);
            }

            this.$elem.append($mediaTable);
            return this;
        },

        /**
         * Renders a simple error message.
         */
        renderError: function () {
            return this;
        },

        /**
         * Builds controls to fetch a media set and populate the current list.
         */
        buildFetchMediaDiv: function (mediaList) {
            const $fetchMediaDiv = $('<div>');
            $fetchMediaDiv.append('Select an existing media to modify (optional): ');

            const $mediaList = $('<select>');
            for (let i = 0; i < mediaList.length; i++) {
                $mediaList.append($('<option>').append(mediaList[i][0]));
            }

            const $fetchButton = $('<button>')
                .attr('type', 'button')
                .attr('value', 'Fetch')
                .addClass('btn btn-primary')
                .append('Fetch')
                .click(
                    $.proxy(function (event) {
                        const mediaName = this.$elem.find('div > select').val();
                        this.fbaClient.get_media_async(
                            {
                                auth: this.authToken(),
                                medias: [mediaName],
                                workspaces: [this.wsId],
                            },
                            $.proxy(function (media) {
                                this.updateMediaTable(media);
                            }, this)
                        );
                    }, this)
                );

            $fetchMediaDiv.append($mediaList).append($fetchButton);

            return $fetchMediaDiv;
        },

        /**
         * name and pH
         */
        buildHeaderInputs: function () {
            const $headerInputDiv = $('<div>');
            $headerInputDiv
                .append($('<b>').append('Name (required): '))
                .append(
                    $('<input>')
                        .attr('type', 'text')
                        .attr('id', 'media-name')
                        .addClass('form-control')
                );
            $headerInputDiv
                .append($('<b>').append('pH (optional): '))
                .append(
                    $('<input>')
                        .attr('type', 'text')
                        .attr('id', 'media-ph')
                        .addClass('form-control')
                );

            return $headerInputDiv;
        },

        buildMediaTable: function () {
            const $mediaTable = $('<table>')
                .addClass('table table-striped table-bordered')
                .css({ 'margin-right': 'auto', 'margin-left': 'auto' })
                .append(
                    $('<tr>')
                        .append($('<th>').append('Compound'))
                        .append($('<th>').append('Concentration'))
                        .append($('<th>').append('Min Flux'))
                        .append($('<th>').append('Max Flux'))
                        .append($('<th>'))
                );

            return $mediaTable;
        },

        buildRowControlButton: function (trashOnly) {
            const self = this;

            const deleteRow = function (event) {
                $(event.currentTarget).closest('tr').remove();
            };

            const addRow = function (event) {
                self.addEmptyMediaRow();
                $(event.currentTarget)
                    .find('span')
                    .addClass('glyphicon-trash')
                    .removeClass('glyphicon-plus');

                $(event.currentTarget).off('click').click(deleteRow);
            };

            const $button = $('<button>')
                .addClass('form-control')
                .append(
                    $('<span>')
                        .addClass('glyphicon')
                        .addClass(trashOnly ? 'glyphicon-trash' : 'glyphicon-plus')
                );

            if (trashOnly) $button.click(deleteRow);
            else $button.click(addRow);

            return $button;
        },

        addEmptyMediaRow: function () {
            this.addMediaRow();
        },

        addMediaRow: function (cpd) {
            const self = this;
            const $newRowBtn = this.buildRowControlButton(cpd);

            // little hack to make the ternary operators below a little cleaner.
            if (!cpd) cpd = {};

            const $row = $('<tr>')
                .append(
                    $('<td>').append(
                        $('<input>')
                            .addClass('form-control')
                            .attr('placeholder', 'Add Compound')
                            .attr('value', cpd.name ? cpd.name : '')
                    )
                )
                .append(
                    $('<td>').append(
                        $('<input>')
                            .addClass('form-control')
                            .attr('placeholder', 'Add Concentration')
                            .attr('value', cpd.concentration ? cpd.concentration : '')
                    )
                )
                .append(
                    $('<td>').append(
                        $('<input>')
                            .addClass('form-control')
                            .attr('placeholder', 'Add Min Flux')
                            .attr('value', cpd.min_flux ? cpd.min_flux : '')
                    )
                )
                .append(
                    $('<td>').append(
                        $('<input>')
                            .addClass('form-control')
                            .attr('placeholder', 'Add Max Flux')
                            .attr('value', cpd.max_flux ? cpd.max_flux : '')
                    )
                )
                .append($('<td>').append($newRowBtn));

            this.$mediaTable.append($row);
        },

        updateMediaTable: function (media) {
            media = media[0];
            this.$mediaTable.find('tr > td').closest('tr').remove();

            for (let i = 0; i < media.media_compounds.length; i++) {
                this.addMediaRow(media.media_compounds[i]);
            }
            this.addEmptyMediaRow();

            this.$headerInputDiv.find('#media-name').val(media.name);
            this.$headerInputDiv.find('#media-ph').val(media.pH);
        },

        /**
         * This puts together and returns an array with a single JSON string
         * representing a new media set. This gets passed to the IPython back end
         * to be processed into a new medium.
         * @public
         * @return
         */
        getParameters: function () {
            const mediaName = this.$headerInputDiv
                .find('#media-name')
                .val()
                .trim()
                .replace(/\s+/g, '_');
            if (!mediaName) {
                // stuuuuuuuuff...
            }

            const mediaParams = {
                // workspace and auth token will be handled by the IPython kernel.
                name: mediaName,
                media: mediaName,
                isDefined: 0,
                isMinimal: 0,
            };

            const cpds = [],
                concs = [],
                minFluxes = [],
                maxFluxes = [];

            //$(cell.element).find("tr").each(function(a, b){ console.log($(b).find("td:nth-child(1) > input").val()); })

            // Find all <tr> in the table that has a <td> (e.g., NOT the header row - that has <th>)
            // and iterate over those rows.
            this.$mediaTable.find("tr:has('td')").each((idx, row) => {
                const cpd = $(row).find('td:nth-child(1) input').val().trim();
                const conc = $(row).find('td:nth-child(2) input').val().trim();
                const min = $(row).find('td:nth-child(3) input').val().trim();
                const max = $(row).find('td:nth-child(4) input').val().trim();

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

            return [JSON.stringify(mediaParams)];
        },
    });
})(jQuery);
