/**
 * A module implementing a SampleSet viewer
 *
 * @module kbaseSampleSetView
 * @authors Sebastian Le Bras, David Lyon, Erik Pearson
 */
define([
    'kbwidget',
    'jquery',
    'kbaseAuthenticatedWidget',
    'kbaseTabs',
    'narrativeConfig',
    'widgets/common/LoadingMessage',
    'widgets/common/ErrorMessage',
    'widgets/function_output/samples/SampleSet',

    // For effect.
    'css!widgets/function_output/samples/KBaseSampleSet.css',
], (
    KBWidget,
    $,
    kbaseAuthenticatedWidget,
    kbaseTabs,
    Config,
    $LoadingMessage,
    $ErrorMessage,
    SampleSet
) => {
    'use strict';

    // A default timeout duration in milliseconds.
    const SERVICE_TIMEOUT = 60000;

    /**
     *
     * @typedef {Object} Schema
     */

    /**
     * Renders a value according to the associated sample field schema
     *
     * @param {any} value
     * @param {Schema} schema
     * @returns {jQuery} A jQuery element containing the formatted field value
     */
    function $renderField(value, schema) {
        if (!schema) {
            return $(`<span>`).text(String(value)).attr('title', String(value));
        }
        switch (schema.type) {
            case 'string':
                switch (schema.format) {
                    case 'url':
                        return $(`<a href='${value}' target='_blank'>`)
                            .text(value)
                            .attr('title', value);
                    case 'ontology-term':
                        return $(
                            `<a href='/#ontology/term/${schema.namespace}/${encodeURIComponent(
                                value
                            )}' target='_blank'>`
                        )
                            .text(value)
                            .attr('title', value);
                    default:
                        return $(`<span>`).text(value).attr('title', value);
                }
            case 'number':
                if ('formatting' in schema.kbase) {
                    return $(`<span>`)
                        .text(Intl.NumberFormat('en-US', schema.kbase.formatting).format(value))
                        .attr('title', value);
                }
                return $(`<span>`).text(String(value)).attr('title', String(value));

            default:
                return $(`<span>`).text(String(value)).attr('title', String(value));
        }
    }

    /**
     *
     * objid, name, type, save_date, ver, saved_by, wsid, workspace, chsum, size, meta
     * @typedef {[number, string, string, string, number, string, number, string, string, number, Object]} ObjectInfo
     */

    /**
     * Renders a link to the "dataview" ui object viewer for a given object using the provided
     * standard "object info" array.
     *
     * @param {ObjectInfo} objectInfo - An object info array for the given object
     * @returns {jQuery} the rendered dataview link
     */
    function $renderDataviewLink(objectInfo) {
        const [objectId, objectName, , , version, , workspaceId] = objectInfo;

        return $('<a>')
            .attr('href', `/#dataview/${workspaceId}/${objectId}/${version}`)
            .attr('target', '_blank')
            .text(objectName);
    }

    /**
     * Renders a link to the user profile page for the user who last saved the given object.
     *
     * @param {ObjectInfo} objectInfo - An object info array for the given object
     * @returns {jQuery} a jQuery object containing the rendered link
     */
    function $renderSavedByLink(objectInfo) {
        const [, , , , , savedBy] = objectInfo;

        return $('<a>').attr('href', `/#people/${savedBy}`).attr('target', '_blank').text(savedBy);
    }

    /**
     * A widget to render a Sample Set within the Narrative
     *
     */
    return KBWidget({
        name: 'kbaseSampleSetView',
        parent: kbaseAuthenticatedWidget,
        version: '1.0.0',
        options: {},

        /**
         *
         * @typedef {Object} Options
         * @property {Object} upas
         * @property {string} upas.id
         */

        /**
         * Initialize the widget with the provided options
         *
         * @param {Options} options
         * @returns {kbaseSampleSetView} A reference to the widget object
         */
        init: function (options) {
            this._super(options);

            this.obj_ref = options.upas.id;

            this.model = new SampleSet({
                workspaceURL: Config.url('workspace'),
                sampleServiceURL: Config.url('sample_service'),
                token: this.authToken(),
                timeout: SERVICE_TIMEOUT,
                ref: options.upas.id,
            });

            return this;
        },

        /**
         * Called by the Narrative upon object instantiation if authenticated, and whenever
         * authentication state changes from unauthenticated to authenticated.
         *
         * @method
         * @returns {void} nothing
         */
        loggedInCallback: function () {
            this.render();
        },

        /**
         * Called by the Narrative upon object instantiation if unauthenticated, and whenever
         * authentication state changes from authenticated to unauthenticated.
         *
         * @returns {void} nothing
         */
        loggedOutCallback: function () {
            this.render();
        },

        /**
         * The main rendering entry point.
         *
         * @returns {void} nothing
         */
        render: function () {
            this.$elem.empty();

            const $summaryTab = $('<div>').css('margin-top', '10px');
            const $samplesTab = $('<div>').css('margin-top', '10px');
            const $tabPane = $('<div>').appendTo(this.$elem);

            new kbaseTabs($tabPane, {
                tabPosition: 'top',
                canDelete: false,
                tabs: [
                    {
                        tab: 'Summary',
                        content: $summaryTab,
                        show: true,
                    },
                    {
                        tab: 'Samples',
                        content: $samplesTab,
                    },
                ],
            });

            $summaryTab.append($LoadingMessage('Loading SampleSet and Samples... '));
            $samplesTab.append($LoadingMessage('Loading SampleSet and Samples... '));
            this.model
                .load()
                .then(() => {
                    $summaryTab.html(this.$renderSummary());
                    $samplesTab.html(this.$renderSamples());
                })
                .catch((err) => {
                    this.$elem.html($ErrorMessage(err));
                });
        },

        /**
         * Renders the summery for a sample set, which should already be available in the
         * widget object.
         *
         * @returns {jQuery} the rendered summary
         */
        $renderSummary: function () {
            // Build table
            const $overviewTable = $('<table>')
                .attr('role', 'table')
                .addClass('table table-bordered table-hover SummaryTable');

            const $tbody = $('<tbody>').attr('role', 'rowgroup').appendTo($overviewTable);
            $tbody.append(
                $('<tr>')
                    .attr('role', 'row')
                    .append(
                        $('<th>').attr('role', 'cell').text('KBase Object Name'),
                        $('<td>')
                            .attr('role', 'cell')
                            .append($renderDataviewLink(this.model.sampleSet.info))
                    ),
                $('<tr>')
                    .attr('role', 'row')
                    .append(
                        $('<th>').attr('role', 'cell').text('Saved by'),
                        $('<td>')
                            .attr('role', 'cell')
                            .append($renderSavedByLink(this.model.sampleSet.info))
                    ),
                $('<tr>')
                    .attr('role', 'row')
                    .append(
                        $('<th>').attr('role', 'cell').text('Number of Samples'),
                        $('<td>')
                            .attr('role', 'cell')
                            .text(
                                Intl.NumberFormat('en-US', { useGrouping: true }).format(
                                    this.model.samples.length
                                )
                            )
                    ),
                $('<tr>')
                    .attr('role', 'row')
                    .append(
                        $('<th>').attr('role', 'cell').text('Description'),
                        $('<td>').attr('role', 'cell').text(this.model.sampleSet.data.description)
                    )
            );

            return $overviewTable;
        },

        /**
         * Render all samples in a table. Columns are grouped and ordered according to the
         * groups config, and cell contents formatted according to the field specs.
         *
         * This table does not have paging, etc.; it simply scrolls the rows and has a
         * vertically fixed header.
         *
         * @returns {jQuery} a jQuery object containing the rendered table.
         */
        $renderTable: function () {
            const table = this.model.toTable();

            // create table
            const $table = $('<table>').addClass('SampleSetTable').attr('role', 'table');

            // create thead
            const $thead = $('<thead>').attr('role', 'rowgroup');
            $table.append($thead);

            // create column group header
            const $columnGroupRow = $('<tr>').attr('role', 'row');
            $thead.append($columnGroupRow);
            for (const columnGroup of this.model.columnGroups) {
                $columnGroupRow.append(
                    $('<th>')
                        .attr('role', 'cell')
                        .attr('colspan', String(columnGroup.columnCount))
                        .text(columnGroup.title)
                );
            }

            // create column header
            const $headerRow = $('<tr>').attr('role', 'row');
            $thead.append($headerRow);
            for (const header of this.model.headerFields) {
                $headerRow.append(
                    $('<th>')
                        .attr('role', 'cell')
                        .append($('<div>').addClass('-content').text(header.title))
                );
            }

            // create units header
            const $unitsHeaderRow = $('<tr>').css('font-style', 'italic').attr('role', 'row');
            $thead.append($unitsHeaderRow);
            for (const header of this.model.headerFields) {
                const unit = () => {
                    if (header.schema) {
                        return header.schema.kbase.unit;
                    } else {
                        return '';
                    }
                };
                $unitsHeaderRow.append(
                    $('<th>')
                        .attr('role', 'cell')
                        .append($('<div>').addClass('-content').text(unit))
                );
            }

            // create tbody
            const $tbody = $('<tbody>').attr('role', 'rowgroup');
            $table.append($tbody);

            // for each data table row, create an html table row.
            for (const [, { row, info }] of table.entries()) {
                const $row = $('<tr>')
                    .attr('role', 'row')
                    .dblclick(() => {
                        const url = `${window.location.origin}/#samples/view/${info.id}/${info.version}`;
                        window.open(url, '_blank');
                    });
                $tbody.append($row);
                for (const [index] of this.model.headerFields.entries()) {
                    const value = row[index];
                    const $field = $('<div>')
                        .addClass('-content')
                        .append($renderField(value, this.model.headerFields[index].schema));
                    $row.append($('<td>').attr('role', 'cell').append($field));
                }
            }

            return $table;
        },

        /**
         *
         * @returns {jQuery} the rendered samples
         */
        $renderSamples: function () {
            const $tableDiv = $('<div>').css('overflow', 'auto').css('max-height', '40em');
            $tableDiv.append(this.$renderTable());
            return $tableDiv;
        },
    });
});
