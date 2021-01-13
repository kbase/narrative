define([], () => {
    'use strict';

    /**
     * A jobState is deemed valid if
     * 1. It's an object (not an array or atomic type)
     * 2. It has a created key
     * 3. It has a job_id key
     * 4. There's others that are necessary, but the top two are sufficient to judge if it's valid
     *    enough and up to date. This function should be updated as necessary.
     *
     * This is intended to be used to make sure that jobStates are of the latest version of the
     * execution engine.
     * @param {object} jobState
     */
    function isValidJobState(jobState) {
        if (jobState !== null && typeof jobState === 'object') {
            return jobState.hasOwnProperty('created') && jobState.hasOwnProperty('job_id');
        }
        return false;
    }

    return {
        isValidJobState: isValidJobState,
    };
});
