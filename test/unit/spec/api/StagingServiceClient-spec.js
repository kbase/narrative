define(['StagingServiceClient'], (StagingServiceClient) => {
    'use strict';

    const functions = {
        addAcl: { method: 'get', path: 'add-acl' },
        removeAcl: { method: 'get', path: 'remove-acl' },
        testService: { method: 'get', path: 'test-service' },
        testAuth: { method: 'get', path: 'test-auth' },
        list: { method: 'get', path: 'list' },
        search: { method: 'get', path: 'search' },
        metadata: { method: 'get', path: 'metadata/' },
        jgi_metadata: { method: 'get', path: 'jgi-metadata/' },
        upload: { method: 'post', path: 'upload' },
        download: { method: 'get', path: 'download/' },
        delete: { method: 'delete', path: 'delete/' },
        rename: { method: 'post', path: 'rename/' },
        decompress: { method: 'patch', path: 'decompress/' },
        importer_mappings: { method: 'get', path: 'importer_mappings/?' },
        bulkSpecification: { method: 'get', path: 'bulk_specification/?files=' },
    };

    describe('the staging service client', () => {
        const ssClientUrl = 'https://kbase.us/staging_service';
        const fakeToken = 'fakeToken';
        const client = new StagingServiceClient({
            root: ssClientUrl,
            token: fakeToken,
        });

        beforeAll(() => {
            jasmine.Ajax.install();
            jasmine.Ajax.stubRequest(new RegExp(`^${ssClientUrl}/`)).andReturn({
                status: 200,
                responseText: '',
            });
        });

        afterAll(() => {
            jasmine.Ajax.uninstall();
        });

        // pretty simple - make sure all functions exist, they all fire off Ajax requests,
        // and they all use the expected url path and method.
        // not really concerned about results from the server, just that the client works
        // as expected
        Object.keys(functions).forEach((fn) => {
            describe(`the ${fn} function`, () => {
                it(`has the ${fn} function`, () => {
                    expect(client[fn]).toEqual(jasmine.any(Function));
                });

                it(`runs the ${fn} function as a ${functions[fn].method} request`, async () => {
                    await client[fn]();
                    const req = jasmine.Ajax.requests.mostRecent();
                    expect(req.method.toLowerCase()).toBe(functions[fn].method);
                    expect(req.url).toContain(`${ssClientUrl}/${functions[fn].path}`);
                    expect(req.requestHeaders.Authorization).toEqual(fakeToken);
                });
            });
        });
    });
});
