/*  eslint-env es6 */

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

    jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000;
    describe('Select 2 Object Input tests', () => {
        const required = false,
            defaultValue = 'apple',
            fakeServiceUrl = 'https://ci.kbase.us/services/fake_taxonomy_service';

        beforeEach(function() {
            runtime = Runtime.make();
            Jupyter.narrative = new Narrative();
            if (TestUtil.getAuthToken()) {
                document.cookie = 'kbase_session=' + TestUtil.getAuthToken();
                Jupyter.narrative.authToken = TestUtil.getAuthToken();
                Jupyter.narrative.userId = TestUtil.getUserId();
            }

            this.node = document.createElement('div');
            this.bus = runtime.bus().makeChannelBus({
                description: 'select input testing',
            });
            this.testConfig = buildTestConfig(required, defaultValue, this.bus);

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

        afterEach(function() {
            jasmine.Ajax.uninstall();
            this.bus.stop();
            window.kbaseRuntime = null;
        });

        it('Should exist', () => {
            expect(Select2ObjectInput).toBeDefined();
        });

        it('Should be instantiable', function() {
            const widget = Select2ObjectInput.make(this.testConfig);
            expect(widget).toEqual(jasmine.any(Object));
            ['start', 'stop'].forEach((fn) => {
                expect(widget[fn]).toBeDefined();
                expect(widget[fn]).toEqual(jasmine.any(Function));
            })
        });
        describe('the started widget', () => {
            beforeEach(async function() {
                this.widget = Select2ObjectInput.make(this.testConfig);
                await this.widget.start({ node: this.node });
            });

            it('should start successfully', function() {
                expect(this.node.querySelector('div[data-element="main-panel"]').innerHTML).toContain('data-element="input-container"');
            });
            it('should stop successfully', async function() {
                await this.widget.stop();
                expect(this.node.innerHTML).toEqual('');
            })

            it('Should set model value by bus', function(done) { // done) {
                this.bus.on('validation', (msg) => {
                    expect(msg.errorMessage).toBeUndefined();
                    expect(msg.diagnosis).toBe('optional-empty');
                    done()
                });
                this.bus.emit('update', { value: 'foo' });
            });

            it('Should reset model value by bus', function(done) { // done) {
                this.bus.on('validation', (msg) => {
                    expect(msg.errorMessage).toBeUndefined();
                    expect(msg.diagnosis).toBe('optional-empty');
                    done()
                });
                this.bus.emit('reset-to-defaults');
            });

            it('Should respond to changed select2 option', function(done) { // done) {
                this.bus.on('changed', () => {
                    expect(true).toBeTruthy();
                    done()
                });
                const $select = $(this.node).find('select');
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
                TestUtil.wait(1000);
                $select.val('stuff').trigger('change');
            });
        });
    });
});
