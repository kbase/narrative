/*global define*/
/*global describe, it, expect*/
/*global jasmine*/
/*global beforeEach, afterEach*/
/*jslint white: true*/
define([
    'jquery',
    'bluebird',
    'widgets/dynamicTable'
], function($, Promise, DynamicTable) {
    'use strict';
    var dummyRows = [
            [ 1, 2, 3 ],
            [ 4, 5, 6 ]
        ],
        dummyHeaders = [{
            id: 'col1',
            text: 'Column 1',
            isSortable: true
        }, {
            id: 'col2',
            text: 'Column 2',
            isSortable: true
        }, {
            id: 'col3',
            text: 'Column 3',
            isSortable: false
        }],
        $dummyDiv = $('<div>'),
        dummyTable;

    beforeEach(function() {
        dummyTable = new DynamicTable($dummyDiv, {
            headers: dummyHeaders,
            updateFunction: function(pageNum, query, sortColId, sortColDir) {
                return {
                    start: 0,
                    total: dummyRows.length,
                    rows: dummyRows
                };
            }
        });
    });

    describe('Test the DynamicTable widget', function() {
        it('Should instantiate with essentially empty data', function() {
            var $container = $('<div>');
            var dt = new DynamicTable($container, {
                updateFunction: function() {
                    return Promise.try(function() {
                        return {
                            start: 0,
                            total: 0,
                            rows: []
                        };
                    });
                }
            });
            expect(dt).toEqual(jasmine.any(Object));
        });

        it('Should display data', function() {
            expect(dummyTable).toEqual(jasmine.any(Object));
        });

        it('Should paginate and show which page', function() {

        });

        it('Should show an error when pagination fails', function() {

        });

        it('Should sort properly', function() {

        });

        it('Should decorate rows properly', function() {

        });

        it('Should add outer widget classes properly', function() {

        });

        it('Should add table styles properly', function() {

        });

        it('Should have optional download buttons', function() {

        });
    });
});
