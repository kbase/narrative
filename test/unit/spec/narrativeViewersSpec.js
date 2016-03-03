/*global define*/
/*global describe, it, expect*/
/*global jasmine*/
/*global beforeEach, afterEach*/
/*jslint white: true*/

define(['narrativeViewers'], function(Viewers) {
    'use strict';
    describe('Test the NarrativeViewers module', function() {
        it('should load viewer info as a promise', function(done) {
            Viewers.viewerInfo.then(function(info) {
                expect(info.viewers).toBeDefined();
                expect(info.typeNames).toBeDefined();
                expect(info.specs).toBeDefined();
                expect(info.methodIds).toBeDefined();
                expect(info.landingPageUrls).toBeDefined();
                done();
            });
        });

        it('should create a viewer, given inputs', function(done) {
            var dataCell = {
                obj_info: {
                    type: 'KBaseGenomes.Genome-1.0',
                    bare_type: 'KBaseGenomes.Genome'
                }
            };
            Viewers.createViewer(dataCell).then(function(view) {
                expect(view.widget).toBeDefined();
                expect(view.widget.prop('tagName')).toEqual('DIV');
                expect(view.title).toEqual('Genome');
                done();
            });
        });

        it('should still make a default widget when the type doesn\'t exist', function(done) {
            var dataCell = {
                obj_info: {
                    type: 'NotARealType',
                    bare_type: 'NotARealType'
                }
            };
            Viewers.createViewer(dataCell).then(function(view) {
                expect(view.widget).toBeDefined();
                expect(view.widget.prop('tagName')).toEqual('DIV');
                expect(view.title).toEqual('Unknown Data Type');
                done();
            });
        });
    });
});