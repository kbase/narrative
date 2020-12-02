/*global describe, it, expect*/
/*global beforeEach, afterEach*/
/*jslint white: true*/
define([
    'jquery',
    '../../../../../../../narrative/nbextensions/appCell2/widgets/appCellWidget',
    'common/runtime',
    'base/js/namespace',
    'bluebird'
], function(
    $,
    AppCell,
    Runtime,
    Jupyter,
    Promise
) {
    'use strict';
    let mockAppCell;

    var workspaceInfo = {
        globalread: 'n',
        id: 54745,
        lockstat: 'unlocked',
        metadata: {
            cell_count: '1',
            narrative_nice_name: 'Test Narrative',
            searchtags: 'narrative',
            is_temporary: 'false',
            narrative: '1'
        },
        moddate: '2020-10-06T03:30:52+0000',
        name: 'testUser:narrative_1601948894239',
        object_count: 1,
        owner: 'testUser',
        user_permission: 'a'
    };

    var cell = {
        cell_type: 'code',
        metadata: {
            kbase: {
                type: 'app',
                attributes:{
                    created: 'Fri, 27 Mar 2020 17:39:10 GMT',
                    id: '71e12dca-3a12-4dd7-862b-125f4337e723',
                    info: {
                        label: 'more...',
                        url: '/#appcatalog/app/simpleapp/example_method/beta'
                    },
                    lastLoaded: 'Tue, 06 Oct 2020 23:28:26 GMT',
                    status: 'new',
                    subtitle: 'Perform some kind of method',
                    title: 'SimpleApp Simple Add'
                },
                appCell: {
                    app: {
                        spec: {
                            parameters: [{
                                advanced: 0,
                                allow_multiple: 0,
                                default_values: ['0'],
                                description: 'The first parameter that needs to be entered to drive the method. This might be the first of many.',
                                disabled: 0,
                                field_type: 'text',
                                id: 'base_number',
                                optional: 1,
                                short_hint: 'The first parameter',
                                text_options:{
                                    is_output_name: 0,
                                    placeholder: '',
                                    regex_constraint: [],
                                    valid_ws_types: [],
                                    validate_as: 'int',
                                    ui_class: 'parameter',
                                    ui_name: 'base_number',
                                }
                            }]
                        }
                    }
                },
            }
        }
    };

    Jupyter.notebook = {
        writable: true
    };
    Jupyter.narrative = {
        readonly: false
    };

    // Can only test the public functions...
    describe('The appCell widget', () => {

        beforeEach( () => {
            var bus = Runtime.make().bus();
            mockAppCell = AppCell.make({
                workspaceInfo: workspaceInfo,
                bus: bus,
                cell: cell,
            });
        });

        afterEach(() => {
            mockAppCell = null;
            window.kbaseRuntime = null;
        });

        it('Should load', () => {
            expect(AppCell).not.toBe(null);
        });

        it('Should return a make function', () => {
            expect(AppCell.make).toBeDefined();
        });

        it('Can be instantiated', () => {
            expect(mockAppCell).not.toBe(null);
        });

        it('Has expected functions when instantiated', () => {
            expect(mockAppCell.init).toBeDefined();
            expect(mockAppCell.attach).toBeDefined();
            expect(mockAppCell.start).toBeDefined();
            expect(mockAppCell.stop).toBeDefined();
            expect(mockAppCell.detach).toBeDefined();
        });

        it('has a method "init" which returns a promise then null', async () => {
            var initPromise = mockAppCell.init();
            expect(initPromise instanceof Promise).toBeTrue();
        });

        it('has a method stop which returns a Promise', () => {
            var stopPromise = mockAppCell.stop();
            expect(stopPromise instanceof Promise).toBeTrue();
            return stopPromise;
        });

        it('has a method detach which returns a Promise', () => {
            var detachPromise = mockAppCell.detach();
            expect(detachPromise instanceof Promise).toBeTrue();
            return detachPromise;
        });

    });

});
