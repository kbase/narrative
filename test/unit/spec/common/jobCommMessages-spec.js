define(['common/jobCommMessages'], (JobCommMessages) => {
    'use strict';

    describe('the JobCommMessages module', () => {
        const expectedKeys = ['CHANNEL', 'MESSAGE_TYPE', 'PARAM', 'REQUESTS', 'RESPONSES'];

        expectedKeys.forEach((key) => {
            it(`has the required key ${key}`, () => {
                expect(JobCommMessages[key]).toBeDefined();
            });
        });

        // ensure that the values in REQUESTS and RESPONSES are all in MESSAGE_TYPE
        for (const type of ['REQUESTS', 'RESPONSES']) {
            it(`${type} passes basic validity checks`, () => {
                Object.keys(JobCommMessages[type]).forEach((key) => {
                    // all keys are in MESSAGE_TYPE
                    expect(key in JobCommMessages.MESSAGE_TYPE).toBeTrue();
                    // the values are equal to those in MESSAGE TYPE
                    expect(JobCommMessages[type][key]).toEqual(JobCommMessages.MESSAGE_TYPE[key]);
                });
            });
        }
    });
});
