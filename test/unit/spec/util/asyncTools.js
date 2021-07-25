define([], () => {
    'use strict';

    const TRY_LOOP_INTERVAL = 100;
    const DEFAULT_TRY_LOOP_TIMEOUT = 5000;

    /**
     * Returns a promise which resolves when the given duration, in milliseconds,
     * elapses.
     *
     * @param {int} duration
     * @returns {Promise<void>}
     */
    function waitFor(duration) {
        return new Promise((resolve) => {
            window.setTimeout(() => {
                resolve();
            }, duration);
        });
    }

    /**
     * Returns a promise which will resolve when the provided function returns true,
     * and reject if it exceeds the provided timeout or default of 5s, or if the
     * function throws an exception.
     *
     * @param {Function} fun - A function to "try"; returns [true, value] if the "try" succeeds, [false] otherwise
     * @param {number} duration - The timeout, in milliseconds, after which trying without success will fail
     * @returns {Promise} - A promise resolved
     */
    async function tryFor(fun, duration = DEFAULT_TRY_LOOP_TIMEOUT) {
        const interval = TRY_LOOP_INTERVAL;
        const started = Date.now();

        for (;;) {
            const elapsed = Date.now() - started;
            if (elapsed > duration) {
                throw new Error(`tryFor expired without success after ${elapsed}ms`);
            }
            const [gotIt, result] = await fun();
            if (gotIt) {
                return result;
            }
            await waitFor(interval);
        }
    }

    return { waitFor, tryFor };
});
