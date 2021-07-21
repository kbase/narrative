/*
Sebastian Le Bras, David Lyon - April 2020
*/
define([
    'kbwidget',
    'jquery',
    'kbaseAuthenticatedWidget',
    'kbaseTabs',
    'narrativeConfig',
    'widgets/common/loadingMessage',
    'widgets/common/errorMessage',
    'jsonrpc/1.1/ServiceClient',
    'json!config/samples/groups.json',
    'json!config/samples/schemas.json',

    // For effect.
    'css!styles/ScrollingTable.css',
    'css!styles/BootstrapOverrides.css',
], (KBWidget, $, kbaseAuthenticatedWidget, kbaseTabs, Config, LoadingMessage, ErrorMessage, ServiceClient, groups, schemas) => {
    'use strict';

    const SERVICE_TIMEOUT = 60000;
    const EMPTY_CHAR = '∅';
    
    function formatFieldName(fieldName) {
        return fieldName.split('_').join(' ');
    }

    class SampleSet {
        constructor({ workspaceURL, sampleServiceURL, token, timeout, groups, schemas, ref }) {
            this.workspaceURL = workspaceURL;
            this.sampleServiceURL = sampleServiceURL;
            this.token = token;
            this.timeout = timeout;
            this.groups = groups;
            this.schemas = schemas;
            this.schemaDB = schemas.reduce((db, schema) => {
                db[schema.kbase.sample.key] = schema;
                return db;
            }, {});
            this.ref = ref;
        }

        async load() {
            const workspace = new ServiceClient({
                url: this.workspaceURL,
                module: 'Workspace',
                token: this.token,
                timeout: this.timeout,
                strict: false,
            });

            const sampleService = new ServiceClient({
                url: this.sampleServiceURL,
                module: 'SampleService',
                token: this.token,
                timeout: this.timeout,
                strict: false,
            });
            const {
                data: [sampleSet],
            } = await workspace.callFunc('get_objects2', {
                params: {
                    objects: [
                        {
                            ref: this.ref,
                        },
                    ],
                },
            });
            this.sampleSet = sampleSet;

            const samplesToFetch = sampleSet.data.samples.map(({ id, version }) => {
                return { id, version };
            });

            // Now get all the samples.
            this.samples = await sampleService.callFunc('get_samples', {
                params: {
                    samples: samplesToFetch,
                },
            });

            this.samplesMap = this.samples.reduce((samplesMap, sample) => {
                samplesMap[`${sample.id}/${sample.version}`] = sample;
                return samplesMap;
            }, {});

            this.getHeaders();
        }

        formatField(value, schema) {
            if (!schema) {
                return $(`<span>`).text(String(value)).attr('title', String(value));
            }
            switch (schema.type) {
                case 'string':
                    switch (schema.format) {
                        case 'url':
                            return $(`<a href="${value}" target="_blank">`)
                                .text(value)
                                .attr('title', value);
                        case 'ontology-term':
                            return $(
                                `<a href="/#ontology/term/${schema.namespace}/${encodeURIComponent(
                                    value
                                )}" target="_blank">`
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

        getHeaders() {
            const controlledFields = new Set();
            const userFields = new Set();

            this.samples.forEach((sample) => {
                Object.keys(sample.node_tree[0].meta_controlled).forEach((fieldKey) => {
                    controlledFields.add(fieldKey);
                });
            });

            this.samples.forEach((sample) => {
                Object.keys(sample.node_tree[0].meta_user).forEach((fieldKey) => {
                    if (fieldKey in controlledFields) {
                        console.warn(
                            `User field ${fieldKey} also present in controlled fields; skipped`
                        );
                        return;
                    }
                    userFields.add(fieldKey);
                });
            });

            // TODO: use grouping to order the fields.

            const controlledFieldMap = Array.from(controlledFields).reduce((m, field) => {
                m[field] = field;
                return m;
            }, {});

            const columnGroups = [];
            const headerFields = [];
            for (const group of this.groups) {
                const groupFields = [];
                for (const field of group.fields) {
                    if (field in controlledFieldMap) {
                        groupFields.push(field);
                        const schema = this.schemaDB[field];

                        headerFields.push({
                            id: field,
                            title: schema.title,
                            isSortable: true,
                            type: 'controlled',
                            group: group.title,
                            schema,
                        });
                    }
                }
                if (groupFields.length > 0) {
                    columnGroups.push({
                        name: group.name,
                        title: group.title,
                        columnCount: groupFields.length,
                    });
                }
            }

            if (userFields.size > 0) {
                columnGroups.push({
                    name: 'user',
                    title: 'User',
                    columnCount: userFields.size,
                });
                for (const field of Array.from(userFields)) {
                    headerFields.push({
                        id: field,
                        title: formatFieldName(field),
                        isSortable: true,
                        type: 'user',
                        group: 'User',
                    });
                }
            }

            this.columnGroups = columnGroups;
            this.headerFields = headerFields;
        }

        toTable() {
            return this.samples.map((sample) => {
                const controlled = sample.node_tree[0].meta_controlled;
                const user = sample.node_tree[0].meta_user;
                const row = this.headerFields.map(({ id, type }) => {
                    // NB: id is the field key.
                    if (type === 'controlled') {
                        return controlled[id] ? controlled[id].value : EMPTY_CHAR;
                    } else if (type === 'user') {
                        return user[id] ? user[id].value : EMPTY_CHAR;
                    } else {
                        return EMPTY_CHAR;
                    }
                });
                return {
                    row,
                    info: {
                        id: sample.id,
                        version: sample.version,
                        nodeId: sample.node_tree[0].id,
                        name: sample.name,
                    },
                };
            });
        }
    }

    const kbaseSampleSetView = KBWidget({
        name: 'kbaseSampleSetView',
        parent: kbaseAuthenticatedWidget,
        version: '1.0.0',
        options: {
            pageLimit: 10,
            default_blank_value: '',
        },

        init: function (options) {
            this._super(options);

            this.obj_ref = this.options.upas.id;

            this.model = new SampleSet({
                workspaceURL: Config.url('workspace'),
                sampleServiceURL: Config.url('sample_service'),
                token: this.authToken(),
                timeout: SERVICE_TIMEOUT,
                groups,
                schemas,
                ref: this.options.upas.id,
            });

            // Render
            this.render();

            return this;
        },

        loggedInCallback: function () {
            this.render();
        },

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

            $summaryTab.append(LoadingMessage('Loading SampleSet and Samples... '));
            $samplesTab.append(LoadingMessage('Loading SampleSet and Samples... '));
            this.model
                .load()
                .then(() => {
                    this.renderSummary($summaryTab);
                    this.renderSamples($samplesTab);
                })
                .catch((err) => {
                    this.renderError(this.$elem, err);
                });
        },

        renderError: function ($container, err) {
            $container.html(ErrorMessage(err));
        },

        renderDataviewLink: function (objectInfo) {
            const [
                objectId,
                objectName,
                ,
                ,
                version,
                ,
                workspaceId,
            ] = objectInfo;

            return $('<a>')
                .attr('href', `/#dataview/${workspaceId}/${objectId}/${version}`)
                .attr('target', '_blank')
                .text(objectName);
        },

        renderPeopleLink: function (objectInfo) {
            const [
                ,
                ,
                ,
                ,
                ,
                savedBy,
                ,
            ] = objectInfo;

            return $('<a>')
                .attr('href', `/#people/${savedBy}`)
                .attr('target', '_blank')
                .text(savedBy);
        },

        renderSummary: function ($container) {
            $container.empty();

            // Build table
            const $overviewTable = $('<table role="table">')
                .addClass('table table-bordered table-hover OverrideRenderedHTML');

            const $tbody = $('<tbody role="rowgroup">').appendTo($overviewTable);
            $tbody.append(
                $('<tr role="row">').append(
                    $('<th role="cell">').text('KBase Object Name'),
                    $('<td role="cell">').html(this.renderDataviewLink(this.model.sampleSet.info))
                ),
                $('<tr role="row">').append(
                    $('<th role="cell">').text('Saved by'),
                    $('<td role="cell">').html(this.renderPeopleLink(this.model.sampleSet.info))
                ),
                $('<tr role="row">').append(
                    $('<th role="cell">').text('Number of Samples'),
                    $('<td role="cell">').text(Intl.NumberFormat('en-US', {useGrouping: true}).format(this.model.samples.length))
                ),
                $('<tr role="row">').append(
                    $('<th role="cell">').text('Description'),
                    $('<td role="cell">').text(this.model.sampleSet.data.description)
                )
            )

            // Attach table to the container
            $container.append($overviewTable);
        },

        renderTable: function ($container) {
            const table = this.model.toTable();
    
            // create table
            const $table = $('<table class="ScrollingTable" role="table">');
            $container.append($table);

            // create thead
            const $thead = $('<thead role="rowgroup">');
            $table.append($thead);

            // create column group header
            const $columnGroupRow = $('<tr role="row">');
            $thead.append($columnGroupRow);
            for (const columnGroup of this.model.columnGroups) {
                $columnGroupRow.append(
                    $(`<th role="cell" colspan="${columnGroup.columnCount}">`).text(columnGroup.title)
                );
            }

            // create column header
            const $headerRow = $('<tr role="row">');
            $thead.append($headerRow);
            for (const header of this.model.headerFields) {
                $headerRow.append($('<th role="cell">').append($('<div class="-content">').text(header.title)));
            }

            // create units header
            const $unitsHeaderRow = $('<tr style="font-style: italic;" role="row">');
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
                    $('<th role="cell">').append(
                        $('<div class="-content">').text(unit)
                    )
                );
            }

            // create tbody
            const $tbody = $('<tbody role="rowgroup">');
            $table.append($tbody);

            // for each row
            for (const [, { row, info }] of table.entries()) {
                const $row = $('<tr role="row">').dblclick(() => {
                    const url = `${window.location.origin}/#samples/view/${info.id}/${info.version}`;
                    window.open(url, '_blank');
                });
                $tbody.append($row);
                for (const [index] of this.model.headerFields.entries()) {
                    const value = row[index];
                    const $field = $('<div class="-content">').append(
                        this.model.formatField(value, this.model.headerFields[index].schema)
                    );
                    $row.append($('<td role="cell">').append($field));
                }
            }

            return $table;
        },

        renderSamples: function ($container) {
            $container.empty();

            // Build and attach to container
            const $tableDiv = $('<div style="overflow: auto; max-height: 40em;" />');
            $container.append($tableDiv);

            this.renderTable($tableDiv);
        },
    });

    return kbaseSampleSetView;
});
