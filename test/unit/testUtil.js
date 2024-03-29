define('testUtil', [
    'bluebird',
    'util/stagingFileCache',
    'common/jobCommMessages',
    'json!/test/testConfig.json',
], (Promise, StagingFileCache, jcm, TestConfig) => {
    'use strict';

    let token = null,
        userId = null;

    function make() {
        return initialize();
    }

    function getAuthToken() {
        return token;
    }

    function getUserId() {
        return userId;
    }

    /**
     * Runs the Jasmine pending() function if there's no Auth token available. This
     * skips the current test.
     */
    function pendingIfNoToken() {
        if (!token) {
            pending();
        }
    }

    function initialize() {
        if (TestConfig.token === undefined) {
            throw new Error(
                'Missing an auth token. Please enter one (or null to skip those tests)' +
                    'in test/unit/testConfig.json'
            );
        }
        if (TestConfig.token === null) {
            return new Promise.resolve(null);
        }
        userId = TestConfig.token.user;
        const tokenFile = TestConfig.token.file;
        return new Promise((resolve) => {
            require(['text!/' + tokenFile], (loadedToken) => {
                token = loadedToken.trim();
                console.warn('Loaded token file ' + tokenFile);
                resolve(token);
            }, () => {
                console.warn(
                    'Unable to load token file ' + tokenFile + '. Continuing without a token'
                );
                resolve(null);
            });
        });
    }

    function JSONcopy(...args) {
        return JSON.parse(JSON.stringify(...args));
    }

    function wait(timeMs) {
        return Promise.delay(timeMs);
    }

    /**
     * Wait for something to happen in the DOM underneath `documentElement`
     * @param {Object} args with keys
     * @param {Object} args.config configuration for the MutationObserver
     * @param {string} args.documentElement  DOM element to watch
     * @param {function} args.domStateFunction function that returns true when the
     * watched event happens
     * @param {function} args.executeFirst     a function to execute after setting up
     * the observer
     * @returns {Promise} that resolves to produce the element
     */
    function waitFor(args) {
        const { documentElement, domStateFunction, executeFirst } = args;
        const config = args.config || { attributes: true, childList: true, subtree: true };

        if (!documentElement || !domStateFunction) {
            throw new Error('Please provide documentElement and domStateFunction to run waitFor');
        }

        return new Promise((resolve) => {
            if (domStateFunction()) {
                resolve();
            }

            const observer = new MutationObserver((mutations) => {
                if (domStateFunction(mutations)) {
                    observer.disconnect();
                    resolve();
                }
            });
            observer.observe(documentElement, config);
            if (executeFirst) {
                executeFirst();
            }
        });
    }

    /**
     * Wait for an element to appear in the DOM underneath `documentElement`
     * @param {DOM element} documentElement to watch for the appearance of the element
     * @param {string} selector to identify the element being watched for
     * @param {function} doThisFirst (optional) function to execute before returning the
     * Promise
     * @returns {Promise} that resolves when the element is seen
     */
    function waitForElement(documentElement, selector, doThisFirst) {
        return new Promise((resolve) => {
            const element = documentElement.querySelector(selector);
            if (element) {
                resolve(element);
            }

            const observer = new MutationObserver(() => {
                const el = documentElement.querySelector(selector);
                if (el) {
                    observer.disconnect();
                    resolve(el);
                }
            });
            observer.observe(documentElement, { childList: true, subtree: true });
            if (doThisFirst) {
                doThisFirst();
            }
        });
    }

    /**
     * Wait for a certain DOM state
     * @param {DOM element} documentElement to watch for changes
     * @param {function} elementStateFunction function returning true when the state
     * occurs
     * @param {function} doThisFirst (optional) function to execute before returning the
     * Promise
     * @returns {Promise} that resolves when the DOM state is seen
     */
    function waitForElementState(documentElement, elementStateFunction, doThisFirst) {
        return new Promise((resolve) => {
            if (elementStateFunction()) {
                resolve();
            }
            const observer = new MutationObserver((mutations) => {
                if (elementStateFunction(mutations)) {
                    observer.disconnect();
                    resolve();
                }
            });
            observer.observe(documentElement, { attributes: true, childList: true, subtree: true });
            if (doThisFirst) {
                doThisFirst();
            }
        });
    }

    /**
     * Wait for matching text to be found within the element found by a selector.
     *
     * By default, supplying a string to look for, it will use the JS "include()" string
     * method.
     *
     * @param {string} selector Selector for the element within which to look for text
     * @param {function | string} textOrComparisonFunction Either a string to look for
     * or function to do the looking; if a string, the JS includes() method is used to
     * look for it within the element; a function will accept a string to look in, and
     * will return a boolean indicating whether it was found.
     * @param {Object} options (optional) several options to control behavior
     * @param {number} options.timeout (optional) duration, in milliseconds, for which
     * to look for the string; defaults to 1000ms
     * @param {number} options.interval (optional) the duration, in milliseconds,
     * between attempts to find the string; defaults to 100ms
     * @param {string} options.textName (optional) the a name for the text being looked
     * for, used in the test failure message; defaults to "text".
     * @returns {Promise} that resolves when the target element or text is found, or
     * rejects if the timeout duration is exceeded without finding it.
     */
    function waitForText(selector, textOrComparisonFunction, options = {}) {
        const { timeout = 1000, interval = 100, textName = 'text' } = options;
        const startedAt = Date.now();
        const textComparison = (() => {
            if (typeof textOrComparisonFunction === 'function') {
                return textOrComparisonFunction;
            }
            return (text) => {
                return text.includes(textOrComparisonFunction);
            };
        })();
        const tryIt = () => {
            const element = document.querySelector(selector);
            if (!element) {
                return;
            }
            return textComparison(element.innerText);
        };
        return new Promise((resolve, reject) => {
            const loop = () => {
                window.setTimeout(() => {
                    const elapsed = Date.now() - startedAt;
                    if (elapsed > timeout) {
                        reject(new Error(`Expected ${textName} not found after ${elapsed}`));
                    } else {
                        try {
                            if (tryIt()) {
                                resolve();
                            } else {
                                loop();
                            }
                        } catch (ex) {
                            reject(ex);
                        }
                    }
                }, interval);
            };
            if (tryIt()) {
                resolve();
                return;
            }
            loop();
        });
    }

    /**
     * Wait for an element to change
     * @param {DOM element} documentElement to watch for changes
     * @param {function} doThisFirst (optional) function to execute before returning the
     * Promise
     * @returns {Promise} that resolves when the element changes
     */
    function waitForElementChange(documentElement, doThisFirst) {
        return new Promise((resolve) => {
            const observer = new MutationObserver(() => {
                observer.disconnect();
                resolve();
            });
            observer.observe(documentElement, { attributes: true, childList: true, subtree: true });
            if (doThisFirst) {
                doThisFirst();
            }
        });
    }

    /**
     * Clears the global Runtime element and other KBase-used caches.
     */
    function clearRuntime() {
        if (window.kbaseRuntime) {
            if (window.kbaseRuntime.clock) {
                window.kbaseRuntime.clock.stop();
            }
            window.kbaseRuntime = null;
        }
        window.__kbase_semaphores__ = {};
        StagingFileCache.clearCache();
    }

    /**
     * send a jcm.MESSAGE_TYPE.INFO message over the bus
     *
     * @param {object} ctx - `this` context, containing keys
     *      {object} bus
     *      {object} jobInfo
     */
    function send_INFO(ctx) {
        const { bus, jobInfo, channelType, channelId } = ctx;
        const jobId = jobInfo.job_id;
        sendBusMessage({
            bus,
            message: { [jobId]: { ...jobInfo, [jcm.PARAM.JOB_ID]: jobId } },
            channelType: channelType ? channelType : jcm.CHANNEL.JOB,
            channelId: channelId ? channelId : jobId,
            type: jcm.MESSAGE_TYPE.INFO,
        });
    }

    /**
     * send a jcm.MESSAGE_TYPE.LOGS message over the bus
     *
     * @param {object} ctx - `this` context, containing keys
     *      {object} bus
     *      {object} message - partial log message; missing keys will be filled in
     */
    function send_LOGS(ctx) {
        const { bus, message } = ctx;
        if (message.lines) {
            message.first = 0;
            message.max_lines = message.lines.length;
        }
        sendBusMessage({
            bus,
            message: { [message[jcm.PARAM.JOB_ID]]: message },
            channelType: jcm.CHANNEL.JOB,
            channelId: message[jcm.PARAM.JOB_ID],
            type: jcm.MESSAGE_TYPE.LOGS,
        });
    }

    /**
     * send a jcm.MESSAGE_TYPE.RETRY message over the bus
     *
     * @param {object} ctx - `this` context, containing keys
     *      {object} retryParent    - the parent of the retried job
     *      {object} retry          - the new job
     *      {object} bus            - the bus to send the message on
     */
    function send_RETRY(ctx) {
        const { bus, retryParent, retry, channelType, channelId } = ctx;
        // send the retry response and the update for the batch parent
        sendBusMessage({
            bus,
            message: {
                [retryParent.job_id]: {
                    [jcm.PARAM.JOB_ID]: retryParent.job_id,
                    job: {
                        [jcm.PARAM.JOB_ID]: retryParent.job_id,
                        jobState: retryParent,
                    },
                    retry_id: retry.job_id,
                    retry: {
                        [jcm.PARAM.JOB_ID]: retry.job_id,
                        jobState: retry,
                    },
                },
            },
            channelType: channelType ? channelType : jcm.CHANNEL.JOB,
            channelId: channelId ? channelId : retryParent.job_id,
            type: jcm.MESSAGE_TYPE.RETRY,
        });
    }

    /**
     * send a jcm.MESSAGE_TYPE.RUN_STATUS message over the bus
     *
     * @param {object} ctx - `this` context, containing keys
     *      {object} runStatusArgs - object with keys for a valid run_status message
     *      {object} bus
     */
    function send_RUN_STATUS(ctx) {
        const { bus, runStatusArgs } = ctx;
        if (!runStatusArgs.cell_id) {
            throw new Error('No cell_id supplied for RUN_STATUS message');
        }
        sendBusMessage({
            bus,
            message: { event_at: 1234567890, ...runStatusArgs },
            channelType: [jcm.CHANNEL.CELL],
            channelId: runStatusArgs.cell_id,
            type: jcm.MESSAGE_TYPE.RUN_STATUS,
        });
    }

    /**
     * send a jcm.MESSAGE_TYPE.STATUS message over the bus
     *
     * @param {object} ctx - `this` context, containing keys
     *      {object} bus      - message bus
     *      {object} jobState - the jobState object to be sent
     */
    function send_STATUS(ctx) {
        const { bus, channelType, channelId, jobState } = ctx;
        let { message } = ctx;
        if (!message) {
            message = {
                [jcm.PARAM.JOB_ID]: jobState.job_id,
                jobState,
            };
        }
        if (channelType && channelId) {
            return sendBusMessage({
                bus,
                message: { [channelId]: message },
                channelType,
                channelId,
                type: jcm.MESSAGE_TYPE.STATUS,
            });
        }

        const jobId = jobState.job_id;
        sendBusMessage({
            bus,
            message: { [jobId]: message },
            channelType: jcm.CHANNEL.JOB,
            channelId: jobId,
            type: jcm.MESSAGE_TYPE.STATUS,
        });
    }

    /**
     * send a jcm.MESSAGE_TYPE.<type> message over the bus
     *
     * @param {object} args with key value pairs:
     * @param {object} bus
     * @param {object} message        - message, to be passed as-is
     * @param {string} channelType    - jcm.CHANNEL.<type>
     * @param {string} channelId      - ID for the channel
     * @param {string} type           - jcm.MESSAGE_TYPE.<type>
     */
    function sendBusMessage(args) {
        const keys = ['bus', 'message', 'channelType', 'channelId', 'type'].filter((key) => {
            return !args[key];
        });
        if (keys.length) {
            throw new Error('Missing required keys for sendBusMessage: ' + keys.join(', '));
        }

        const { bus, message, channelType, channelId, type } = args;

        bus.send(message, { channel: { [channelType]: channelId }, key: { type } });
    }

    /**
     * Returns a promise which will resolve when the provided function returns true,
     * and reject if it exceeds the provided timeout or default of 5s, or if the
     * function throws an exception.
     *
     * @param {Function} fun - A function to "try"; returns [true, value] if the "try"
     * succeeds, [false] otherwise
     * @param {number} duration - The timeout, in milliseconds, after which trying
     * without success will fail
     * @param {number} loopInterval - The time, in milliseconds, between attempts to run
     * "fun" (optional).
     * @returns {Promise} - A promise resolved
     */
    async function tryFor(fun, duration, loopInterval = 100) {
        if (typeof fun !== 'function') {
            throw new Error('The "fun" parameter (0) is required and must be a function');
        }
        if (typeof duration !== 'number') {
            throw new Error('The "duration" parameter (1) is required and must be a number');
        }

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
            await wait(loopInterval);
        }
    }

    return {
        make,
        getAuthToken,
        pendingIfNoToken,
        getUserId,
        JSONcopy,
        wait,
        waitFor,
        waitForElement,
        waitForElementState,
        waitForElementChange,
        waitForText,
        send_INFO,
        send_LOGS,
        send_RETRY,
        send_RUN_STATUS,
        send_STATUS,
        sendBusMessage,
        clearRuntime,
        tryFor,
    };
});
