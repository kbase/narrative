/* global describe it expect */

define([
    '../../../../../../narrative/nbextensions/bulkImportCell/main'
], (Main) => {
    'use strict';
    describe('test the bulkImportCell entrypoint module', () => {
        it('should have a load_ipython_extension function', () => {
            expect(Main.load_ipython_extension).toBeDefined();
        });
    });
});
