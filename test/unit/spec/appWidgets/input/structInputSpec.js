define([
    'widgets/appWidgets2/input/structInput',
    'base/js/namespace',
    'narrativeMocks',
    'testUtil',
    // 'common/monoBus'
    'common/runtime',
], (StructInput, Jupyter, Mocks, TestUtil, Runtime) => {
    'use strict';

    describe('Struct Input Widget', () => {
        const runtime = Runtime.make();
        const bus = runtime.bus();
        const testConfig = {
                bus: bus,
                parameterSpec: {
                    data: {
                        defaultValue: '',
                        nullValue: '',
                        constraints: {
                            required: false,
                        },
                    },
                    original: {
                        dynamic_dropdown_options: {},
                    },
                    ui: {
                        layout: {},
                    },
                },
                channelName: 'foo',
            },
            AUTH_TOKEN = 'fakeAuthToken';
        let container;

        beforeEach(() => {
            container = document.createElement('div');
            Mocks.setAuthToken(AUTH_TOKEN);
            Jupyter.narrative = {
                getAuthToken: () => AUTH_TOKEN,
                userId: 'test_user',
            };
        });

        afterEach(() => {
            container.remove();
            Mocks.clearAuthToken();
            Jupyter.narrative = null;
            TestUtil.clearRuntime();
        });

        it('should be defined', () => {
            expect(StructInput).not.toBeNull();
        });

        it('should instantiate with a test config', () => {
            const widget = StructInput.make(testConfig);
            expect(widget).toEqual(jasmine.any(Object));
            ['start', 'stop'].forEach((fn) => {
                expect(widget[fn]).toEqual(jasmine.any(Function));
            });
        });
    });
});
