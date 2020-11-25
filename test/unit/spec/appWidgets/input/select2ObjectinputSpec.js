/* eslint-env jasmine */
define([
    'jquery',
    'testUtil',
    'common/runtime',
    'widgets/appWidgets2/input/select2ObjectInput',
    'base/js/namespace',
    'kbaseNarrative',
], ($, TestUtil, Runtime, Select2ObjectInput, Jupyter, Narrative) => {
    'use strict';

    const readsItem = [
            3,
            'small.fq_reads',
            'KBaseFile.SingleEndLibrary-2.2',
            '2018-01-18T22:26:25+0000',
            1,
            'wjriehl',
            25022,
            'wjriehl:narrative12345',
            '4161234123',
            628,
            {},
        ],
        readsItem2 = [
            4,
            'other_small.fq_reads',
            'KBaseFile.SingleEndLibrary-2.2',
            '2018-01-19T22:26:25+0000',
            1,
            'wjriehl',
            25022,
            'wjriehl:narrative12345',
            '5161234123',
            628,
            {},
        ],
        dummyData = [readsItem, readsItem2],
        dummyObjInfo = [objectify(readsItem), objectify(readsItem2)];
    let runtime;

    function objectify(infoArr) {
        let splitType = infoArr[2].split('-');
        let moduleAndType = splitType[0].split('.');
        return {
            id: infoArr[0],
            name: infoArr[1],
            ref: [infoArr[6], infoArr[0], infoArr[4]].join('/'),
            metadata: infoArr[10],
            type: infoArr[2],
            obj_id: 'ws.' + infoArr[6] + '.obj.' + infoArr[0],
            save_date: infoArr[3],
            version: infoArr[4],
            wsid: infoArr[6],
            saveDate: new Date(infoArr[3]),
            typeModule: moduleAndType[0],
            typeName: moduleAndType[1],
        };
    }

    function buildTestConfig(required, defaultValue, bus) {
        return {
            bus: bus,
            parameterSpec: {
                data: {
                    defaultValue: defaultValue,
                    nullValue: '',
                    constraints: {
                        required: required,
                        defaultValue: defaultValue,
                        types: ['KBaseFile.SingleEndLibrary'],
                    },
                },
            },
            channelName: bus.channelName,
        };
    }

    function updateData(dataset, objectInfo) {
        dataset = dataset || dummyData;
        objectInfo = objectInfo || dummyObjInfo;

        runtime.bus().set(
            {
                data: dataset,
                timestamp: new Date().getTime(),
                objectInfo: objectInfo,
            },
            {
                channel: 'data',
                key: {
                    type: 'workspace-data-updated',
                },
            }
        );
    }

    describe('Select 2 Object Input tests', () => {
        let bus,
            testConfig,
            required = false,
            node,
            defaultValue = 'apple',
            fakeServiceUrl = 'https://ci.kbase.us/services/fake_taxonomy_service';

        beforeEach(() => {
            runtime = Runtime.make();
            Jupyter.narrative = new Narrative();
            if (TestUtil.getAuthToken()) {
                document.cookie = 'kbase_session=' + TestUtil.getAuthToken();
                Jupyter.narrative.authToken = TestUtil.getAuthToken();
                Jupyter.narrative.userId = TestUtil.getUserId();
            }

            node = document.createElement('div');
            bus = runtime.bus().makeChannelBus({
                description: 'select input testing',
            });
            testConfig = buildTestConfig(required, defaultValue, bus);

            jasmine.Ajax.install();

            const taxonServiceInfo = {
                version: '1.1',
                id: '12345',
                result: [
                    {
                        git_commit_hash: 'blahblahblah',
                        hash: 'blahblahblah',
                        health: 'healthy',
                        module_name: 'taxonomy_service',
                        url: fakeServiceUrl,
                    },
                ],
            };
            jasmine.Ajax.stubRequest(runtime.config('services.service_wizard.url')).andReturn({
                status: 200,
                statusText: 'HTTP/1.1 200 OK',
                contentType: 'application/json',
                responseText: JSON.stringify(taxonServiceInfo),
                response: JSON.stringify(taxonServiceInfo),
            });

            const taxonSearchInfo = {
                version: '1.1',
                id: '67890',
                result: [
                    {
                        hits: [
                            {
                                label: 'A Hit',
                                id: '1',
                                category: 'generic',
                                parent: null,
                                parent_ref: null,
                            },
                        ],
                        num_of_hits: 1,
                    },
                ],
            };
            jasmine.Ajax.stubRequest(fakeServiceUrl).andReturn({
                status: 200,
                statusText: 'HTTP/1.1 200 OK',
                contentType: 'application/json',
                responseText: JSON.stringify(taxonSearchInfo),
                response: JSON.stringify(taxonSearchInfo),
            });

            updateData();
        });

        afterEach(() => {
            jasmine.Ajax.uninstall();
        });

        it('Should exist', () => {
            expect(Select2ObjectInput).toBeDefined();
        });

        it('Should be instantiable', () => {
            let widget = Select2ObjectInput.make(testConfig);
            expect(widget).toEqual(jasmine.any(Object));
            expect(widget.start).toBeDefined();
            expect(widget.stop).toBeDefined();
        });

        it('Should start and stop', (done) => {
            let widget = Select2ObjectInput.make(testConfig);
            widget
                .start({ node: node })
                .then(() => {
                    return widget.stop();
                })
                .then(() => {
                    done();
                });
        });

        it('Should set model value by bus', (done) => {
            let widget = Select2ObjectInput.make(testConfig);
            bus.on('validation', (msg) => {
                expect(msg.errorMessage).toBeUndefined();
                expect(msg.diagnosis).toBe('optional-empty');
                done();
            });

            widget.start({ node: node }).then(() => {
                bus.emit('update', { value: 'foo' });
            });
        });

        it('Should reset model value by bus', (done) => {
            let widget = Select2ObjectInput.make(testConfig);
            bus.on('validation', (msg) => {
                expect(msg.errorMessage).toBeUndefined();
                expect(msg.diagnosis).toBe('optional-empty');
                done();
            });

            widget.start({ node: node }).then(() => {
                bus.emit('reset-to-defaults');
            });
        });

        it('Should respond to changed select2 option', (done) => {
            let widget = Select2ObjectInput.make(testConfig);
            bus.on('validation', (msg) => {});
            bus.on('changed', (msg) => {
                done();
            });
            widget
                .start({ node: node })
                .then(() => {
                    let $select = $(node).find('select');
                    let $search =
                        $select.data('select2').dropdown.$search ||
                        $select.data('select2').selection.$search;

                    $search.val('small');
                    $search.trigger('input');

                    $select.trigger({
                        type: 'select2: select',
                        params: {
                            data: {},
                        },
                    });
                    return TestUtil.wait(1000);
                })
                .then(() => {
                    let $select = $(node).find('select');
                    $select.val('stuff').trigger('change');
                });
        });
    });
});
