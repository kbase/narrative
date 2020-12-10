/*jslint white: true*/
define([
    'kbaseNarrativeWorkspace',
    'jquery',
    'base/js/namespace',
    'narrativeMocks',
    'common/runtime',
    'json!/test/data/NarrativeTest.test_simple_inputs.spec.json'
], (
    KBaseNarrativeWorkspace,
    $,
    Jupyter,
    Mocks,
    Runtime,
    AppSpec
) => {
    'use strict';
    describe('Test the kbaseNarrativeWorkspace widget', () => {
        let $node;
        beforeEach(() => {
            jasmine.Ajax.install();
            $node = $('div');
            $('body').append($node);
            Jupyter.notebook = Mocks.buildMockNotebook({
                readOnly: false,
            });
            Jupyter.narrative = {
                sidePanel: {
                    setReadOnlyMode: () => {}
                },
                toggleSidePanel: () => {},
                insertAndSelectCellBelow: () => {
                    return {
                        metadata: {
                            kbase: {
                                appCell: {
                                    params: {}
                                }
                            }
                        }
                    };
                }  // just a mock
            };
        });

        afterEach(() => {
            jasmine.Ajax.uninstall();
            $node.detach();
        });

        it('should attach to a node and show its UI mode', () => {
            let widget = new KBaseNarrativeWorkspace($node);
            expect(widget.uiModeIs('edit')).toBe(Jupyter.notebook.writable);
        });

        it('buildAppCodeCell should work by direct call', () => {
            const params = {
                'foo': 'bar',
                'baz': 'frobozz'
            };
            let widget = new KBaseNarrativeWorkspace($node);
            spyOn(Jupyter.narrative, 'insertAndSelectCellBelow').and.callThrough();
            let cell = widget.buildAppCodeCell(AppSpec, 'release', params);
            expect(Jupyter.narrative.insertAndSelectCellBelow).toHaveBeenCalled();
            expect(cell.metadata.kbase.appCell.params).toEqual(params);
        });

        it('buildAppCodeCell should work by event', () => {
            const params = {
                'foo': 'bar',
                'baz': 'frobozz'
            };
            let widget = new KBaseNarrativeWorkspace($node);
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
            let widget = new KBaseNarrativeWorkspace($node);
            expect(widget.buildAppCodeCell()).toBeUndefined();
        });

        it('buildViewerCell should work by direct call', () => {
            let widget = new KBaseNarrativeWorkspace($node);
            let placements = {
                above: 'above',
                below: 'below',
                blah: 'below'
            };
            for (const place of Object.keys(placements)) {
                let cell = widget.buildViewerCell(0, {
                    placement: place,
                    info: {}
                });
                expect(cell.cell_type).toEqual('code');
            }
        });

        it('buildViewerCell should work by event', () => {
            let widget = new KBaseNarrativeWorkspace($node);
            spyOn(widget, 'buildViewerCell');
            $(document).trigger('createViewerCell.Narrative', [{info: {}}]);
            expect(widget.buildViewerCell).toHaveBeenCalled();

            // shouldn't do anything in view mode
            widget.enterReadOnlyMode();
            $(document).trigger('createViewerCell.Narrative', [{info: {}}]);
            expect(widget.buildViewerCell).toHaveBeenCalled();
        });

        it('should go back and forth between read-only and read-write modes in a writable Narrative', () => {
            let widget = new KBaseNarrativeWorkspace($node);
            let initialUIMode = 'edit';  // this is the beforeEach starting point
            expect(widget.uiModeIs(initialUIMode)).toBeTruthy();
            widget.enterReadOnlyMode();
            expect(widget.uiModeIs(initialUIMode)).toBeFalsy();
            widget.enterReadWriteMode();
            expect(widget.uiModeIs(initialUIMode)).toBeTruthy();
        });

        it('should not be able to toggle out of read only mode if the narrative is not writable', () => {
            Jupyter.notebook.writable = false;
            let widget = new KBaseNarrativeWorkspace($node);
            expect(widget.narrativeIsReadOnly).toBeTruthy();
            expect(widget.uiMode).toEqual('view');
            widget.enterReadWriteMode();
            expect(widget.uiMode).toEqual('view');
        });

        it('should delete KBase extension cells by direct call by bus command', (done) => {
            let cell = Mocks.buildMockCell('code', 'app');
            Jupyter.notebook.cells[0] = cell;  // manually mock out the notebook state
            let widget = new KBaseNarrativeWorkspace($node);
            let runtime = Runtime.make();
            let cellBus = runtime.bus().makeChannelBus({
                name: {
                    cell: cell.metadata.kbase.attributes.id
                },
                description: 'testing bus'
            });
            cellBus.on('delete-cell', () => done());
            widget.deleteCell(0);
        });

        it('should delete KBase extension cells by direct call by dialog', (done) => {
            Jupyter.notebook = Mocks.buildMockNotebook({
                readOnly: false,
                deleteCallback: () => done()
            });
            Jupyter.notebook.insert_cell_above('code', 0);
            let widget = new KBaseNarrativeWorkspace($node);
            widget.deleteCell(0);
            // that makes a popup happen. find and click the element.
            document.querySelector('[data-element="modal"] [data-element="yes"]').click();
            // that click should trigger deleteCallback, and this is done. Yay!
        });

        it('should delete cells by event', (done) => {
            let cell = Mocks.buildMockCell('code', 'app');
            Jupyter.notebook.cells[0] = cell;  // manually mock out the notebook state
            new KBaseNarrativeWorkspace($node);
            let runtime = Runtime.make();
            let cellBus = runtime.bus().makeChannelBus({
                name: {
                    cell: cell.metadata.kbase.attributes.id
                },
                description: 'testing bus'
            });
            cellBus.on('delete-cell', () => done());
            $(document).trigger('deleteCell.Narrative', [0]);

        });

        it('should not fail when trying to delete cells with an invalid index', () => {
            let widget = new KBaseNarrativeWorkspace($node);
            widget.deleteCell();
            widget.deleteCell(1000);
        });

        it('should have a working copy button', () => {

        });
    });
});
