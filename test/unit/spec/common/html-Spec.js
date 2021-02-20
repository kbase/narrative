/*jslint white:true,browser:true*/
define([
    'common/html'
], (html) => {
    'use strict';

    fdescribe('html utility library', () => {
        it('Creates a simple tag', () => {
            const span = html.tag('span');
            expect(span('hi')).toEqual('<span>hi</span>');
        });

        it('Creates a tag with attributes', () => {
            const div = html.tag('div');
            expect(div({ class: 'foo' }, 'hello')).toEqual('<div class="foo">hello</div>');
        });

        it('Creates a tag with style', () => {
            const div = html.tag('div');
            expect(div({ style: { color: 'red', fontWeight: 'bold' } }, 'hello')).toEqual('<div style="color: red; font-weight: bold">hello</div>');
        });

        it('Creates a tag with various style types', () => {
            const div = html.tag('div');
            expect(div({ style: { color: 'red', foo: 1, bar: true, baz: false, a: null, b: {}, c: undefined } }, 'hello'))
                .toEqual('<div style="color: red; foo: 1">hello</div>');
        });

        it('Creates a nested tag', () => {
            const div = html.tag('div');
            expect(div(div(div('hi')))).toEqual('<div><div><div>hi</div></div></div>');
        });

        it('Converts camelCaseToHyphen', () => {
            expect(html.camelToKebab('camelCase')).toEqual('camel-case');
            expect(html.camelToKebab('CamelCase')).toEqual('-camel-case');
            expect(html.camelToKebab('camel')).toEqual('camel');
            expect(html.camelToKebab('CASE')).toEqual('-c-a-s-e');
        });

    });
});