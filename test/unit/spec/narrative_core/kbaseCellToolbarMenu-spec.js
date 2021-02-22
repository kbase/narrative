define(['jquery', 'kbaseCellToolbarMenu', 'base/js/namespace'], ($, Widget, Jupyter) => {
    'use strict';
    describe('Test the kbaseCellToolbarMenu widget', () => {
        beforeAll(() => {
            Jupyter.narrative = {
                readonly: false,
            };
        });

        const mockParentCell = (mode, stage, collapsedState) => {
            const messageContainer = document.createElement('div');
            const currentState = {
                mode: mode,
                stage: stage,
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
                            fsm: fsm,
                        },
                        cellState: {
                            toggleMinMax: collapsedState,
                        },
                        type: 'app',
                    },
                },
            };
        };

        const mockToolbar = (mode, stage, collapsedState) => {
            const instance = Widget.make();
            const parentCell = mockParentCell(mode, stage, collapsedState);
            const toolbarDiv = document.createElement('div');
            instance.register_callback([toolbarDiv], parentCell);
            return toolbarDiv.querySelectorAll('div.title div:nth-child(3)')[0].innerText;
        };

        const mockToolbarDataTestNodes = (mode, stage, collapsedState) => {
            const instance = Widget.make();
            const parentCell = mockParentCell(mode, stage, collapsedState);
            const toolbarDiv = document.createElement('div');
            instance.register_callback([toolbarDiv], parentCell);
            return toolbarDiv.querySelectorAll('[data-test]');
        };

        // This test might better be served through Snapshot Testing
        // This test might want to check to see if each buttton has the correct fa-* class
        it('Should render the correct app cell buttons in the correct order', () => {
            const testToolBar = mockToolbarDataTestNodes('success', '', 'maximized');
            const expectedButtonOrder = [
                'cell-dropdown',
                'cell-move-up',
                'cell-move-down',
                'cell-toggle-expansion',
            ];
            const extractedButtons = [];
            testToolBar.forEach((element) => {
                const attribute = element.getAttribute('data-test');
                if (expectedButtonOrder.includes(attribute)) {
                    extractedButtons.push(attribute);
                }
            });
            expect(extractedButtons.length).toEqual(expectedButtonOrder.length);
            expect(extractedButtons).toEqual(expectedButtonOrder);
        });

        it('Should say Error when minimized and mode is error', () => {
            expect(mockToolbar('error', '', 'minimized')).toBe('Error');
        });

        it('Should say Error when minimized and mode is internal-error', () => {
            expect(mockToolbar('internal-error', '', 'minimized')).toBe('Error');
        });

        it('Should say Canceled when minimized and canceling', () => {
            expect(mockToolbar('canceling', '', 'minimized')).toBe('Canceled');
        });

        it('Should say Canceled when minimized and canceled', () => {
            expect(mockToolbar('canceled', '', 'minimized')).toBe('Canceled');
        });

        it('Should say Running when minimized and running', () => {
            expect(mockToolbar('processing', 'running', 'minimized')).toBe('Running');
        });

        it('Should say Running when minimized and queued', () => {
            expect(mockToolbar('processing', 'queued', 'minimized')).toBe('Queued');
        });

        it('Should say Success when minimized and mode is success', () => {
            expect(mockToolbar('success', '', 'minimized')).toBe('Success');
        });

        it('Should suppress the status message if maximized', () => {
            expect(mockToolbar('processing', 'running', 'maximized')).toBe('');
        });
    });
});
