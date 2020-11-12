/* global describe, it, expect, spyOn */
define([
    '../../../../../../narrative/nbextensions/bulkImportCell/bulkImportCell',
    'base/js/namespace',
    'common/runtime',
    'narrativeMocks'
], (
    BulkImportCell,
    Jupyter,
    Runtime,
    Mocks
) => {
    'use strict';

    describe('test the bulk import cell module', () => {
        it('should construct a bulk import cell class', () => {
            const cell = Mocks.buildMockCell('code');
            expect(cell.getIcon).not.toBeDefined();
            expect(cell.renderIcon).not.toBeDefined();
            const cellWidget = new BulkImportCell(cell, true);
            expect(cellWidget).toBeDefined();
            expect(cell.getIcon).toBeDefined();
            expect(cell.renderIcon).toBeDefined();
            expect(cell.metadata.kbase).toBeDefined();
            for(const prop of ['id', 'status', 'created', 'title', 'subtitle']) {
                expect(cell.metadata.kbase.attributes[prop]).toBeDefined();
            }
            expect(cell.metadata.kbase.type).toBe('app-bulk-import');
            expect(cell.metadata.kbase.bulkImportCell).toBeDefined();
        });
    });
});
