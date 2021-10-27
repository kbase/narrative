define([
    'testUtils/domUtils',
    'widgets/function_output/KBaseSets/SetElements/AssemblySetViewer',
    'json!../data/assemblyset_case_01_props.json',
    'json!../data/assemblyset_case_01_expected.json',
], (domUtils, AssemblySetViewer, case1Props, case1Expected) => {
    'use strict';

    // 1 second timeout for waiting for async browser changes.
    const ASSERT_TIMEOUT = 1000;

    describe('The AssemblySetViewer component', () => {
        it('should render an assembly set in a "loaded" async status', async () => {
            const { node } = domUtils.renderComponent(AssemblySetViewer, case1Props);

            for await (const [label, text] of Object.entries(case1Expected)) {
                await expectAsync(domUtils.waitForText({
                    node, text, label, timeout: ASSERT_TIMEOUT
                })).toBeResolved();
            }
        });
    });
});
