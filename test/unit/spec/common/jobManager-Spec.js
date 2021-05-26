define(['common/jobManager', 'common/jobs', 'common/props', 'common/ui', '/test/data/jobsData'], (
    JobManager,
    Jobs,
    Props,
    UI,
    JobsData
) => {
    'use strict';

    function createJobManagerInstance(context) {
        return new JobManager({
            model: context.model,
            bus: context.bus,
            viewResultsFunction: context.viewResultsFunction,
            devMode: true,
        });
    }

    describe('the JobManager module', () => {
        it('Should be loaded with the right functions', () => {
            expect(JobManager).toEqual(jasmine.any(Function));
        });

        it('can be instantiated', () => {
            const jobManagerInstance = new JobManager({
                model: {},
                bus: {},
                viewResultsFunction: {},
            });

            [
                'addUpdateHandler',
                'removeUpdateHandler',
                'runUpdateHandlers',
                'updateModel',
                'cancelJob',
                'cancelJobsByStatus',
                'retryJob',
                'retryJobsByStatus',
            ].forEach((fn) => {
                expect(jobManagerInstance[fn]).toEqual(jasmine.any(Function));
            });
        });

        it('requires certain params for initialisation', () => {
            let jobManagerInstance;
            expect(() => {
                jobManagerInstance = new JobManager({
                    model: null,
                });
            }).toThrowError(
                /cannot initialise job manager widget without params "bus", "model", and "viewResultsFunction"/
            );
            expect(jobManagerInstance).not.toBeDefined();
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

            this.viewResultsFunction = () => {
                // do nothing
            };
        });

        describe('the updateModel function', () => {
            beforeEach(function () {
                this.starterJob = {
                    job_id: 'jobToUpdate',
                    status: 'queued',
                    created: 0,
                };

                this.originalObject = {
                    exec: {
                        jobs: {
                            byId: {
                                jobToUpdate: this.starterJob,
                            },
                            byStatus: {
                                queued: {
                                    jobToUpdate: true,
                                },
                            },
                        },
                    },
                };
                this.model = Props.make({
                    data: {
                        exec: {
                            jobs: Jobs.jobArrayToIndexedObject([this.starterJob]),
                        },
                    },
                });
                this.jobManagerInstance = createJobManagerInstance(this);
            });

            it('can update a job in the model', function () {
                const jobState = {
                    job_id: 'jobToUpdate',
                    status: 'running',
                    created: 0,
                };
                const expectedObject = {
                    exec: {
                        jobs: {
                            byId: {
                                jobToUpdate: jobState,
                            },
                            byStatus: {
                                running: {
                                    jobToUpdate: true,
                                },
                            },
                        },
                    },
                };

                this.jobManagerInstance.addUpdateHandler({
                    test: (newModel, extraArgs) => {
                        expect(newModel.getRawObject()).toEqual(expectedObject);
                        expect(extraArgs).toEqual([jobState]);
                        console.warn('Running an update handler!', jobState);
                    },
                });
                expect(this.model.getRawObject()).toEqual(this.originalObject);
                expect(this.jobManagerInstance.model.getRawObject()).toEqual(this.originalObject);

                spyOn(console, 'warn');
                const updatedModel = this.jobManagerInstance.updateModel([jobState]);
                expect(updatedModel.getRawObject()).toEqual(expectedObject);
                expect(console.warn).toHaveBeenCalled();
                expect(console.warn.calls.allArgs()).toEqual([
                    ['Running an update handler!', jobState],
                ]);
            });

            it('can add a job to an existing model', function () {
                const jobState = {
                    job_id: 'a brave new job',
                    status: 'does_not_exist',
                    created: 0,
                };

                const expectedObject = {
                    exec: {
                        jobs: {
                            byId: {
                                jobToUpdate: this.starterJob,
                                'a brave new job': jobState,
                            },
                            byStatus: {
                                queued: {
                                    jobToUpdate: true,
                                },
                                does_not_exist: {
                                    'a brave new job': true,
                                },
                            },
                        },
                    },
                };
                expect(this.model.getRawObject()).toEqual(this.originalObject);
                const updatedModel = this.jobManagerInstance.updateModel([jobState]);
                expect(updatedModel.getRawObject()).toEqual(expectedObject);
            });
        });

        describe('handlers', () => {
            const screamStr = 'AARRGGHH!!',
                shoutStr = 'Beware!',
                scream = () => {
                    console.error(screamStr);
                },
                shout = () => {
                    console.warn(shoutStr);
                };

            /**
             * test whether a handler is defined
             * @param {JobManager} jobManagerInstance
             * @param {boolean} definedStatus
             * @param {array} handlerArray - array of names of handlers
             */
            function expectHandlersDefined(jobManagerInstance, definedStatus, handlerArray) {
                handlerArray.forEach((name) => {
                    if (definedStatus) {
                        expect(jobManagerInstance.handlers[name]).toEqual(jasmine.any(Function));
                    } else {
                        expect(jobManagerInstance.handlers[name]).toBeUndefined();
                    }
                });
            }

            beforeEach(function () {
                this.jobManagerInstance = createJobManagerInstance(this);
            });

            describe('addUpdateHandler', () => {
                it('can have handlers added', function () {
                    expect(this.jobManagerInstance.handlers).toEqual({});
                    this.jobManagerInstance.addUpdateHandler({ scream: scream });
                    expectHandlersDefined(this.jobManagerInstance, true, ['scream']);
                });

                it('can have numerous handlers', function () {
                    expect(this.jobManagerInstance.handlers).toEqual({});
                    this.jobManagerInstance.addUpdateHandler({ scream, shout });
                    expectHandlersDefined(this.jobManagerInstance, true, ['scream', 'shout']);
                });

                it('cannot add handlers that are not functions', function () {
                    expect(this.jobManagerInstance.handlers).toEqual({});
                    expect(() => {
                        this.jobManagerInstance.addUpdateHandler({ shout: { key: 'value' } });
                    }).toThrowError(
                        /Handlers must be of type function. Recheck these handlers: shout/
                    );
                    expectHandlersDefined(this.jobManagerInstance, false, ['shout']);
                    expect(this.jobManagerInstance.handlers).toEqual({});
                });

                it('only adds valid handlers', function () {
                    expect(this.jobManagerInstance.handlers).toEqual({});
                    expect(() => {
                        this.jobManagerInstance.addUpdateHandler({
                            scream,
                            shout,
                            let_it_all: {},
                            out: null,
                        });
                    }).toThrowError(
                        /Handlers must be of type function. Recheck these handlers: let_it_all, out/
                    );
                    expectHandlersDefined(this.jobManagerInstance, true, ['scream', 'shout']);
                    expectHandlersDefined(this.jobManagerInstance, false, ['let_it_all', 'out']);
                });

                const badArguments = [null, undefined, '', 0, 1.2345, [], [1, 2, 3, 4], () => {}];
                badArguments.forEach((arg) => {
                    it(`does not accept args of type ${Object.prototype.toString.call(
                        arg
                    )}`, function () {
                        expect(() => {
                            this.jobManagerInstance.addUpdateHandler(arg);
                        }).toThrowError(/Arguments to addUpdateHandler must be of type object/);
                    });
                });
            });

            describe('removeUpdateHandler', () => {
                it('can have handlers removed', function () {
                    this.jobManagerInstance.handlers.scream = scream;
                    expect(this.jobManagerInstance.handlers.scream).toEqual(jasmine.any(Function));
                    this.jobManagerInstance.removeUpdateHandler('scream');
                    expectHandlersDefined(this.jobManagerInstance, false, ['scream']);
                });

                it('does not die if the handler name does not exist', function () {
                    expect(this.jobManagerInstance.handlers.scream).toBeUndefined();
                    this.jobManagerInstance.removeUpdateHandler('scream');
                    expectHandlersDefined(this.jobManagerInstance, false, ['scream']);
                });
            });

            describe('runUpdateHandlers', () => {
                it('does not throw an error if there are no handlers', function () {
                    expect(this.jobManagerInstance.handlers).toEqual({});
                    expect(() => {
                        this.jobManagerInstance.runUpdateHandlers();
                    }).not.toThrow();
                });

                it('executes the handlers', function () {
                    const extraArg = [1, 2, 3],
                        model = this.model;
                    this.jobManagerInstance.handlers.handler_1 = scream;
                    this.jobManagerInstance.handlers.handler_2 = shout;

                    spyOn(console, 'error');
                    spyOn(console, 'warn');
                    spyOn(this.jobManagerInstance.handlers, 'handler_1').and.callThrough();
                    spyOn(this.jobManagerInstance.handlers, 'handler_2').and.callThrough();

                    this.jobManagerInstance.runUpdateHandlers(extraArg);

                    [
                        console.error,
                        console.warn,
                        this.jobManagerInstance.handlers.handler_1,
                        this.jobManagerInstance.handlers.handler_2,
                    ].forEach((fn) => {
                        expect(fn).toHaveBeenCalled();
                    });
                    [
                        this.jobManagerInstance.handlers.handler_1,
                        this.jobManagerInstance.handlers.handler_2,
                    ].forEach((fn) => {
                        expect(fn.calls.allArgs()).toEqual([[model, extraArg]]);
                    });

                    expect(console.error.calls.allArgs()).toEqual([[screamStr]]);
                    expect(console.warn.calls.allArgs()).toEqual([[shoutStr]]);
                });

                it('warns if a handler throws an error', function () {
                    const extraArg = [1, 2, 3];
                    this.jobManagerInstance.handlers.handler_a = scream;
                    this.jobManagerInstance.handlers.handler_c = shout;
                    this.jobManagerInstance.handlers.handler_b = () => {
                        throw new Error('Dying');
                    };
                    spyOn(console, 'error');
                    spyOn(console, 'warn');

                    this.jobManagerInstance.runUpdateHandlers(extraArg);
                    expect(console.error).toHaveBeenCalled();
                    expect(console.error.calls.allArgs()).toEqual([[screamStr]]);
                    expect(console.warn.calls.allArgs()).toEqual([
                        ['Error executing handler handler_b:', new Error('Dying')],
                        [shoutStr],
                    ]);
                });
            });
        });

        describe('the viewResults function', () => {
            it('can execute a function to view results', function () {
                const jobManagerInstance = new JobManager({
                    model: this.model,
                    bus: this.bus,
                    viewResultsFunction: () => {
                        console.error('Triggered!');
                    },
                    devMode: true,
                });

                spyOn(console, 'error');
                jobManagerInstance.viewResults();
                expect(console.error).toHaveBeenCalledWith('Triggered!');
            });
        });

        describe('job action functions', () => {
            beforeEach(function () {
                this.jobManagerInstance = createJobManagerInstance(this);
            });

            const actionStatusMatrix = {
                cancel: {
                    valid: ['created', 'estimating', 'queued', 'running'],
                    invalid: [],
                    request: 'cancellation',
                },
                retry: {
                    valid: ['created', 'estimating', 'queued', 'running', 'terminated', 'error'],
                    invalid: [],
                    request: 'retry',
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
                            this.jobManagerInstance = new JobManager({
                                model: model,
                                bus: this.bus,
                                viewResultsFunction: () => {},
                                devMode: true,
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
                            const expectedJobIds = Object.values(JobsData.jobsByStatus[status])
                                .map((jobState) => jobState.job_id)
                                .sort();
                            expect(callArgs.length).toEqual(1);
                            expect(callArgs[0][0]).toEqual(`request-job-${actionString}`);
                            expect(callArgs[0][1].jobIdList.sort()).toEqual(expectedJobIds);
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
                    spyOn(UI, 'showConfirmDialog').and.callFake((args) => {
                        // check the dialog structure
                        return UI.showConfirmDialog.and.originalFn(
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

                    expect(callArgs.length).toEqual(1);
                    expect(callArgs[0][0]).toEqual(`request-job-${actionString}`);

                    // this is an ugly way to do this,
                    // but we don't want to just mimic the code we're testing
                    let acc = 0;
                    test.statusList.forEach((status) => {
                        Object.values(JobsData.jobsByStatus[status])
                            .map((jobState) => jobState.job_id)
                            .forEach((jobId) => {
                                expect(callArgs[0][1].jobIdList.includes(jobId)).toBeTrue();
                                acc++;
                            });
                    });
                    expect(callArgs[0][1].jobIdList.length).toEqual(acc);
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

        describe('initBatchJob', () => {
            beforeEach(function () {
                this.jobManagerInstance = createJobManagerInstance(this);
            });

            const invalidInput = [
                {},
                { parent_job: 12345 },
                { parent_job_id: 12345, child_jobs: [] },
                { parent_job_id: 12345, child_job_ids: [] },
                { parent_job_id: 12345, child_job_ids: {} },
            ];

            invalidInput.forEach((input) => {
                it(`will not accept invalid input ${JSON.stringify(input)}`, function () {
                    expect(() => {
                        this.jobManagerInstance.initBatchJob(input);
                    }).toThrowError(
                        /Batch job must have a parent job ID and at least one child job ID/
                    );
                });
            });

            it('replaces any existing job data with the new input', function () {
                const childJobs = ['this', 'that', 'the other'];
                expect(
                    Object.keys(this.jobManagerInstance.model.getItem('exec.jobs.byId')).sort()
                ).toEqual(
                    JobsData.allJobs
                        .map((job) => {
                            return job.job_id;
                        })
                        .sort()
                );
                this.jobManagerInstance.initBatchJob({
                    parent_job_id: 'something',
                    child_job_ids: childJobs,
                });
                expect(
                    Object.keys(this.jobManagerInstance.model.getItem('exec.jobs.byId')).sort()
                ).toEqual(['that', 'the other', 'this']);
            });
        });
    });
});
