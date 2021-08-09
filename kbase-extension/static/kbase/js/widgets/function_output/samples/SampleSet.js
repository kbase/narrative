define([
    'jsonrpc/1.1/ServiceClient',
    'json!config/samples/groups.json',
    'json!config/samples/schemas.json',
], (ServiceClient, sampleGroups, sampleSchemas) => {
    /**
     * A module which provides a SampleSet data model
     *
     * @module widgets/function_output/samples/SampleSet
     */
    'use strict';

    // Used to represent missing data.
    const EMPTY_CHAR = '∅';

    // Used to create a field label from a field key, in the case of
    // user fields for whom we do not have the original column label.
    function formatFieldName(fieldName) {
        return fieldName.split('_').join(' ');
    }

    /**
     * @typedef {Object} SampleGroups
     */

    /**
     * @typedef {Object} SampleSchemas
     */

    /**
     * A class represent a Sample Set, as implemented by a SampleSet object (Workspace) and a
     * set of samples (SampleService).
     */
    class SampleSet {
        /**
         *
         * @param {Object} param
         * @param {string} param.workspaceURL - A url to an instance of the Workspace service
         * @param {string} param.sampleServiceURL - A url to an instance of the Sample service
         * @param {string} param.token - A KBase authorization token, typically a Login Token
         * @param {number} param.timeout - A duration, in milliseconds, after which a service request
         *      is considered to have timed out.
         * @param {string} param.ref - The Workspace object reference, or upa, for the SampleSet to be rendered
         */
        constructor({ workspaceURL, sampleServiceURL, token, timeout, ref }) {
            // @type {string}
            this.workspaceURL = workspaceURL;

            // @type {string}
            this.sampleServiceURL = sampleServiceURL;

            // @type {string}
            this.token = token;

            // @type {number}
            this.timeout = timeout;

            // @type {SampleGroups}
            this.groups = sampleGroups;

            // @type {SampleSchemas}
            this.schemas = sampleSchemas;

            // @type {Object}
            this.schemaDB = this.schemas.reduce((db, schema) => {
                db[schema.kbase.sample.key] = schema;
                return db;
            }, {});

            // @type {string}
            this.ref = ref;
        }

        /**
         * Fetches a SampleSet object and associated samples. Not that it stores
         * all data as object properties.
         *
         * @returns {void} Nothing
         */
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
                objects: [
                    {
                        ref: this.ref,
                    },
                ],
            });
            this.sampleSet = sampleSet;

            const samplesToFetch = sampleSet.data.samples.map(({ id, version }) => {
                return { id, version };
            });

            // Now get all the samples.
            this.samples = await sampleService.callFunc('get_samples', {
                samples: samplesToFetch,
            });

            this.samplesMap = this.samples.reduce((samplesMap, sample) => {
                samplesMap[`${sample.id}/${sample.version}`] = sample;
                return samplesMap;
            }, {});

            this.getHeaders();
        }

        /**
         * Processes loaded samples, sample group configs, and the sample schemas to build
         * a two-tiered table header which honors the grouping config.
         *
         * @returns {void} nothing
         */
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

            const controlledFieldMap = Array.from(controlledFields).reduce((m, field) => {
                m[field] = field;
                return m;
            }, {});

            const columnGroups = [];
            const headerFields = [];
            columnGroups.push({
                name: 'rowInfo',
                title: '',
                columnCount: 1,
            });
            headerFields.push({
                id: 'rowNumber',
                title: '#',
                isSortable: true,
                type: 'rowInfo',
                group: 'rowInfo',
                schema: null,
            });
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

        /**
         *
         * @typedef {Object} SampleTable
         * @property {string[]} SampleTable.row -
         * @property {Object} SampleTable.info - A
         * @property {string} SampleTable.info.id - The sample id
         * @property {number} SampleTable.info.version - The sample version
         * @property {string} SampleTable.info.nodeId - The id of the first element of the sample node tree
         * @property {string} SampleTable.info.name - The sample name
         */

        /**
         * Prepares loaded samples into a table format acceptable for rendering by the SampleSet
         * viewer widget.
         *
         * @returns {SampleTable}
         */
        toTable() {
            return this.samples.map((sample, index) => {
                const controlled = sample.node_tree[0].meta_controlled;
                const user = sample.node_tree[0].meta_user;
                const row = this.headerFields.map(({ id, type }) => {
                    // NB: id is the field key.
                    if (type === 'controlled') {
                        return controlled[id] ? controlled[id].value : EMPTY_CHAR;
                    } else if (type === 'user') {
                        return user[id] ? user[id].value : EMPTY_CHAR;
                    } else if (type === 'rowInfo') {
                        switch (id) {
                            case 'rowNumber':
                                return index + 1;
                            default:
                                return EMPTY_CHAR;
                        }
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

    return SampleSet;
});
