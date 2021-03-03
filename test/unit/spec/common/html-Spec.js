define(['common/html'], (html) => {
    'use strict';

    describe('html utility library', () => {
        // camelToKebab
        it('Converts camelCaseToHyphen', () => {
            expect(html.camelToKebab('camelCase')).toEqual('camel-case');
            expect(html.camelToKebab('CamelCase')).toEqual('-camel-case');
            expect(html.camelToKebab('camel')).toEqual('camel');
            expect(html.camelToKebab('CASE')).toEqual('-c-a-s-e');
        });

        // genId
        it('Generates an id', () => {
            expect(html.genId()).toMatch(/^kb_html_.*$/);
        });

        // Loading
        it('Makes a loading message', () => {
            let loading = html.loading();
            expect(loading).toEqual(
                '<span><i class="fa fa-spinner fa-pulse fa-2x fa-fw margin-bottom"></i></span>'
            );

            loading = html.loading('Loading...');
            expect(loading).toEqual(
                '<span>Loading... &nbsp;&nbsp;<i class="fa fa-spinner fa-pulse fa-2x fa-fw margin-bottom"></i></span>'
            );
        });

        // makePanel
        it('Makes a panel', () => {
            const panelDef = [
                {
                    title: 'Panel 1',
                    body: 'This is panel 1',
                },
                {
                    title: 'Panel2',
                    body: 'This is panel 2',
                },
            ];
            const panelContent =
                '<div class="panel panel-default"><div class="panel-heading"><span class="panel-title"></span></div><div class="panel-body"></div></div>';
            const panel = html.makePanel(panelDef);
            expect(panel).toEqual(panelContent);
        });

        // makeTabs
        it('Makes tabs', () => {
            const arg = {
                id: '123',
                alignRight: false,
                tabs: [
                    {
                        name: 'tab1',
                        label: 'Tab One',
                        content: 'This is tab one',
                    },
                    {
                        name: 'tab2',
                        label: 'Tab Two',
                        content: 'This is tab two',
                    },
                    null,
                ],
            };
            const expected = new RegExp(
                '<div id="123"><ul class="nav nav-tabs" role="tablist"><li role="presentation" class="active" style=""><a href="#kb_html_[^"]+" aria-controls="home" role="tab" data-toggle="tab">Tab One</a></li><li role="presentation" style=""><a href="#kb_html_[^"]+" aria-controls="home" role="tab" data-toggle="tab">Tab Two</a></li></ul><div class="tab-content"><div role="tabpanel" class="tab-pane active" id="kb_html_[^"]+" data-name="tab1">This is tab one</div><div role="tabpanel" class="tab-pane" id="kb_html_[^"]+" data-name="tab2">This is tab two</div></div></div>'
            );
            const tabs = html.makeTabs(arg);
            expect(tabs).toMatch(expected);
        });

        it('Makes tabs right aligned', () => {
            const arg = {
                id: '123',
                alignRight: true,
                tabs: [
                    {
                        name: 'tab1',
                        label: 'Tab One',
                        content: 'This is tab one',
                    },
                    {
                        name: 'tab2',
                        label: 'Tab Two',
                        content: 'This is tab two',
                    },
                ],
            };
            const expected = new RegExp(
                '<div id="123"><ul class="nav nav-tabs" role="tablist"><li role="presentation" style="float: right"><a href="#kb_html_[^"]+" aria-controls="home" role="tab" data-toggle="tab">Tab Two</a></li><li role="presentation" class="active" style="float: right"><a href="#kb_html[^"]+" aria-controls="home" role="tab" data-toggle="tab">Tab One</a></li></ul><div class="tab-content"><div role="tabpanel" class="tab-pane active" id="kb_html_[^"]+" data-name="tab1">This is tab one</div><div role="tabpanel" class="tab-pane" id="kb_html_[^"]+" data-name="tab2">This is tab two</div></div></div>'
            );

            const tabs = html.makeTabs(arg);

            expect(tabs).toMatch(expected);
        });

        // merge
        it('Merges two simple objects', () => {
            const x = { foo: 'bar' };
            const y = { bing: 'bong' };
            const z = html.merge(x, y);
            expect(z).toEqual({ foo: 'bar', bing: 'bong' });
        });

        it('Merges two nested objects', () => {
            const x = { foo: 'bar', name: { middle: 'M' } };
            const y = { bing: 'bong', name: { first: 'Mickey', last: 'Mouse' } };
            const z = html.merge(x, y);
            expect(z).toEqual({
                foo: 'bar',
                bing: 'bong',
                name: { first: 'Mickey', middle: 'M', last: 'Mouse' },
            });
        });

        // isSimpleObject
        it('Determine if a value is a simple object', () => {
            const cases = [
                {
                    value: 'hi',
                    expected: false,
                },
                {
                    value: 42,
                    expected: false,
                },
                {
                    value: true,
                    expected: false,
                },
                {
                    value: false,
                    expected: false,
                },
                {
                    value: 'hi',
                    expected: false,
                },
                {
                    value: null,
                    expected: false,
                },
                {
                    value: undefined,
                    expected: false,
                },
                {
                    value: new Date(),
                    expected: false,
                },
                {
                    value: {},
                    expected: true,
                },
                {
                    value: { foo: 'bar' },
                    expected: true,
                },
            ];
            for (const { value, expected } of cases) {
                expect(html.isSimpleObject(value)).toEqual(expected);
            }
        });

        // tag

        it('Creates a simple tag', () => {
            const span = html.tag('span');
            expect(span('hi')).toEqual('<span>hi</span>');
        });

        it('Creates a tag with attributes', () => {
            const div = html.tag('div');
            expect(div({ class: 'foo', bar: 42 }, 'hello')).toEqual(
                '<div class="foo" bar="42">hello</div>'
            );
        });

        it('Creates a tag with empty attributes', () => {
            const div = html.tag('div');
            expect(div({}, 'hello')).toEqual('<div>hello</div>');
        });

        it('Creates a tag with a string as attributes', () => {
            const div = html.tag('div');
            expect(div('hi', 'hello')).toEqual('<div>hello</div>');
        });

        it('Creates a tag with false as attributes', () => {
            const div = html.tag('div');
            expect(div(false, 'hello')).toEqual('<div>hello</div>');
        });

        it('Creates a tag with true as attributes', () => {
            const div = html.tag('div');
            expect(div(true, 'hello')).toEqual('<div>hello</div>');
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
            expect(div(42, 'hello')).toEqual('<div>hello</div>');
        });

        it('Creates a tag without a closing tag', () => {
            const z = html.tag('z', { close: false });
            expect(z()).toEqual('<z>');
        });

        it('Creates a tag with attribute with  number value', () => {
            const x = html.tag('x', { attribs: { foo: 'bar' } });
            expect(x({ ping: 'pong' }, 'hello')).toEqual('<x foo="bar" ping="pong">hello</x>');
        });

        it('Creates a tag with attributes, overrides with and without cached tag', () => {
            const y = html.tag('y', { attribs: { foo: 'bar' } });
            expect(y()).toEqual('<y foo="bar"></y>');

            const y1 = html.tag('y');
            expect(y1()).toEqual('<y foo="bar"></y>');

            const y2 = html.tag('y', { attribs: { foo: 'baz' }, ignoreCache: true });
            expect(y2()).toEqual('<y foo="baz"></y>');

            const y3 = html.tag('y', { ignoreCache: true });
            expect(y3({ bee: 'buzz' })).toEqual('<y bee="buzz"></y>');

            const y4 = html.tag('y');
            expect(y4()).toEqual('<y foo="bar"></y>');
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

        it('Creates a tag with a class attribute with array value', () => {
            const div = html.tag('div');
            expect(div({ class: ['1', '2', '3'] }, 'hello')).toEqual(
                '<div class="1 2 3">hello</div>'
            );
        });

        it('Creates a tag with non-style attribute with object value', () => {
            const div = html.tag('div');
            expect(div({ foo: {} }, 'hello')).toEqual('<div>hello</div>');
        });

        it('Creates a tag with style', () => {
            const div = html.tag('div');
            expect(div({ style: { color: 'red', fontWeight: 'bold' } }, 'hello')).toEqual(
                '<div style="color: red; font-weight: bold">hello</div>'
            );
        });

        it('Creates a tag with various style types', () => {
            const div = html.tag('div');
            expect(
                div(
                    {
                        style: {
                            color: 'red',
                            foo: 1,
                            bar: true,
                            baz: false,
                            a: null,
                            b: {},
                            c: undefined,
                        },
                    },
                    'hello'
                )
            ).toEqual('<div style="color: red; foo: 1">hello</div>');
        });

        it('Creates a nested tag', () => {
            const div = html.tag('div');
            expect(div(div(div('hi')))).toEqual('<div><div><div>hi</div></div></div>');
        });

        it('Creates a tag with an array content', () => {
            const div = html.tag('div');
            expect(div([])).toEqual('<div></div>');
            expect(div(['hello', 'there'])).toEqual('<div>hellothere</div>');
            expect(div([123, 456])).toEqual('<div>123456</div>');
        });

        it('Creates a tag with an array tag content', () => {
            const div = html.tag('div');
            expect(div([div('hi'), div('hello')])).toEqual(
                '<div><div>hi</div><div>hello</div></div>'
            );
        });

        it('Creates a tag with non-string content', () => {
            const div = html.tag('div');
            const content = [
                {
                    value: 42,
                    expected: '42',
                },
                {
                    value: 123.456,
                    expected: '123.456',
                },
                {
                    value: true,
                    expected: '',
                },
                {
                    value: false,
                    expected: '',
                },
                {
                    value: null,
                    expected: '',
                },
                {
                    value: undefined,
                    expected: '',
                },
                {
                    value: new Date(),
                    expected: '',
                },
            ];
            for (const { value, expected } of content) {
                expect(div(value)).toEqual(`<div>${expected}</div>`);
            }
        });
    });
});
