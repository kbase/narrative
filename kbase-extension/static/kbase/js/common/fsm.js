/*
 * fsm.js
 *
 *  A simple finite state machine.
 *
 */

define([
    './unodep',
    'common/runtime'
], (
    utils,
    Runtime
) => {
    'use strict';


    function factory(config) {
        let allStates = config.states,
            initialState = config.initialState,
            fallbackState = config.fallbackState,
            currentState,
            api,
            timer, newStateHandler = config.onNewState;

        const runtime = Runtime.make();

        // We get our own bus for emitting state-change events
        // on. This lets us cleanly disengage when we are done.
        const busConnection = runtime.bus().connect(),
            bus = busConnection.channel(null);

        /*
         * Validate the state machine configuration 'states'.
         */
        function validate() {
            // find initial state

            // ...
        }

        function run() {
            if (!newStateHandler) {
                return;
            }
            if (timer) {
                return;
            }
            timer = window.setTimeout(() => {
                try {
                    timer = null;
                    newStateHandler(api);
                } catch (ex) {
                    console.error('ERROR in fms newStateHandler', ex);
                }
            }, 0);
        }

        function findState(stateToFind) {
            const foundStates = allStates.filter((stateDef) => {
                return utils.isEqual(stateToFind, stateDef.state);
            });
            if (foundStates.length === 1) {
                return foundStates[0];
            }
            if (foundStates.length > 1) {
                console.error('state error: multiple states found:', stateToFind, foundStates);
                throw new Error('state error: multiple states found');
            }

        }

        function doMessages(changeType) {
            const state = currentState;
            if (state.on && state.on[changeType]) {
                if (state.on[changeType].messages) {
                    state.on[changeType].messages.forEach((msg) => {
                        if (msg.emit) {
                            bus.emit(msg.emit, msg.message);
                        } else if (msg.send) {
                            bus.send(msg.send.message, msg.send.address);
                        }
                    });
                }
            }
        }

        function doResumeState() {
            doMessages('resume');
        }

        function doEnterState() {
            doMessages('enter');
        }

        function doLeaveState() {
            doMessages('leave');
        }

        function findNextState(stateList, stateToFind) {
            const foundStates = stateList.filter((state) => {
                if (utils.isEqual(state, stateToFind)) {
                    return true;
                }
            });
            if (foundStates.length === 1) {
                return foundStates[0];
            }
            if (foundStates.length > 1) {
                throw new Error('Multiple next states found');
            }
        }

        function newState(nextState) {
            if (!currentState.next) {
                // If there's no next states, then we're in a terminal state and shouldn't try
                // to transition. Or someone is missing something.
                return;
            }
            const state = findNextState(currentState.next, nextState);
            if (!state) {
                console.error('Cannot not find new state', nextState, currentState);
                throw new Error('Cannot find the new state');
            }

            const newState = findState(state);
            if (!newState) {
                throw new Error('Next state found, but that state does not exist');
            }

            if (utils.isEqual(newState.state, currentState.state)) {
                return;
            }

            doMessages('exit');

            // make it the current state
            currentState = newState;

            doMessages('enter');


            run();
        }

        function updateState(nextState) {
            const updatedState = JSON.parse(JSON.stringify(currentState.state));
            Object.keys(nextState).forEach((key) => {
                updatedState[key] = nextState[key];
            });
            newState(updatedState);
        }

        function getCurrentState() {
            return currentState;
        }

        // LIFECYCLE

        function start(startingState) {
            // find initial state
            if (!startingState) {
                startingState = initialState;
            }
            const state = findState(startingState);
            if (!state) {
                console.error('FSM: initial state could not be found', startingState);
                throw new Error('Cannot find initial state');
            }

            // make it the current state
            currentState = state;

            doResumeState();
        }

        function stop() {

        }

        // API

        api = Object.freeze({
            start: start,
            stop: stop,
            newState: newState,
            updateState: updateState,
            getCurrentState: getCurrentState,
            findState: findState,
            bus: bus
        });

        return api;
    }


    return {
        make: function(config) {
            return factory(config);
        }
    };
});
