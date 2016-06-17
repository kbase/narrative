/*global define*/
/*jslint white:true,browser:true*/

/*
 * fsm.js
 * 
 *  A simple finite state machine.
 *  
 */

define([
    './unodep'
], function (utils) {
    'use strict';


    function factory(config) {
        var allStates = config.states,
            initialState = config.initialState,
            currentState,
            api,
            timer, newStateHandler = config.onNewState;

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
            timer = window.setTimeout(function () {
                try {
                    timer = null;
                    newStateHandler(api);
                } catch (ex) {
                    console.error('ERROR in fms newStateHandler', ex);
                }
            }, 0);
        }
        
        function findState(stateToFind) {
            var foundStates = allStates.filter(function (stateDef) {
                if (utils.isEqual(stateToFind, stateDef.state)) {
                    return true;
                }
            });
            if (foundStates.length === 1) {
                return foundStates[0];
            }
            if (foundStates.length > 1) {
                throw new Error('state error: multiple states found');
            }            
        }

        function start(startingState) {
            // find initial state
            if (!startingState) {
                startingState = initialState;
            }
            var state = findState(startingState);
            if (!state) {
                throw new Error('Cannot find initial state');
            }

            // make it the current state
            currentState = state;
        }
        
        function findNextState(stateList, stateToFind) {
            var foundStates = stateList.filter(function (state) {
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
            var state = findNextState(currentState.next, nextState);
            if (!state) {
                console.error('Could not find new state', nextState, currentState);
                throw new Error('Cannot find the new state');
            }

            var newState = findState(state);
            if (!newState) {
                throw new Error('Next state found, but that state does not exist');
            }
            
            if (utils.isEqual(newState.state, currentState.state)) {
                return;
            }

            run();

            // make it the current state
            currentState = newState;
        }

        function getCurrentState() {
            return currentState;
        }
        
        api = {
            start: start,
            newState: newState,
            getCurrentState: getCurrentState,
            findState: findState
        };
        
        return api;
    }


    return {
        make: function (config) {
            return factory(config);
        }
    };
});