define(['narrativeViewers', 'narrativeConfig'], (Viewers, Config) => {
    'use strict';

    /** data format taken from
     * https://github.com/kbase/narrative_method_store/blob/master/NarrativeMethodStore.spec#L709
     * and modified to what's needed for running the module and testing
     * - returned by NarrativeMethodStore.list_categories
     */
    const categoryData = [
        // this would be the list of app categories, ironically not actually needed
        {},
        // list of apps referenced by the types, just mocking to show existence (which is all
        // the module needs)
        // leaving out one to trigger a different code path
        {
            'Viewers/a_viewer_app': {},
            'Viewers/error_viewer_app': {
                loading_error: 'Not a real app',
            },
        },
        // list of "apps" (in the NMS lingo), all obsolete and no longer used or needed
        {},
        // set of available types and relevant info used by the NarrativeViewers module
        {
            'Module.Type1': {
                view_method_ids: ['Viewers/a_viewer_app'],
                landing_page_url_prefix: 'type1',
                name: 'Type 1',
            },
            'Module.Type2': {
                view_method_ids: ['Viewers/missing_viewer_app'],
                landing_page_url_prefix: 'type2',
                name: 'Type 2',
            },
            'Module.Type3': {
                view_method_ids: ['Viewers/error_viewer_app'],
                landing_page_url_prefix: 'type3',
                name: 'Type 3',
            },
        },
    ];

    /** "method" data is the NMS lingo for app specs. This just mocks what's needed for
     * NarrativeViewers to function for a single mock app.
     * - returned by NarrativeMethodStore.get_method_spec
     */
    const methodData = [
        {
            'Viewers/a_viewer_app': {
                behavior: {},
                fixed_parameters: [],
                info: {
                    id: 'Viewers/a_viewer_app',
                    module_name: 'Viewers',
                    app_type: 'viewer',
                    input_types: ['Module.Type1'],
                    name: 'View Module Type 1',
                },
                parameters: [],
                widgets: {
                    input: 'null',
                    output: 'SomeViewerWidget',
                },
            },
        },
    ];

    describe('Test the NarrativeViewers module', () => {
        beforeEach(() => {
            jasmine.Ajax.install();

            jasmine.Ajax.stubRequest(
                Config.url('narrative_method_store'),
                /list_categories/
            ).andReturn({
                status: 200,
                statusText: 'HTTP/1 200 OK',
                contentType: 'application/json',
                responseText: JSON.stringify({
                    version: '1.1',
                    id: '12345',
                    result: categoryData,
                }),
            });

            jasmine.Ajax.stubRequest(
                Config.url('narrative_method_store'),
                /get_method_spec/
            ).andReturn({
                status: 200,
                statusText: 'HTTP/1 200 OK',
                contentType: 'application/json',
                responseText: JSON.stringify({
                    version: '1.1',
                    id: '12345',
                    result: methodData,
                }),
            });
        });

        afterEach(() => {
            jasmine.Ajax.uninstall();
        });

        it('should load and have expected functions', () => {
            expect(Viewers).toBeDefined();

            ['getViewerInfo', 'createViewer', 'defaultViewer'].forEach((fn) => {
                expect(Viewers[fn]).toBeDefined();
            });
        });

        it('should load viewer info as a promise', () => {
            const expectedItems = ['viewers', 'typeNames', 'specs', 'methodIds', 'landingPageUrls'];
            return Viewers.getViewerInfo().then((info) => {
                expectedItems.forEach((item) => {
                    expect(info[item]).toBeDefined();
                });
            });
        });

        it('should create a default viewer, given inputs and a missing widget', () => {
            const dataCell = {
                obj_info: {
                    type: 'Module.Type1-1.0',
                    bare_type: 'Module.Type1',
                },
            };
            spyOn(window, 'require').and.callFake((files, cb, errCb) => {
                errCb(new Error('Not a real widget!')); // make a fake error
            });
            return Viewers.createViewer(dataCell).then((view) => {
                expect(window.require).toHaveBeenCalled();
                expect(view.widget).toBeDefined();
                expect(view.widget.prop('tagName')).toEqual('DIV');
                expect(view.title).toEqual('Unknown Data Type');
            });
        });

        it('should create a viewer, given inputs', () => {
            const dataCell = {
                obj_info: {
                    type: 'Module.Type1-1.0',
                    bare_type: 'Module.Type1',
                },
            };
            spyOn(window, 'require').and.callFake((files, cb) => {
                cb(function () {
                    return this;
                }); // just a dummy constructor
            });
            return Viewers.createViewer(dataCell).then((view) => {
                expect(window.require).toHaveBeenCalled();
                expect(view.widget).toBeDefined();
                expect(view.widget.prop('tagName')).toEqual('DIV');
                expect(view.title).toEqual('Type 1');
            });
        });

        it("should still make a default widget when the type doesn't exist", () => {
            const dataCell = {
                obj_info: {
                    type: 'NotARealType',
                    bare_type: 'NotARealType',
                },
            };
            return Viewers.createViewer(dataCell).then((view) => {
                expect(view.widget).toBeDefined();
                expect(view.widget.prop('tagName')).toEqual('DIV');
                expect(view.title).toEqual('Unknown Data Type');
            });
        });
    });
});
