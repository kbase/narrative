/*global describe, it, expect, beforeAll */
/*jslint white: true*/
define([
    'jquery',
    'kbaseCellToolbarMenu',
    'base/js/namespace'
], function (
    $,
    Widget,
    Jupyter
) {
    'use strict';
    describe('Test the kbaseCellToolbarMenu widget', function () {
        beforeAll(() => {
            Jupyter.narrative = {
                readonly: false
            };
        });

        const mockParentCell = (mode, stage, collapsedState) => {
            const messageContainer = document.createElement('div');
            const currentState = {
                mode: mode,
                stage: stage
            };
            const fsm = {
                currentState: currentState,
                getCurrentState: () => currentState,
            };
            return {
                element: [messageContainer],
                metadata: {
                    kbase: {
                        appCell: {
                            fsm: fsm
                        },
                        cellState: {
                            toggleMinMax: collapsedState
                        },
                        type: 'app'
                    }
                }
            };
        };

        const mockToolbar = (mode, stage, collapsedState) => {
            const instance = Widget.make();
            const parentCell = mockParentCell(mode, stage, collapsedState);
            const toolbarDiv = document.createElement('div');
            instance.register_callback([toolbarDiv], parentCell);
            return toolbarDiv.querySelectorAll(
                'div.title div:nth-child(3)'
            )[0].innerText;
        };


        const mockToolbarDataTestNodes = (mode, stage, collapsedState) => {
            const instance = Widget.make();
            const parentCell = mockParentCell(mode, stage, collapsedState);
            const toolbarDiv = document.createElement('div');
            instance.register_callback([toolbarDiv], parentCell);
            return toolbarDiv.querySelectorAll(
                '[data-test]'
            );
        };

        // This test might better be served through Snapshot Testing
        // This test might want to check to see if each buttton has the correct fa-* class
        it('Should render the correct app cell buttons in the correct order', function () {
            var testToolBar = mockToolbarDataTestNodes('success', '', 'maximized');
            var expectedButtonOrder = ['cell-dropdown', 'cell-move-up', 'cell-move-down', 'cell-toggle-expansion'];
            var extractedButtons = [];
            testToolBar.forEach(function (element) {
                var attribute = element.getAttribute('data-test');
                if (expectedButtonOrder.includes(attribute)) {
                    extractedButtons.push(attribute);
                }
            });
            expect(extractedButtons.length).toEqual(expectedButtonOrder.length);
            expect(extractedButtons).toEqual(expectedButtonOrder);
        });


        it('Should say Error when minimized and mode is error', function () {
            expect(
                mockToolbar('error', '', 'minimized')
            ).toBe('Error');
        });

        it('Should say Error when minimized and mode is internal-error', function () {
            expect(
                mockToolbar('internal-error', '', 'minimized')
            ).toBe('Error');
        });

        it('Should say Canceled when minimized and canceling', function () {
            expect(
                mockToolbar('canceling', '', 'minimized')
            ).toBe('Canceled');
        });

        it('Should say Canceled when minimized and canceled', function () {
            expect(
                mockToolbar('canceled', '', 'minimized')
            ).toBe('Canceled');
        });

        it('Should say Running when minimized and running', function () {
            expect(
                mockToolbar('processing', 'running', 'minimized')
            ).toBe('Running');
        });

        it('Should say Running when minimized and queued', function () {
            expect(
                mockToolbar('processing', 'queued', 'minimized')
            ).toBe('Queued');
        });

        it('Should say Success when minimized and mode is success', function () {
            expect(
                mockToolbar('success', '', 'minimized')
            ).toBe('Success');
        });

        it('Should suppress the status message if maximized', function () {
            expect(
                mockToolbar('processing', 'running', 'maximized')
            ).toBe('');
        });
    });
});
