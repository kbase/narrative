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
        const testConfig = {
                parameterSpec: {
                    data: {
                        defaultValue: '',
                        nullValue: '',
                        constraints: {
                            required: false,
                        },
                    },
                    ui: {
                        layout: {},
                    },
                    parameters: {
                        spec: {},
                    },
                },
                initialValue: 'bar',
            },
            AUTH_TOKEN = 'fakeAuthToken';
        let container, runtime, bus;

        beforeEach(() => {
            container = document.createElement('div');
            runtime = Runtime.make();
            Mocks.setAuthToken(AUTH_TOKEN);
            Jupyter.narrative = {
                getAuthToken: () => AUTH_TOKEN,
                userId: 'test_user',
            };
            bus = runtime.bus().makeChannelBus({
                description: 'float testing',
            });
            testConfig.paramsChannelName = bus.paramsChannelName;
        });

        afterEach(() => {
            container.remove();
            Mocks.clearAuthToken();
            Jupyter.narrative = null;
            TestUtil.clearRuntime();
            bus.stop();
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
