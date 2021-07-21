define(['msw'], (msw) => {
    'use strict';

    const { setupWorker, rest } = msw;

    const MSW_FUDGE_FACTOR = 100;
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
     * @param {int} timeout - The timeout, in milliseconds, after which trying without success will faile
     * @returns {Promise} - A promise resolved
     */

    async function tryFor(fun, duration = DEFAULT_TRY_LOOP_TIMEOUT) {
        const interval = TRY_LOOP_INTERVAL;
        const started = Date.now();

        for (;;) {
            const elapsed = Date.now() - started;
            if (elapsed > duration) {
                throw new Error(`waitFor expired without success after ${elapsed}ms`);
            }
            const [gotIt, result] = await fun();
            if (gotIt) {
                return result;
            }
            await waitFor(interval);
        }
    }

    async function setupListener(url, respond) {
        const worker = setupWorker(
            rest.post(url, async (req, res, ctx) => {
                const response = await respond(req);
                if (response) {
                    return res(ctx.json(response));
                }
            })
        );
        await worker.start({
            quiet: true,
        });
        // TODO: the promise above is resolving before the listener is ready.
        await waitFor(MSW_FUDGE_FACTOR);
        return worker;
    }

    async function setupTextListener(url, respond) {
        const worker = setupWorker(
            rest.post(url, async (req, res, ctx) => {
                const response = await respond(req);
                if (response) {
                    return res(ctx.text(response));
                }
            })
        );
        await worker.start({
            quiet: true,
        });
        // TODO: the promise above is resolving before the listener is ready.
        await waitFor(MSW_FUDGE_FACTOR);
        return worker;
    }

    class MockWorker {
        constructor(options = {}) {
            this.handlers = [];
            this.worker = null;
            this.onUnhandledRequest = options.onUnhandledRequest || 'bypass';
        }

        addJSONResponder(url, responder) {
            const handler = rest.post(url, async (req, res, ctx) => {
                const response = await responder(req);
                if (response) {
                    return res(ctx.json(response));
                }
            });
            this.handlers.push(handler);
        }

        useJSONResponder(url, responder) {
            const handler = rest.post(url, async (req, res, ctx) => {
                const response = await responder(req);
                if (response) {
                    return res(ctx.json(response));
                }
            });
            this.worker.use(handler);
        }

        addTextResponder(url, responder) {
            const handler = rest.post(url, async (req, res, ctx) => {
                const response = await responder(req);
                if (response) {
                    return res(ctx.text(response));
                }
            });
            this.handlers.push(handler);
        }

        async start() {
            this.worker = setupWorker(...this.handlers);
            await this.worker.start({
                quiet: true,
                onUnhandledRequest: this.onUnhandledRequest,
            });
            // TODO: the promise above is resolving before the listener is ready.
            await waitFor(MSW_FUDGE_FACTOR);
            return this;
        }

        stop() {
            return this.worker.stop();
        }

        reset() {
            return this.worker.resetHandlers();
        }
    }

    function findTab($container, name) {
        return tryFor(() => {
            const $tabs = $container.find('[data-id="tabs-nav"]');
            if ($tabs.length === 0) {
                return Promise.resolve([false]);
            }
            const $tab = $tabs.find(`[data-tab="${name}"]`);
            if ($tab.length === 0) {
                return Promise.resolve([false]);
            }
            const matches = $tab.text() === name;

            if (!matches) {
                return Promise.resolve([false]);
            }

            return Promise.resolve([true, $tab]);
        }, 3000);
    }

    function expectCell($container, rowGroup, row, col, text) {
        const $row1 = $container.find(
            `[role="table"] [role="rowgroup"]:nth-child(${rowGroup}) [role="row"]:nth-child(${row})`
        );
        expect($row1).toBeDefined();
        const cellText = $row1.find(`[role="cell"]:nth-child(${col})`).text().trim();
        expect(cellText).toEqual(text);
    }

    function findTabContent($container, panelIndex) {
        return tryFor(() => {
            const $tabs = $container.find('[data-id="tabs-nav"]');
            if ($tabs.length === 0) {
                return Promise.resolve([false]);
            }
            const $tabPanel = $container.find(`[role="tabpanel"]:nth-child(${panelIndex})`);
            if ($tabPanel.length === 0) {
                return Promise.resolve([false]);
            }
            return Promise.resolve([true, $tabPanel]);
        }, 3000);
    }

    return {
        waitFor,
        tryFor,
        setupListener,
        setupTextListener,
        MockWorker,
        findTab,
        expectCell,
        findTabContent,
    };
});
