define(['msw', 'testUtil'], (msw, testutil) => {
    'use strict';

    const { setupWorker, rest } = msw;

    const { wait, tryFor } = testutil;

    const MSW_FUDGE_FACTOR = 100;

    class MockWorker {
        constructor(options = {}) {
            this.worker = null;
            this.onUnhandledRequest = options.onUnhandledRequest || 'bypass';
        }

        // The "use" methods will add responders at "runtime", and must be used after the
        // worker has started. They can be removed using resetHandlers. These are the preferred
        // way to use msw in tests.

        useJSONResponder(url, responder, options = {}) {
            const handler = rest.post(url, (req, res, ctx) => {
                const args = [];
                let rpc;
                if (typeof req.body === 'string') {
                    rpc = JSON.parse(req.body);
                } else {
                    rpc = req.body;
                }

                const response = responder(req, res, rpc);
                if (response) {
                    if (options.delay) {
                        args.push(ctx.delay(options.delay));
                    }
                    args.push(ctx.json(response));
                    return res(...args);
                }
            });
            this.worker.use(handler);
        }

        useTextResponder(url, responder) {
            const handler = rest.post(url, (req, res, ctx) => {
                const response = responder(req);
                if (response) {
                    return res(ctx.text(response));
                }
            });
            this.worker.use(handler);
        }

        async start() {
            this.worker = setupWorker();
            await this.worker.start({
                quiet: true,
                onUnhandledRequest: this.onUnhandledRequest,
            });
            // Workaround to ensure that the worker is fully started before we
            // proceed.
            await wait(MSW_FUDGE_FACTOR);
            return this;
        }

        stop() {
            return this.worker.stop();
        }

        reset() {
            return this.worker.resetHandlers();
        }

        done() {
            this.stop();
            this.reset();
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

    function getProp(obj, path) {
        const [pathElement, ...restOfPath] = path;
        if (restOfPath.length === 0) {
            return obj[pathElement];
        }
        return getProp(obj[pathElement], restOfPath);
    }

    return {
        MockWorker,
        findTab,
        expectCell,
        findTabContent,
        getProp,
    };
});
