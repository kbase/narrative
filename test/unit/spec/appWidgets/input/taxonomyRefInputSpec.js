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

    describe('TaxonomyRefInput module', () => {
        it('Should exist', () => {
            expect(TaxonomyRefInput).toBeDefined();
        });
    });

    describe('The Taxonomy Ref Input widget', () => {
        const required = false,
            defaultValue = 'apple',
            fakeServiceUrl = 'https://ci.kbase.us/services/fake_taxonomy_service';
        let bus, testConfig, container, widget;

        beforeEach(() => {
            const runtime = Runtime.make();
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
            container = document.createElement('div');
            widget = TaxonomyRefInput.make(testConfig);
        });

        afterEach(async () => {
            if (widget) {
                await widget.stop();
            }
            container.remove();
            bus.stop();
            window.kbaseRuntime = null;
            Jupyter.narrative = null;
            jasmine.Ajax.uninstall();
        });

        it('Should be instantiable', () => {
            expect(widget).toEqual(jasmine.any(Object));
            ['start', 'stop'].forEach((fn) => {
                expect(widget[fn]).toBeDefined();
                expect(widget[fn]).toEqual(jasmine.any(Function));
            });
            widget = null;
        });

        describe('the started widget', () => {
            beforeEach(async () => {
                await widget.start({ node: container });
            });

            it('Should start and stop', async () => {
                expect(container.childElementCount).toBeGreaterThan(0);
                const input = container.querySelector('select[data-element="input"]');
                expect(input).toBeDefined();
                expect(input.getAttribute('value')).toBeNull();

                await widget.stop();
                expect(container.childElementCount).toBe(0);
                widget = null;
            });

            // this resets the model value but does not change the UI
            // or emit a message via the bus
            // ==> cannot easily be tested
            xit('Should set model value by bus', (done) => {
                bus.on('validation', (msg) => {
                    expect(msg.errorMessage).toBeNull();
                    expect(msg.diagnosis).toBe('valid');
                    done();
                });

                widget.start({ node: container }).then(() => {
                    bus.emit('update', { value: 'foo' });
                });
            });

            // this resets the model value but does not change the UI
            // or emit a message via the bus
            // ==> cannot easily be tested
            xit('Should reset model value by bus', (done) => {
                bus.on('validation', (msg) => {
                    expect(msg.errorMessage).toBeNull();
                    expect(msg.diagnosis).toBe('valid');
                    done();
                });

                widget.start({ node: container }).then(() => {
                    bus.emit('reset-to-defaults');
                });
            });

            it('Should respond to changed select2 option', async () => {
                const initialNodeStructure = container.innerHTML;
                const $select = $(container).find('select');
                const $search =
                    $select.data('select2').dropdown.$search ||
                    $select.data('select2').selection.$search;

                $search.val('stuff').trigger('input');

                // runs doTaxonomySearch
                $select.trigger({
                    type: 'select2:select',
                    params: {
                        data: {},
                    },
                });

                await TestUtil.wait(1000);
                // the DOM structure of the select2 element has changed
                expect(initialNodeStructure).not.toEqual(container.innerHTML);
                // "A Hit" should be present as a search result
                expect($select.data('select2').$results[0].textContent).toContain('A Hit');

                let validationMessage;
                bus.on('validation', (msg) => {
                    validationMessage = msg;
                });
                // set the model value, which triggers a validation message
                $select.val('stuff').trigger('change');
                await TestUtil.wait(1000);
                expect(validationMessage).toEqual({ errorMessage: null, diagnosis: 'valid' });
            });
        });
    });
});
