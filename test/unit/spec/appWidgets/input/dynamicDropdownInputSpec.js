/*eslint-env jasmine*/
define([
    'widgets/appWidgets2/input/dynamicDropdownInput',
    'base/js/namespace',
    'kbaseNarrative',
    'narrativeMocks',
], (
    DynamicDropdownInput,
    Jupyter,
    Narrative,
    Mocks,
) => {
    'use strict';

    describe('Test dynamic dropdown input widget', () => {
        const testConfig = {
            parameterSpec: {
                data: {
                    defaultValue: '',
                    nullValue: '',
                    constraints: {
                        required: false
                    }

                },
                original: {
                    dynamic_dropdown_options: {}
                }
            },
            channelName: 'foo'
        },
            AUTH_TOKEN = 'fakeAuthToken';

        beforeEach(() => {
            Mocks.setAuthToken(AUTH_TOKEN);
            Jupyter.narrative = {
                getAuthToken: () => AUTH_TOKEN,
                userId: 'test_user'
            };
        });

        afterEach(() => {
            Mocks.clearAuthToken();
            Jupyter.narrative = null;
        })

        it('should be real', () => {
            expect(DynamicDropdownInput).not.toBeNull();
        });

        it('should instantiate with a test config', () => {
            const widget = DynamicDropdownInput.make(testConfig);
            expect(widget).toEqual(jasmine.any(Object));
        });

        it('should start up and stop correctly', () => {
            const widget = DynamicDropdownInput.make(testConfig);
            const node = document.createElement('div');
            return widget.start({node: node})
                .then(() => {
                    expect(node.innerHTML).toContain('input-container');
                    return widget.stop();
                })
                .then(() => {
                    expect(node.innerHTML).not.toContain('input-container');
                });
        });
    });
});
