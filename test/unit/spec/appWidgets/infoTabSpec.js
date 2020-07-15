/*global define*/
/*global describe, expect, it*/
/*global beforeEach */
/*jslint white: true*/

define([
    '../../../../../narrative/nbextensions/appCell2/widgets/tabs/infoTab',
], function(
    infoTabWidget
) {
    'use strict';

    describe('The App Info Tab module', function() {
        it('loads', function() {
            expect(infoTabWidget).not.toBe(null);
        });

        it('has expected functions', function() {
            expect(infoTabWidget.make).toBeDefined();
        });

    });

    describe('The App Info Tab instance', function() {
        let node;
        const model = {
            getItem: (item) => model[item],
            'app': {'tag': 'Mock App'},
            'app.spec': {
                'info': {
                    'authors': ['Abraham', 'Martin', 'John'],
                    'id': 0,
                    'subtitle': 'A mock app for testing purposes',
                    'ver': '1.0.1',
                },
                'parameters': [{
                    'text_options': {
                        'valid_ws_types': ['genome']},
                    'ui_name': 'Genome',
                }],
            },
            'executionStats': {
                'number_of_calls': 1729,
                'total_exec_time': 9001,
            }
        };
        const mockInfoTab = infoTabWidget.make({model});

        beforeEach(function () {
            node = document.createElement('div');
        });

        it('has a factory which can be invoked', function() {
            expect(mockInfoTab).not.toBe(null);
        });

        it('has the required methods', function() {
            expect(mockInfoTab.start).toBeDefined();
            expect(mockInfoTab.stop).toBeDefined();
        });

        it('has a method "start" which returns a Promise',
            async function() {
                const result = await mockInfoTab.start({node});
                expect(result).toBe(node);
            }
        );

        it('has a method "stop" which returns a Promise',
            async function() {
                await mockInfoTab.start({node});
                const result = await mockInfoTab.stop();
                expect(result).toBeUndefined();
            }
        );

        it('returns the defined description', async function() {
            const infoTab = await mockInfoTab.start({node});
            expect(infoTab.firstChild.textContent).toBe(
                model['app.spec']['info']['subtitle']
            );
        });

        it('returns an item for each parameter', async function() {
            const infoTab = await mockInfoTab.start({node});
            const listItems = Array.from(infoTab.querySelectorAll('li li'));
            expect(listItems.length).toBe(1);
        });
    });
});
