define([
    'jquery',
    'testUtil',
    'common/runtime',
    'widgets/appWidgets2/input/taxonomyRefInput',
    'base/js/namespace',
    'narrativeMocks',
], ($, TestUtil, Runtime, TaxonomyRefInput, Jupyter, Mocks) => {
    'use strict';
    const AUTH_TOKEN = 'fakeAuthToken';

    function buildTestConfig(required, defaultValue, bus) {
        return {
            parameterSpec: {
                data: {
                    defaultValue: defaultValue,
                    nullValue: '',
                    constraints: {
                        required: required,
                        defaultValue: defaultValue,
                        types: ['SomeModule.SomeType'],
                    },
                },
            },
            channelName: bus.channelName,
        };
    }

    jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000;

    describe('TaxonomyRefInput module', () => {
        it('Should exist', () => {
            expect(TaxonomyRefInput).toBeDefined();
        });
    });

    describe('The Taxonomy Ref Input widget', () => {
        const required = false,
            defaultValue = 'apple',
            fakeServiceUrl = 'https://ci.kbase.us/services/fake_taxonomy_service';
        let bus, testConfig;

        beforeEach(function () {
            const runtime = Runtime.make();
            Mocks.setAuthToken(AUTH_TOKEN);
            Jupyter.narrative = {
                getAuthToken: () => AUTH_TOKEN,
                userId: 'test_user',
            };

            this.node = document.createElement('div');
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
        });

        afterEach(() => {
            jasmine.Ajax.uninstall();
            bus.stop();
            window.kbaseRuntime = null;
            Jupyter.narrative = null;
        });

        it('Should be instantiable', () => {
            const widget = TaxonomyRefInput.make(testConfig);
            expect(widget).toEqual(jasmine.any(Object));
            ['start', 'stop'].forEach((fn) => {
                expect(widget[fn]).toBeDefined();
                expect(widget[fn]).toEqual(jasmine.any(Function));
            });
        });

        it('Should start and stop', function (done) {
            const widget = TaxonomyRefInput.make(testConfig);
            widget
                .start({ node: this.node })
                .then(() => {
                    expect(this.node.childElementCount).toBeGreaterThan(0);
                    const input = this.node.querySelector('select[data-element="input"]');
                    expect(input).toBeDefined();
                    expect(input.getAttribute('value')).toBeNull();
                    return widget.stop();
                })
                .then(() => {
                    expect(this.node.childElementCount).toBe(0);
                    done();
                })
                .catch((err) => {
                    fail(err);
                });
        });

        // this resets the model value but does not change the UI
        // or emit a message via the bus
        // ==> cannot easily be tested
        xit('Should set model value by bus', function (done) {
            const widget = TaxonomyRefInput.make(testConfig);
            bus.on('validation', (msg) => {
                expect(msg.errorMessage).toBeNull();
                expect(msg.diagnosis).toBe('valid');
                done();
            });

            widget.start({ node: this.node }).then(() => {
                bus.emit('update', { value: 'foo' });
            });
        });

        // this resets the model value but does not change the UI
        // or emit a message via the bus
        // ==> cannot easily be tested
        xit('Should reset model value by bus', function (done) {
            const widget = TaxonomyRefInput.make(testConfig);
            bus.on('validation', (msg) => {
                expect(msg.errorMessage).toBeNull();
                expect(msg.diagnosis).toBe('valid');
                done();
            });

            widget.start({ node: this.node }).then(() => {
                bus.emit('reset-to-defaults');
            });
        });

        // FIXME: it is unclear what the effect of these changes should be
        // More precise tests should be implemented
        it('Should respond to changed select2 option', function (done) {
            const widget = TaxonomyRefInput.make(testConfig);
            const nodeStructures = [];
            widget
                .start({ node: this.node })
                .then(() => {
                    nodeStructures.push(this.node.innerHTML);
                    const $select = $(this.node).find('select');
                    const $search =
                        $select.data('select2').dropdown.$search ||
                        $select.data('select2').selection.$search;

                    $search.val('stuff');
                    $search.trigger('input');

                    $select.trigger({
                        type: 'select2: select',
                        params: {
                            data: {},
                        },
                    });
                })
                .then(() => {
                    nodeStructures.push(this.node.innerHTML);
                    expect(nodeStructures[0]).not.toEqual(nodeStructures[1]);
                    const $select = $(this.node).find('select');
                    $select.val('stuff').trigger('change');
                    return TestUtil.wait(1000);
                })
                .then(() => {
                    nodeStructures.push(this.node.innerHTML);
                    expect(nodeStructures[0]).not.toEqual(nodeStructures[2]);
                    done();
                });
        });
    });
});
