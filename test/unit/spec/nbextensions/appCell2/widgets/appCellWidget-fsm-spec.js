define(['/narrative/nbextensions/appCell2/widgets/appCellWidget-fsm', 'underscore', 'common/fsm'], (
    AppCellStates,
    _,
    Fsm
) => {
    'use strict';

    describe('app cell states', () => {
        const uiTabs = ['info', 'configure', 'viewConfigure', 'jobStatus', 'results', 'error'];
        const uiKeys = ['tabs', 'actionButton'];
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

        it('should have a set of unique state shorthands', () => {
            const stateShorthands = Object.values(AppCellStates.STATE);
            const appStates = states.map((state) => {
                return state.state;
            });
            expect(appStates).toEqual(jasmine.arrayWithExactContents(stateShorthands));
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
                    const matchingState = states.filter((_state) =>
                        _.isEqual(next[i], _state.state)
                    );
                    expect(matchingState.length).toBe(1);
                }
            });
        });

        // a special case that modifies the set of error tabs
        it('should show the job status tab when a run results in an error', () => {
            const fsm = Fsm.make({
                states,
                initialState: {
                    mode: 'error',
                    stage: 'runtime',
                },
                onNewState: () => {},
            });
            fsm.start();
            const state = fsm.getCurrentState();
            const trueTabs = ['jobStatus', 'error', 'viewConfigure', 'info'];
            const falseTabs = ['configure', 'results'];
            trueTabs.forEach((tab) => {
                expect(state.ui.tabs[tab].enabled).toBeTrue();
            });
            falseTabs.forEach((tab) => {
                expect(state.ui.tabs[tab].enabled).toBeFalse();
            });
        });
    });
});
