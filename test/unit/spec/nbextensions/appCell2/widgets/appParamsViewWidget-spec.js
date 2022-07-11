define([
    '/narrative/nbextensions/appCell2/widgets/appParamsViewWidget',
    'common/runtime',
    'common/spec',
    'testUtil',
], (AppParamsViewWidget, Runtime, Spec, TestUtil) => {
    'use strict';

    describe('app params view widget tests', () => {
        const appSpec = {
            id: 'NarrativeTest/app_succeed',
            gitCommitHash: '8d1f8480aee9852e9354cf723f0808fae53b2fcc',
            version: '0.0.2',
            tag: 'dev',
            spec: {
                info: {
                    id: 'NarrativeTest/app_succeed',
                    module_name: 'NarrativeTest',
                    git_commit_hash: '8d1f8480aee9852e9354cf723f0808fae53b2fcc',
                    name: 'App Succeed',
                    ver: '0.0.2',
                    subtitle: 'A simple test app that always succeeds.',
                    tooltip: 'A simple test app that always succeeds.',
                    categories: ['active'],
                    authors: ['wjriehl'],
                    input_types: [],
                    output_types: [],
                    app_type: 'app',
                    namespace: 'NarrativeTest',
                },
                widgets: {
                    input: 'null',
                    output: 'no-display',
                },
                parameters: [
                    {
                        id: 'some_param',
                        ui_name: 'A String',
                        short_hint: 'A string.',
                        description: '',
                        field_type: 'text',
                        allow_multiple: 0,
                        optional: 0,
                        advanced: 0,
                        disabled: 0,
                        ui_class: 'parameter',
                        default_values: [''],
                        text_options: {
                            is_output_name: 0,
                            placeholder: '',
                            regex_constraint: [],
                        },
                    },
                ],
                fixed_parameters: [],
                behavior: {
                    kb_service_url: '',
                    kb_service_name: 'NarrativeTest',
                    kb_service_version: '8d1f8480aee9852e9354cf723f0808fae53b2fcc',
                    kb_service_method: 'app_succeed',
                    kb_service_input_mapping: [
                        {
                            input_parameter: 'some_param',
                            target_argument_position: 0,
                        },
                    ],
                    kb_service_output_mapping: [],
                },
                job_id_output_field: 'docker',
            },
        };
        const compiledSpec = Spec.make({ appSpec: appSpec.spec });
        const paramId = 'some_param';
        const initialParams = {
            [paramId]: 'foo',
        };
        const initialDisplay = {
            [paramId]: null,
        };

        afterEach(() => {
            TestUtil.clearRuntime();
        });

        it('should have a factory', () => {
            expect(AppParamsViewWidget.make).toEqual(jasmine.any(Function));
            const bus = Runtime.make().bus();
            const widget = AppParamsViewWidget.make({
                bus,
                initialParams,
                initialDisplay,
            });
            ['start', 'stop', 'bus'].forEach((fn) => {
                expect(widget[fn]).toEqual(jasmine.any(Function));
            });
        });

        describe('starting and stopping with simple value', () => {
            let bus, node;

            async function runSimpleTest(widget) {
                await widget.start({
                    node,
                    appSpec: appSpec.spec,
                    parameters: compiledSpec.getSpec().parameters,
                });
                checkRendering();
                await widget.stop();
                expect(node.innerHTML).toBe('');
            }

            function checkRendering() {
                // get the (single) input element, ensure it has the startup value
                const inputElem = node.querySelector('input[data-element="input"]');
                expect(inputElem).not.toBeNull();
                expect(inputElem.value).toEqual(initialParams[paramId]);
            }

            beforeEach(() => {
                bus = Runtime.make().bus();
                bus.respond({
                    key: {
                        type: 'get-batch-mode',
                    },
                    handle: () => {
                        return false;
                    },
                });
                node = document.createElement('div');
                document.body.appendChild(node);
            });

            afterEach(() => {
                node.remove();
            });

            it('should start and stop as expected, and have an accessible bus', async () => {
                const widget = AppParamsViewWidget.make({
                    bus,
                    initialParams,
                    initialDisplay,
                });
                await runSimpleTest(widget);
            });

            it('should start with missing display values', async () => {
                const widget = AppParamsViewWidget.make({
                    bus,
                    initialParams,
                });
                await runSimpleTest(widget);
            });

            it('should start with specific missing display value', async () => {
                const widget = AppParamsViewWidget.make({
                    bus,
                    initialParams,
                    initialDisplay: {},
                });
                await runSimpleTest(widget);
            });
        });
    });
});
