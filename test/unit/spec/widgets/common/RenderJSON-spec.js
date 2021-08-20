define(['widgets/common/RenderJSON'], (RenderJSON) => {
    'use strict';

    const { $renderJSON, $renderJSONArray, $renderJSONObject } = RenderJSON;

    function expectJSON(text, value) {
        switch (typeof value) {
            case 'string':
            case 'number':
            case 'boolean':
                expect(text).toContain(String(value));
                break;
            case 'object':
                if (value === null) {
                    expect(text).toContain('null');
                } else if (Array.isArray(value)) {
                    for (const arrayValue of value) {
                        expectJSON(text, arrayValue);
                    }
                } else {
                    for (const [objectKey, objectValue] of Object.entries(value)) {
                        expect(text).toContain(objectKey);
                        expectJSON(text, objectValue);
                    }
                }
        }
    }

    describe('The RenderJSON collection of functions ', () => {
        it('render scalar JSON-compatible values', () => {
            const values = ['123', 45.67, true, false, null];
            for (const value of values) {
                const $rendered = $renderJSON(value);
                expectJSON($rendered.text(), value);
            }
        });

        it('render "undefined" should be an empty string', () => {
            const $rendered = $renderJSON(undefined);
            expect($rendered.text().length).toEqual(0);
        });

        it('render "un-representable" objects', () => {
            const $rendered = $renderJSON(Symbol());
            expect($rendered.text()).toContain('not representable: "symbol"');
        });

        it('renders a JSON-compatible array', () => {
            const arrayValue = [
                'a string',
                123.456,
                null,
                true,
                false,
                ['nested', 'array'],
                { foo: 'bar' },
            ];
            const $rendered = $renderJSONArray(arrayValue);
            expectJSON($rendered.text(), arrayValue);
        });

        it('renders a JSON-compatible object', () => {
            const objectValue = {
                prop1: 'a string',
                prop2: 123.456,
                prop3: null,
                prop4: true,
                prop5: false,
                prop6: ['nested', 'array'],
                prop7: { foo: 'bar' },
            };
            const $rendered = $renderJSONObject(objectValue);
            expectJSON($rendered.text(), objectValue);
        });
    });
});
