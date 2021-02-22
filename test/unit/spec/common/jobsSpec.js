define(['common/jobs'], (Jobs) => {
    'use strict';
    describe('Test Jobs module', () => {
        it('Should be loaded with the right functions', () => {
            expect(Jobs).toBeDefined();
            expect(Jobs.isValidJobState).toBeDefined();
        });

        it('Should know how to tell good job states', () => {
            const goodJs = {
                job_id: 'foo',
                created: 12345,
                other: 'key',
                another: 'key',
            };
            expect(Jobs.isValidJobState(goodJs)).toBeTrue();
        });

        it('Should know how to tell bad job states', () => {
            const badJsList = [
                1,
                'foo',
                ['a', 'list'],
                {
                    job_id: 'somejob',
                    other: 'key',
                },
                {
                    created: 'at_some_point',
                    other: 'key',
                },
                {
                    foobar: 'baz',
                },
                null,
                undefined,
            ];
            badJsList.forEach((elem) => {
                expect(Jobs.isValidJobState(elem)).toBeFalse();
            });
        });
    });
});
