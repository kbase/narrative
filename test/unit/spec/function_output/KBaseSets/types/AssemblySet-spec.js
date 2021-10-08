define([
    'react',
    'react-dom',
    'test/unit/utils/domUtils',
    'widgets/function_output/KBaseSets/types/AssemblySet',
    'json!../data/assemblyset_1.json'
], (React, ReactDOM, domUtils, AssemblySet, testData1) => {
    'use strict';

    const { createElement } = React;
    const { render } = ReactDOM;

    describe('The Loader class', () => {
        it('should be defined', () => {
            expect(AssemblySet).toBeDefined();
        });

        it('should render a valid assembly set', async () => {
            const node = document.createElement('div');

            // install our component there
            const el = createElement(AssemblySet, { set: testData1, setItem: () => { } }, null);
            render(el, node);

            await domUtils.waitFor(() => {
                return node.innerText.includes(testData1.value.description);
            }, 1000);

            expect(true).toBeTrue();

        });
    });
});
