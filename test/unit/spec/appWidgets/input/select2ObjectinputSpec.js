define([
    'jquery',
    'testUtil',
    'common/runtime',
    'widgets/appWidgets2/input/select2ObjectInput',
    'base/js/namespace',
    'narrativeMocks',
], ($, TestUtil, Runtime, Select2ObjectInput, Jupyter, Mocks) => {
    'use strict';

    const AUTH_TOKEN = 'fakeAuthToken';
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
        const splitType = infoArr[2].split('-');
        const moduleAndType = splitType[0].split('.');
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

    jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000;
    describe('Select 2 Object Input tests', () => {
        let bus, testConfig, container;
        const required = false,
            defaultValue = 'apple',
            fakeServiceUrl = 'https://ci.kbase.us/services/fake_taxonomy_service';

        beforeEach(() => {
            container = document.createElement('div');
            runtime = Runtime.make();
            Mocks.setAuthToken(AUTH_TOKEN);
            Jupyter.narrative = {
                getAuthToken: () => AUTH_TOKEN,
                userId: 'test_user',
            };
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
            bus.stop();
            window.kbaseRuntime = null;
            Jupyter.narrative = null;
            container.remove();
        });

        it('Should exist', () => {
            expect(Select2ObjectInput).toBeDefined();
        });

        it('Should be instantiable', () => {
            const widget = Select2ObjectInput.make(testConfig);
            expect(widget).toEqual(jasmine.any(Object));
            ['start', 'stop'].forEach((fn) => {
                expect(widget[fn]).toBeDefined();
                expect(widget[fn]).toEqual(jasmine.any(Function));
            });
        });

        describe('the started widget', () => {
            beforeEach(async function () {
                this.widget = Select2ObjectInput.make(testConfig);
                await this.widget.start({ node: container });
            });

            it('Should start and stop', async function () {
                expect(container.childElementCount).toBeGreaterThan(0);
                const input = container.querySelector('select[data-element="input"]');
                expect(input).toBeDefined();
                expect(input.getAttribute('value')).toBeNull();

                await this.widget.stop();
                expect(container.childElementCount).toBe(0);
            });

            // this resets the model value but does not change the UI
            // or emit a bus message => cannot easily be tested
            xit('Should set model value by bus', (done) => {
                bus.emit('update', { value: 'foo' });
                bus.on('validation', (msg) => {
                    expect(msg.errorMessage).toBeUndefined();
                    expect(msg.diagnosis).toBe('optional-empty');
                    done();
                });
            });

            // this resets the model value but does not change the UI
            // or emit a bus message => cannot easily be tested
            xit('Should reset model value by bus', (done) => {
                bus.emit('reset-to-defaults');
                bus.on('validation', (msg) => {
                    expect(msg.errorMessage).toBeUndefined();
                    expect(msg.diagnosis).toBe('optional-empty');
                    done();
                });
            });
        });

        // FIXME: it is unclear what the effect of these changes should be
        // More precise tests should be implemented
        it('Should respond to changed select2 option', (done) => {
            const widget = Select2ObjectInput.make(testConfig);
            const nodeStructures = [];
            widget
                .start({ node: container })
                .then(() => {
                    nodeStructures.push(container.innerHTML);
                    const $select = $(container).find('select');
                    const $search =
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
                    nodeStructures.push(container.innerHTML);
                    expect(nodeStructures[0]).not.toEqual(nodeStructures[1]);
                    const $select = $(container).find('select');
                    $select.val('stuff').trigger('change');
                    return TestUtil.wait(1000);
                })
                .then(() => {
                    nodeStructures.push(container.innerHTML);
                    expect(nodeStructures[0]).not.toEqual(nodeStructures[2]);
                    done();
                });
        });
    });
});
