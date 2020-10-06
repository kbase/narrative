/*global define*/
/*global describe, it, expect*/
/*global jasmine*/
/*global beforeEach, afterEach*/
/*jslint white: true*/
define([
    'jquery',
    '../../../../../../../narrative/nbextensions/appCell2/widgets/appCellWidget',
    'kbase/js/common/monoBus'
], function(
    $,
    AppCell,
    MonoBus
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

        var bus = MonoBus.make();

        beforeEach( () => {
            $node = $("<div>");
            mockAppCell = AppCell.make({
                workspaceInfo: workspaceInfo,
                bus: bus,
                cell: {},

            });
            appCell = mockAppCell.start({$node});
        });

        afterEach(() => {
            $node = null;
            appCell = null;
            mockAppCell = null;
        });

        it('Should return a make function', function() {
            expect(true).toEqual(true);
        });
    });
});
