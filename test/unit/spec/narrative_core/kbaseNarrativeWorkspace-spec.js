define([
    'kbaseNarrativeWorkspace',
    'jquery',
    'base/js/namespace',
    'narrativeMocks',
    'testUtil',
    'common/runtime',
    'json!/test/data/NarrativeTest.test_simple_inputs.spec.json',
], (KBaseNarrativeWorkspace, $, Jupyter, Mocks, TestUtil, Runtime, AppSpec) => {
    'use strict';

    describe('Test the kbaseNarrativeWorkspace widget', () => {
        let $node, $container;
        beforeAll(() => {
            $(document).off();
        });

        beforeEach(() => {
            jasmine.Ajax.install();
            $node = $(document.createElement('div'));
            $container = $(document.createElement('div')).append($node);
            $('body').append($container);
            Jupyter.notebook = Mocks.buildMockNotebook({
                readOnly: false,
            });
            Jupyter.narrative = {
                sidePanel: {
                    setReadOnlyMode: () => {},
                },
                toggleSidePanel: () => {},
                insertAndSelectCellBelow: () => {
                    return {
                        metadata: {
                            kbase: {
                                appCell: {
                                    params: {},
                                },
                            },
                        },
                    };
                }, // just a mock
            };
        });

        afterEach(() => {
            jasmine.Ajax.uninstall();
            $container.remove();
            $(document).off();
            TestUtil.clearRuntime();
        });

        it('should attach to a node and show its UI mode', () => {
            const widget = new KBaseNarrativeWorkspace($node);
            expect(widget.uiModeIs('edit')).toBe(Jupyter.notebook.writable);
        });

        it('buildAppCodeCell should work by direct call', () => {
            const params = {
                foo: 'bar',
                baz: 'frobozz',
            };
            const widget = new KBaseNarrativeWorkspace($node);
            spyOn(Jupyter.narrative, 'insertAndSelectCellBelow').and.callThrough();
            const cell = widget.buildAppCodeCell(AppSpec, 'release', params);
            expect(Jupyter.narrative.insertAndSelectCellBelow).toHaveBeenCalled();
            expect(cell.metadata.kbase.appCell.params).toEqual(params);
        });

        it('buildAppCodeCell should work by event', () => {
            const params = {
                foo: 'bar',
                baz: 'frobozz',
            };
            const widget = new KBaseNarrativeWorkspace($node);
            spyOn(Jupyter.narrative, 'insertAndSelectCellBelow').and.callThrough();
            $(document).trigger('appClicked.Narrative', [AppSpec, 'release', params]);
            expect(Jupyter.narrative.insertAndSelectCellBelow).toHaveBeenCalled();

            // shouldn't do anything in view mode
            widget.enterReadOnlyMode();
            spyOn(widget, 'buildAppCodeCell');
            $(document).trigger('appClicked.Narrative', [AppSpec, 'release', params]);
            expect(widget.buildAppCodeCell).not.toHaveBeenCalled();
        });

        it('buildAppCodeCell should fail without a spec', () => {
            spyOn(window, 'alert');
            const widget = new KBaseNarrativeWorkspace($node);
            expect(widget.buildAppCodeCell()).toBeUndefined();
            expect(window.alert).toHaveBeenCalled();
        });

        it('buildViewerCell should work by direct call', () => {
            const widget = new KBaseNarrativeWorkspace($node);
            const placements = {
                above: 'above',
                below: 'below',
                blah: 'below',
            };
            for (const place of Object.keys(placements)) {
                const cell = widget.buildViewerCell(0, {
                    placement: place,
                    info: {},
                });
                expect(cell.cell_type).toEqual('code');
            }
        });

        it('buildViewerCell should work by event', () => {
            const widget = new KBaseNarrativeWorkspace($node);
            spyOn(widget, 'buildViewerCell');
            $(document).trigger('createViewerCell.Narrative', [{ info: {} }]);
            expect(widget.buildViewerCell).toHaveBeenCalled();

            // shouldn't do anything in view mode
            widget.enterReadOnlyMode();
            $(document).trigger('createViewerCell.Narrative', [{ info: {} }]);
            expect(widget.buildViewerCell).toHaveBeenCalled();
        });

        it('should go back and forth between read-only and read-write modes in a writable Narrative', () => {
            const widget = new KBaseNarrativeWorkspace($node);
            const initialUIMode = 'edit'; // this is the beforeEach starting point
            expect(widget.uiModeIs(initialUIMode)).toBeTruthy();
            widget.enterReadOnlyMode();
            expect(widget.uiModeIs(initialUIMode)).toBeFalsy();
            widget.enterReadWriteMode();
            expect(widget.uiModeIs(initialUIMode)).toBeTruthy();
        });

        it('should not be able to toggle out of read only mode if the narrative is not writable', () => {
            Jupyter.notebook.writable = false;
            const widget = new KBaseNarrativeWorkspace($node);
            expect(widget.narrativeIsReadOnly).toBeTruthy();
            expect(widget.uiMode).toEqual('view');
            widget.enterReadWriteMode();
            expect(widget.uiMode).toEqual('view');
        });

        it('should control the toggle read/write mode', (done) => {
            Jupyter.CellToolbar = {
                rebuild_all: () => {},
            };
            // included in the main templates, mocked here
            $container.append('<button id="kb-view-mode">');
            const widget = new KBaseNarrativeWorkspace($node);
            expect(widget.narrativeIsReadOnly).toBeFalsy();
            expect(widget.uiMode).toEqual('edit');

            // use these to count how many messages get sent
            // we expect to see them twice, so when they're both = 2, then
            // we're done.
            let caughtReadOnlyMsg = 0;
            const runtime = Runtime.make();
            const currentViewState = widget.uiMode;
            runtime.bus().on('read-only-changed', () => {
                caughtReadOnlyMsg++;
                if (caughtReadOnlyMsg < 2) {
                    // the view state should've been toggled
                    expect(currentViewState).not.toEqual(widget.uiMode);
                    $('#kb-view-mode').click();
                } else {
                    done();
                }
            });
            $('#kb-view-mode').click();
        });

        it('should delete KBase extension cells by direct call by bus command', (done) => {
            const cell = Mocks.buildMockCell('code', 'app');
            Jupyter.notebook.cells[0] = cell; // manually mock out the notebook state
            const widget = new KBaseNarrativeWorkspace($node),
                runtime = Runtime.make(),
                cellBus = runtime.bus().makeChannelBus({
                    name: {
                        cell: cell.metadata.kbase.attributes.id,
                    },
                    description: 'testing bus',
                });
            cellBus.on('delete-cell', (msg) => {
                expect(msg).toBeDefined();
                done();
            });
            widget.deleteCell(0);
        });

        it('should delete KBase extension cells by direct call by dialog', async () => {
            Jupyter.notebook = Mocks.buildMockNotebook({
                readOnly: false,
            });
            Jupyter.notebook.insert_cell_above('code', 0);
            const widget = new KBaseNarrativeWorkspace($node);
            widget.deleteCell(0);

            // 'deleteCell' triggers an 'Are you sure?' popup. Wait for the 'OK' button to appear
            const okButton = '[data-element="modal"] [data-element="ok"]';
            await TestUtil.waitForElement(document.body, okButton);

            // spy on the notebook's `delete_cell` function, which is triggered by clicking the 'OK' button
            return new Promise((resolve) => {
                spyOn(Jupyter.notebook, 'delete_cell').and.callFake(() => {
                    expect(Jupyter.notebook.delete_cell).toHaveBeenCalled();
                    resolve();
                });
                // this click should trigger delete callback, and this is done. Yay!
                document.querySelector(okButton).click();
            });
        });

        it('should delete cells by event', (done) => {
            const cell = Mocks.buildMockCell('code', 'app');
            Jupyter.notebook.cells[0] = cell; // manually mock out the notebook state
            new KBaseNarrativeWorkspace($node);
            const runtime = Runtime.make();
            const cellBus = runtime.bus().makeChannelBus({
                name: {
                    cell: cell.metadata.kbase.attributes.id,
                },
                description: 'testing bus',
            });
            cellBus.on('delete-cell', (msg) => {
                expect(msg).toBeDefined();
                done();
            });
            $(document).trigger('deleteCell.Narrative', [0]);
        });

        it('should not fail when trying to delete cells with an invalid index', () => {
            const widget = new KBaseNarrativeWorkspace($node);
            expect(() => widget.deleteCell()).not.toThrow();
            expect(() => widget.deleteCell(1000)).not.toThrow();
        });
    });
});
