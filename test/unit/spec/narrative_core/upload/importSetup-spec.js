define([
    'kbase/js/widgets/narrative_core/upload/importSetup',
    'base/js/namespace',
    'narrativeConfig',
    'testUtil',
], (ImportSetup, Jupyter, Config, TestUtil) => {
    'use strict';

    fdescribe('ImportSetup module tests', () => {
        beforeAll(() => {
            Jupyter.narrative = {
                sidePanel: {
                    $methodsWidget: {
                        currentTag: 'release',
                    },
                },
                addAndPopulateApp: () => {},
                insertBulkImportCell: () => {},
            };
        });

        beforeEach(() => {
            jasmine.Ajax.install();
        });

        afterEach(() => {
            jasmine.Ajax.uninstall();
        });

        afterAll(() => {
            Jupyter.narrative = null;
            TestUtil.clearRuntime();
        });

        it('should have expected functions', () => {
            ['setupImportCells', 'setupWebUploadCell'].forEach((fn) => {
                expect(ImportSetup[fn]).toEqual(jasmine.any(Function));
            });
        });

        xdescribe('setupImportCells tests', () => {});

        describe('setupWebUploadCell tests', () => {
            it('should create a web upload app cell', () => {
                spyOn(Jupyter.narrative, 'addAndPopulateApp');
                ImportSetup.setupWebUploadCell();
                expect(Jupyter.narrative.addAndPopulateApp).toHaveBeenCalledWith(
                    'kb_uploadmethods/upload_web_file',
                    'release',
                    {}
                );
            });
        });
    });
});
