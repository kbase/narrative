/*jslint white:true,browser:true*/
define([
    'common/html'
], (html) => {
    'use strict';

    describe('html utility library', () => {
        it('Creates a simple tag', () => {
            const span = html.tag('span');
            expect(span('hi')).toEqual('<span>hi</span>');
        });

        it('Creates a tag with attributes', () => {
            const div = html.tag('div');
            expect(div({ class: 'foo' }, 'hello')).toEqual('<div class="foo">hello</div>');
        });

        it('Creates a tag with empty attributes', () => {
            const div = html.tag('div');
            expect(div({}, 'hello')).toEqual('<div>hello</div>');
        });

        it('Creates a tag with a string as attributes', () => {
            const div = html.tag('div');
            expect(div('hi', 'hello')).toEqual('<div>hi</div>');
        });

        it('Creates a tag with false as attributes', () => {
            const div = html.tag('div');
            expect(div(false, 'hello')).toEqual('<div>false</div>');
        });

        it('Creates a tag with true as attributes', () => {
            const div = html.tag('div');
            expect(div(true, 'hello')).toEqual('<div>true</div>');
        });

        it('Creates a tag with null as attributes', () => {
            const div = html.tag('div');
            expect(div(null, 'hello')).toEqual('<div>hello</div>');
        });

        it('Creates a tag with undefined as attributes', () => {
            const div = html.tag('div');
            expect(div(undefined, 'hello')).toEqual('<div>hello</div>');
        });

        it('Creates a tag with a  number as attributes', () => {
            const div = html.tag('div');
            expect(div(42, 'hello')).toEqual('<div>42</div>');
        });

        it('Creates a tag with attribute with  number value', () => {
            const div = html.tag('div');
            expect(div({ foo: 123 }, 'hello')).toEqual('<div foo="123">hello</div>');
        });

        it('Creates a tag with attribute with  null value', () => {
            const div = html.tag('div');
            expect(div({ foo: null }, 'hello')).toEqual('<div>hello</div>');
        });

        it('Creates a tag with attribute with  undefined value', () => {
            const div = html.tag('div');
            expect(div({ foo: undefined }, 'hello')).toEqual('<div>hello</div>');
        });

        it('Creates a tag with attribute with  false value', () => {
            const div = html.tag('div');
            expect(div({ foo: false }, 'hello')).toEqual('<div>hello</div>');
        });

        it('Creates a tag with attribute with  true value', () => {
            const div = html.tag('div');
            expect(div({ foo: true }, 'hello')).toEqual('<div foo>hello</div>');
        });

        it('Creates a tag with attribute with array value', () => {
            const div = html.tag('div');
            expect(div({ foo: ['1', '2', '3'] }, 'hello')).toEqual('<div foo="1 2 3">hello</div>');
        });

        it('Creates a tag with attribute with object value', () => {
            const div = html.tag('div');
            expect(div({ foo: {} }, 'hello')).toEqual('<div>hello</div>');
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