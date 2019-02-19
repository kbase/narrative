/*eslint-env jasmine*/
define([
    'widgets/appWidgets2/input/subdataInput',
    'base/js/namespace',
    'kbaseNarrative',
    'testUtil'
], function(
    SubdataInput,
    Jupyter,
    Narrative,
    TestUtil
) {
    'use strict';

    describe('Test subobject data input widget', function() {
        var testConfig = {
            parameterSpec: {
                data: {
                    defaultValue: '',
                    nullValue: '',
                    constraints: {
                        required: false
                    }

                },
                original: {
                    text_subdata_options: {}
                }
            },
            channelName: 'foo'
        };

        beforeEach(function() {
            if (TestUtil.getAuthToken()) {
                document.cookie = 'kbase_session=' + TestUtil.getAuthToken();
                Jupyter.narrative = new Narrative();
                Jupyter.narrative.authToken = TestUtil.getAuthToken();
                Jupyter.narrative.userId = TestUtil.getUserId();
            }
        });

        it('should be real!', function() {
            expect(SubdataInput).not.toBeNull();
        });

        it('should instantiate with a test config', function() {
            TestUtil.pendingIfNoToken();
            var widget = SubdataInput.make(testConfig);
            expect(widget).toEqual(jasmine.any(Object));
        });
    });
});
