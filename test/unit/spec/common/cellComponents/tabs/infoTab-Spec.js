/*global beforeEach */
/*global define*/ // eslint-disable-line no-redeclare
/*global describe, expect, it*/
/*jslint white: true*/

define(['common/cellComponents/tabs/infoTab'], function (infoTabWidget) {
    'use strict';

    describe('The App Info Tab module', function () {
        it('loads', function () {
            expect(infoTabWidget).not.toBe(null);
        });

        it('has expected functions', function () {
            expect(infoTabWidget.make).toBeDefined();
        });
    });

    describe('The App Info Tab instance', function () {
        const model = {
            getItem: (item) => model[item],
            app: { tag: 'Mock App' },
            'app.spec': {
                full_info: {
                    description: 'Details about this mock app',
                },
                info: {
                    authors: ['Abraham', 'Martin', 'John'],
                    id: 0,
                    subtitle: 'A mock app for testing purposes',
                    ver: '1.0.1',
                },
                parameters: [
                    {
                        text_options: {
                            valid_ws_types: ['KBaseRNASeq.RNASeqSampleSet'],
                        },
                        ui_name: 'RNA sequence object <font color=red>*</font>',
                    },
                    {
                        ui_name: 'Adapters',
                    },
                ],
            },
            executionStats: {
                number_of_calls: 1729,
                total_exec_time: 9001,
            },
        };
        const appSpec = model.getItem('app.spec');
        const mockInfoTab = infoTabWidget.make({ model });
        let node, infoTabPromise, infoTab;

        beforeEach(async function () {
            node = document.createElement('div');
            infoTabPromise = mockInfoTab.start({ node });
            infoTab = await infoTabPromise;
            return infoTab; // to use infoTab for linter
        });

        it('has a factory which can be invoked', function () {
            expect(mockInfoTab).not.toBe(null);
        });

        it('has the required methods', function () {
            expect(mockInfoTab.start).toBeDefined();
            expect(mockInfoTab.stop).toBeDefined();
        });

        it('has a method "start" which returns a Promise', function () {
            expect(infoTabPromise instanceof Promise).toBeTrue();
        });

        it('has a method "stop" which returns a Promise', function () {
            const result = mockInfoTab.stop();
            expect(result instanceof Promise).toBeTrue();
        });

        it('returns the defined description', function () {
            expect(infoTab.firstChild.textContent).toBe(appSpec.full_info.description);
        });

        it('returns an item for each parameter', function () {
            const listItems = Array.from(infoTab.querySelectorAll('li li'));
            expect(listItems.length).toBe(appSpec.parameters.length);
        });

        it('renders parameter with formatting correctly', function () {
            const RNASeqFormat = infoTab.querySelectorAll('li li:nth-child(1) font');
            expect(RNASeqFormat.length).toBeGreaterThan(0);
        });

        it('renders parameter with no formatting correctly', function () {
            const AdaptersFormat = infoTab.querySelectorAll('li li:nth-child(2)')[0];
            expect(AdaptersFormat.innerText).toBe(appSpec.parameters[1].ui_name);
        });
    });
});
