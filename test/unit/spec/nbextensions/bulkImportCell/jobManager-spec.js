define([
    '/narrative/nbextensions/bulkImportCell/jobManager',
    'common/jobs',
    'common/props',
    'common/ui',
    '/test/data/jobsData',
], (JobManager, Jobs, Props, UI, JobsData) => {
    'use strict';

    const JobManagerFunctions = [
        'cancelJob',
        'cancelJobsByStatus',
        'retryJob',
        'retryJobsByStatus',
        'updateJobState',
        'viewResults',
    ];

    describe('the JobManager module', () => {
        it('Should be loaded with the right functions', () => {
            expect(JobManager).toBeDefined();
            expect(JobManager.make).toBeDefined();
            expect(JobManager.make).toEqual(jasmine.any(Function));
        });

        it('has the right functions', () => {
            const jobManagerInstance = JobManager.make({
                model: {},
                controlPanel: {},
                bus: {},
                viewResultsFunction: {},
            });
            JobManagerFunctions.forEach((fn) => {
                expect(jobManagerInstance[fn]).toBeDefined();
                expect(jobManagerInstance[fn]).toEqual(jasmine.any(Function));
            });
        });
        it('requires certain params for initialisation', () => {
            expect(() => {
                JobManager.make({
                    model: null,
                });
            }).toThrowError(
                /cannot initialise job manager widget without params "bus", "model", and "viewResultsFunction"/
            );
        });
    });

    describe('the JobManager instance', () => {
        beforeEach(function () {
            this.model = Props.make({
                data: {
                    exec: {
                        jobs: Jobs.jobArrayToIndexedObject(JobsData.allJobs),
                    },
                },
            });

            this.bus = {
                emit: () => {
                    // do nothing
                },
            };

            this.controlPanel = {
                setExecMessage: () => {
                    // do nothing
                },
            };

            this.viewResultsFunction = () => {
                // do nothing
            };

            this.jobManagerInstance = JobManager.make({
                model: this.model,
                controlPanel: this.controlPanel,
                bus: this.bus,
                viewResultsFunction: this.viewResultsFunction,
            });
        });

        describe('the updateJobState function', () => {
            it('can execute a function in the controlPanel', function () {
                spyOn(this.controlPanel, 'setExecMessage');
                this.jobManagerInstance.updateJobState();
                expect(this.controlPanel.setExecMessage).toHaveBeenCalled();
            });

            it('can have the controlPanel added retroactively', function () {
                const jobManagerInstance = JobManager.make({
                    model: this.model,
                    bus: this.bus,
                    viewResultsFunction: this.viewResultsFunction,
                });
                spyOn(console, 'warn');
                jobManagerInstance.updateJobState();
                expect(console.warn).toHaveBeenCalledWith('controlPanel has not been initialised');

                jobManagerInstance.setControlPanel(this.controlPanel);
                spyOn(this.controlPanel, 'setExecMessage');
                jobManagerInstance.updateJobState();
                expect(this.controlPanel.setExecMessage).toHaveBeenCalled();
            });
        });

        describe('the viewResults function', () => {
            it('can execute a function to view results', function () {
                const jobManagerInstance = JobManager.make({
                    model: this.model,
                    bus: this.bus,
                    viewResultsFunction: () => {
                        console.error('Triggered!');
                    },
                });

                spyOn(console, 'error');
                jobManagerInstance.viewResults();
                expect(console.error).toHaveBeenCalledWith('Triggered!');
            });
        });

        const actionStatusMatrix = {
            cancel: {
                valid: ['created', 'estimating', 'queued', 'running'],
                invalid: [],
                request: 'cancellation',
            },
            retry: {
                valid: ['terminated', 'error'],
                invalid: [],
                request: 'rerun',
            },
        };

        // fill in the invalid statuses
        Jobs.validJobStatuses.filter((status) => {
            Object.keys(actionStatusMatrix).forEach((action) => {
                if (!actionStatusMatrix[action].valid.includes(status)) {
                    actionStatusMatrix[action].invalid.push(status);
                }
            });
        });

        ['cancel', 'retry'].forEach((action) => {
            // cancelJob and retryJob: input is a single job ID
            describe(`${action}Job`, () => {
                actionStatusMatrix[action].valid.forEach((status) => {
                    const jobId = JobsData.jobsByStatus[status][0].job_id;
                    it(`can ${action} a job in status ${status}`, function () {
                        spyOn(this.bus, 'emit');
                        const result = this.jobManagerInstance[`${action}Job`](jobId);
                        expect(result).toBeTrue();
                        expect(this.bus.emit).toHaveBeenCalled();
                        // check the args to bus.emit were correct
                        const callArgs = this.bus.emit.calls.allArgs();
                        const actionRequest = `request-job-${actionStatusMatrix[action].request}`;
                        expect(callArgs[0]).toEqual([actionRequest, { jobId: jobId }]);
                    });
                });
                actionStatusMatrix[action].invalid.forEach((status) => {
                    const jobId = JobsData.jobsByStatus[status][0].job_id;
                    it(`cannot ${action} a job in status ${status}`, function () {
                        spyOn(this.bus, 'emit');
                        const result = this.jobManagerInstance[`${action}Job`](jobId);
                        expect(result).toBeFalse();
                        expect(this.bus.emit).not.toHaveBeenCalled();
                    });
                });
            });

            describe(`${action}JobsByStatus`, () => {
                // job status is invalid
                actionStatusMatrix[action].invalid.forEach((status) => {
                    it(`cannot ${action} a batch of jobs in status ${status}`, async function () {
                        spyOn(this.bus, 'emit');
                        await expectAsync(
                            this.jobManagerInstance[`${action}JobsByStatus`]([status])
                        ).toBeResolvedTo(false);
                        expect(this.bus.emit).not.toHaveBeenCalled();
                    });
                });

                actionStatusMatrix[action].valid.forEach((status) => {
                    it(`cannot ${action} a batch of ${status} jobs if there are none in that state`, async function () {
                        const model = Props.make({
                            data: {
                                exec: {
                                    jobs: Jobs.jobArrayToIndexedObject([]),
                                },
                            },
                        });
                        this.jobManagerInstance = JobManager.make({
                            model: model,
                            controlPanel: {},
                            bus: this.bus,
                            viewResultsFunction: () => {},
                        });

                        spyOn(this.bus, 'emit');
                        await expectAsync(
                            this.jobManagerInstance[`${action}JobsByStatus`]([status])
                        ).toBeResolvedTo(false);
                        expect(this.bus.emit).not.toHaveBeenCalled();
                    });

                    it(`can ${action} a batch of jobs in status ${status}`, async function () {
                        spyOn(this.bus, 'emit');
                        spyOn(UI, 'showConfirmDialog').and.resolveTo(true);
                        await this.jobManagerInstance[`${action}JobsByStatus`]([status]);
                        expect(UI.showConfirmDialog).toHaveBeenCalled();
                        expect(this.bus.emit).toHaveBeenCalled();

                        const callArgs = this.bus.emit.calls.allArgs();
                        const actionString = actionStatusMatrix[action].request;
                        // all the jobs of status `status` should be included
                        const expectedJobIds = Object.values(JobsData.jobsByStatus[status]).map(
                            (jobState) => jobState.job_id
                        );

                        expectedJobIds.forEach((jobId) => {
                            expect(callArgs).toContain([
                                `request-job-${actionString}`,
                                { jobId: jobId },
                            ]);
                        });
                    });
                });
            });
        });

        // make sure that jobs in several states can be collected together
        const statusListTests = [
            {
                action: 'cancel',
                statusList: ['created', 'estimating', 'queued'],
                title: 'Cancel queued jobs',
            },
            {
                action: 'cancel',
                statusList: ['created', 'estimating', 'queued'],
                title: 'Cancel queued jobs',
            },
            // these actions can't be done through the UI at present, but they are legal
            {
                action: 'cancel',
                statusList: ['created', 'estimating', 'running'],
                title: 'Cancel queued and running jobs',
            },
            {
                action: 'retry',
                statusList: ['terminated', 'error'],
                title: 'Retry failed and cancelled jobs',
                body:
                    'Please note that jobs are rerun using the same parameters. Any jobs that failed due to issues with the input, such as misconfigured parameters or corrupted input data, are likely to throw the same errors when run again.',
            },
        ];

        statusListTests.forEach((test) => {
            it(`can ${test.action} all jobs in states ${test.statusList.join(
                ' and '
            )}`, async function () {
                spyOn(this.bus, 'emit');
                spyOn(UI, 'showConfirmDialog').and.callFake(async (args) => {
                    // check the dialog structure
                    return await UI.showConfirmDialog.and.originalFn(
                        Object.assign(
                            {
                                doThisFirst: () => {
                                    expect(
                                        document.querySelector('.modal-title').textContent
                                    ).toContain(test.title);
                                    if (test.body) {
                                        expect(
                                            document.querySelector('.modal-body').textContent
                                        ).toContain(test.body);
                                    }
                                    document.querySelector('[data-element="ok"]').click();
                                },
                            },
                            args
                        )
                    );
                });
                await this.jobManagerInstance[`${test.action}JobsByStatus`](test.statusList);
                expect(UI.showConfirmDialog).toHaveBeenCalled();
                expect(this.bus.emit).toHaveBeenCalled();

                const callArgs = this.bus.emit.calls.allArgs();
                const actionString = actionStatusMatrix[test.action].request;

                // this is an ugly way to do this,
                // but we don't want to just mimic the code we're testing
                test.statusList.forEach((status) => {
                    Object.values(JobsData.jobsByStatus[status])
                        .map((jobState) => jobState.job_id)
                        .forEach((jobId) => {
                            expect(callArgs).toContain([
                                `request-job-${actionString}`,
                                { jobId: jobId },
                            ]);
                        });
                });
            });

            it('does nothing if the user responds no to the modal', async function () {
                spyOn(this.bus, 'emit');
                spyOn(UI, 'showConfirmDialog').and.resolveTo(false);
                await this.jobManagerInstance[`${test.action}JobsByStatus`](test.statusList);
                expect(UI.showConfirmDialog).toHaveBeenCalled();
                expect(this.bus.emit).not.toHaveBeenCalled();
            });
        });
    });
});
