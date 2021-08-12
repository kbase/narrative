define(['widgets/common/ErrorMessage', 'jsonrpc/1.1/errors', 'jsonrpc/1.1/jsonrpcErrors'], (
    $ErrorMessage,
    errors,
    jsonrpcErrors
) => {
    'use strict';
    function expectFooterMessage($node) {
        expect($node.text()).toContain('contact the KBase team');
    }

    function expectTitle($node, title = 'Error!') {
        expect($node.text()).toContain(title);
    }

    describe('The $ErrorMessage widget', () => {
        it('should be defined', () => {
            expect($ErrorMessage).toBeDefined();
        });

        it('should display a string error message', () => {
            const message = 'I am an error';
            const $testDiv = $ErrorMessage(message);
            expect($testDiv).toBeDefined();
            expect($testDiv.text()).toContain(message);
            expectTitle($testDiv);
            expectFooterMessage($testDiv);
        });

        it('should display an Error-based exception', () => {
            const message = 'I am an exception';
            try {
                throw new Error(message);
            } catch (ex) {
                const $testDiv = $ErrorMessage(ex);
                expect($testDiv).toBeDefined();
                expect($testDiv.text()).toContain(message);
                expectTitle($testDiv);
                expectFooterMessage($testDiv);
            }
        });

        it('should display a custom title', () => {
            const message = 'I am an exception';
            try {
                throw new Error(message);
            } catch (ex) {
                const $testDiv = $ErrorMessage(ex, { title: 'Foobar!' });
                expect($testDiv).toBeDefined();
                expect($testDiv.text()).toContain(message);
                expectTitle($testDiv, 'Foobar!');
                expectFooterMessage($testDiv);
            }
        });

        it('should display a simulated JSONRPCError exception', () => {
            const message = 'I am an exception';
            const errorData = {
                method: 'MyModule.my_method',
                params: {
                    param1: 'value1',
                    param2: [1, 2, true, false, null],
                },
                url: 'https://ci.kbase.us/services/MyModule',
                error: {
                    name: 'JSONRPCError',
                    code: 123,
                    message: 'json-rpc service error here',
                    error: {
                        some: 'error info',
                        booltrue: true,
                        boolfalse: false,
                        nullfield: null,
                        arrayfield: [
                            'value in array',
                            'bar',
                            true,
                            false,
                            null,
                            1,
                            ['array field in array'],
                            { foo: 'bar' },
                        ],
                        objectfield: {
                            foo: 'value in object',
                            is: true,
                            not: false,
                            empty: null,
                            arrayfield: ['array field in object'],
                        },
                        trace: ['line 1', 'line 2'],
                    },
                },
            };
            try {
                throw new jsonrpcErrors.JSONRPCError(message, errorData);
            } catch (ex) {
                const $testDiv = $ErrorMessage(ex);
                expect($testDiv).toBeDefined();
                expect($testDiv.text()).toContain(message);
                expect($testDiv.text()).toContain(errorData.method);
                expect($testDiv.text()).toContain(errorData.url);
                expect($testDiv.text()).toContain(errorData.error.code);
                expect($testDiv.text()).toContain(errorData.error.message);
                expect($testDiv.text()).toContain(errorData.error.error.arrayfield[0]);
                expect($testDiv.text()).toContain(errorData.error.error.objectfield.foo);
                expect($testDiv.text()).toContain(errorData.error.error.objectfield.arrayfield[0]);
                expect($testDiv.text()).toContain(errorData.error.error.trace[1]);
                expectTitle($testDiv);
                expectFooterMessage($testDiv);
            }
        });

        it('should display a simulated ClientError exception', () => {
            const message = 'I am an exception';
            const errorData = {
                method: 'MyModule.my_method',
                params: {
                    param1: 'value1',
                    param2: [1, 2, true, false, null],
                },
                url: 'https://ci.kbase.us/services/MyModule',
            };
            try {
                throw new errors.ClientError(message, errorData);
            } catch (ex) {
                const $testDiv = $ErrorMessage(ex);
                expect($testDiv).toBeDefined();
                expect($testDiv.text()).toContain(message);
                expect($testDiv.text()).toContain(errorData.method);
                expect($testDiv.text()).toContain(errorData.url);
                expectTitle($testDiv);
                expectFooterMessage($testDiv);
            }
        });

        it('should display a null value', () => {
            const errorThing = null;
            const $testDiv = $ErrorMessage(errorThing);
            expect($testDiv).toBeDefined();
            expect($testDiv.text()).toContain('Unsupported kind of error: "null"');
            expectTitle($testDiv);
            expectFooterMessage($testDiv);
        });

        it('should display a generic Error with toJSON defined', () => {
            class BadError extends Error {
                toJSON() {
                    return {
                        foo: 'bar',
                        fizz: 'buzz',
                    };
                }
            }
            const errorThing = new BadError('My message');
            const $testDiv = $ErrorMessage(errorThing);
            expect($testDiv).toBeDefined();
            expect($testDiv.text()).toContain('My message');
            expect($testDiv.text()).toContain('bar');
            expect($testDiv.text()).toContain('buzz');
            expectTitle($testDiv);
            expectFooterMessage($testDiv);
        });

        it('should display "not representable: type" if given non-json compatible property', () => {
            class BadError extends Error {
                toJSON() {
                    return {
                        foo: 'bar',
                        fizz: undefined,
                        buzz: Symbol('x'),
                    };
                }
            }
            const errorThing = new BadError('My message');
            const $testDiv = $ErrorMessage(errorThing);
            expect($testDiv).toBeDefined();
            expect($testDiv.text()).toContain('My message');
            expect($testDiv.text()).toContain('bar');
            expect($testDiv.text()).toContain('fizz');
            expect($testDiv.text()).toContain('not representable: "symbol"');
            expectTitle($testDiv);
            expectFooterMessage($testDiv);
        });

        it('should display a message for an unknown object if it has a message property', () => {
            class ErrorThing {
                constructor(message) {
                    this.message = message;
                    this.foo = 'Bar';
                }
            }
            const errorThing = new ErrorThing('My message');
            const $testDiv = $ErrorMessage(errorThing);
            expect($testDiv).toBeDefined();
            expect($testDiv.text()).toContain(errorThing.message);
            expect($testDiv.text()).not.toContain(errorThing.foo);
            expectTitle($testDiv);
            expectFooterMessage($testDiv);
        });

        it('should display a message for plain object', () => {
            const errorThing = {
                message: 'My message',
                foo: 'bar',
            };
            const $testDiv = $ErrorMessage(errorThing);
            expect($testDiv).toBeDefined();
            expect($testDiv.text()).toContain(errorThing.message);
            expect($testDiv.text()).toContain(errorThing.foo);
            expectTitle($testDiv);
            expectFooterMessage($testDiv);
        });

        it('should display a message for plain object without a message property', () => {
            const errorThing = {
                foo: 'bar',
            };
            const $testDiv = $ErrorMessage(errorThing);
            expect($testDiv).toBeDefined();
            expect($testDiv.text()).toContain(errorThing.foo);
            expectTitle($testDiv);
            expectFooterMessage($testDiv);
        });

        it('should display an unsupported object type with a special Unknown error message using toString', () => {
            class Obj {
                toString() {
                    return 'I am an Obj';
                }
            }
            const errorThings = [
                [new Set(), 'Unsupported kind of error: type is "object", name is "Set"'],
                [new Map(), 'Unsupported kind of error: type is "object", name is "Map"'],
                [new Obj(), 'Unsupported kind of error: type is "object", name is "Obj"'],
            ];
            for (const [thing, thingString] of errorThings) {
                const $testDiv = $ErrorMessage(thing);
                expect($testDiv).toBeDefined();
                expect($testDiv.text()).toContain(thingString);
                expectTitle($testDiv);
                expectFooterMessage($testDiv);
            }
        });

        it('should display "Unknown error" for an unknown object without a message property or toString', () => {
            class ErrorThing {
                constructor() {
                    this.foo = 'Bar';
                }
            }
            const errorThing = new ErrorThing('My message');
            errorThing.toString = undefined;
            for (const value of [errorThing, 1, 0, false, true]) {
                const $testDiv = $ErrorMessage(value);
                expect($testDiv).toBeDefined();
                expect($testDiv.text()).toContain('Unsupported kind of error:');
                expectTitle($testDiv);
                expectFooterMessage($testDiv);
            }
        });
    });
});
