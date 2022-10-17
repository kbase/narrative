define(['widgets/common/JSONView'], ($JSONView) => {
    'use strict';
    describe('The $JSONView widget', () => {
        it('should display instances of scalar JSON-compatible values', () => {
            const values = [
                ['hello', 'hello'],
                [123, '123'],
                [123.456, '123.456'],
                [true, 'true'],
                [false, 'false'],
                [null, 'NULL'],
            ];
            for (const [value, text] of values) {
                const $testDiv = $JSONView(value);
                expect($testDiv).toBeDefined();
                expect($testDiv.text()).toContain(text);
            }
        });

        it('should display a JSON-compatible array', () => {
            const testValue = [
                ['hello', 'hello'],
                [123, '123'],
                [123.456, '123.456'],
                [true, 'true'],
                [false, 'false'],
                [null, 'NULL'],
            ];
            const values = testValue.map(([value]) => {
                return value;
            });
            const $testDiv = $JSONView(values);
            for (const [, text] of testValue) {
                expect($testDiv.text()).toContain(text);
            }
        });

        it('should display a JSON-compatible object', () => {
            const testValue = {
                foo: 'bar',
                baz: 12345,
                positively: true,
                negatory: false,
                absolutely: null,
            };
            const expected = ['bar', '12345', 'true', 'false', 'NULL'];

            const $testDiv = $JSONView(testValue);
            for (const [, text] of expected) {
                expect($testDiv.text()).toContain(text);
            }
        });

        it('should display a JSON-compatible object with nested array and object', () => {
            const testValue = {
                pets: ['dog', 'cat', 'snake', 'mouse'],
                food: {
                    breakfast: ['kibbles', 'bits'],
                    lunch: ['rodent'],
                    dinner: ['seeds', 'water'],
                    snacks: {
                        dry: ['chips'],
                        wet: ['soda'],
                    },
                },
            };
            const expected = [
                'dog',
                'cat',
                'snake',
                'mouse',
                'kibbles',
                'bits',
                'rodent',
                'seeds',
                'water',
                'chips',
                'soda',
            ];

            const $testDiv = $JSONView(testValue);
            for (const [, text] of expected) {
                expect($testDiv.text()).toContain(text);
            }
        });

        it('should display instances of incompatible values as "Not representable"', () => {
            const values = [
                [undefined, 'undefined'],
                [new Date(), 'object (Date)'],
            ];
            for (const [value, text] of values) {
                const $testDiv = $JSONView(value);
                expect($testDiv).toBeDefined();
                expect($testDiv.text()).toContain(`Not representable: ${text}`);
            }
        });
    });
});
