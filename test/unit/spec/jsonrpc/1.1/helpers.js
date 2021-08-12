define(['jsonrpc/1.1/JSONRPCClient'], (JSONRPCClient) => {
    'use strict';

    const URL = '/services/Module';
    const REQUEST_TIMEOUT = 1000;

    function makeJSONRPCClient(config = {}) {
        const constructorParams = {
            url: URL,
            timeout:
                (typeof config.timeout !== 'undefined' ? config.timeout : false) || REQUEST_TIMEOUT,
        };
        const extraArgs = config.extraArgs;
        if (extraArgs) {
            if (Array.isArray(extraArgs)) {
                for (const extraArg of extraArgs) {
                    if (typeof extraArg === 'string') {
                        delete constructorParams[extraArg];
                    } else {
                        const [key, value] = extraArg;
                        constructorParams[key] = value;
                    }
                }
            } else {
                for (const [key, value] of Object.entries(extraArgs)) {
                    constructorParams[key] = value;
                }
            }
        }
        return new JSONRPCClient(constructorParams);
    }

    function makeResponse(rpc, result, { replace } = {}) {
        const response = {
            version: '1.1',
            result,
        };

        if (typeof rpc.id !== 'undefined') {
            response.id = rpc.id;
        }

        if (replace) {
            for (const pair of replace) {
                if (typeof pair === 'string') {
                    delete response[pair];
                } else {
                    response[pair[0]] = pair[1];
                }
            }
        }

        return response;
    }

    function makeErrorResponse(rpc, error, { replace } = {}) {
        const response = {
            version: '1.1',
            error,
        };

        if (typeof rpc.id !== 'undefined') {
            response.id = rpc.id;
        }

        if (replace) {
            for (const pair of replace) {
                if (typeof pair === 'string') {
                    delete response[pair];
                } else {
                    response[pair[0]] = pair[1];
                }
            }
        }

        return response;
    }

    function expectClassObjectBehavior(Klass, name, constructorProps) {
        const message = `Test Message for ${name}`;
        const error = new Klass(message, constructorProps);
        expect(error.name).toEqual(name);
        expect(error).toBeInstanceOf(Error);

        constructorProps.message = message;
        for (const [key, value] of Object.entries(constructorProps)) {
            expect(error[key]).toEqual(value);
        }

        const json = error.toJSON();
        expect(json).toBeDefined();

        constructorProps.name = name;
        for (const [key, value] of Object.entries(constructorProps)) {
            expect(error[key]).toEqual(value);
        }
    }

    function expectThrowBehavior(Klass, name, constructorProps) {
        const message = `Test Message for ${name}`;
        try {
            throw new Klass(message, constructorProps);
        } catch (error) {
            expect(error.name).toEqual(name);
            expect(error).toBeInstanceOf(Error);

            constructorProps.message = message;
            for (const [key, value] of Object.entries(constructorProps)) {
                expect(error[key]).toEqual(value);
            }

            const json = error.toJSON();
            expect(json).toBeDefined();

            constructorProps.name = name;
            for (const [key, value] of Object.entries(constructorProps)) {
                expect(error[key]).toEqual(value);
            }
        }
    }

    function expectErrorBehavior(Klass, name, constructorProps) {
        expectClassObjectBehavior(Klass, name, constructorProps);
        expectThrowBehavior(Klass, name, constructorProps);
    }

    function expectJSONRPCError(errorObject, { code, message, error }) {
        const jsonrpcError = errorObject.toJSONRPCError();
        expect(jsonrpcError.name).toEqual('JSONRPCError');
        expect(jsonrpcError.code).toEqual(code);
        expect(jsonrpcError.message).toEqual(message);
        if (typeof error === 'undefined') {
            expect(jsonrpcError.error).toBeUndefined();
        } else {
            expect(jsonrpcError.error).toEqual(error);
        }
    }

    function expectJSONRPCErrorClassObjectBehavior(Klass, name, code, constructorProps) {
        const message = `Test Message for ${name}`;
        const errorObject = new Klass(message, constructorProps);
        expect(errorObject).toBeInstanceOf(Error);

        // Test object
        expect(errorObject.name).toEqual(name);
        expect(errorObject.error.code).toEqual(code);

        // constructorProps.error.message = message;
        for (const [key, value] of Object.entries(constructorProps)) {
            expect(errorObject[key]).toEqual(value);
        }

        expectJSONRPCError(errorObject, constructorProps.error);
    }

    function expectJSONRPCErrorBehavior(Klass, name, code, constructorProps) {
        expectJSONRPCErrorClassObjectBehavior(Klass, name, code, constructorProps);
        // expectThrowBehavior(Klass, name, constructorProps);
    }

    return {
        makeJSONRPCClient,
        makeResponse,
        makeErrorResponse,
        expectErrorBehavior,
        expectJSONRPCErrorBehavior,
        REQUEST_TIMEOUT,
        URL,
    };
});
