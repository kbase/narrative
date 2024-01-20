define(['jquery', 'preact', 'htm', 'preactComponents/ErrorAlert'], ($, preact, htm, ErrorAlert) => {
    'use strict';

    const { h } = preact;
    const html = htm.bind(h);

    describe('The ErrorAlert preact component', () => {
        it('should render with a message provided as a prop', () => {
            const container = document.createElement('div');
            const content = html` <${ErrorAlert} message="Foo" /> `;
            preact.render(content, container);

            expect(container.innerText).toContain('Foo');
        });

        it('should render with a message provided as children', () => {
            const container = document.createElement('div');
            const content = html` <${ErrorAlert}>Baz</${ErrorAlert}> `;
            preact.render(content, container);
            expect(container.innerText).toContain('Baz');
        });

        it('should render with a provided title', () => {
            const container = document.createElement('div');
            const content = html` <${ErrorAlert} message="Foo" title="Bar" /> `;
            preact.render(content, container);

            expect(container.innerText).toContain('Foo');
            expect(container.innerText).toContain('Bar');
        });
    });
});
