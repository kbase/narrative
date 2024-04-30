define(['preact', 'htm', 'preactComponents/Loading', './utils'], (preact, htm, Loading, utils) => {
    'use strict';

    const { h } = preact;
    const html = htm.bind(h);

    const { createBodyElement } = utils;

    describe('The Loading preact component', () => {
        it('should render with a message provided as a prop', () => {
            const container = document.createElement('div');
            const content = html` <${Loading} message="Foo" /> `;
            preact.render(content, container);

            expect(container.innerText).toContain('Foo');
        });

        it('should render with size "normal" which should be smaller than default', () => {
            const container = createBodyElement();
            const content = html` <${Loading} message="Foo" size="normal" /> `;
            preact.render(content, container);

            const { height: h1, width: w1 } = container
                .querySelector('.fa-spinner')
                .getBoundingClientRect();

            const container2 = createBodyElement();

            const content2 = html` <${Loading} message="Foo" /> `;
            preact.render(content2, container2);

            const { height: h2, width: w2 } = container2
                .querySelector('.fa-spinner')
                .getBoundingClientRect();

            expect(h1).toBeLessThan(h2);
            expect(w1).toBeLessThan(w2);

            expect(container.innerText).toContain('Foo');

            container.remove();
            container2.remove();
        });

        it('should render with size "normal" which should be smaller than "large"', () => {
            const container = createBodyElement();
            const content = html` <${Loading} message="Foo" size="normal" /> `;
            preact.render(content, container);

            const { height: h1, width: w1 } = container
                .querySelector('.fa-spinner')
                .getBoundingClientRect();

            const container2 = createBodyElement();

            const content2 = html` <${Loading} message="Foo" size="large" /> `;
            preact.render(content2, container2);

            const { height: h2, width: w2 } = container2
                .querySelector('.fa-spinner')
                .getBoundingClientRect();

            expect(h1).toBeLessThan(h2);
            expect(w1).toBeLessThan(w2);

            expect(container.innerText).toContain('Foo');

            container.remove();
            container2.remove();
        });

        it('should render with as display type "inline"', () => {
            const container = document.createElement('div');
            const content = html` <${Loading} message="Foo" display="inline" /> `;
            preact.render(content, container);

            expect(container.innerText).toContain('Foo');
            expect(container.querySelector('.preactComponent-Loading-Inline')).not.toBeNull();
            expect(container.querySelector('[data-display="inline"]')).not.toBeNull();
        });

        it('should render with default display type "block"', () => {
            const container = document.createElement('div');
            const content = html` <${Loading} message="Foo" display="block" /> `;
            preact.render(content, container);

            expect(container.innerText).toContain('Foo');
            expect(container.querySelector('[data-display="block"]')).not.toBeNull();
        });

        it('should render with default display type', () => {
            const container = document.createElement('div');
            const content = html` <${Loading} message="Foo" /> `;
            preact.render(content, container);

            expect(container.innerText).toContain('Foo');
            expect(container.querySelector('[data-display="block"]')).not.toBeNull();
        });
    });
});
