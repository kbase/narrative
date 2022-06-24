define(['jquery', 'RestAPIClient'], ($, RestAPIClient) => {
    'use strict';

    const methods = ['connect', 'delete', 'get', 'head', 'options', 'patch', 'post', 'put'];
    const root = 'https://example.com';
    const token = 'fakeToken';
    const routes = methods.reduce((prev, curr) => {
        prev[curr + '_route'] = { method: curr, path: `${curr}_something` };
        return prev;
    }, {});

    describe('the REST API client', () => {
        const client = new RestAPIClient({
            root,
            token,
            routes,
        });

        beforeAll(() => {
            jasmine.Ajax.install();
            jasmine.Ajax.stubRequest(new RegExp(`^${root}/`)).andReturn({
                status: 200,
                responseText: '',
            });
        });

        afterAll(() => {
            jasmine.Ajax.uninstall();
        });

        // Ensure all functions exist, that they all fire off Ajax requests,
        // and they all use the expected url path and method.
        Object.keys(routes).forEach((fn) => {
            describe(`the ${fn} function`, () => {
                it(`has the ${fn} function`, () => {
                    expect(client[fn]).toEqual(jasmine.any(Function));
                });

                it(`runs the ${fn} function as a ${routes[fn].method} request`, async () => {
                    await client[fn]();
                    const req = jasmine.Ajax.requests.mostRecent();
                    expect(req.method.toLowerCase()).toBe(routes[fn].method);
                    expect(req.url).toContain(`${root}/${routes[fn].path}`);
                    expect(req.requestHeaders.Authorization).toEqual(token);
                });
            });
        });

        describe('running a request', () => {
            it('sets defaults', () => {
                // just check the arguments to jQuery.ajax are as expected;
                // don't execute the query
                spyOn($, 'ajax');
                client.post_route();
                const allArgs = $.ajax.calls.allArgs();
                expect(allArgs.length).toEqual(1);
                expect(allArgs[0].length).toEqual(1);
                const ajaxArgs = allArgs[0][0];
                expect(ajaxArgs.data).toEqual(undefined);
                expect(ajaxArgs.type).toEqual('post');
                expect(ajaxArgs.dataType).toEqual('text');
                expect(ajaxArgs.headers).toEqual({ Authorization: token });
            });

            it('can override defaults', async () => {
                const data = { this: 'that', 'the other': [1, 2, 3] };
                // the RestAPIClient's ajax function
                spyOn(client, 'ajax').and.callThrough();
                // the jQuery ajax function that gets executed by the RestAPIClient's ajax function
                spyOn($, 'ajax').and.callThrough();
                await client.post_route({
                    data,
                    dataType: 'html',
                    headers: { 'Content-Type': 'application/json' },
                });
                const req = jasmine.Ajax.requests.mostRecent();
                expect(req.method.toLowerCase()).toBe(routes.post_route.method);
                expect(req.url).toContain(`${root}/${routes.post_route.path}`);
                expect(req.requestHeaders.Authorization).toEqual(token);
                expect(req.requestHeaders['Content-Type']).toEqual('application/json');
                expect(req.requestHeaders.Accept).toContain('text/html');
                expect(req.data()).toEqual(data);
            });
        });

        describe('more complex paths', () => {
            beforeEach(function () {
                this.complexRoutes = {
                    interpolate_multiple: {
                        method: 'get',
                        path: 'multiple/${path}?${type}=${value}',
                    },
                    interpolate_single: { method: 'get', path: 'single/?${interpolate_me}' },
                };
                this.complexClient = new RestAPIClient({
                    root,
                    token,
                    routes: this.complexRoutes,
                });
            });

            it('can interpolate a value into the route', async function () {
                await this.complexClient.interpolate_single({
                    interpolate_me: 'some_boring_path',
                });
                const req = jasmine.Ajax.requests.mostRecent();
                expect(req.url).toContain(`${root}/single/?some_boring_path`);
            });

            it('adds nothing if no value is supplied', async function () {
                await this.complexClient.interpolate_single();
                const req = jasmine.Ajax.requests.mostRecent();
                expect(req.url).toContain(`${root}/single/?`);
            });

            it('can interpolate several values into a path', async function () {
                await this.complexClient.interpolate_multiple({
                    path: 'i_miss.cgi',
                    type: 'really',
                    value: 'yes',
                });
                const req = jasmine.Ajax.requests.mostRecent();
                expect(req.url).toContain(`${root}/multiple/i_miss.cgi?really=yes`);
            });
        });
    });
});
