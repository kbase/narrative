define(['widgets/appWidgets2/input/dynamicDropdownInput', 'base/js/namespace', 'narrativeMocks', 'testUtil'], (
    DynamicDropdownInput,
    Jupyter,
    Mocks,
    TestUtil
) => {
    'use strict';

    afterAll(() => TestUtil.clearRuntime());

    describe('Test dynamic dropdown input widget', () => {
        const testConfig = {
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
            expect(DynamicDropdownInput).not.toBeNull();
        });

        it('should instantiate with a test config', () => {
            const widget = DynamicDropdownInput.make(testConfig);
            expect(widget).toEqual(jasmine.any(Object));
            ['start', 'stop'].forEach((fn) => {
                expect(widget[fn]).toEqual(jasmine.any(Function));
            });
        });

        it('should start up and stop correctly', () => {
            const widget = DynamicDropdownInput.make(testConfig);
            return widget
                .start({ node: container })
                .then(() => {
                    expect(container.innerHTML).toContain('input-container');
                    return widget.stop();
                })
                .then(() => {
                    expect(container.innerHTML).not.toContain('input-container');
                });
        });
    });
});
