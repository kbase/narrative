define([
    'react',
    'react-dom',
    'test/unit/utils/domUtils',
    'widgets/function_output/KBaseSets/SetElements/AssemblySetViewer',
    'json!../data/assemblyset_case_01_props.json',
    'json!../data/assemblyset_case_01_expected.json',
    // 'json!../data/assemblyset_case_02_props.json',
    // 'json!../data/assemblyset_case_03_props.json',
    // 'json!../data/assemblyset_case_04_props.json',
    // 'json!../data/assemblyset_case_03_expected.json',
    // 'json!../data/assemblyset_case_04_expected.json'
], (React, ReactDOM, domUtils, AssemblySetViewer, case1Props, case1Expected) => {
    'use strict';

    const { createElement } = React;
    const { render } = ReactDOM;

    // 1 second timeout for waiting for async browser changes.
    const ASSERT_TIMEOUT = 1000;

    describe('The AssemblySetViewer component', () => {
        // it('should render a loading indicator in a "null" async status', async () => {
        //     const node = document.createElement('div');

        //     const el = createElement(AssemblySetViewer, case1Props, null);
        //     render(el, node);

        //     await expectAsync(domUtils.waitForText({
        //         node, text: "Loading...", label: "Loading Message", timeout: ASSERT_TIMEOUT
        //     })).toBeResolved();
        // });

        // it('should render a loading indicator in a "loading" async status', async () => {
        //     const node = document.createElement('div');

        //     const el = createElement(AssemblySetViewer, case2Props, null);
        //     render(el, node);

        //     await expectAsync(domUtils.waitForText({
        //         node, text: "Loading...", label: "Loading Message", timeout: ASSERT_TIMEOUT
        //     })).toBeResolved();
        // });

        // it('should render an error message set in a "error" async status', async () => {
        //     const node = document.createElement('div');

        //     const el = createElement(AssemblySetViewer, case3Props, null);
        //     render(el, node);

        //     await expectAsync(domUtils.waitForText({
        //         node, text: case3Expected.message, label: "Error Message", timeout: ASSERT_TIMEOUT
        //     })).toBeResolved();
        // });

        it('should render an assembly set in a "loaded" async status', async () => {
            const node = document.createElement('div');

            // install our component there
            const el = createElement(AssemblySetViewer, case1Props, null);
            render(el, node);

            for await (const [label, text] of Object.entries(case1Expected)) {
                await expectAsync(domUtils.waitForText({
                    node, text, label, timeout: ASSERT_TIMEOUT
                })).toBeResolved();
            }
        });
    });
});
