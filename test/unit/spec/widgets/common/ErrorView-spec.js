define(['widgets/common/ErrorView', 'kb_common/jsonRpc/exceptions'], (
    $ErrorView,
    jsonrpcExceptions
) => {
    'use strict';

    const expectContactInfo = ($element) => {
        expect($element.text()).toContain('contact the KBase team');
    };

    describe('The $ErrorView widget', () => {
        it('should be defined', () => {
            expect($ErrorView).toBeDefined();
        });

        it('should display a simple error string', () => {
            const message = 'I am an error';
            const $testDiv = $ErrorView(message);
            expect($testDiv).toBeDefined();
            expect($testDiv.text()).toContain(message);
            expectContactInfo($testDiv);
        });

        it('should display an Error object', () => {
            const message = 'I am an error';
            const error = new Error(message);
            const $testDiv = $ErrorView(error);
            expect($testDiv).toBeDefined();
            expect($testDiv.text()).toContain(message);
            expectContactInfo($testDiv);
        });

        it('should display an Error object', () => {
            const message = 'I am an error';
            const error = new Error(message);
            const $testDiv = $ErrorView(error);
            expect($testDiv).toBeDefined();
            expect($testDiv.text()).toContain(message);
            expect($testDiv.text()).toContain('Error:');
            expectContactInfo($testDiv);
        });

        it('should display a the "Unknown error" message if given null"', () => {
            const error = null;
            const message = 'Unknown error';
            const $testDiv = $ErrorView(error);
            expect($testDiv).toBeDefined();
            expect($testDiv.text()).toContain(message);
            expectContactInfo($testDiv);
        });

        it('should display a the "Unknown error" message if given an unsupported type"', () => {
            const errors = [true, false, undefined, 42];
            const message = 'Unknown error';
            for (const error of errors) {
                const $testDiv = $ErrorView(error);
                expect($testDiv).toBeDefined();
                expect($testDiv.text()).toContain(message);
                expectContactInfo($testDiv);
            }
        });

        it('should display a the "message" property for an unsupported object"', () => {
            class Foo {
                constructor(_message) {
                    this.message = _message;
                }
            }
            const message = 'I am Foo';
            const error = new Foo(message);
            const $testDiv = $ErrorView(error);
            expect($testDiv).toBeDefined();
            expect($testDiv.text()).toContain(message);
            expectContactInfo($testDiv);
        });

        it('should display all the properties for a plain object without a "message" property', () => {
            const error = {
                foo: 'A foo happened',
                bar: 12345,
                baz: true,
            };
            const $testDiv = $ErrorView(error);
            expect($testDiv).toBeDefined();
            expect($testDiv.text()).toContain(error.foo);
            expect($testDiv.text()).toContain(error.bar);
            expect($testDiv.text()).toContain(error.baz);
            expectContactInfo($testDiv);
        });

        it('should display the "toString()" result an unsupported object with a "toString" method"', () => {
            class Foo {
                constructor(_message2) {
                    this.message2 = _message2;
                }
                toString() {
                    return this.message2;
                }
            }
            const message2 = 'The result of toString()';
            const error = new Foo(message2);
            const $testDiv = $ErrorView(error);
            expect($testDiv).toBeDefined();
            expect($testDiv.text()).toContain(message2);
            expectContactInfo($testDiv);
        });

        it('should display the "message" of unsupported object even if it has a "toString" method"', () => {
            class Foo {
                constructor(_message, _message2) {
                    this.message = _message;
                    this.message2 = _message2;
                }
                toString() {
                    return this.message2;
                }
            }
            const message = 'I am Foo';
            const message2 = 'The result of toString()';
            const error = new Foo(message, message2);
            const $testDiv = $ErrorView(error);
            expect($testDiv).toBeDefined();
            expect($testDiv.text()).not.toContain(message2);
            expect($testDiv.text()).toContain(message);
            expectContactInfo($testDiv);
        });

        it('should specifically display a JSON-RPC error from the old JSON-RPC librar"', () => {
            const error = new jsonrpcExceptions.JsonRpcError(
                'MyModule',
                'my_func',
                {
                    param1: 'Param1',
                    param2: 123,
                },
                'https://ci.kbase.us/services/my_module',
                {
                    code: 456,
                    name: 'JSONRPCError',
                    message: 'This is an rpc error',
                    error: 'some error\nanother line\nand another line',
                }
            );
            const $testDiv = $ErrorView(error);
            expect($testDiv.text()).toContain('JSONRPCError');
            expect($testDiv.text()).toContain('456');
            expect($testDiv.text()).toContain('MyModule');
            expect($testDiv.text()).toContain('my_func');
            expect($testDiv.text()).toContain('This is an rpc error');
            expectContactInfo($testDiv);
        });
    });
});
