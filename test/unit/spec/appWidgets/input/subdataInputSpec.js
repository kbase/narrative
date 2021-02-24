define([
    'widgets/appWidgets2/input/subdataInput',
    'base/js/namespace',
    'kbaseNarrative',
    'testUtil',
], (SubdataInput, Jupyter, Narrative, TestUtil) => {
    'use strict';

    describe('Test subobject data input widget', () => {
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
                    text_subdata_options: {},
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
            expect(SubdataInput).not.toBeNull();
        });

        it('should instantiate with a test config', () => {
            TestUtil.pendingIfNoToken();
            const widget = SubdataInput.make(testConfig);
            expect(widget).toEqual(jasmine.any(Object));
        });
    });
});
