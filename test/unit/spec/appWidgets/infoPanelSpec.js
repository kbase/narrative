/*global define*/
/*global describe, it, expect*/
/*global jasmine*/
/*global beforeEach, afterEach*/
/*jslint white: true*/

define([
    'jquery',
    'narrativeConfig',
    'kbase/js/widgets/appInfoPanel'
], function(
    $,
    Config,
    InfoPanel
) {
    'use strict';

    function makeDummyPanel() {
        return InfoPanel.make({
            appId: 'SomeModule/some_app',
            appModule: 'SomeModule',
            tag: 'release'
        });
    }

    /**
     * Mock data for the NMS.get_method_full_info call.
     */
    const methodFullInfoMock = [[{
        description: 'This is a KBase wrapper for SomeModule.',
        authors: ['author1', 'author2']
    }]];

    /**
     * Mock data for the Catalog.get_exec_aggr_stats call.
     */
    const getExecAggrStatsMock = [[{
        number_of_calls: 5
    }]];

    /**
     * Mock data for the Catalog.get_module_info call.
     */
    const getModuleInfoMock = [{
        module_name: 'SomeModule',
        release: {
            timestamp: 1555098756211
        }
    }];

    describe('Test the App Info Panel module', () => {
        beforeEach(() => {
            jasmine.Ajax.install();
            jasmine.Ajax.stubRequest(Config.url('narrative_method_store'), /get_method_full_info/)
                .andReturn({
                    status: 200,
                    statusText: 'HTTP/1 200 OK',
                    contentType: 'application/json',
                    responseText: JSON.stringify({
                        version: '1.1',
                        id: '12345',
                        result: methodFullInfoMock
                    })
                });

            jasmine.Ajax.stubRequest(Config.url('catalog'), /get_exec_aggr_stats/)
                .andReturn({
                    status: 200,
                    statusText: 'HTTP/1 200 OK',
                    contentType: 'application/json',
                    responseText: JSON.stringify({
                        version: '1.1',
                        id: '12345',
                        result: getExecAggrStatsMock
                    })
                });

            jasmine.Ajax.stubRequest(Config.url('catalog'), /get_module_info/)
                .andReturn({
                    status: 200,
                    statusText: 'HTTP/1 200 OK',
                    contentType: 'application/json',
                    responseText: JSON.stringify({
                        version: '1.1',
                        id: '12345',
                        result: getModuleInfoMock
                    })
                });
        });

        afterEach(() => {
            jasmine.Ajax.uninstall();
        });

        it('Loads the module with its expected constructor', () => {
            expect(InfoPanel).not.toBe(null);
            expect(InfoPanel.make).toBeDefined();
        });

        it('Has expected functions when instantiated', () => {
            const panel = makeDummyPanel();
            ['start', 'stop'].forEach(fn => {
                expect(panel[fn]).toBeDefined();
            });
        });

        it('Can render with "start" and return a Promise', () => {
            const panel = makeDummyPanel();
            const myNode = $('<div>');
            return panel.start({ node: myNode })
                .then(() => {
                    expect(myNode.find('.kb-app-cell-info-desc').text()).toContain('This is a KBase wrapper for SomeModule.');
                });
        });

        it('Can unrender with "stop" and return a Promise', () => {
            const panel = makeDummyPanel();
            const myNode = $('<div>');
            return panel.start({ node: myNode })
                .then(() => {
                    return panel.stop();
                })
                .then(() => {
                    expect(myNode.text()).toEqual('');
                });
        });
    });
});
