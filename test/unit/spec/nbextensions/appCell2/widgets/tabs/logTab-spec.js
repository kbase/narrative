define([
    '/narrative/nbextensions/appCell2/widgets/tabs/logTab',
    'common/props',
    '/test/data/jobsData',
], (LogTab, Props, JobsData) => {
    'use strict';

    function buildModel(options = {}) {
        const testJob = JobsData.jobsByStatus.completed[0];
        const data = {
            exec: { jobState: testJob },
            ...options,
        };
        return Props.make({ data });
    }

    describe('The app cell log tab module', () => {
        it('Should load and return a make function', () => {
            expect(LogTab).toEqual(jasmine.any(Object));
            expect(LogTab.make).toEqual(jasmine.any(Function));
        });
    });

    describe('The app cell log tab instance', () => {
        it('can be instantiated', () => {
            const model = buildModel();
            const logTabInstance = LogTab.make({ model });
            ['start', 'stop'].forEach((fn) => {
                expect(logTabInstance[fn]).toEqual(jasmine.any(Function));
            });
        });

        describe('starts', () => {
            it('in single job mode', async () => {
                const model = buildModel(),
                    node = document.createElement('div');
                const logTabInstance = LogTab.make({ model });
                await logTabInstance.start({ node });

                const logNode = node.querySelector('[data-element="log"]');
                expect(node.textContent).not.toContain(LogTab.batchModeText);
                // until the log viewer receives a job status update, it will show the awaiting message
                expect(logNode.textContent).toContain(JobsData.jobStrings.unknown);
            });

            it('in batch mode, no child jobs', async () => {
                const model = buildModel({ 'user-settings': { batchMode: true } }),
                    node = document.createElement('div');
                const logTabInstance = LogTab.make({ model });
                await logTabInstance.start({ node });

                const logNode = node.querySelector('[data-element="log"]');
                expect(node.textContent).toContain(LogTab.batchModeText);
                expect(logNode.textContent).toContain(JobsData.jobStrings.unknown);
            });

            // this does not happen in reality because batch mode spawns child jobs anonymously
            it('in batch mode, with child jobs', async () => {
                const model = buildModel({ exec: { jobState: JobsData.batchParentJob } }),
                    node = document.createElement('div');
                const logTabInstance = LogTab.make({ model });
                await logTabInstance.start({ node });

                const logNode = node.querySelector('[data-element="log"]');
                expect(node.textContent).toContain(LogTab.batchModeText);
                expect(logNode.textContent).toContain(JobsData.jobStrings.unknown);
            });
        });

        describe('stop', () => {
            it('can stop the widget', async () => {
                const model = buildModel(),
                    node = document.createElement('div');
                const logTabInstance = LogTab.make({ model });
                await logTabInstance.start({ node });

                const logNode = node.querySelector('[data-element="log"]');
                expect(node.textContent).not.toContain(LogTab.batchModeText);

                await logTabInstance.stop();
                expect(logNode.textContent).toEqual('');
            });
        });
    });
});
