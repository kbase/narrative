define([
    'common/cellComponents/tabs/jobStatus/jobActionDropdown',
    'common/jobMessages',
    'common/jobs',
    'common/props',
    'testUtil',
    '/test/data/jobsData',
], (JobActionDropdown, JobMessages, Jobs, Props, TestUtil, JobsData) => {
    'use strict';

    let container, jobActionDropdownInstance;

    const batchJobModel = Props.make({
        data: {},
    });
    Jobs.populateModelFromJobArray(batchJobModel, JobsData.allJobsWithBatchParent);

    function createInstance(config) {
        return JobActionDropdown.make(
            Object.assign(
                {
                    jobManager: {
                        model: batchJobModel,
                    },
                    devMode: true,
                },
                config
            )
        );
    }

    async function createStartedInstance(node, config = {}) {
        const instance = createInstance(config);
        await instance.start({
            node,
        });
        return instance;
    }

    describe('The job action dropdown module', () => {
        afterEach(() => {
            TestUtil.clearRuntime();
        });

        it('loads', () => {
            expect(JobActionDropdown).not.toBe(null);
        });

        it('has expected functions', () => {
            expect(JobActionDropdown.make).toEqual(jasmine.any(Function));
        });

        it('has a cssBaseClass variable', () => {
            expect(JobActionDropdown.cssBaseClass).toEqual(jasmine.any(String));
            expect(JobActionDropdown.cssBaseClass).toContain('kb-job-action');
        });
    });

    describe('The job action dropdown instance', () => {
        beforeEach(() => {
            container = document.createElement('div');
            jobActionDropdownInstance = createInstance();
        });

        afterEach(async () => {
            await jobActionDropdownInstance.stop();
            container.remove();
            TestUtil.clearRuntime();
        });

        it('has a make function that returns an object', () => {
            expect(jobActionDropdownInstance).not.toBe(null);
            expect(jobActionDropdownInstance).toEqual(jasmine.any(Object));
        });

        it('has the required methods', () => {
            ['start', 'stop', 'updateState'].forEach((fn) => {
                expect(jobActionDropdownInstance[fn]).toBeDefined();
                expect(jobActionDropdownInstance[fn]).toEqual(jasmine.any(Function));
            });
        });

        it('should start, and populate a node', async () => {
            expect(container.children.length).toBe(0);
            await jobActionDropdownInstance.start({
                node: container,
            });
            expect(container.children.length).toBeGreaterThan(0);
            // button to trigger the dropdown, four dropdown options
            expect(container.querySelectorAll('button').length).toBe(5);
        });

        it('should throw an error without the required start argument', async () => {
            await expectAsync(jobActionDropdownInstance.start({})).toBeRejectedWithError(
                /start argument must have the key "node"/
            );
        });
    });

    describe('the started job action dropdown instance', () => {
        describe('buttons', () => {
            beforeEach(async function () {
                container = document.createElement('div');
                this.jobManager = {
                    model: batchJobModel,
                    getCurrentJobsByStatus: () => {
                        // nothing
                    },
                    doJobAction: () => {
                        // nothing
                    },
                };
                jobActionDropdownInstance = await createStartedInstance(container, {
                    jobManager: this.jobManager,
                });
            });

            afterEach(async () => {
                await jobActionDropdownInstance.stop();
                container.remove();
                TestUtil.clearRuntime();
            });

            it('should perform dropdown options when clicked', function () {
                const orderedButtons = [
                    {
                        statusList: ['created', 'estimating', 'queued'],
                        validStatuses: Jobs.validStatusesForAction.cancel,
                    },
                    {
                        statusList: ['running'],
                        validStatuses: Jobs.validStatusesForAction.cancel,
                    },
                    {
                        statusList: ['terminated'],
                        validStatuses: Jobs.validStatusesForAction.retry,
                    },
                    {
                        statusList: ['error'],
                        validStatuses: Jobs.validStatusesForAction.retry,
                    },
                ];
                const argCombos = orderedButtons.map((button) => {
                    // arguments to jobManager.getCurrentJobsByStatus
                    return [button.statusList, button.validStatuses];
                });

                spyOn(this.jobManager, 'getCurrentJobsByStatus').and.returnValue([]);

                const dropdownButtons = container.querySelectorAll('.dropdown [data-action]');
                dropdownButtons.forEach((button) => {
                    button.click();
                });

                expect(this.jobManager.getCurrentJobsByStatus).toHaveBeenCalled();
                expect(this.jobManager.getCurrentJobsByStatus.calls.allArgs()).toEqual(argCombos);
            });
        });

        describe('doBatchJobAction', () => {
            beforeEach(async function () {
                container = document.createElement('div');
                this.clickTarget = document.createElement('button');
                this.jobManager = {
                    model: batchJobModel,
                    getCurrentJobsByStatus: () => {
                        // nothing
                    },
                    doJobAction: () => {
                        // nothing
                    },
                };
                jobActionDropdownInstance = await createStartedInstance(container, {
                    jobManager: this.jobManager,
                });
            });

            afterEach(async () => {
                await jobActionDropdownInstance.stop();
                container.remove();
                TestUtil.clearRuntime();
            });

            it('resolves to false with an invalid action', async function () {
                this.clickTarget.setAttribute('data-action', 'go-to-results');
                this.clickTarget.setAttribute('data-target', 'running');
                spyOn(this.jobManager, 'getCurrentJobsByStatus');
                const outcome = await jobActionDropdownInstance.doBatchJobAction({
                    target: this.clickTarget,
                });
                expect(outcome).toBeFalse();
                expect(this.jobManager.getCurrentJobsByStatus).not.toHaveBeenCalled();
            });

            [null, undefined, []].forEach((returnValue) => {
                it(`resolves to false with the job ID list ${JSON.stringify(
                    returnValue
                )}`, async function () {
                    this.clickTarget.setAttribute('data-action', 'cancel');
                    this.clickTarget.setAttribute('data-target', 'running');
                    spyOn(this.jobManager, 'getCurrentJobsByStatus').and.returnValue(returnValue);
                    const outcome = await jobActionDropdownInstance.doBatchJobAction({
                        target: this.clickTarget,
                    });
                    expect(outcome).toBeFalse();
                    expect(this.jobManager.getCurrentJobsByStatus).toHaveBeenCalled();
                    expect(this.jobManager.getCurrentJobsByStatus.calls.allArgs()).toEqual([
                        [['running'], Jobs.validStatusesForAction.cancel],
                    ]);
                });
            });

            // whether the user confirms the cancel/retry dialog or not
            it('resolves to false if the user dismisses the dialog', async function () {
                const action = 'cancel';
                const target = 'running';
                const returnValue = [1, 2, 3];
                this.clickTarget.setAttribute('data-action', action);
                this.clickTarget.setAttribute('data-target', target);
                spyOn(this.jobManager, 'getCurrentJobsByStatus').and.returnValue(returnValue);
                spyOn(this.jobManager, 'doJobAction');
                spyOn(JobMessages, 'showDialog').and.resolveTo(false);
                const outcome = await jobActionDropdownInstance.doBatchJobAction({
                    target: this.clickTarget,
                });
                expect(outcome).toBeFalse();
                expect(this.jobManager.getCurrentJobsByStatus).toHaveBeenCalled();
                expect(this.jobManager.getCurrentJobsByStatus.calls.allArgs()).toEqual([
                    [[target], Jobs.validStatusesForAction.cancel],
                ]);
                expect(this.jobManager.doJobAction).not.toHaveBeenCalled();
            });

            it('resolves to true if the user accepts the dialog', async function () {
                const action = 'retry';
                const target = 'error';
                const returnValue = [
                    {
                        job_id: 1,
                        retry_parent: 11,
                    },
                    {
                        job_id: 2,
                        retry_parent: 22,
                    },
                    {
                        job_id: 3,
                        retry_parent: 33,
                    },
                ];
                this.clickTarget.setAttribute('data-action', action);
                this.clickTarget.setAttribute('data-target', target);
                spyOn(this.jobManager, 'getCurrentJobsByStatus').and.returnValue(returnValue);
                spyOn(this.jobManager, 'doJobAction');
                spyOn(JobMessages, 'showDialog').and.resolveTo(true);
                const outcome = await jobActionDropdownInstance.doBatchJobAction({
                    target: this.clickTarget,
                });
                expect(outcome).toBeTrue();
                expect(this.jobManager.getCurrentJobsByStatus).toHaveBeenCalled();
                expect(this.jobManager.getCurrentJobsByStatus.calls.allArgs()).toEqual([
                    [[target], Jobs.validStatusesForAction.retry],
                ]);
                expect(this.jobManager.doJobAction).toHaveBeenCalled();
                expect(this.jobManager.doJobAction.calls.allArgs()).toEqual([
                    [action, [11, 22, 33]],
                ]);
            });
        });

        describe('button state', () => {
            /**
             * Test the expected state of the job action dropdown buttons
             *
             * @param {array}   expectations in the form [
             *                      ['querySelectorString', expectedValue],
             *                      ['querySelectorString', expectedValue],
             *                  ]
             *                  where querySelectorString is used to select elements
             *                  using container.querySelectorAll
             *
             *                  e.g. ['.dropdown [data-action]', true]
             *                  expect all elements with a data-action attribute to be disabled
             *
             *                  if no expectations are supplied, it is assumed that
             *                  all buttons are disabled
             */
            function expectButtonState(expectations) {
                jobActionDropdownInstance.updateState();
                if (!expectations || !expectations.length) {
                    expectations = [['.dropdown [data-action]', true]];
                }
                expectations.forEach((expectation) => {
                    const dropdownButtons = container.querySelectorAll(expectation[0]);
                    dropdownButtons.forEach((button) => {
                        expect(button.disabled).toBe(expectation[1]);
                    });
                });
            }

            function generateJobs(jobSpec) {
                const outputJobs = [JobsData.batchParentJob];
                Object.keys(jobSpec).forEach((status) => {
                    Object.keys(jobSpec[status]).forEach((jobId) => {
                        outputJobs.push({
                            job_id: jobId,
                            status: status,
                            batch_id: JobsData.batchParentJob.job_id,
                        });
                    });
                });
                return outputJobs;
            }

            beforeAll(async function () {
                container = document.createElement('div');
                this.jobManager = {
                    model: Props.make({ data: {} }),
                };
                jobActionDropdownInstance = await createStartedInstance(container, {
                    jobManager: this.jobManager,
                });
            });

            afterEach(() => {
                TestUtil.clearRuntime();
            });

            afterAll(async () => {
                await jobActionDropdownInstance.stop();
                container.remove();
            });

            const tests = [
                {
                    desc: 'no jobs: all off',
                    input: [],
                },
                {
                    desc: 'batch job with retries: cancel on, retry off',
                    input: JobsData.batchJob.jobArray,
                    expect: JobsData.batchJob.expectedButtonState,
                },
                {
                    desc: 'all jobs: all on',
                    input: JobsData.allJobsWithBatchParent,
                    expect: [['.dropdown [data-action]', false]],
                },
                {
                    desc: 'all jobs complete: all off',
                    input: generateJobs({
                        completed: {
                            job_1: true,
                            job_2: true,
                        },
                    }),
                },
                {
                    desc: 'no jobs found: all off',
                    input: generateJobs({
                        does_not_exist: {
                            job_1: true,
                            job_2: true,
                        },
                    }),
                },
                {
                    desc: 'queued and running: cancel on, retry off',
                    input: generateJobs({
                        queued: { job_1: true, job_2: true },
                        running: { job_3: true },
                    }),
                    expect: [
                        ['.dropdown [data-action="cancel"]', false],
                        ['.dropdown [data-action="retry"]', true],
                    ],
                },
                {
                    desc: 'created, estimating, and running: cancel on, retry off',
                    input: generateJobs({
                        created: { job_1: true },
                        estimating: { job_2: true },
                        running: { job_3: true },
                    }),
                    expect: [
                        ['.dropdown [data-action="cancel"]', false],
                        ['.dropdown [data-action="retry"]', true],
                    ],
                },
                {
                    desc: 'failed and cancelled: cancel off, retry on',
                    input: generateJobs({
                        error: {
                            job_1: true,
                            job_2: true,
                        },
                        terminated: {
                            job_3: true,
                        },
                    }),
                    expect: [
                        ['.dropdown [data-action="cancel"]', true],
                        ['.dropdown [data-action="retry"]', false],
                    ],
                },
                {
                    desc: 'errored jobs only: retry errors on',
                    input: generateJobs({
                        error: {
                            job_1: true,
                            job_2: true,
                        },
                        does_not_exist: {
                            job_3: true,
                        },
                        completed: {
                            job_4: true,
                            job_5: true,
                        },
                    }),
                    expect: [
                        ['.dropdown [data-action="cancel"]', true],
                        ['.dropdown [data-target="terminated"]', true],
                        ['.dropdown [data-target="error"]', false],
                    ],
                },
            ];

            tests.forEach((test) => {
                it(test.desc, function () {
                    Jobs.populateModelFromJobArray(this.jobManager.model, test.input);
                    test.expect ? expectButtonState(test.expect) : expectButtonState();
                });
            });
        });
    });
});
