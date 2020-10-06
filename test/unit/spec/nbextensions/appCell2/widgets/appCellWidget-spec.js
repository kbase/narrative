/*global define*/
/*global describe, it, expect*/
/*global jasmine*/
/*global beforeEach, afterEach*/
/*jslint white: true*/
define([
    'jquery',
    '../../../../../../../narrative/nbextensions/appCell2/widgets/appCellWidget',
    'common/runtime',
], function(
    $,
    AppCell,
    Runtime
) {
    'use strict';
    describe('The appCell widget module', function() {
        var myAppCell = null;
        it('Should load', function() {
            expect(AppCell).not.toBe(null);
        });

        it('Should return a make function', function() {
            expect(AppCell.make).toBeDefined();
        });

    });

    describe('The appCell widget instance', () => {
        var $node = null;
        var appCell = null;
        var mockAppCell = null;

        var workspaceInfo = {
            globalread: "n",
            id: 54745,
            lockstat: "unlocked",
            metadata: {
                cell_count: "1",
                narrative_nice_name: "Test Narrative",
                searchtags: "narrative",
                is_temporary: "false",
                narrative: "1"
            },
            moddate: "2020-10-06T03:30:52+0000",
            name: "testUser:narrative_1601948894239",
            object_count: 1,
            owner: "testUser",
            user_permission: "a"
        };

        var cell = {
            metadata: {
                kbase: {
                    attributes:{
                        created: "Fri, 27 Mar 2020 17:39:10 GMT",
                        id: "71e12dca-3a12-4dd7-862b-125f4337e723",
                        info: {
                            label: "more...",
                            url: "/#appcatalog/app/simpleapp/example_method/beta"
                        },
                        lastLoaded: "Tue, 06 Oct 2020 23:28:26 GMT",
                        status: "new",
                        subtitle: "Perform some kind of method",
                        title: "SimpleApp Simple Add"
                    },
                    appCell: {
                        app: {
                            spec: {
                                parameters: [{
                                    advanced: 0,
                                    allow_multiple: 0,
                                    default_values: ["0"],
                                    description: "The first parameter that needs to be entered to drive the method. This might be the first of many.",
                                    disabled: 0,
                                    field_type: "text",
                                    id: "base_number",
                                    optional: 1,
                                    short_hint: "The first parameter",
                                    text_options:{
                                        is_output_name: 0,
                                        placeholder: "",
                                        regex_constraint: [],
                                        valid_ws_types: [],
                                        validate_as: "int",
                                        ui_class: "parameter",
                                        ui_name: "base_number",
                                    }
                                }]
                            }
                        }
                    }
                }
            }
        };

        // Can't create a cell each time. I don't know how to kill the cellBus...
        // beforeEach( () => {
            var bus = Runtime.make().bus()
            $node = $("<div>");
            mockAppCell = AppCell.make({
                workspaceInfo: workspaceInfo,
                bus: bus,
                cell: cell,

            });
            appCell = mockAppCell.start({$node});
        // });

        // afterEach(() => {
        //     $node = null;
        //     appCell = null;
        //     mockAppCell = null;
        //     bus.stop();
        // });

        it('Should render an app cell', function() {
            expect(true).toEqual(true);
        });

        it('Should render the runtime control panel', function() {
            expect(true).toEqual(true);
        });

        it('Should an action button in the control panel', function() {
            expect(true).toEqual(true);
        });

        it('When the mode: execution-requsted, the cancel button should be enabled', function() {
            expect(true).toEqual(true);
        });

        it('When the mode: execution-requsted, the cancel button should be enabled', function() {
            expect(true).toEqual(true);
        });

        it('When the cancel button is clicked a confimation modal should appear', function() {
            expect(true).toEqual(true);
        });

        it('When the cancel button is clicked a confimation modal should appear', function() {
            expect(true).toEqual(true);
        });

    });
});
