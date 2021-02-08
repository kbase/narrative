define([
    'common/cellComponents/tabs/jobStatus/jobStateListRow',
    'common/props',
    '/test/data/testAppObj',
    '/test/data/jobsData',
], (jobStateListRow, Props, TestAppObject, JobsData) => {
    'use strict';

    const model = Props.make({
        data: TestAppObject,
        onUpdate: () => {},
    });
    const { cssBaseClass } = jobStateListRow;

    function createInstance() {
        return jobStateListRow.make({
            model: model,
        });
    }

    const customMatchers = {
        toHaveRowStructure: function () {
            return {
                compare: function (...args) {
                    return checkRowContents(args);
                },
            };
        },
    };

    function checkRowContents(args) {
        const [row, context] = args;
        const { job } = context;
        const input = args[2] || job;
        let inputString;

        if (typeof input === 'object' && 'status' in input && 'job_id' in input) {
            inputString = JSON.stringify({ job_id: input.job_id, status: input.status });
        } else {
            inputString = JSON.stringify(input);
        }

        const result = {
            pass: true,
            message: 'checking row contents with input ' + inputString,
            tests: {},
        };

        // status details cell
        const logViewEl = row.querySelector(`.${cssBaseClass}__cell--log-view`);
        const logViewRegex = new RegExp('Status details');
        result.tests.logView = logViewRegex.test(logViewEl.textContent);
        expect(logViewEl.textContent).toContain('Status details');

        // object name
        const objectEl = row.querySelector(`.${cssBaseClass}__cell--object`);
        const objectRegex = new RegExp('testObject');

        if (input.meta.paramsRegex) {
            expect(objectEl.textContent).toMatch(input.meta.paramsRegex);
            result.tests.object = input.meta.paramsRegex.test(objectEl.textContent);
        } else {
            result.tests.object = objectRegex.test(objectEl.textContent);
            expect(objectEl.textContent).toContain('testObject');
        }

        // action
        const actionEl = row.querySelector(`.${cssBaseClass}__cell--action`);
        const actionRegex = new RegExp(job.meta.jobAction);
        result.tests.action = actionRegex.test(actionEl.textContent);
        expect(actionEl.textContent).toContain(input.meta.jobAction);

        // status
        const statusEl = row.querySelector(`.${cssBaseClass}__cell--status`);
        const statusRegex = new RegExp(job.meta.jobLabel);
        result.tests.status = statusRegex.test(statusEl.textContent);
        expect(statusEl.textContent).toContain(input.meta.jobLabel);

        if (!Object.values(result.tests).every((item) => item)) {
            result.pass = false;
            result.message += '; results: ' + JSON.stringify(result.tests);
        }
        return result;
    }

    describe('The job state list row module', () => {
        it('loads', () => {
            expect(jobStateListRow).not.toBe(null);
        });

        it('has expected functions', () => {
            expect(jobStateListRow.make).toBeDefined();
        });

        it('has a base css class', () => {
            expect(jobStateListRow.cssBaseClass).toContain('kb-job');
        });
    });

    describe('The job state list row instance', () => {
        let jobStateListRowInstance;
        beforeEach(() => {
            jobStateListRowInstance = createInstance();
        });

        it('has a make function that returns an object', () => {
            expect(jobStateListRowInstance).not.toBe(null);
        });

        it('has the required methods', () => {
            const requiredMethods = ['start', 'stop', 'updateState', 'updateParams'];
            requiredMethods.forEach((method) => {
                expect(jobStateListRowInstance[method]).toBeDefined();
            });
        });
    });

    describe('Starting the job state list row instance', () => {
        let jobStateListRowInstance;
        beforeAll(() => {
            jobStateListRowInstance = createInstance();
        });
        const invalidArgs = [
            null,
            undefined,
            'a string',
            ['jobState'],
            {},
            {
                jobState: {},
            },
            {
                name: {},
                node: {},
            },
            {
                name: null,
                node: undefined,
                jobState: { this: 'that' },
            },
        ];
        invalidArgs.forEach((args) => {
            it('will throw an error with invalid args ' + JSON.stringify(args), async () => {
                await expectAsync(jobStateListRowInstance.start(args)).toBeRejectedWithError(
                    Error,
                    /invalid arguments supplied/
                );
            });
        });

        JobsData.invalidJobs.forEach((invalidJob) => {
            it('will throw an error with an invalid job', async () => {
                await expectAsync(
                    jobStateListRowInstance.start({
                        jobState: invalidJob,
                        name: 'whatever',
                        node: 'wherever',
                    })
                ).toBeRejectedWithError(
                    Error,
                    invalidJob ? /invalid job object supplied/ : /invalid arguments supplied/
                );
            });
        });
    });

    JobsData.validJobs.forEach((job) => {
        beforeEach(() => {
            jasmine.addMatchers(customMatchers);
        });
        describe('the job state list row instance creates initial structure and content', () => {
            const row = document.createElement('tr');
            const jobStateListRowInstance = createInstance();
            jobStateListRowInstance
                .start({
                    node: row,
                    jobState: job,
                    name: 'testObject',
                })
                .then(() => {
                    it('should have row structure', () => {
                        expect(row).toHaveRowStructure({ job: job });
                    });
                });
        });
    });
});
