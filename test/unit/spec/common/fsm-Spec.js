define(['common/fsm'], (Fsm) => {
    'use strict';

    const simpleStates = [
            {
                state: {
                    mode: 'awake',
                },
                next: [
                    {
                        mode: 'awake',
                    },
                    {
                        mode: 'asleep',
                    },
                ],
            },
            {
                state: {
                    mode: 'asleep',
                },
                next: [
                    {
                        mode: 'asleep',
                    },
                    {
                        mode: 'awake',
                    },
                ],
            },
        ],
        awakeState = {
            state: {
                mode: 'awake',
            },
            next: [
                {
                    mode: 'awake',
                },
                {
                    mode: 'asleep',
                },
            ],
        },
        asleepState = {
            state: {
                mode: 'asleep',
            },
            next: [
                {
                    mode: 'asleep',
                },
                {
                    mode: 'awake',
                },
            ],
        };

    const statesWithEvents = [
        {
            state: {
                mode: 'first',
            },
            next: [
                {
                    mode: 'second',
                },
            ],
        },
        {
            state: {
                mode: 'second',
            },
            next: [
                {
                    mode: 'last',
                },
            ],
            on: {
                enter: {
                    messages: [
                        {
                            emit: 'in-second',
                            message: { test: 'second' },
                        },
                    ],
                },
            },
        },
        {
            state: {
                mode: 'last',
            },
        },
    ];

    const statesWithEvents2 = [
        {
            state: {
                mode: 'first',
            },
            next: [
                {
                    mode: 'second',
                },
            ],
        },
        {
            state: {
                mode: 'second',
            },
            next: [
                {
                    mode: 'last',
                },
            ],
            on: {
                exit: {
                    messages: [
                        {
                            emit: 'leaving-second',
                            message: { test: 'second' },
                        },
                    ],
                },
            },
        },
        {
            state: {
                mode: 'last',
            },
        },
    ];

    const statesWithEvents3 = [
        {
            state: {
                mode: 'first',
            },
            next: [
                {
                    mode: 'second',
                },
            ],
        },
        {
            state: {
                mode: 'second',
            },
            next: [
                {
                    mode: 'last',
                },
            ],
            on: {
                resume: {
                    messages: [
                        {
                            emit: 'back-in-second',
                            message: { test: 'second' },
                        },
                    ],
                },
            },
        },
        {
            state: {
                mode: 'last',
            },
        },
    ];

    const appStates = [
        {
            state: {
                mode: 'editing',
                params: 'incomplete',
            },
            next: [
                {
                    mode: 'editing',
                    params: 'complete',
                },
                {
                    mode: 'editing',
                    params: 'incomplete',
                },
            ],
        },
        {
            state: {
                mode: 'editing',
                params: 'complete',
            },
            next: [
                {
                    mode: 'editing',
                    params: 'complete',
                    code: 'built',
                },
            ],
        },
        {
            state: {
                mode: 'editing',
                params: 'complete',
                code: 'built',
            },
            next: [
                {
                    mode: 'editing',
                    params: 'incomplete',
                },
                {
                    mode: 'editing',
                    params: 'complete',
                    code: 'built',
                },
                {
                    mode: 'processing',
                    stage: 'launching',
                },
            ],
        },
        {
            state: {
                mode: 'processing',
                stage: 'launching',
            },
            next: [
                {
                    mode: 'processing',
                    stage: 'queued',
                },
                {
                    mode: 'processing',
                    stage: 'launching',
                },
                {
                    mode: 'error',
                    stage: 'launching',
                },
                {
                    mode: 'editing',
                    params: 'complete',
                    code: 'built',
                },
            ],
        },
        {
            state: {
                mode: 'processing',
                stage: 'queued',
            },
            next: [
                {
                    mode: 'processing',
                    stage: 'running',
                },
                {
                    mode: 'processing',
                    stage: 'queued',
                },
                {
                    mode: 'error',
                    stage: 'queued',
                },
                {
                    mode: 'editing',
                    params: 'complete',
                    code: 'built',
                },
            ],
        },
        {
            state: {
                mode: 'processing',
                stage: 'running',
            },
            next: [
                {
                    mode: 'success',
                },
                {
                    mode: 'error',
                    stage: 'running',
                },
                {
                    mode: 'editing',
                    params: 'complete',
                    code: 'built',
                },
            ],
        },
        {
            state: {
                mode: 'success',
            },
            next: [
                {
                    mode: 'success',
                },
                {
                    mode: 'editing',
                    params: 'complete',
                    code: 'built',
                },
            ],
        },
        {
            state: {
                mode: 'error',
                stage: 'launching',
            },
            next: [
                {
                    mode: 'editing',
                    params: 'complete',
                    code: 'built',
                },
            ],
        },
        {
            state: {
                mode: 'error',
                stage: 'queued',
            },
            next: [
                {
                    mode: 'editing',
                    params: 'complete',
                    code: 'built',
                },
            ],
        },
        {
            state: {
                mode: 'error',
                stage: 'running',
            },
            next: [
                {
                    mode: 'editing',
                    params: 'complete',
                    code: 'built',
                },
            ],
        },
    ];

    describe('FSM core functions', () => {
        it('Is alive', () => {
            let alive;
            if (Fsm) {
                alive = true;
            } else {
                alive = false;
            }
            expect(alive).toBeTruthy();
        });
        //        it('Two simple objects equal', function() {
        //            var a = {
        //                name: 'erik'
        //            },
        //                b = {
        //                    name: 'erik'
        //                };
        //            expect(Fsm.test.objectEqual(a, b)).toBeTruthy();
        //        });
        //         it('Two simple objects not equal', function() {
        //            var a = {
        //                name: 'erik'
        //            },
        //                b = {
        //                    name: 'alex'
        //                };
        //            expect(Fsm.test.objectEqual(a, b)).not.toBeTruthy();
        //        });
    });

    describe('Operations on a simple FSM', () => {
        it('Create with an FSM', () => {
            const states = simpleStates,
                fsm = Fsm.make({
                    states: states,
                    initialState: { mode: 'asleep' },
                });
            expect(fsm).toBeTruthy();
        });

        it('Find a state', () => {
            const states = simpleStates,
                fsm = Fsm.make({
                    states: states,
                    initialState: { mode: 'awake' },
                }),
                found = fsm.findState({ mode: 'awake' });

            expect(found).toEqual(awakeState);
        });

        it('Initialize the state machine, should be on initial state.', () => {
            const states = simpleStates,
                fsm = Fsm.make({
                    states: states,
                    initialState: { mode: 'awake' },
                });
            fsm.start();

            expect(fsm.getCurrentState()).toEqual(awakeState);
        });

        it('Initialize the state machine, start on a different state.', () => {
            const states = simpleStates,
                fsm = Fsm.make({
                    states: states,
                    initialState: { mode: 'awake' },
                });
            fsm.start({ mode: 'asleep' });

            expect(fsm.getCurrentState()).toEqual(asleepState);
        });

        it('Move to another state.', () => {
            const states = simpleStates,
                fsm = Fsm.make({
                    states: states,
                    initialState: { mode: 'awake' },
                });
            fsm.start();
            fsm.newState({ mode: 'asleep' });

            expect(fsm.getCurrentState()).toEqual(asleepState);
        });

        it('Move through a sequence of states.', () => {
            const states = simpleStates,
                fsm = Fsm.make({
                    states: states,
                    initialState: { mode: 'awake' },
                });
            fsm.start();
            fsm.newState({ mode: 'asleep' });
            fsm.newState({ mode: 'asleep' });
            fsm.newState({ mode: 'awake' });
            fsm.newState({ mode: 'awake' });

            expect(fsm.getCurrentState()).toEqual(awakeState);
        });

        it('Move into an invalid state.', () => {
            const states = simpleStates,
                fsm = Fsm.make({
                    states: states,
                    initialState: { mode: 'awake' },
                });
            fsm.start();

            function invalid() {
                fsm.newState({ mode: 'tired' });
            }

            expect(invalid).toThrow();
        });

        it('Move to another state with notification.', (done) => {
            const states = simpleStates,
                fsm = Fsm.make({
                    states: states,
                    initialState: { mode: 'awake' },
                    onNewState: function (fsm) {
                        expect(fsm.getCurrentState()).toEqual(asleepState);
                        done();
                    },
                });
            fsm.start();
            fsm.newState({ mode: 'asleep' });

            // expect(fsm.getCurrentState()).toEqual(asleepState);
        });

        it('Sends a message when entering a state', (done) => {
            const fsm = Fsm.make({
                states: statesWithEvents,
                initialState: { mode: 'first' },
            });
            fsm.bus.on('in-second', (message) => {
                expect(message.test).toEqual('second');
                done();
            });
            fsm.start();
            fsm.newState({ mode: 'second' });
        });
        it('Sends a message when exiting a state', (done) => {
            const fsm = Fsm.make({
                states: statesWithEvents2,
                initialState: { mode: 'first' },
            });
            fsm.bus.on('leaving-second', (message) => {
                expect(message.test).toEqual('second');
                done();
            });
            fsm.start();
            fsm.newState({ mode: 'second' });
            fsm.newState({ mode: 'last' });
        });
        it('Sends a message when resuming a state', (done) => {
            const fsm = Fsm.make({
                states: statesWithEvents3,
                initialState: { mode: 'second' },
            });
            fsm.bus.on('back-in-second', (message) => {
                expect(message.test).toEqual('second');
                done();
            });
            fsm.start();
        });
    });
});
