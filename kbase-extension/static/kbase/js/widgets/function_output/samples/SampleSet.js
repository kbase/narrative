define([
    'jsonrpc/1.1/ServiceClient',
    'json!config/samples/groups.json',
    'json!config/samples/schemas.json',
], (ServiceClient, sampleGroups, sampleSchemas) => {
    'use strict';

    const EMPTY_CHAR = '∅';

    function formatFieldName(fieldName) {
        return fieldName.split('_').join(' ');
    }

    class SampleSet {
        constructor({ workspaceURL, sampleServiceURL, token, timeout, ref }) {
            this.workspaceURL = workspaceURL;
            this.sampleServiceURL = sampleServiceURL;
            this.token = token;
            this.timeout = timeout;
            this.groups = sampleGroups;
            this.schemas = sampleSchemas;
            this.schemaDB = this.schemas.reduce((db, schema) => {
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

    return SampleSet;
});
