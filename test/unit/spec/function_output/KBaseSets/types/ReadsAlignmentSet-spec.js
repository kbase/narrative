define([
    'react',
    'react-dom',
    'test/unit/utils/domUtils',
    'widgets/function_output/KBaseSets/types/ReadsAlignmentSetViewer',
    'json!../data/readsalignmentset_1.json'
], (React, ReactDOM, domUtils, ReadsAlignmentSetViewer, testData1) => {
    'use strict';

    const { createElement } = React;
    const { render } = ReactDOM;

    describe('The Loader class', () => {
        it('should be defined', () => {
            expect(ReadsAlignmentSetViewer).toBeDefined();
        });

        it('should render a valid reads alignment set', async () => {
            const node = document.createElement('div');

            // install our component there
            const el = createElement(ReadsAlignmentSetViewer, { set: testData1 }, null);
            render(el, node);

            await domUtils.waitFor(() => {
                return node.innerText.includes(testData1.value.description);
            }, 1000);

            expect(true).toBeTrue();

        });
    });
});
