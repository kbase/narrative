/*global define*/
/*global describe, it, expect*/
/*global jasmine*/
/*global beforeEach, afterEach*/
/*jslint white: true*/
define([
    'jobCommChannel'
], function(JobCommChannel) {
    describe('Test the jobCommChannel widget', () => {
        it('Should load properly', () => {
            expect(JobCommChannel).not.toBeNull();
        });

        it('Should be instantiable and contain the right components', () => {
            let comm = new JobCommChannel();
            expect(comm.initCommChannel).toBeDefined();
            expect(comm.jobStates).toEqual({});
        });

        it('Should initialize correctly on request', () => {
            let comm = new JobCommChannel();
            comm.initCommChannel();
        });
    });
});
