define(['react_components/ErrorMessage', 'react', 'react-dom'], (ErrorMessage, React, ReactDOM) => {
    'use strict';

    const { createElement } = React;
    const { render } = ReactDOM;

    describe('The ErrorMessage class', () => {
        it('should be defined', () => {
            expect(ErrorMessage).toBeDefined();
        });

        it('should display a simple string error message', () => {

            // create a dom node.
            const node = document.createElement('div');

            // install our component there
            const el = createElement(ErrorMessage, { error: 'foo' }, null);
            render(el, node);
            expect(node.innerText).toContain('foo');
        });

        it('should display a simple Error object message', () => {
            // create a dom node.
            const node = document.createElement('div');

            // install our component there
            const el = createElement(ErrorMessage, { error: new Error('bar') }, null);
            render(el, node);
            expect(node.innerText).toContain('bar');
        });

        it('should display a simple Error-like object', () => {
            // create a dom node.
            const node = document.createElement('div');

            // install our component there
            const el = createElement(ErrorMessage, { error: { message: 'baz' } }, null);
            render(el, node);
            expect(node.innerText).toContain('baz');
        });

        it('should display a KBase service-error-like object', () => {
            // create a dom node.
            const node = document.createElement('div');

            // install our component there
            const el = createElement(ErrorMessage, { error: { error: { message: 'buzz' } } }, null);
            render(el, node);
            expect(node.innerText).toContain('buzz');
        });

        it('should display a default error message if it is an unsupported scalar type', () => {
            // create a dom node.
            const node = document.createElement('div');

            // install our component there
            const unsupportedTypes = [
                null,
                true,
                false,
                1,
                0,
                -1,
                undefined
            ];
            for (const unsupported of unsupportedTypes) {
                const el = createElement(ErrorMessage, { error: unsupported });
                render(el, node);
                expect(node.innerText).toContain('Unknown Error (incompatible type)');
            }
        });

        it('should display a default error message if it is an unsupported object', () => {
            // create a dom node.
            const node = document.createElement('div');

            // install our component there
            const unsupportedTypes = [
                {},
                { foo: 'bar' },
                [],
                [1, 2, 3],
                new Date(),
                new URL('https://example.com'),
                new Number(1),
                new String('foo') // yes, _could_ be supported...
            ];
            for (const unsupported of unsupportedTypes) {
                const el = createElement(ErrorMessage, { error: unsupported });
                render(el, node);
                expect(node.innerText).toContain('Unknown Error (incompatible object)');
            }
        });
    });
});
