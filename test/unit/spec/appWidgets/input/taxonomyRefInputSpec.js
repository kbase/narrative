/* eslint-env jasmine */
define([
    'jquery',
    'testUtil',
    'common/runtime',
    'widgets/appWidgets2/input/taxonomyRefInput',
    'base/js/namespace',
    'kbaseNarrative',
], ($, TestUtil, Runtime, TaxonomyRefInput, Jupyter, Narrative) => {
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

        beforeEach(function () {
            const runtime = Runtime.make();
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
        });

        afterEach(function () {
            jasmine.Ajax.uninstall();
            this.bus.stop();
            window.kbaseRuntime = null;
            Jupyter.narrative = null;
        });

        it('Should be instantiable', function () {
            const widget = TaxonomyRefInput.make(this.testConfig);
            expect(widget).toEqual(jasmine.any(Object));
            ['start', 'stop'].forEach((fn) => {
                expect(widget[fn]).toBeDefined();
                expect(widget[fn]).toEqual(jasmine.any(Function));
            });
        });

        describe('the started widget', () => {
            beforeEach(async function () {
                this.widget = TaxonomyRefInput.make(this.testConfig);
                await this.widget.start({ node: this.node });
            });
            it('should start successfully', function () {
                expect(
                    this.node.querySelector('div[data-element="main-panel"]').innerHTML
                ).toContain('data-element="input-container"');
            });
            it('should stop successfully', async function () {
                await this.widget.stop();
                expect(this.node.innerHTML).toEqual('');
            });

            describe('something', () => {
                const STANDARD_TIMEOUT = 5000;
                beforeEach(function () {
                    this.bus.on('validation', (msg) => {
                        this.validationMsg = msg;
                    });
                    this.bus.on('changed', (msg) => {
                        this.changedMsg = msg;
                        console.log('change message: ' + this.changedMsg);
                    });
                });

                xit('Should set model value by bus', function (done) {
                    this.bus.emit('update', { value: 'foo' });
                    // setTimeout(() => {
                        expect(this.validationMsg).toBeDefined();
                        expect(this.validationMsg.errorMessage).toBeNull();
                        expect(this.validationMsg.diagnosis).toBe('valid');
                        done()
                    // }, STANDARD_TIMEOUT);
                });

                xit('Should reset model value by bus', function (done) {
                    this.bus.emit('reset-to-defaults');
                    // setTimeout(() => {
                        expect(this.validationMsg).toBeDefined();
                        expect(this.validationMsg.errorMessage).toBeNull();
                        expect(this.validationMsg.diagnosis).toBe('valid');
                        done()
                    // }, STANDARD_TIMEOUT);
                });

                xit('Should respond to changed select2 option', function (done) {
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
                    $select.val('stuff').trigger('change');
                    // setTimeout(() => {
                        expect(this.changedMsg).toBeDefined();
                        done()
                    // }, STANDARD_TIMEOUT);
                });
            });
        });
    });
});
