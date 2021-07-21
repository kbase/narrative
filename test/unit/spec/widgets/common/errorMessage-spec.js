define(['widgets/common/errorMessage', 'jsonrpc/1.1/errors'], (errorMessage, errors) => {
    'use strict';
    function expectFooterMessage($node) {
        expect($node.text()).toContain('contact the KBase team');
    }

    describe('The errorMessage widget', () => {
        it('should be defined', () => {
            expect(errorMessage).toBeDefined();
        });

        it('should display a string error message', () => {
            const message = 'I am an error';
            const $testDiv = errorMessage(message);
            expect($testDiv).toBeDefined();
            expect($testDiv.text()).toContain(message);
            expectFooterMessage($testDiv);
        });

        it('should display an Error-based exception', () => {
            const message = 'I am an exception';
            try {
                throw new Error(message);
            } catch (ex) {
                const $testDiv = errorMessage(ex);
                expect($testDiv).toBeDefined();
                expect($testDiv.text()).toContain(message);
                expectFooterMessage($testDiv);
            }
        });

        it('should display a simulated JSONRPCError exception', () => {
            const message = 'I am an exception';
            const errorData = {
                module: 'MyModule',
                method: 'my method',
                params: {
                    param1: 'value1',
                    param2: [1, 2, true, false, null]
                },
                url: 'https://ci.kbase.us/services/MyModule',
                originalMessage: 'My original message',
            };
            try {
                throw new errors.JSONRPCError(message, errorData);
            } catch (ex) {
                const $testDiv = errorMessage(ex);
                expect($testDiv).toBeDefined();
                expect($testDiv.text()).toContain(message);
                expect($testDiv.text()).toContain(errorData.module);
                expect($testDiv.text()).toContain(errorData.method);
                expect($testDiv.text()).toContain(errorData.url);
                expect($testDiv.text()).toContain(errorData.originalMessage);
                expectFooterMessage($testDiv);
            }
        });

        it('should display a null value', () => {
            const errorThing = null;
            const $testDiv = errorMessage(errorThing);
            expect($testDiv).toBeDefined();
            expect($testDiv.text()).toContain('Unknown');
            expectFooterMessage($testDiv);
        });

        it('should display a generic Error with toJSON defined', () => {
            class BadError extends Error {
                toJSON() {
                    return {
                        foo: 'bar',
                        fizz: 'buzz'
                    }
                }
            }
            const errorThing = new BadError('My message');
            const $testDiv = errorMessage(errorThing);
            expect($testDiv).toBeDefined();
            expect($testDiv.text()).toContain('My message');
            expect($testDiv.text()).toContain('bar');
            expect($testDiv.text()).toContain('buzz');
            expectFooterMessage($testDiv);
        });

        it('should display "Not representable: type" if given non-json compatible property', () => {
            class BadError extends Error {
                toJSON() {
                    return {
                        foo: 'bar',
                        fizz: undefined
                    }
                }
            }
            const errorThing = new BadError('My message');
            const $testDiv = errorMessage(errorThing);
            expect($testDiv).toBeDefined();
            expect($testDiv.text()).toContain('My message');
            expect($testDiv.text()).toContain('bar');
            expect($testDiv.text()).toContain('Not representable: undefined');
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
            const $testDiv = errorMessage(errorThing);
            expect($testDiv).toBeDefined();
            expect($testDiv.text()).toContain(errorThing.message);
            expect($testDiv.text()).not.toContain(errorThing.foo);
            expectFooterMessage($testDiv);
        });


        it('should display a message for plain object', () => {
            const errorThing = {
                message: 'My message',
                foo: 'bar'
            };
            const $testDiv = errorMessage(errorThing);
            expect($testDiv).toBeDefined();
            expect($testDiv.text()).toContain(errorThing.message);
            expect($testDiv.text()).toContain(errorThing.foo);
            expectFooterMessage($testDiv);
        });

        it('should display a message for plain object without a message property', () => {
            const errorThing = {
                foo: 'bar'
            };
            const $testDiv = errorMessage(errorThing);
            expect($testDiv).toBeDefined();
            expect($testDiv.text()).toContain(errorThing.foo);
            expectFooterMessage($testDiv);
        });

        it('should display an unsupported object type with a special Unknown error message using toString', () => {
            class Obj {
                toString() {
                    return 'I am an Obj';
                }
            }
            const errorThings = [
                [new Set(), 'Unknown error: [object Set]'],
                [new Map(), 'Unknown error: [object Map]'],
                [new Obj(), 'Unknown error: I am an Obj']
            ]
            for (const [thing, thingString] of errorThings) {
                const $testDiv = errorMessage(thing);
                expect($testDiv).toBeDefined();
                expect($testDiv.text()).toContain(thingString);
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
            for (const value of [errorThing, 1, 0, false, true, undefined]) {
                const $testDiv = errorMessage(value);
                expect($testDiv).toBeDefined();
                expect($testDiv.text()).toContain('Unknown error');
                expectFooterMessage($testDiv);
            }
        });

    });
});
