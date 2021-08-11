define([
    '../../util/mswUtils',
    'jsonrpc/1.1/DynamicServiceClient',
    'jsonrpc/1.1/errors',
    './helpers',
], (mswUtils, DynamicServiceClient, errors, helpers) => {
    'use strict';

    const { MockWorker } = mswUtils;
    const { makeErrorResponse } = helpers;
    const { ClientAbortError } = errors;

    const SERVICE_WIZARD_URL = 'https://ci.kbase.us/services/service_wizard';
    const DYNAMIC_SERVICE_URL = 'https://ci.kbase.us/dynserv/ABC.ADynamicService';

    // A responder for the dynamic service request
    function makeSDKResponse(req) {
        const method = req.body.method;
        const [params] = req.body.params;

        switch (method) {
            case 'ADynamicService.function1':
                if (typeof params === 'undefined') {
                    // Actually, KB SDK apps require params to be present, yet empty.
                    return {
                        version: '1.1',
                        id: req.body.id,
                        result: [
                            {
                                bath: 'salt',
                            },
                        ],
                    };
                }
                if (Array.isArray(params)) {
                    if (params.length > 0) {
                        return makeErrorResponse(req, {
                            name: 'JSONRPCError',
                            code: -32602,
                            message: 'Wrong parameter count for method ADynamicService.function1',
                            error: null,
                        });
                    }
                    return {
                        version: '1.1',
                        id: req.body.id,
                        result: [
                            {
                                bath: 'salt',
                            },
                        ],
                    };
                }
                return makeErrorResponse(req, {
                    name: 'JSONRPCError',
                    code: -32602,
                    message: 'No "params" expected, but was provided',
                    error: {
                        params,
                    },
                });
            case 'ADynamicService.function2':
                if (typeof params === 'undefined') {
                    return makeErrorResponse(req, {
                        name: 'JSONRPCError',
                        code: -32602,
                        message: '"params" expected, but was not provided',
                    });
                }
                if ('foo' in params) {
                    if (params.foo === 'bar') {
                        return {
                            version: '1.1',
                            id: req.body.id,
                            result: [
                                {
                                    bar: 'foo',
                                },
                            ],
                        };
                    } else {
                        return makeErrorResponse(req, {
                            name: 'JSONRPCError',
                            code: -32602,
                            message: 'Param "foo" should be "bar", but is not',
                        });
                    }
                }
                // simulate param missing error
                return makeErrorResponse(req, {
                    name: 'JSONRPCError',
                    code: -32602,
                    message: 'Param "foo" expected, but was not provided',
                });
            default:
                return makeErrorResponse(req, {
                    name: 'JSONRPCError',
                    code: -32601,
                    message: 'Method not found',
                    error: {
                        method,
                    },
                });
        }
    }

    // A responder for the service wizard response.
    function makeServiceWizardResponse(req) {
        const method = req.body.method;
        const [params] = req.body.params;

        const version = (() => {
            if (typeof params !== 'undefined' && 'version' in params) {
                return params.version;
            } else {
                return null;
            }
        })();

        if (!['dev', 'beta', 'release', null].includes(version)) {
            return {
                version: '1.1',
                id: req.body.id,
                error: {
                    name: 'Server error',
                    code: -32000,
                    message: 'No module version found that matches your criteria!',
                    error: ['some', 'trace', 'or', 'traceback'].join('\n'),
                },
            };
        }

        switch (method) {
            case 'ServiceWizard.get_service_status':
                return {
                    version: '1.1',
                    id: req.body.id,
                    result: [
                        {
                            git_commit_hash: 'abc',
                            status: 'active',
                            version: '1.2.3',
                            hash: 'abc',
                            release_tags: ['release', 'beta', 'dev'],
                            url: DYNAMIC_SERVICE_URL,
                            module_name: params.module_name,
                            health: 'healthy',
                            up: 1,
                        },
                    ],
                };
            default:
                return {
                    version: '1.1',
                    id: req.body.id,
                    error: {
                        name: 'JSONRPCError',
                        code: -32601,
                        message: 'Method not found',
                        error: {
                            method,
                        },
                    },
                };
        }
    }

    describe('The DynamicServiceClient', () => {
        let mock = null;

        beforeEach(async () => {
            mock = await new MockWorker().start();
        });

        afterEach(() => {
            mock.stop();
        });

        it('should be constructable without crashing', () => {
            const client = new DynamicServiceClient({
                url: 'foo',
                module: 'bar',
                timeout: 1,
            });
            expect(client).toBeDefined();
        });

        // Happy Paths

        it('should be able to make an unauthorized request (without a token) and get a response', async () => {
            mock.useJSONResponder(SERVICE_WIZARD_URL, (req) => {
                return makeServiceWizardResponse(req);
            });

            mock.useJSONResponder(DYNAMIC_SERVICE_URL, (req) => {
                return makeSDKResponse(req);
            });

            const constructorParams = {
                url: SERVICE_WIZARD_URL,
                module: 'ADynamicService',
                timeout: 1000,
                token: 'token',
            };
            const params = {
                foo: 'bar',
            };
            const client = new DynamicServiceClient(constructorParams);
            const result = await client.callFunc('function2', params);
            expect(result).toHaveString('bar');
            expect(result.bar).toEqual('foo');
        });

        // call normal service endpoint, params, success
        it('should be able to make an authorized request with a token and get a response', async () => {
            mock.useJSONResponder(SERVICE_WIZARD_URL, (req) => {
                return makeServiceWizardResponse(req);
            });

            mock.useJSONResponder(DYNAMIC_SERVICE_URL, (req) => {
                if (req.headers.get('authorization') !== 'token') {
                    return makeErrorResponse(req, {
                        name: 'JSONRPCError',
                        code: -32500,
                        message: 'No authorization',
                        trace: ['some long', 'trace', 'here'].join('\n'),
                    });
                }
                return makeSDKResponse(req);
            });

            const constructorParams = {
                url: SERVICE_WIZARD_URL,
                module: 'ADynamicService',
                timeout: 1000,
                token: 'token',
            };
            const params = {
                foo: 'bar',
            };
            const client = new DynamicServiceClient(constructorParams);
            const result = await client.callFunc('function2', params);
            expect(result).toEqual({ bar: 'foo' });
        });

        it('should be able to make an authorized request without a token and get an error response', async () => {
            mock.useJSONResponder(SERVICE_WIZARD_URL, (req) => {
                return makeServiceWizardResponse(req);
            });

            mock.useJSONResponder(DYNAMIC_SERVICE_URL, (req) => {
                if (req.headers.get('authorization') !== 'token') {
                    return makeErrorResponse(req, {
                        name: 'JSONRPCError',
                        code: 100,
                        message: 'No authorization',
                    });
                }
                return makeSDKResponse(req);
            });

            const constructorParams = {
                url: SERVICE_WIZARD_URL,
                module: 'ADynamicService',
                timeout: 1000,
            };
            const params = {
                foo: 'bar',
            };
            const noAccess = () => {
                const client = new DynamicServiceClient(constructorParams);
                return client.callFunc('function2', params);
            };

            await expectAsync(noAccess()).toBeRejected();
        });

        // call parameter-less service endpoint
        it('should be able to make a request without params and get a response', async () => {
            mock.useJSONResponder(SERVICE_WIZARD_URL, (req) => {
                return makeServiceWizardResponse(req);
            });

            mock.useJSONResponder(DYNAMIC_SERVICE_URL, (req) => {
                return makeSDKResponse(req);
            });

            const constructorParams = {
                url: SERVICE_WIZARD_URL,
                module: 'ADynamicService',
                timeout: 1000,
                token: 'token',
            };

            const client = new DynamicServiceClient(constructorParams);
            const result = await client.callFunc('function1');
            expect(result).toEqual({ bath: 'salt' });
        });

        it('should be able to make a request with empty params and get a response', async () => {
            mock.useJSONResponder(SERVICE_WIZARD_URL, (req) => {
                return makeServiceWizardResponse(req);
            });

            mock.useJSONResponder(DYNAMIC_SERVICE_URL, (req) => {
                return makeSDKResponse(req);
            });

            const constructorParams = {
                url: SERVICE_WIZARD_URL,
                module: 'ADynamicService',
                timeout: 1000,
                token: 'token',
            };

            const client = new DynamicServiceClient(constructorParams);
            const result = await client.callFunc('function1', []);
            expect(result).toEqual({ bath: 'salt' });
        });

        it('should be able to make a request for each type of version tag', async () => {
            mock.useJSONResponder(SERVICE_WIZARD_URL, (req) => {
                return makeServiceWizardResponse(req);
            });

            mock.useJSONResponder(DYNAMIC_SERVICE_URL, (req) => {
                return makeSDKResponse(req);
            });

            for (const version of ['dev', 'beta', 'release', null]) {
                const constructorParams = {
                    url: SERVICE_WIZARD_URL,
                    module: 'ADynamicService',
                    timeout: 1000,
                    token: 'token',
                    version,
                };
                const client = new DynamicServiceClient(constructorParams);
                const result = await client.callFunc('function2', { foo: 'bar' });
                expect(result).toEqual({ bar: 'foo' });
            }
        });

        // ERRORS

        // // call endpoint which returns error
        it('a response with an error should throw', async () => {
            mock.useJSONResponder(SERVICE_WIZARD_URL, (req) => {
                return makeServiceWizardResponse(req);
            });

            mock.useJSONResponder(DYNAMIC_SERVICE_URL, (req) => {
                return makeErrorResponse(req, {
                    name: 'JSONRPCError',
                    code: 123,
                    message: 'Error message',
                });
            });

            const constructorParams = {
                url: SERVICE_WIZARD_URL,
                module: 'ADynamicService',
                timeout: 1000,
                token: 'token',
            };

            const client = new DynamicServiceClient(constructorParams);
            const shouldThrow = () => {
                return client.callFunc('function');
            };
            await expectAsync(shouldThrow()).toBeRejected();
        });

        it('should receive errors for invalid version tags', async () => {
            mock.useJSONResponder(SERVICE_WIZARD_URL, (req) => {
                return makeServiceWizardResponse(req);
            });

            mock.useJSONResponder(DYNAMIC_SERVICE_URL, (req) => {
                return makeSDKResponse(req);
            });

            for (const version of ['x', 1, 12.34, true, false, {}, []]) {
                const constructorParams = {
                    url: SERVICE_WIZARD_URL,
                    module: 'ADynamicService',
                    timeout: 1000,
                    token: 'token',
                    version,
                };
                const badVersion = () => {
                    const client = new DynamicServiceClient(constructorParams);
                    return client.callFunc('function2');
                };

                await expectAsync(badVersion()).toBeRejected();
            }
        });

        // // Errors

        // construct without url
        it('making a client without a "url" constructor param should throw an error', () => {
            const constructorParams = {
                module: 'Module',
                timeout: 1000,
            };
            function noURL() {
                return new DynamicServiceClient(constructorParams);
            }
            expect(noURL).toThrow();
        });

        // construct without module
        it('making a client without a "module" constructor param should throw an error', () => {
            const constructorParams = {
                url: 'foo',
                timeout: 1000,
            };
            function noURL() {
                return new DynamicServiceClient(constructorParams);
            }
            expect(noURL).toThrow();
        });

        // construct without timeout
        it('making a client without a "timeout" constructor param should throw an error', () => {
            const constructorParams = {
                url: 'foo',
                module: 'Module',
            };
            function noURL() {
                return new DynamicServiceClient(constructorParams);
            }
            expect(noURL).toThrow();
        });

        // Usage exceptions

        it('a timeout should trigger an exception for a long running service wizard request', async () => {
            mock.useJSONResponder(
                SERVICE_WIZARD_URL,
                (req) => {
                    return makeServiceWizardResponse(req);
                },
                {
                    delay: 500,
                }
            );

            mock.useJSONResponder(DYNAMIC_SERVICE_URL, (req) => {
                return makeSDKResponse(req);
            });

            const constructorParams = {
                url: SERVICE_WIZARD_URL,
                module: 'Module2',
                timeout: 100,
            };

            const client = new DynamicServiceClient(constructorParams);
            const shouldTimeout = () => {
                return client.callFunc('function');
            };

            // try {
            //     const response = await shouldTimeout();
            //     console.log('GOT', response);
            // } catch (ex) {
            //     console.error('EX', ex);
            // }

            await expectAsync(shouldTimeout()).toBeRejectedWithError(ClientAbortError);
        });

        it('a timeout should trigger an exception for a long running request', async () => {
            // let cancelRequest = null;

            mock.useJSONResponder(SERVICE_WIZARD_URL, (req) => {
                return makeServiceWizardResponse(req);
            });

            mock.useJSONResponder(
                DYNAMIC_SERVICE_URL,
                (req) => {
                    return makeSDKResponse(req);
                },
                {
                    delay: 200,
                }
            );

            const constructorParams = {
                url: SERVICE_WIZARD_URL,
                module: 'Module',
                timeout: 100,
            };

            const client = new DynamicServiceClient(constructorParams);
            const shouldTimeout = () => {
                return client.callFunc('function1');
            };

            await expectAsync(shouldTimeout()).toBeRejectedWithError(ClientAbortError);
        });
    });
});
