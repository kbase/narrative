define([
    'common/jobManager',
    'common/jobs',
    'common/props',
    'common/ui',
    'testUtil',
    '/test/data/jobsData',
], (JobManager, Jobs, Props, UI, TestUtil, JobsData) => {
    'use strict';

    afterAll(() => TestUtil.clearRuntime());

    function createJobManagerInstance(context) {
        return new JobManager({
            model: context.model,
            bus: context.bus,
            devMode: true,
        });
    }

    /**
     * test whether a handler is defined
     * @param {JobManager} jobManagerInstance
     * @param {string} event being handled
     * @param {boolean} definedStatus
     * @param {array} handlerArray - array of names of handlers
     */
    function expectHandlersDefined(jobManagerInstance, event, definedStatus, handlerArray) {
        handlerArray.forEach((name) => {
            if (definedStatus) {
                expect(jobManagerInstance.handlers[event][name]).toEqual(jasmine.any(Function));
            } else {
                expect(
                    jobManagerInstance.handlers[event] && jobManagerInstance.handlers[event][name]
                ).toBeFalsy();
            }
        });
    }

    const screamStr = 'AARRGGHH!!',
        shoutStr = 'Beware!',
        scream = () => {
            console.error(screamStr);
        },
        shout = () => {
            console.warn(shoutStr);
        };

    describe('the JobManager module', () => {
        it('Should be loaded with the right functions', () => {
            expect(JobManager).toEqual(jasmine.any(Function));
        });

        it('can be instantiated', () => {
            const jobManagerInstance = new JobManager({
                model: {},
                bus: {},
            });

            [
                'addHandler',
                'removeHandler',
                'runHandler',
                'updateModel',
                'addListener',
                'removeListener',
                'removeJobListeners',
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
                /cannot initialise job manager widget without params "bus" and "model"/
            );

            expect(() => {
                jobManagerInstance = new JobManager({
                    bus: null,
                });
            }).toThrowError(
                /cannot initialise job manager widget without params "bus" and "model"/
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
                listen: () => {
                    // nope
                },
                removeListener: () => {
                    // nope
                },
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
                            batchId: null,
                            jobsWithRetries: {},
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
                            batchId: null,
                            jobsWithRetries: {},
                        },
                    },
                };

                this.jobManagerInstance.addHandler('modelUpdate', {
                    test: (context, extraArgs) => {
                        expect(context.model.getRawObject()).toEqual(expectedObject);
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
                            batchId: null,
                            jobsWithRetries: {},
                        },
                    },
                };
                expect(this.model.getRawObject()).toEqual(this.originalObject);
                const updatedModel = this.jobManagerInstance.updateModel([jobState]);
                expect(updatedModel.getRawObject()).toEqual(expectedObject);
            });
        });

        describe('handlers', () => {
            beforeEach(function () {
                this.jobManagerInstance = createJobManagerInstance(this);
            });

            describe('addHandler', () => {
                it('can have handlers added', function () {
                    const event = 'modelUpdate';
                    expect(this.jobManagerInstance.handlers).toEqual({});
                    this.jobManagerInstance.addHandler(event, { scream: scream });
                    expectHandlersDefined(this.jobManagerInstance, event, true, ['scream']);
                });

                it('can have numerous handlers', function () {
                    const event = 'job-info';
                    expect(this.jobManagerInstance.handlers).toEqual({});
                    this.jobManagerInstance.addHandler(event, { scream, shout });
                    expectHandlersDefined(this.jobManagerInstance, event, true, [
                        'scream',
                        'shout',
                    ]);
                });

                it('cannot add handlers that are not functions', function () {
                    const event = 'job-status';
                    expect(this.jobManagerInstance.handlers).toEqual({});
                    expect(() => {
                        this.jobManagerInstance.addHandler(event, { shout: { key: 'value' } });
                    }).toThrowError(
                        /Handlers must be of type function. Recheck these handlers: shout/
                    );
                    expectHandlersDefined(this.jobManagerInstance, event, false, ['shout']);
                    expect(this.jobManagerInstance.handlers[event]).toEqual({});
                });

                it('cannot add handlers for events that do not exist', function () {
                    const event = 'the-queens-birthday';
                    expect(this.jobManagerInstance.handlers).toEqual({});
                    expect(() => {
                        this.jobManagerInstance.addHandler(event, { scream, shout });
                    }).toThrowError(/addHandler: invalid event the-queens-birthday supplied/);
                    expectHandlersDefined(this.jobManagerInstance, event, false, ['shout']);
                    expect(this.jobManagerInstance.handlers).toEqual({});
                });

                it('only adds valid handlers', function () {
                    const event = 'modelUpdate';
                    expect(this.jobManagerInstance.handlers).toEqual({});
                    expect(() => {
                        this.jobManagerInstance.addHandler(event, {
                            scream,
                            shout,
                            let_it_all: {},
                            out: null,
                        });
                    }).toThrowError(
                        /Handlers must be of type function. Recheck these handlers: let_it_all, out/
                    );
                    expectHandlersDefined(this.jobManagerInstance, event, true, [
                        'scream',
                        'shout',
                    ]);
                    expectHandlersDefined(this.jobManagerInstance, event, false, [
                        'let_it_all',
                        'out',
                    ]);
                });

                it('warns and does not add the handler if the handler name already exists', function () {
                    const event = 'job-logs';
                    expect(this.jobManagerInstance.handlers).toEqual({});
                    spyOn(console, 'warn').and.callThrough();
                    this.jobManagerInstance.addHandler(event, { scream, shout });
                    expectHandlersDefined(this.jobManagerInstance, event, true, [
                        'scream',
                        'shout',
                    ]);
                    this.jobManagerInstance.addHandler(event, { shout: scream });
                    expect(console.warn).toHaveBeenCalledTimes(1);
                    expect(console.warn.calls.allArgs()).toEqual([
                        ['A handler with the name shout already exists'],
                    ]);
                    expect(this.jobManagerInstance.handlers[event]).toEqual({ scream, shout });
                });

                const badArguments = [
                    null,
                    undefined,
                    '',
                    0,
                    1.2345,
                    [],
                    [1, 2, 3, 4],
                    () => {
                        /* no op */
                    },
                    {},
                ];
                badArguments.forEach((arg) => {
                    it(`does not accept args of type ${Object.prototype.toString.call(
                        arg
                    )}`, function () {
                        expect(() => {
                            this.jobManagerInstance.addHandler('modelUpdate', arg);
                        }).toThrowError(
                            /addHandler: invalid handlerObject supplied \(must be of type object\)/
                        );
                    });
                });
            });

            describe('removeHandler', () => {
                it('can have handlers removed', function () {
                    const event = 'job-logs';
                    this.jobManagerInstance.handlers[event] = {
                        scream: scream,
                    };
                    expect(this.jobManagerInstance.handlers[event].scream).toEqual(
                        jasmine.any(Function)
                    );
                    this.jobManagerInstance.removeHandler(event, 'scream');
                    expectHandlersDefined(this.jobManagerInstance, event, false, ['scream']);
                });

                it('does not die if the handler name does not exist', function () {
                    const event = 'job-logs';
                    expect(this.jobManagerInstance.handlers[event]).toBeUndefined();
                    this.jobManagerInstance.removeHandler(event, 'scream');
                    expectHandlersDefined(this.jobManagerInstance, event, false, ['scream']);
                });
            });

            describe('runHandler', () => {
                it('does not throw an error if there are no handlers', function () {
                    expect(this.jobManagerInstance.handlers).toEqual({});
                    expect(() => {
                        this.jobManagerInstance.runHandler();
                    }).not.toThrow();
                });

                it('executes the handlers', function () {
                    const event = 'modelUpdate';
                    this.jobManagerInstance.handlers.modelUpdate = {
                        handler_1: scream,
                        handler_2: shout,
                    };

                    spyOn(console, 'error');
                    spyOn(console, 'warn');
                    spyOn(this.jobManagerInstance.handlers[event], 'handler_1').and.callThrough();
                    spyOn(this.jobManagerInstance.handlers[event], 'handler_2').and.callThrough();

                    // the extra args here should be passed through as-is
                    this.jobManagerInstance.runHandler(event, [1, 2, 3], 'fee', 'fi', 'fo', 'fum');
                    [
                        console.error,
                        console.warn,
                        this.jobManagerInstance.handlers[event].handler_1,
                        this.jobManagerInstance.handlers[event].handler_2,
                    ].forEach((fn) => {
                        expect(fn).toHaveBeenCalled();
                    });
                    [
                        this.jobManagerInstance.handlers[event].handler_1,
                        this.jobManagerInstance.handlers[event].handler_2,
                    ].forEach((fn) => {
                        expect(fn.calls.allArgs()).toEqual([
                            [this.jobManagerInstance, [1, 2, 3], 'fee', 'fi', 'fo', 'fum'],
                        ]);
                    });

                    expect(console.error.calls.allArgs()).toEqual([[screamStr]]);
                    expect(console.warn.calls.allArgs()).toEqual([[shoutStr]]);
                });

                it('warns if a handler throws an error', function () {
                    const extraArg = [1, 2, 3];
                    const event = 'job-logs';
                    this.jobManagerInstance.handlers[event] = {
                        handler_a: scream,
                        handler_b: () => {
                            throw new Error('Dying');
                        },
                        handler_c: shout,
                    };
                    spyOn(console, 'error');
                    spyOn(console, 'warn');
                    this.jobManagerInstance.runHandler(event, extraArg);
                    expect(console.error).toHaveBeenCalled();
                    expect(console.error.calls.allArgs()).toEqual([[screamStr]]);
                    expect(console.warn.calls.allArgs()).toEqual([
                        ['Error executing handler handler_b:', new Error('Dying')],
                        [shoutStr],
                    ]);
                });
            });
        });

        describe('listeners', () => {
            describe('addListener', () => {
                beforeEach(function () {
                    this.jobManagerInstance = createJobManagerInstance(this);
                });

                it('can have listeners added', function () {
                    const type = 'job-info',
                        jobId = 'fakeJob';
                    expect(this.jobManagerInstance.listeners).toEqual({});
                    spyOn(this.bus, 'listen').and.returnValue(true);
                    this.jobManagerInstance.addListener(type, jobId);
                    expect(this.jobManagerInstance.listeners[jobId][type]).toEqual(true);
                    expect(this.bus.listen).toHaveBeenCalledTimes(1);
                    const allArgs = this.bus.listen.calls.allArgs();
                    expect(allArgs.length).toEqual(1);
                    expect(allArgs[0].length).toEqual(1);
                    expect(allArgs[0][0].key).toEqual({ type: type });
                    expect(allArgs[0][0].channel).toEqual({ jobId: jobId });
                    expect(allArgs[0][0].handle).toEqual(jasmine.any(Function));
                });

                it('will not add listeners of invalid types', function () {
                    expect(this.jobManagerInstance.listeners).toEqual({});
                    expect(() => {
                        this.jobManagerInstance.addListener('modelUpdate', [1, 2, 3]);
                    }).toThrowError(/addListener: invalid listener modelUpdate supplied/);
                    expect(this.jobManagerInstance.listeners).toEqual({});
                });

                it('will take a list of job IDs', function () {
                    const type = 'job-info',
                        jobIdList = ['fee', 'fi', 'fo', 'fum'];
                    expect(this.jobManagerInstance.listeners).toEqual({});
                    spyOn(this.bus, 'listen').and.returnValue(true);
                    this.jobManagerInstance.addListener(type, jobIdList);
                    jobIdList.forEach((jobId) => {
                        expect(this.jobManagerInstance.listeners[jobId][type]).toEqual(true);
                    });
                    expect(this.bus.listen).toHaveBeenCalledTimes(4);
                    const allArgs = this.bus.listen.calls.allArgs();
                    allArgs.forEach((arg, ix) => {
                        expect(arg.length).toEqual(1);
                        expect(arg[0].key).toEqual({ type: type });
                        expect(arg[0].channel).toEqual({ jobId: jobIdList[ix] });
                        expect(arg[0].handle).toEqual(jasmine.any(Function));
                    });
                });

                it('will also add handlers', function () {
                    // add a mix of valid and invalid handlers
                    const type = 'job-does-not-exist',
                        jobIdList = ['this', 'that', 'the_other'];
                    expect(() => {
                        this.jobManagerInstance.addListener(type, jobIdList, {
                            scream,
                            shout,
                            let_it_all: {},
                            out: null,
                        });
                    }).toThrowError(
                        /Handlers must be of type function. Recheck these handlers: let_it_all, out/
                    );
                    expectHandlersDefined(this.jobManagerInstance, type, true, ['scream', 'shout']);
                    expectHandlersDefined(this.jobManagerInstance, type, false, [
                        'let_it_all',
                        'out',
                    ]);
                });
            });

            describe('removeListener', () => {
                beforeEach(function () {
                    this.jobManagerInstance = createJobManagerInstance(this);
                });

                it('does not die if the job or listener does not exist', function () {
                    expect(() => {
                        this.jobManagerInstance.removeListener('fakeJob', 'job-info');
                    }).not.toThrow();
                });

                it('will remove a specified job ID / type listener combo', function () {
                    spyOn(this.bus, 'removeListener').and.returnValue(true);
                    this.jobManagerInstance.listeners.fakeJob = {
                        'job-info': 'job-info-fake-job',
                        'job-status': 'job-status-fake-job',
                        'job-logs': 'job-logs-fake-job',
                    };

                    this.jobManagerInstance.removeListener('fakeJob', 'job-info');
                    expect(this.jobManagerInstance.listeners.fakeJob).toEqual({
                        'job-status': 'job-status-fake-job',
                        'job-logs': 'job-logs-fake-job',
                    });
                    expect(this.bus.removeListener).toHaveBeenCalledTimes(1);
                    expect(this.bus.removeListener.calls.allArgs()).toEqual([
                        ['job-info-fake-job'],
                    ]);
                });
            });

            describe('removeJobListener', () => {
                beforeEach(function () {
                    this.jobManagerInstance = createJobManagerInstance(this);
                });
                it('will remove all listeners from a certain job ID', function () {
                    this.jobManagerInstance.listeners.fakeJob = {
                        'job-info': {},
                        'job-status': {},
                        'job-logs': {},
                    };

                    this.jobManagerInstance.removeJobListeners('fakeJob');
                    expect(this.jobManagerInstance.listeners).toEqual({});
                });

                it('survives a job without listeners', function () {
                    expect(this.jobManagerInstance.listeners).toEqual({});
                    expect(() => {
                        this.jobManagerInstance.removeJobListeners('fakeJob');
                    }).not.toThrow();
                    expect(this.jobManagerInstance.listeners).toEqual({});
                });
            });
        });

        describe('job action functions', () => {
            beforeEach(function () {
                this.jobManagerInstance = createJobManagerInstance(this);
            });

            const actionStatusMatrix = {
                cancel: {
                    valid: Jobs.validStatusesForAction.cancel,
                    invalid: [],
                    request: 'cancellation',
                },
                retry: {
                    valid: Jobs.validStatusesForAction.retry,
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
                            expect(callArgs[0]).toEqual([actionRequest, { jobIdList: [jobId] }]);
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
                { batch_job: 12345 },
                { batch_id: 12345, child_jobs: [] },
                { batch_id: 12345, child_job_ids: [] },
                { batch_id: 12345, child_job_ids: {} },
            ];

            invalidInput.forEach((input) => {
                it(`will not accept invalid input ${JSON.stringify(input)}`, function () {
                    expect(() => {
                        this.jobManagerInstance.initBatchJob(input);
                    }).toThrowError(/Batch job must have a batch ID and at least one child job ID/);
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
                    batch_id: 'something',
                    child_job_ids: childJobs,
                });
                expect(
                    Object.keys(this.jobManagerInstance.model.getItem('exec.jobs.byId')).sort()
                ).toEqual(['that', 'the other', 'this']);
                expect(this.jobManagerInstance.model.getItem('exec.jobState').job_id).toEqual(
                    'something'
                );
            });
        });

        describe('restoreFromSaved', () => {
            beforeEach(function () {
                this.jobManagerInstance = createJobManagerInstance(this);
            });

            it('is defined', function () {
                expect(this.jobManagerInstance.restoreFromSaved).toEqual(jasmine.any(Function));
            });
        });

        describe('getFsmStateFromJobs', () => {
            beforeEach(function () {
                this.jobManagerInstance = createJobManagerInstance(this);
            });
            it('uses the Jobs function', function () {
                spyOn(Jobs, 'getFsmStateFromJobs').and.callThrough();
                spyOn(this.jobManagerInstance.model, 'getItem').and.returnValue([]);

                const result = this.jobManagerInstance.getFsmStateFromJobs();
                expect(result).toBeNull();
                expect(this.jobManagerInstance.model.getItem).toHaveBeenCalled();
                expect(Jobs.getFsmStateFromJobs).toHaveBeenCalled();
                expect(Jobs.getFsmStateFromJobs.calls.allArgs()).toEqual([[[]]]);
            });
        });
    });
});
