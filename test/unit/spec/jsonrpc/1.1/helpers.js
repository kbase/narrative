define(['jsonrpc/1.1/JSONRPCClient'], (JSONRPCClient) => {
    'use strict';

    const URL = '/services/Module';
    const REQUEST_TIMEOUT = 1000;

    function makeJSONRPCClient(extras) {
        const constructorParams = {
            url: URL,
            timeout: REQUEST_TIMEOUT,
        };
        if (extras) {
            for (const extra of extras) {
                if (typeof extra === 'string') {
                    delete constructorParams[extra];
                } else {
                    const [key, value] = extra;
                    constructorParams[key] = value;
                }
            }
        }
        return new JSONRPCClient(constructorParams);
    }

    function makeResponse(req, result) {
        const defaultResult = {
            bar: 'foo',
        };
        return {
            version: '1.1',
            id: req.body.id,
            result: result || defaultResult,
        };
    }

    function makeBadResponse(req, { replace, result }) {
        const defaultResult = {
            bar: 'foo',
        };
        const response = {
            version: '1.1',
            id: req.body.id,
            result: result || defaultResult,
        };

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

    function makeErrorResponse(req, error) {
        return {
            version: '1.1',
            id: req.body.id,
            error,
        };
    }

    return {
        makeJSONRPCClient,
        makeResponse,
        makeBadResponse,
        makeErrorResponse,
        REQUEST_TIMEOUT,
        URL,
    };
});
