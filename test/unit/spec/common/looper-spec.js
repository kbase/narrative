define(['common/looper'], (Looper) => {
    'use strict';

    describe('the Looper instance', () => {
        beforeEach(() => {
            jasmine.clock().install();
        });
        afterEach(() => {
            jasmine.clock().uninstall();
        });

        it('can be instantiated', () => {
            const looperInstance = new Looper();
            ['scheduleRequest', 'clearRequest'].forEach((fn) => {
                expect(looperInstance[fn]).toEqual(jasmine.any(Function));
            });
        });

        it('has a default poll interval', () => {
            const looperInstance = new Looper();
            expect(looperInstance.pollInterval).toBeGreaterThan(0);
        });

        it('can have a poll interval set', () => {
            const looperInstance = new Looper({ pollInterval: 500 });
            expect(looperInstance.pollInterval).toEqual(500);
        });

        it('executes a function after a delay', () => {
            const looperInstance = new Looper({ pollInterval: 10000 });
            spyOn(console, 'error');
            looperInstance.scheduleRequest(console.error, 'ZOMG!');
            expect(console.error).not.toHaveBeenCalled();
            jasmine.clock().tick(10001);
            expect(console.error.calls.allArgs()).toEqual([['ZOMG!']]);
        });

        it('can have the function cleared', () => {
            const looperInstance = new Looper({ pollInterval: 10000 });
            spyOn(console, 'error');
            looperInstance.scheduleRequest(console.error, 'ZOMG!');
            expect(console.error).not.toHaveBeenCalled();
            jasmine.clock().tick(1000);
            looperInstance.clearRequest();
            jasmine.clock().tick(10000);
            expect(console.error).not.toHaveBeenCalled();
        });
    });
});
