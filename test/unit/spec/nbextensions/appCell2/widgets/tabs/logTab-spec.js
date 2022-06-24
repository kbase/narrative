define([
    '/narrative/nbextensions/appCell2/widgets/tabs/logTab',
    'common/jobManager',
    'common/props',
    '/test/data/jobsData',
], (LogTab, JobManagerModule, Props, JobsData) => {
    'use strict';

    const { SingleJobManager } = JobManagerModule;
    const bus = {
        emit: () => {
            /* no op */
        },
    };

    function buildModel(options = {}) {
        const testJob = JobsData.jobsByStatus.completed[0];
        const data = {
            exec: { jobState: testJob },
            ...options,
        };
        return Props.make({ data });
    }

    const selector = {
        log: '[data-element="log"]',
        state: '[data-element="state"]',
    };

    describe('The app cell log tab module', () => {
        it('Should load and return a make function', () => {
            expect(LogTab).toEqual(jasmine.any(Object));
            expect(LogTab.make).toEqual(jasmine.any(Function));
        });
    });

    describe('The app cell log tab instance', () => {
        it('can be instantiated', () => {
            const model = buildModel(),
                jobManager = new SingleJobManager({ model, bus });
            const logTabInstance = LogTab.make({ model, jobManager });
            ['start', 'stop'].forEach((fn) => {
                expect(logTabInstance[fn]).toEqual(jasmine.any(Function));
            });
        });

        describe('starts', () => {
            it('in single job mode', async () => {
                const model = buildModel(),
                    jobManager = new SingleJobManager({ model, bus }),
                    node = document.createElement('div');
                const logTabInstance = LogTab.make({ model, jobManager });
                await logTabInstance.start({ node });

                const logNode = node.querySelector(selector.log);
                expect(node.textContent).not.toContain(LogTab.batchModeText);
                // until the log viewer receives LOGS data, it will show the
                // 'Fetching' message
                expect(logNode.textContent).toContain('Fetching logs...');
            });

            it('in batch mode, no child jobs', async () => {
                const model = buildModel({ 'user-settings': { batchMode: true } }),
                    jobManager = new SingleJobManager({ model, bus }),
                    node = document.createElement('div');
                const logTabInstance = LogTab.make({ model, jobManager });
                await logTabInstance.start({ node });

                const logNode = node.querySelector('[data-element="log"]');
                expect(node.textContent).toContain(LogTab.batchModeText);
                expect(logNode.textContent).toContain('Fetching logs...');
            });

            // this does not happen in reality because batch mode spawns child jobs anonymously
            it('in batch mode, with child jobs', async () => {
                const model = buildModel({ exec: { jobState: JobsData.batchParentJob } }),
                    jobManager = new SingleJobManager({ model, bus }),
                    node = document.createElement('div');
                const logTabInstance = LogTab.make({ model, jobManager });
                await logTabInstance.start({ node });
                const logNode = node.querySelector('[data-element="log"]');
                expect(node.textContent).toContain(LogTab.batchModeText);
                expect(logNode.textContent).toContain('Fetching logs...');
            });
        });

        describe('stop', () => {
            it('can stop the widget', async () => {
                const model = buildModel(),
                    jobManager = new SingleJobManager({ model, bus }),
                    node = document.createElement('div');
                const logTabInstance = LogTab.make({ model, jobManager });
                await logTabInstance.start({ node });

                const logNode = node.querySelector('[data-element="log"]');
                expect(node.textContent).not.toContain(LogTab.batchModeText);

                await logTabInstance.stop();
                expect(logNode.textContent).toEqual('');

                ['state', 'log'].forEach((section) => {
                    const sectionNode = node.querySelector(selector[section]);
                    expect(sectionNode.textContent).toEqual('');
                });
            });
        });
    });
});
