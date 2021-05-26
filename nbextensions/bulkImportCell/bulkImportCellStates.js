/**
 * This has the list of available states for the bulk import cell. They should all be referenced
 * by their state id:
 *
 * editingIncomplete - the initial state, a user can edit the app configuration, but not run the
 *      cell yet
 * editingComplete - transition to this when the cell is ready to run. A user can still change
 *      the configuration, this just means it's ready to go.
 * launching - a user clicked "run" and is waiting on a response from the server. This should be
 *      cancelable.
 * inProgress - the jobs have launched and at least one is queued or running; none have completed yet
 * inProgressResultsAvailable - at least one job is queued or running and at least one job has completed successfully, yielding results
 * jobsFinished - all jobs are in a terminal state (error/terminated), but none completed successfully
 * jobsFinishedResultsAvailable - all jobs are in a terminal state, and at least one job completed successfully
 * appError - some unrecoverable error has happened during the app run
 * generalError - not sure how this might get reached, but some horrible error has rendered the
 *      cell unusable. Maybe some mangled data, maybe some mangled internal information.
 */

define([], () => {
    'use strict';

    /**
     * Returns a view state for the tabs.
     * @param {Array} enabled the tabs in this array are enabled
     * @param {Array} visible the tabs in this array are visible
     */
    function tabState(enabled, visible) {
        // can't just use the same default object, it has to be generated each time,
        // as JS does assign by reference.
        const defaultView = () => ({ enabled: false, visible: false });

        const state = {
            tabs: {},
        };
        ['configure', 'viewConfigure', 'info', 'jobStatus', 'results', 'error'].forEach((tabId) => {
            state.tabs[tabId] = defaultView();
        });
        enabled.forEach((enabledTab) => {
            state.tabs[enabledTab].enabled = true;
        });
        visible.forEach((visibleTab) => {
            state.tabs[visibleTab].visible = true;
        });
        return state;
    }

    return {
        // for when the cell is in configuration mode, hasn't been run, has no jobs, no results
        editingIncomplete: {
            ui: {
                tab: tabState(
                    ['configure', 'info', 'jobStatus', 'results'],
                    ['configure', 'info', 'jobStatus', 'results']
                ),
                action: {
                    name: 'runApp',
                    disabled: true,
                },
            },
        },
        // when the cell is in configuration mode, ready to run, but hasn't been started yet
        editingComplete: {
            ui: {
                tab: tabState(['configure', 'info'], ['configure', 'info', 'jobStatus', 'results']),
                action: {
                    name: 'runApp',
                    disabled: false,
                },
            },
        },
        // the user has clicked "run" and is waiting on the run to start
        launching: {
            ui: {
                tab: tabState(
                    ['viewConfigure', 'info'],
                    ['viewConfigure', 'info', 'jobStatus', 'results']
                ),
                action: {
                    name: 'cancel',
                    disabled: false,
                },
            },
        },
        // at least one job is queued or running
        // no results are available
        inProgress: {
            ui: {
                tab: tabState(
                    ['viewConfigure', 'info', 'jobStatus'],
                    ['viewConfigure', 'info', 'jobStatus', 'results']
                ),
                action: {
                    name: 'cancel',
                    disabled: false,
                },
            },
        },
        // at least one job is queued or running
        // at least one job has completed successfully
        inProgressResultsAvailable: {
            ui: {
                tab: tabState(
                    ['viewConfigure', 'info', 'jobStatus', 'results'],
                    ['viewConfigure', 'info', 'jobStatus', 'results']
                ),
                action: {
                    name: 'cancel',
                    disabled: false,
                },
            },
        },
        // all jobs are in a terminal state
        // no results are available
        jobsFinished: {
            ui: {
                tab: tabState(
                    ['viewConfigure', 'info', 'jobStatus'],
                    ['viewConfigure', 'info', 'jobStatus', 'results']
                ),
                action: {
                    name: 'resetApp',
                    disabled: false,
                },
            },
        },
        // all jobs are in a terminal state
        // at least one job finished successfully
        jobsFinishedResultsAvailable: {
            ui: {
                tab: tabState(
                    ['viewConfigure', 'info', 'jobStatus', 'results'],
                    ['viewConfigure', 'info', 'jobStatus', 'results']
                ),
                action: {
                    name: 'resetApp',
                    disabled: false,
                },
            },
        },
        // unrecoverable error(s) occurred during the app run
        appError: {
            ui: {
                tab: tabState(
                    ['viewConfigure', 'info', 'jobStatus', 'error'],
                    ['viewConfigure', 'info', 'jobStatus', 'error']
                ),
                action: {
                    name: 'resetApp',
                    disabled: false,
                },
            },
        },
        // something tragic and unrecoverable has happened to the cell
        // (not a job error -- those are handled by the jobStatus tab)
        generalError: {
            ui: {
                tab: tabState(
                    ['viewConfigure', 'info', 'jobStatus', 'error'],
                    ['viewConfigure', 'info', 'jobStatus', 'error']
                ),
                action: {
                    name: 'resetApp',
                    disabled: false,
                },
            },
        },
    };
});
