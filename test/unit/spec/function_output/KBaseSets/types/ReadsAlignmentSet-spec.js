define([
    'react',
    'react-dom',
    'test/unit/utils/domUtils',
    'widgets/function_output/KBaseSets/types/ReadsAlignmentSet',
    'json!../data/readsalignmentset_1.json'
], (React, ReactDOM, domUtils, ReadsAlignmentSet, testData1) => {
    'use strict';

    const { createElement } = React;
    const { render } = ReactDOM;

    describe('The Loader class', () => {
        it('should be defined', () => {
            expect(ReadsAlignmentSet).toBeDefined();
        });

        it('should render a valid reads alignment set', async () => {
            const node = document.createElement('div');

            // install our component there
            const el = createElement(ReadsAlignmentSet, { set: testData1, setItem: () => { } }, null);
            render(el, node);

            await domUtils.waitFor(() => {
                return node.innerText.includes(testData1.value.description);
            }, 1000);

            expect(true).toBeTrue();

        });
    });
});
