define([
    'react',
    'react-dom',
    'test/unit/utils/domUtils',
    'widgets/function_output/KBaseSets/types/AssemblySetViewer',
    'json!../data/assemblyset_1.json'
], (React, ReactDOM, domUtils, AssemblySetViewer, testData1) => {
    'use strict';

    const { createElement } = React;
    const { render } = ReactDOM;

    describe('The Loader class', () => {
        it('should be defined', () => {
            expect(AssemblySetViewer).toBeDefined();
        });

        it('should render a valid assembly set', async () => {
            const node = document.createElement('div');

            // install our component there
            const el = createElement(AssemblySetViewer, { set: testData1 }, null);
            render(el, node);

            await domUtils.waitFor(() => {
                return node.innerText.includes(testData1.value.description);
            }, 1000);

            expect(true).toBeTrue();

        });
    });
});
