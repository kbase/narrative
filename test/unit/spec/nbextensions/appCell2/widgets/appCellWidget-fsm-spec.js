define(['/narrative/nbextensions/appCell2/widgets/appCellWidget-fsm', 'underscore'], (
    AppCellStates,
    _
) => {
    'use strict';

    describe('app cell states', () => {
        const uiTabs = ['info', 'configure', 'viewConfigure', 'jobStatus', 'results', 'error'];
        const uiKeys = ['tabs', 'actionButton', 'elements', 'appStatus', 'label', 'message'];
        const stateKeys = ['next', 'state', 'ui'];
        const states = AppCellStates.appStates;

        it('should be an array of states with expected keys', () => {
            expect(Array.isArray(states)).toBeTrue();
            states.forEach((state) => {
                stateKeys.forEach((key) => {
                    expect(state[key]).toBeDefined();
                });

                uiKeys.forEach((uiKey) => {
                    expect(state.ui[uiKey]).toBeDefined();
                });

                uiTabs.forEach((uiTab) => {
                    expect(state.ui.tabs[uiTab]).toBeDefined();
                });
            });
        });

        it('should have an array of unique state descriptors', () => {
            for (let i = 0; i < states.length; i++) {
                for (let j = i + 1; j < states.length; j++) {
                    expect(_.isEqual(states[i].state, states[j].state))
                        .withContext(`duplicate state: ${JSON.stringify(states[i].state)}`)
                        .toBeFalse();
                }
            }
        });

        it('should have a next field that is an array of existing, unique states', () => {
            states.forEach((state) => {
                const next = state.next;
                // no other good solution, so compare each state to each other state
                // if any are equal, test should fail

                for (let i = 0; i < next.length; i++) {
                    for (let j = i + 1; j < next.length; j++) {
                        expect(_.isEqual(next[i], next[j]))
                            .withContext(`duplicate next state: ${JSON.stringify(next[i])}`)
                            .toBeFalse();
                    }
                    const matchingState = states.filter((state) => _.isEqual(next[i], state.state));
                    expect(matchingState.length).toBe(1);
                }
            });
        });
    });
});
