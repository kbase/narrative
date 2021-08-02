define(['kbaseCellToolbarMenu', 'narrativeConfig', 'base/js/namespace', 'testUtil'], (
    Widget,
    Config,
    Jupyter,
    TestUtil
) => {
    'use strict';

    afterAll(() => TestUtil.clearRuntime());

    function generateCell(mode, stage, collapsedState) {
        const currentState = {
            mode: mode,
            stage: stage,
        };
        const fsm = {
            currentState: currentState,
            getCurrentState: () => currentState,
        };

        return {
            element: [document.createElement('div')],
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
    }

    function generateToolbar(parentCell) {
        const instance = Widget.make();
        const container = document.createElement('div');
        instance.register_callback([container], parentCell);
        return container;
    }

    function generateToolbarFromMetadata(metadata) {
        const cell = {
            element: [document.createElement('div')],
            metadata: metadata,
        };
        return generateToolbar(cell);
    }

    function checkCellTitles(container, expected) {
        const title = container.querySelector('[data-element="title"]');
        const subtitle = container.querySelector('[data-element="subtitle"]');
        expect(title.textContent).toEqual(expected.title);
        expect(subtitle.textContent).toEqual(expected.subtitle);
    }

    function checkCellButtons(container, expected) {
        const cellButtons = container.querySelectorAll('.kb-cell-toolbar__button');
        expect(cellButtons.length).toEqual(expected.length);
        cellButtons.forEach((item, ix) => {
            expect(item.getAttribute('data-element')).toEqual(expected[ix]);
        });
    }

    function checkDropdownItems(container, expected) {
        const dropdownItems = container.querySelectorAll('.kb-cell-toolbar__dropdown_item');
        expect(dropdownItems.length).toEqual(expected.length);
        dropdownItems.forEach((item, ix) => {
            expect(item.getAttribute('data-element')).toEqual(expected[ix]);
        });
    }

    function checkOutdatedButton(container, hasButton) {
        const outdatedQuerySelector = '.kb-cell-toolbar__icon--outdated';
        if (hasButton) {
            expect(container.querySelectorAll(outdatedQuerySelector).length).toBe(1);
        } else {
            expect(container.querySelector(outdatedQuerySelector)).toBeNull();
        }
    }

    function checkJobStatus(container, status) {
        const selector = '[data-element="job-status"]';
        if (!status) {
            expect(container.querySelector(selector)).toBeNull();
            return;
        }
        expect(container.querySelector(selector).textContent).toBe(status);
    }

    describe('The kbaseCellToolbarMenu widget', () => {
        beforeEach(() => {
            Jupyter.narrative = {
                readonly: false,
            };
        });

        describe('the cell options buttons', () => {
            beforeEach(() => {
                Jupyter.narrative = {
                    readonly: false,
                };
            });

            // This test might want to check to see if each button has the correct fa-* class
            it('should render the correct app cell buttons in the correct order', () => {
                const cell = generateCell('success', '', 'maximized');
                const toolbar = generateToolbar(cell);
                const expectedButtonOrder = [
                    'cell-dropdown',
                    'cell-move-up',
                    'cell-move-down',
                    'cell-toggle-expansion',
                ];
                checkCellButtons(toolbar, expectedButtonOrder);
            });

            // no dropdown options available => the dropdown does not display
            it('should not show cell movement buttons in read-only mode', () => {
                Jupyter.narrative = {
                    readonly: true,
                };
                const cell = generateCell('success', '', 'maximized');
                const toolbar = generateToolbar(cell);
                const expectedButtonOrder = ['cell-toggle-expansion'];
                checkCellButtons(toolbar, expectedButtonOrder);
            });

            it('should show a dropdown for a code cell in read-only mode', () => {
                Jupyter.narrative = {
                    readonly: true,
                };
                const cell = generateCell('success', '', 'maximized');
                cell.cell_type = 'code';
                const toolbar = generateToolbar(cell);
                const expectedButtonOrder = ['cell-dropdown', 'cell-toggle-expansion'];
                checkCellButtons(toolbar, expectedButtonOrder);
            });

            it('should show a plus if the cell is minimised', () => {
                const toolbar = generateToolbar(generateCell('success', '', 'minimized'));
                const minMaxButton = toolbar.querySelector(
                    '[data-element="cell-toggle-expansion"] span'
                );
                expect(minMaxButton).toHaveClass('fa-plus-square-o');
                expect(minMaxButton).not.toHaveClass('fa-minus-square-o');
            });

            it('should show a minus if the cell is maximised', () => {
                const toolbar = generateToolbar(generateCell('success', '', 'maximized'));
                const minMaxButton = toolbar.querySelector(
                    '[data-element="cell-toggle-expansion"] span'
                );
                expect(minMaxButton).not.toHaveClass('fa-plus-square-o');
                expect(minMaxButton).toHaveClass('fa-minus-square-o');
            });
        });

        describe('the cell options dropdown', () => {
            beforeEach(() => {
                Jupyter.narrative = {
                    readonly: false,
                };
            });
            /*
                dropdown options:
                code-view
                info
                batch
                delete-cell
            */

            it('should not render any options for a read-only narrative and a plain cell', () => {
                Jupyter.narrative = {
                    readonly: true,
                };
                const toolbar = generateToolbar(generateCell('foo', 'bar', 'baz'));
                checkDropdownItems(toolbar, []);
            });

            it('should allow cell deletion for plain cells', () => {
                const toolbar = generateToolbar(generateCell('foo', 'bar', 'baz'));
                checkDropdownItems(toolbar, ['delete-cell']);
            });

            it('should render show code and info for a read-only narrative and a code cell', () => {
                Jupyter.narrative = {
                    readonly: true,
                };
                const cell = generateCell('foo', 'bar', 'baz');
                cell.cell_type = 'code';
                cell.showInfo = true;
                const toolbar = generateToolbar(cell);
                checkDropdownItems(toolbar, ['code-view', 'info']);
            });

            it('should not show batch if cell.toggleBatch exists and batchAppMode is false', () => {
                spyOn(Config, 'get').withArgs('features').and.returnValue({ batchAppMode: false });
                const cell = generateCell('foo', 'bar', 'baz');
                cell.toggleBatch = true;
                const toolbar = generateToolbar(cell);
                checkDropdownItems(toolbar, ['delete-cell']);
            });

            it('should show batch if cell.toggleBatch exists and batchAppMode is true', () => {
                spyOn(Config, 'get').withArgs('features').and.returnValue({ batchAppMode: true });
                const cell = generateCell('foo', 'bar', 'baz');
                cell.toggleBatch = true;
                const toolbar = generateToolbar(cell);
                checkDropdownItems(toolbar, ['batch', 'delete-cell']);
            });

            it('should show all possible options in order', () => {
                spyOn(Config, 'get').withArgs('features').and.returnValue({ batchAppMode: true });
                const cell = generateCell('foo', 'bar', 'baz');
                cell.cell_type = 'code';
                cell.showInfo = true;
                cell.toggleBatch = true;
                const toolbar = generateToolbar(cell);
                checkDropdownItems(toolbar, ['code-view', 'info', 'batch', 'delete-cell']);
            });

            it('should not show batch or deletion in read-only mode', () => {
                Jupyter.narrative = {
                    readonly: true,
                };
                spyOn(Config, 'get').withArgs('features').and.returnValue({ batchAppMode: true });
                const cell = generateCell('foo', 'bar', 'baz');
                cell.cell_type = 'code';
                cell.showInfo = true;
                cell.toggleBatch = true;
                const toolbar = generateToolbar(cell);
                checkDropdownItems(toolbar, ['code-view', 'info']);
            });

            it('should say "show code" if the code is currently hidden', () => {
                const cell = generateCell('foo', 'bar', 'baz');
                cell.cell_type = 'code';
                const toolbar = generateToolbar(cell);
                expect(toolbar.querySelector('[data-element="code-view"]').textContent).toBe(
                    'Show code'
                );
            });

            it('should say "show code" if the code is currently hidden, isCodeShowing function', () => {
                const cell = generateCell('foo', 'bar', 'baz');
                cell.cell_type = 'code';
                cell.isCodeShowing = () => {
                    return false;
                };
                const toolbar = generateToolbar(cell);
                expect(toolbar.querySelector('[data-element="code-view"]').textContent).toBe(
                    'Show code'
                );
            });

            it('should say "hide code" if the code is currently showing', () => {
                const cell = generateCell('foo', 'bar', 'baz');
                cell.cell_type = 'code';
                cell.isCodeShowing = () => {
                    return true;
                };
                const toolbar = generateToolbar(cell);
                expect(toolbar.querySelector('[data-element="code-view"]').textContent).toBe(
                    'Hide code'
                );
            });
        });

        describe('the outdated button', () => {
            it('should not render an outdated button for a non-app cell', () => {
                const metadata = {
                    kbase: {
                        codeCell: {},
                        type: 'code',
                    },
                };
                const toolbar = generateToolbarFromMetadata(metadata);
                checkOutdatedButton(toolbar, false);
            });
            it('should not render an outdated button for a non-outdated app', () => {
                const metadata = {
                    kbase: {
                        appCell: {},
                        type: 'app',
                    },
                };
                const toolbar = generateToolbarFromMetadata(metadata);
                checkOutdatedButton(toolbar, false);
            });

            it('should render an outdated button for an app that is outdated', () => {
                const metadata = {
                    kbase: {
                        appCell: {
                            outdated: true,
                        },
                        type: 'app',
                    },
                };
                const toolbar = generateToolbarFromMetadata(metadata);
                checkOutdatedButton(toolbar, true);
            });
        });

        describe('title and subtitle attributes', () => {
            it('should render no title or subtitle by default', () => {
                const metadata = {
                    kbase: {
                        type: 'app',
                        attributes: {},
                    },
                };
                const toolbar = generateToolbarFromMetadata(metadata);
                checkCellTitles(toolbar, { title: '', subtitle: '' });
            });

            it('should render a title and subtitle correctly', () => {
                const attributes = {
                    title: 'Cell title',
                    subtitle: 'Cell subtitle',
                };
                const metadata = {
                    kbase: {
                        attributes: attributes,
                    },
                };
                const toolbar = generateToolbarFromMetadata(metadata);
                checkCellTitles(toolbar, attributes);
            });

            it('should not render a title or subtitle if cellState.showTitle is false', () => {
                const metadata = {
                    kbase: {
                        attributes: {
                            title: 'Cell title',
                            subtitle: 'Cell subtitle',
                        },
                        cellState: {
                            showTitle: false,
                        },
                    },
                };
                const toolbar = generateToolbarFromMetadata(metadata);
                checkCellTitles(toolbar, { title: '', subtitle: '' });
            });
        });

        describe('job status summary', () => {
            const tests = [
                { mode: 'error', stage: '', minMax: 'minimized', text: 'error' },
                { mode: 'internal-error', stage: '', minMax: 'minimized', text: 'error' },
                { mode: 'canceling', stage: '', minMax: 'minimized', text: 'canceled' },
                { mode: 'canceled', stage: '', minMax: 'minimized', text: 'canceled' },
                { mode: 'processing', stage: 'running', minMax: 'minimized', text: 'running' },
                { mode: 'processing', stage: 'queued', minMax: 'minimized', text: 'queued' },
                { mode: 'success', stage: '', minMax: 'minimized', text: 'success' },
                // invalid input
                { mode: 'processing', stage: 'unknown', minMax: 'minimized' },
                { mode: '', stage: 'running', minMax: 'minimized' },
                { mode: 'vacationing', stage: '', minMax: 'minimized' },
                // cell maximised
                { mode: 'internal-error', stage: '', minMax: 'maximized' },
                { mode: 'canceling', stage: '', minMax: 'maximized' },
                { mode: 'processing', stage: 'running', minMax: 'maximized' },
            ];

            tests.forEach((test) => {
                if (test.text) {
                    it(`should show status "${test.text}" with mode "${test.mode}", stage "${test.stage}", min/max "${test.minMax}"`, () => {
                        const cell = generateCell(test.mode, test.stage, test.minMax);
                        const toolbar = generateToolbar(cell);
                        checkJobStatus(toolbar, test.text);
                    });
                } else {
                    it(`should not show job status with mode "${test.mode}", stage "${test.stage}", min/max "${test.minMax}"`, () => {
                        const cell = generateCell(test.mode, test.stage, test.minMax);
                        const toolbar = generateToolbar(cell);
                        checkJobStatus(toolbar, null);
                    });
                }
            });
        });
    });
});
