/*eslint-env jasmine*/
define([
    'widgets/appWidgets2/input/dynamicDropdownInput',
    'base/js/namespace',
    'kbaseNarrative',
    'testUtil',
], (DynamicDropdownInput, Jupyter, Narrative, TestUtil) => {
    'use strict';

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
        };

        beforeEach(() => {
            Jupyter.narrative = new Narrative();
            if (TestUtil.getAuthToken()) {
                document.cookie = 'kbase_session=' + TestUtil.getAuthToken();
                Jupyter.narrative.authToken = TestUtil.getAuthToken();
                Jupyter.narrative.userId = TestUtil.getUserId();
            }
        });

        it('should be real!', () => {
            expect(DynamicDropdownInput).not.toBeNull();
        });

        it('should instantiate with a test config', () => {
            TestUtil.pendingIfNoToken();
            const widget = DynamicDropdownInput.make(testConfig);
            expect(widget).toEqual(jasmine.any(Object));
        });

        it('should start up and stop correctly', (done) => {
            TestUtil.pendingIfNoToken();
            const widget = DynamicDropdownInput.make(testConfig);
            widget
                .start({ node: document.createElement('div') })
                .then(() => {
                    return widget.stop();
                })
                .then(() => {
                    // no-op
                })
                .catch((error) => {
                    console.error(JSON.stringify(error, null, 4));
                    console.error(error.stack);
                    done.fail();
                })
                .finally(() => {
                    done();
                });
        });
    });
});
