/*global define,describe,it,expect*/
/*jslint white:true,browser:true*/
define([
    'fsm'
], function (Fsm) {
    'use strict';
    var appStates = [
        {
            state: {
                mode: 'editing',
                params: 'incomplete'
            },
            next: [
                {
                    mode: 'editing',
                    params: 'complete',
                    code: 'built'
                },
                {
                    mode: 'editing',
                    params: 'incomplete'
                }
            ]
        },
        {
            state: {
                mode: 'editing',
                params: 'complete',
                code: 'built'
            },
            next: [
                {
                    mode: 'editing',
                    params: 'incomplete'
                },
                {
                    mode: 'editing',
                    params: 'complete',
                    code: 'built'
                },
                {
                    mode: 'processing',
                    stage: 'launching'
                }
            ]
        },
        {
            state: {
                mode: 'processing',
                stage: 'launching'
            },
            next: [
                {
                    mode: 'processing',
                    stage: 'queued'
                },
                {
                    mode: 'processing',
                    stage: 'launching'
                },
                {
                    mode: 'error',
                    stage: 'launching'
                },
                {
                    mode: 'editing',
                    params: 'complete',
                    code: 'built'
                }
            ]
        },
        {
            state: {
                mode: 'processing',
                stage: 'queued'
            },
            next: [
                {
                    mode: 'processing',
                    stage: 'running'
                },
                {
                    mode: 'processing',
                    stage: 'queued'
                },
                {
                    mode: 'error',
                    stage: 'queued'
                },
                {
                    mode: 'editing',
                    params: 'complete',
                    code: 'built'
                }
            ]
        },
        {
            state: {
                mode: 'processing',
                stage: 'running'
            },
            next: [
                {
                    mode: 'success'
                },
                {
                    mode: 'error',
                    stage: 'running'
                },
                {
                    mode: 'editing',
                    params: 'complete',
                    code: 'built'
                }
            ]
        },
        {
            state: {
                mode: 'success'
            },
            next: [
                {
                    mode: 'success'
                },
                {
                    mode: 'editing',
                    params: 'complete',
                    code: 'built'
                }
            ]
        },
        {
            state: {
                mode: 'error',
                stage: 'launching'
            },
            next: [
                {
                    mode: 'editing',
                    params: 'complete',
                    code: 'built'
                }
            ]

        },
        {
            state: {
                mode: 'error',
                stage: 'queued'
            },
            next: [
                {
                    mode: 'editing',
                    params: 'complete',
                    code: 'built'
                }
            ]

        },
        {
            state: {
                mode: 'error',
                stage: 'running'
            },
            next: [
                {
                    mode: 'editing',
                    params: 'complete',
                    code: 'built'
                }
            ]

        }
    ],
        testFindState = {
            state: {
                mode: 'processing',
                stage: 'launching'
            },
            next: [
                {
                    mode: 'processing',
                    stage: 'queued'
                },
                {
                    mode: 'processing',
                    stage: 'launching'
                },
                {
                    mode: 'error',
                    stage: 'launching'
                },
                {
                    mode: 'editing',
                    params: 'complete',
                    code: 'built'
                }
            ]
        },
    initialState = {
        state: {
            mode: 'editing',
            params: 'incomplete'
        },
        next: [
            {
                mode: 'editing',
                params: 'complete',
                code: 'built'
            },
            {
                mode: 'editing',
                params: 'incomplete'
            }
        ]
    },
        nextStateTest =   {
            state: {
                mode: 'editing',
                params: 'complete',
                code: 'built'
            },
            next: [
                {
                    mode: 'editing',
                    params: 'incomplete'
                },
                {
                    mode: 'editing',
                    params: 'complete',
                    code: 'built'
                },
                {
                    mode: 'processing',
                    stage: 'launching'
                }
            ]
        };

    describe('FSM core functions', function () {
        it('Is alive', function () {
            var alive;
            if (Fsm) {
                alive = true;
            } else {
                alive = false;
            }
            expect(alive).toBeTruthy();
        });
        it('Two simple objects equal', function () {
            var a = {
                name: 'erik'
            },
            b = {
                name: 'erik'
            };
            expect(Fsm.test.objectEqual(a, b)).toBeTruthy();
        });
        it('Two simple objects not equal', function () {
            var a = {
                name: 'erik'
            },
            b = {
                name: 'alex'
            };
            expect(Fsm.test.objectEqual(a, b)).not.toBeTruthy();
        });
    });

    describe('Operations on the app state FSM', function () {
        it('Create with an FSM', function () {
            var states = appStates,
                fsm = Fsm.make({
                    states: states,
                    initialState: {
                        mode: 'editing',
                        params: 'incomplete'
                    }
                });
            expect(fsm).toBeTruthy();
        });

        it('Find a state', function () {
            var states = appStates,
                fsm = Fsm.make({
                    states: states,
                    initialState: {
                        mode: 'editing',
                        params: 'incomplete'
                    }
                }),
                toFind = {
                    mode: 'processing',
                    stage: 'launching'
                },
            found = fsm.findState(toFind);

            expect(found).toEqual(testFindState);
        });

        it('Initialize the state machine, should be on initial state.', function () {
            var states = appStates,
                fsm = Fsm.make({
                    states: states,
                    initialState: {
                        mode: 'editing',
                        params: 'incomplete'
                    }
                });
            fsm.start();
            expect(fsm.getCurrentState()).toEqual(initialState);
        });


        it('Move to another state.', function () {
            var states = appStates,
                fsm = Fsm.make({
                    states: states,
                    initialState: {
                        mode: 'editing',
                        params: 'incomplete'
                    }
                }),
                nextState = {
                    mode: 'editing',
                    params: 'complete',
                    code: 'built'
                };
            fsm.start();
            fsm.newState(nextState);
            
            expect(fsm.getCurrentState()).toEqual(nextStateTest);
        });

        it('Move through a sequence of states.', function () {
            var states = appStates,
                fsm = Fsm.make({
                    states: states,
                    initialState: {
                        mode: 'editing',
                        params: 'incomplete'
                    }
                });
            fsm.start();
            fsm.newState({mode: 'editing', params: 'complete', code: 'built'});
            fsm.newState({mode: 'editing', params: 'complete', code: 'built'});
            fsm.newState({mode: 'editing', params: 'incomplete'});
            fsm.newState({mode: 'editing', params: 'complete', code: 'built'});

            expect(fsm.getCurrentState()).toEqual(nextStateTest);
        });

        it('Move into an invalid state.', function () {
            var states = appStates,
                fsm = Fsm.make({
                    states: states,
                    initialState: {
                        mode: 'editing',
                        params: 'incomplete'
                    }
                });
            fsm.start();

            function invalid() {
                fsm.newState({mode: 'tired'});
            }

            expect(invalid).toThrow();
        });
        
        it('Move through the normal sequence of states.', function () {
            var states = appStates,
                fsm = Fsm.make({
                    states: states,
                    initialState: {
                        mode: 'editing',
                        params: 'incomplete'
                    }
                });
            fsm.start();
            
            fsm.newState({mode: 'editing', params: 'complete', code: 'built'});
            fsm.newState({mode: 'processing', stage: 'launching'});
            fsm.newState({mode: 'processing', stage: 'queued'});
            fsm.newState({mode: 'processing', stage: 'running'});
            fsm.newState({mode: 'success'});

            expect(fsm.getCurrentState().state).toEqual({mode: 'success'});
        });
        
         it('Move through the normal sequence of states which ends in an error.', function () {
            var states = appStates,
                fsm = Fsm.make({
                    states: states,
                    initialState: {
                        mode: 'editing',
                        params: 'incomplete'
                    }
                });
            fsm.start();
            
            fsm.newState({mode: 'editing', params: 'complete', code: 'built'});
            fsm.newState({mode: 'processing', stage: 'launching'});
            fsm.newState({mode: 'processing', stage: 'queued'});
            fsm.newState({mode: 'processing', stage: 'running'});
            fsm.newState({mode: 'error', stage: 'running'});

            expect(fsm.getCurrentState().state).toEqual({mode: 'error', stage: 'running'});
        });
        
         it('Try to move to a state which is not available', function () {
            var states = appStates,
                fsm = Fsm.make({
                    states: states,
                    initialState: {
                        mode: 'editing',
                        params: 'incomplete'
                    }
                });
            fsm.start();

            function invalidStateChange() {
                fsm.newState({mode: 'processing', stage: 'launching'});
            }

            expect(invalidStateChange).toThrow();
        });
    });

});