/* eslint-env jasmine */
define([
    'jquery',
    'testUtil',
    'common/runtime',
    'widgets/appWidgets2/input/taxonomyRefInput',
    'base/js/namespace',
    'kbaseNarrative'
], (
    $,
    TestUtil,
    Runtime,
    TaxonomyRefInput,
    Jupyter,
    Narrative
) => {
    'use strict';

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
                        types: ['SomeModule.SomeType']
                    }
                }
            },
            channelName: bus.channelName,
        };
    }

    describe('Taxonomy Ref Input tests', () => {
        let bus,
            testConfig,
            required = false,
            runtime,
            node,
            defaultValue = 'apple',
            fakeServiceUrl = 'https://ci.kbase.us/services/fake_taxonomy_service';


        beforeEach(() => {
            runtime = Runtime.make();
            if (TestUtil.getAuthToken()) {
                document.cookie = 'kbase_session=' + TestUtil.getAuthToken();
                Jupyter.narrative = new Narrative();
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
                result: [{
                    git_commit_hash: 'blahblahblah',
                    hash: 'blahblahblah',
                    health: 'healthy',
                    module_name: 'taxonomy_service',
                    url: fakeServiceUrl
                }]
            }
            jasmine.Ajax.stubRequest(
                runtime.config('services.service_wizard.url')
            ).andReturn({
                status: 200,
                statusText: 'HTTP/1.1 200 OK',
                contentType: 'application/json',
                responseText: JSON.stringify(taxonServiceInfo),
                response: JSON.stringify(taxonServiceInfo),
            });

            const taxonSearchInfo = {
                version: '1.1',
                id: '67890',
                result: [{
                    hits: [{
                        label: 'A Hit',
                        id: '1',
                        category: 'generic',
                        parent: null,
                        parent_ref: null
                    }],
                    num_of_hits: 1
                }]
            };
            jasmine.Ajax.stubRequest(fakeServiceUrl)
                .andReturn({
                    status: 200,
                    statusText: 'HTTP/1.1 200 OK',
                    contentType: 'application/json',
                    responseText: JSON.stringify(taxonSearchInfo),
                    response: JSON.stringify(taxonSearchInfo)
                });
        });

        afterEach(() => {
            jasmine.Ajax.uninstall();
        });

        it('Should exist', () => {
            expect(TaxonomyRefInput).toBeDefined();
        });

        it('Should be instantiable', () => {
            let widget = TaxonomyRefInput.make(testConfig);
            expect(widget).toEqual(jasmine.any(Object));
            expect(widget.start).toBeDefined();
            expect(widget.stop).toBeDefined();
        });

        it('Should start and stop', (done) => {
            let widget = TaxonomyRefInput.make(testConfig);
            widget.start({node: node})
                .then(() => {
                    return widget.stop();
                })
                .then(() => {
                    done()
                });
        });

        it('Should set model value by bus', (done) => {
            let widget = TaxonomyRefInput.make(testConfig);
            bus.on('validation', (msg) => {
                expect(msg.errorMessage).toBeNull();
                expect(msg.diagnosis).toBe('valid');
                done();
            });

            widget.start({node: node})
                .then(() => {
                    bus.emit('update', {value: 'foo'})
                });
        });

        it('Should reset model value by bus', (done) => {
            let widget = TaxonomyRefInput.make(testConfig);
            bus.on('validation', (msg) => {
                expect(msg.errorMessage).toBeNull();
                expect(msg.diagnosis).toBe('valid');
                done();
            });

            widget.start({node: node})
                .then(() => {
                    bus.emit('reset-to-defaults');
                });
        });

        it('Should respond to changed select2 option', (done) => {
            let widget = TaxonomyRefInput.make(testConfig);
            bus.on('changed', (msg) => {
                done();
            });
            widget.start({node: node})
                .then(() => {
                    let $select = $(node).find('select');
                    let $search = $select.data('select2').dropdown.$search || $select.data('select2').selection.$search;

                    $search.val('stuff');
                    $search.trigger('input');

                    $select.trigger({
                        type: 'select2: select',
                        params: {
                            data: {
                            }
                        }
                    })
                    return TestUtil.wait(1000);
                    // $select.val('something').trigger({
                    //     type: 'select2:select',
                    //     params: {
                    //         data: {
                    //             term: 'stuff',
                    //             page: 1
                    //         }
                    //     }
                    // });
                })
                .then(() => {
                    let $select = $(node).find('select');
                    $select.val('stuff').trigger('change');
                });
        });
    });
});
