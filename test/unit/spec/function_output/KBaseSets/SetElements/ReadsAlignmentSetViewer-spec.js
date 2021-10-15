define([
    'test/unit/utils/domUtils',
    'widgets/function_output/KBaseSets/SetElements/ReadsAlignmentSetViewer',
    'json!../data/readsalignmentset_case_01_props.json',
    'json!../data/readsalignmentset_case_01_expected.json',
], (domUtils, ReadsAlignmentSetViewer, case1Props, case1Expected) => {
    'use strict';

    // 1 second timeout for waiting for async browser changes.
    const ASSERT_TIMEOUT = 1000;

    describe('The ReadsAlignmentSetViewer component', () => {
        it('should render a ReadsAlignment set in a "loaded" async status', async () => {

            const { node } = domUtils.renderComponent(ReadsAlignmentSetViewer, case1Props);

            for await (const [label, text] of Object.entries(case1Expected)) {
                await expectAsync(domUtils.waitForText({
                    node, text, label, timeout: ASSERT_TIMEOUT
                })).toBeResolved();
            }
        });
    });
});
