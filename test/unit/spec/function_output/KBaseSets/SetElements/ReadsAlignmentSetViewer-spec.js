define([
    'react',
    'react-dom',
    'test/unit/utils/domUtils',
    'widgets/function_output/KBaseSets/SetElements/ReadsAlignmentSetViewer',
    'json!../data/readsalignmentset_case_01_props.json',
    'json!../data/readsalignmentset_case_01_expected.json',
], (React, ReactDOM, domUtils, ReadsAlignmentSetViewer, case1Props, case1Expected) => {
    'use strict';

    const { createElement } = React;
    const { render } = ReactDOM;

    // 1 second timeout for waiting for async browser changes.
    const ASSERT_TIMEOUT = 1000;

    describe('The ReadsAlignmentSetViewer component', () => {
        it('should render a ReadsAlignment set in a "loaded" async status', async () => {
            const node = document.createElement('div');

            const el = createElement(ReadsAlignmentSetViewer, case1Props, null);
            render(el, node);

            for await (const [label, text] of Object.entries(case1Expected)) {
                await expectAsync(domUtils.waitForText({
                    node, text, label, timeout: ASSERT_TIMEOUT
                })).toBeResolved();
            }
        });
    });
});
