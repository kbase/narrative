/*global define, describe, it, expect, jasmine, beforeEach, afterEach*/
/*jslint white: true*/
define([
    'util/jobLogViewer'
], (
    JobLogViewer
) => {
    describe('Test the job log viewer module', () => {
        beforeEach(() => {

        });

        it('Should load the module code successfully', () => {
            expect(JobLogViewer).toBeDefined();
        });

        it('Should have the factory method', () => {
            expect(JobLogViewer.make).toBeDefined();
            expect(JobLogViewer.make).toEqual(jasmine.any(Function));
        });
    });
})
