define([
    'common/jobManager',
    'common/jobs',
    'common/jobCommMessages',
    'common/looper',
    'common/props',
    'common/runtime',
    'common/ui',
    'testUtil',
    '/test/data/jobsData',
], (JobManagerModule, Jobs, jcm, Looper, Props, Runtime, UI, TestUtil, JobsData) => {
    'use strict';

    const { JobManagerCore, DefaultHandlerMixin, JobActionsMixin, BatchMixin, JobManager } =
        JobManagerModule;

    function createJobManagerInstance(context, jmClass = JobManager) {
        return new jmClass({
            model: context.model,
            bus: context.bus,
            devMode: true,
        });
    }

    const cellId = 'MY_FAVE_CELL_ID',
        BATCH_ID = JobsData.batchParentJob.job_id;
    const ACTIVE_JOB_IDS = [];
    JobsData.allJobsWithBatchParent.forEach((job) => {
        if (job.meta.terminal === false) {
            ACTIVE_JOB_IDS.push(job.job_id);
        }
    });

    const ALL_LISTENERS = ['ERROR', 'INFO', 'LOGS', 'RETRY', 'STATUS'].map((l) => {
        return jcm.MESSAGE_TYPE[l];
    });

    const actionStatusMatrix = {
        cancel: {
            valid: Jobs.validStatusesForAction.cancel,
            invalid: [],
            request: 'cancel',
            jobRequest: jcm.MESSAGE_TYPE.CANCEL,
        },
        retry: {
            valid: Jobs.validStatusesForAction.retry,
            invalid: [],
            request: 'retry',
            jobRequest: jcm.MESSAGE_TYPE.RETRY,
        },
    };

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

    // set up a model with jobs populated with
    // - JobsData.allJobs, altered so each job is a retry, named <original-name>-retry
    //   the retry parent is <original_name>
    // - JobsData.allJobs, altered so that each is a retry parent and has status 'terminated'
    // - JobsData.allJobs, duplicated and named <original-name>-v2
    function createModelWithBatchJobWithRetries() {
        const model = Props.make({
            data: {},
        });
        const batchParent = JobsData.batchParentJob;
        // duplicate the allJobs array and give each job a retry parent
        const allDupeJobs = TestUtil.JSONcopy(JobsData.allJobs).map((job) => {
            job.retry_parent = job.job_id;
            job.job_id = job.job_id + '-retry';
            job.batch_id = batchParent.job_id;
            job.created += 5;
            return job;
        });
        // retry parent jobs -- all in state 'terminated'
        const retryParentJobs = TestUtil.JSONcopy(JobsData.allJobs).map((job) => {
            job.status = 'terminated';
            return job;
        });
        // a second set of jobs that have not been retried
        const allOriginalJobIds = TestUtil.JSONcopy(JobsData.allJobs).map((job) => {
            job.job_id += '-v2';
            return job;
        });

        const allJobs = [batchParent]
            .concat(allDupeJobs)
            .concat(retryParentJobs)
            .concat(allOriginalJobIds);

        Jobs.populateModelFromJobArray(model, allJobs);
        return { model, allJobs };
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
        const jobManagerClass = JobManagerCore;
        afterEach(() => {
            TestUtil.clearRuntime();
        });

        it('Should be loaded with the right functions', () => {
            expect(jobManagerClass).toEqual(jasmine.any(Function));
        });

        it('can be instantiated', () => {
            const jobManagerInstance = new jobManagerClass({
                model: {},
                bus: {},
            });

            [
                'addEventHandler',
                'removeEventHandler',
                'runHandler',
                'updateModel',
                'addListener',
                'removeListener',
                'removeChannelListeners',
            ].forEach((fn) => {
                expect(jobManagerInstance[fn]).toEqual(jasmine.any(Function));
            });
        });

        it('requires certain params for initialisation', () => {
            let jobManagerInstance;
            expect(() => {
                jobManagerInstance = new jobManagerClass({
                    model: null,
                });
            }).toThrowError(/cannot initialise Job Manager without params "bus" and "model"/);

            expect(() => {
                jobManagerInstance = new jobManagerClass({
                    bus: null,
                });
            }).toThrowError(/cannot initialise Job Manager without params "bus" and "model"/);

            expect(jobManagerInstance).not.toBeDefined();
        });

        describe('cell ID', () => {
            it('can store a cell ID', () => {
                const jobManagerInstance = new jobManagerClass({
                    model: {},
                    bus: {},
                    cell: {
                        metadata: {
                            kbase: {
                                attributes: {
                                    id: cellId,
                                },
                            },
                        },
                    },
                });

                expect(jobManagerInstance.cellId).toEqual(cellId);
            });

            it('can be instantiated without a cell ID', () => {
                const jobManagerInstance = new jobManagerClass({
                    model: {},
                    bus: {},
                    cell: null,
                });
                expect(jobManagerInstance.cellId).toEqual(null);
            });

            it('throws an error if cell data is supplied but it is invalid', () => {
                expect(() => {
                    new jobManagerClass({
                        bus: {},
                        model: {},
                        cell: {},
                    });
                }).toThrowError(/cannot initialise Job Manager with invalid cell metadata/);

                expect(() => {
                    new jobManagerClass({
                        bus: {},
                        model: {},
                        cell: { this: 'that' },
                    });
                }).toThrowError(/cannot initialise Job Manager with invalid cell metadata/);
            });
        });
    });

    const recheckHandlersErr =
            'addEventHandler: handlers must be of type function. Recheck these handlers: ',
        noHandlersErr = 'addEventHandler: no handlers supplied',
        invalidHandlersErr =
            'addEventHandler: invalid handlers supplied (must be of type array or object)';

    describe('the JobManager instance', () => {
        beforeEach(function () {
            this.model = Props.make({
                data: {},
            });
            Jobs.populateModelFromJobArray(this.model, JobsData.allJobsWithBatchParent);

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

        afterEach(() => {
            TestUtil.clearRuntime();
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
                this.jobManagerInstance = createJobManagerInstance(this, JobManagerCore);
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
                        },
                    },
                };

                this.jobManagerInstance.addEventHandler('modelUpdate', {
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
                this.jobManagerInstance = createJobManagerInstance(this, JobManagerCore);
            });

            describe('addEventHandler', () => {
                it('can have handlers added', function () {
                    const event = 'modelUpdate';
                    expect(this.jobManagerInstance.handlers).toEqual({});
                    this.jobManagerInstance.addEventHandler(event, { scream: scream });
                    expectHandlersDefined(this.jobManagerInstance, event, true, ['scream']);
                });

                it('can have numerous handlers', function () {
                    const event = jcm.MESSAGE_TYPE.INFO;
                    expect(this.jobManagerInstance.handlers).toEqual({});
                    this.jobManagerInstance.addEventHandler(event, { scream, shout });
                    expectHandlersDefined(this.jobManagerInstance, event, true, [
                        'scream',
                        'shout',
                    ]);
                });

                it('cannot add handlers that are not functions', function () {
                    const event = jcm.MESSAGE_TYPE.STATUS;
                    expect(this.jobManagerInstance.handlers).toEqual({});
                    expect(() => {
                        this.jobManagerInstance.addEventHandler(event, { shout: { key: 'value' } });
                    }).toThrowError(recheckHandlersErr + 'shout');
                    expectHandlersDefined(this.jobManagerInstance, event, false, ['shout']);
                    expect(this.jobManagerInstance.handlers[event]).toEqual({});
                });

                it('cannot add handlers for events that do not exist', function () {
                    const event = 'the-queens-birthday';
                    expect(this.jobManagerInstance.handlers).toEqual({});
                    expect(() => {
                        this.jobManagerInstance.addEventHandler(event, { scream, shout });
                    }).toThrowError(/addEventHandler: invalid event the-queens-birthday supplied/);
                    expectHandlersDefined(this.jobManagerInstance, event, false, ['shout']);
                    expect(this.jobManagerInstance.handlers).toEqual({});
                });

                it('only adds valid handlers', function () {
                    const event = 'modelUpdate';
                    expect(this.jobManagerInstance.handlers).toEqual({});
                    expect(() => {
                        this.jobManagerInstance.addEventHandler(event, {
                            scream,
                            shout,
                            let_it_all: {},
                            out: undefined,
                        });
                    }).toThrowError(recheckHandlersErr + 'let_it_all, out');
                    expectHandlersDefined(this.jobManagerInstance, event, true, [
                        'scream',
                        'shout',
                    ]);
                    expectHandlersDefined(this.jobManagerInstance, event, false, [
                        'let_it_all',
                        'out',
                    ]);
                });

                it('adds an existing handler if null is supplied as the function', function () {
                    const event = jcm.MESSAGE_TYPE.LOGS,
                        secondEvent = jcm.MESSAGE_TYPE.STATUS;
                    expect(this.jobManagerInstance.handlers).toEqual({});
                    spyOn(console, 'warn');
                    this.jobManagerInstance.addEventHandler(event, { scream, shout });
                    expectHandlersDefined(this.jobManagerInstance, event, true, [
                        'scream',
                        'shout',
                    ]);
                    this.jobManagerInstance.addEventHandler(secondEvent, { shout: null });
                    expect(console.warn).toHaveBeenCalledTimes(0);
                    expect(this.jobManagerInstance.handlers[event]).toEqual({ scream, shout });
                    expect(this.jobManagerInstance.handlers[secondEvent]).toEqual({ shout });
                });

                it('accepts an array of defined handler names', function () {
                    const event = 'modelUpdate',
                        secondEvent = jcm.MESSAGE_TYPE.ERROR,
                        thirdEvent = jcm.MESSAGE_TYPE.LOGS;
                    expect(this.jobManagerInstance.handlers).toEqual({});
                    this.jobManagerInstance.addEventHandler(event, {
                        scream,
                        shout,
                    });
                    this.jobManagerInstance.addEventHandler(secondEvent, ['scream']);
                    this.jobManagerInstance.addEventHandler(thirdEvent, { shout: null });
                    expectHandlersDefined(this.jobManagerInstance, event, true, [
                        'scream',
                        'shout',
                    ]);
                    expectHandlersDefined(this.jobManagerInstance, secondEvent, true, ['scream']);
                    expectHandlersDefined(this.jobManagerInstance, thirdEvent, true, ['shout']);
                });

                it('throws an error if no handlers are supplied', function () {
                    const event = jcm.MESSAGE_TYPE.LOGS,
                        secondEvent = jcm.MESSAGE_TYPE.STATUS,
                        context = this;
                    expect(() => {
                        context.jobManagerInstance.addEventHandler(event, {});
                    }).toThrowError(noHandlersErr);

                    expect(() => {
                        context.jobManagerInstance.addEventHandler(secondEvent, []);
                    }).toThrowError(noHandlersErr);
                    expect(this.jobManagerInstance.handlers).toEqual({});
                });

                it('throws an error if a saved function does not exist', function () {
                    const event = 'modelUpdate',
                        secondEvent = jcm.MESSAGE_TYPE.ERROR,
                        thirdEvent = jcm.MESSAGE_TYPE.LOGS,
                        context = this;
                    expect(this.jobManagerInstance.handlers).toEqual({});
                    spyOn(console, 'error');
                    this.jobManagerInstance.addEventHandler(event, {
                        scream,
                        shout,
                    });

                    expect(() => {
                        context.jobManagerInstance.addEventHandler(secondEvent, ['let_it_all']);
                    }).toThrowError(recheckHandlersErr + 'let_it_all');

                    expect(() => {
                        context.jobManagerInstance.addEventHandler(thirdEvent, { out: null });
                    }).toThrowError(recheckHandlersErr + 'out');

                    expectHandlersDefined(this.jobManagerInstance, event, true, [
                        'scream',
                        'shout',
                    ]);
                    expectHandlersDefined(this.jobManagerInstance, secondEvent, true, []);
                    expectHandlersDefined(this.jobManagerInstance, thirdEvent, true, []);
                    expect(console.error.calls.allArgs()).toEqual([
                        ['No handler function supplied for let_it_all'],
                        ['No handler function supplied for out'],
                    ]);
                });

                it('warns if the handler already exists', function () {
                    const event = jcm.MESSAGE_TYPE.LOGS,
                        secondEvent = jcm.MESSAGE_TYPE.STATUS;
                    expect(this.jobManagerInstance.handlers).toEqual({});
                    spyOn(console, 'warn');
                    spyOn(console, 'error');
                    this.jobManagerInstance.addEventHandler(event, { scream, shout });
                    expectHandlersDefined(this.jobManagerInstance, event, true, [
                        'scream',
                        'shout',
                    ]);
                    this.jobManagerInstance.addEventHandler(secondEvent, { shout: scream });
                    expect(console.warn).toHaveBeenCalledTimes(1);
                    expect(console.warn.calls.allArgs()).toEqual([
                        ['Replaced existing shout handler'],
                    ]);
                    expect(this.jobManagerInstance.handlers[event]).toEqual({ scream, shout });
                    expect(this.jobManagerInstance.handlers[secondEvent]).toEqual({
                        shout: scream,
                    });
                    // trigger the second event handler; 'scream' should run, not 'shout'
                    this.jobManagerInstance.runHandler(secondEvent);
                    expect(console.warn.calls.allArgs()).toEqual([
                        ['Replaced existing shout handler'],
                    ]);
                    expect(console.error.calls.allArgs()).toEqual([[screamStr]]);
                });

                const badArguments = [
                    // array contents:
                    // [0] the argument;
                    // [1] error emitted if the argument is supplied directly to addEventHandler;
                    // [2] boolean representing whether or not {name: arg} would be valid if supplied
                    //     to addEventHandler
                    [null, invalidHandlersErr, false],
                    [undefined, invalidHandlersErr, false],
                    ['', invalidHandlersErr, false],
                    [0, invalidHandlersErr, false],
                    [1.2345, invalidHandlersErr, false],
                    [[1, 2, 3, 4], recheckHandlersErr + '1, 2, 3, 4', false],
                    [
                        () => {
                            /* no op */
                        },
                        invalidHandlersErr,
                        true,
                    ],
                    [[], noHandlersErr, false],
                    [{}, noHandlersErr, false],
                ];
                badArguments.forEach((badArg) => {
                    const [arg, errOne, isValid] = badArg;
                    it(`does not accept args of type ${Object.prototype.toString.call(
                        arg
                    )}`, function () {
                        expect(() => {
                            this.jobManagerInstance.addEventHandler('modelUpdate', arg);
                        }).toThrowError(errOne);
                    });
                    it(`${
                        isValid ? 'accepts' : 'does not accept'
                    } handler functions of type ${Object.prototype.toString.call(
                        arg
                    )}`, function () {
                        if (isValid) {
                            this.jobManagerInstance.addEventHandler('modelUpdate', { name: arg });
                            expect(this.jobManagerInstance.handlers['modelUpdate']).toEqual({
                                name: arg,
                            });
                        } else {
                            expect(() => {
                                this.jobManagerInstance.addEventHandler('modelUpdate', {
                                    name: arg,
                                });
                            }).toThrowError(recheckHandlersErr + 'name');
                        }
                    });
                });
            });

            describe('removeEventHandler', () => {
                it('can have handlers removed', function () {
                    const event = jcm.MESSAGE_TYPE.LOGS;
                    this.jobManagerInstance.handlers[event] = {
                        scream,
                    };
                    expect(this.jobManagerInstance.handlers[event].scream).toEqual(
                        jasmine.any(Function)
                    );
                    this.jobManagerInstance.removeEventHandler(event, 'scream');
                    expectHandlersDefined(this.jobManagerInstance, event, false, ['scream']);
                });

                it('does not die if the handler name does not exist', function () {
                    const event = jcm.MESSAGE_TYPE.LOGS;
                    expect(this.jobManagerInstance.handlers[event]).toBeUndefined();
                    this.jobManagerInstance.removeEventHandler(event, 'scream');
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
                    const event = jcm.MESSAGE_TYPE.LOGS;
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
                    this.jobManagerInstance = createJobManagerInstance(this, JobManagerCore);
                });

                it('can have listeners added', function () {
                    const type = jcm.MESSAGE_TYPE.INFO,
                        jobId = 'fakeJob';
                    expect(this.jobManagerInstance.listeners).toEqual({});
                    spyOn(this.bus, 'listen').and.returnValue(true);
                    this.jobManagerInstance.addListener(type, jcm.CHANNEL.JOB, jobId);
                    const channelString = this.jobManagerInstance._encodeChannel(
                        jcm.CHANNEL.JOB,
                        jobId
                    );
                    expect(this.jobManagerInstance.listeners[channelString][type]).toEqual(true);
                    expect(this.bus.listen).toHaveBeenCalledTimes(1);
                    const allArgs = this.bus.listen.calls.allArgs();
                    expect(allArgs.length).toEqual(1);
                    expect(allArgs[0].length).toEqual(1);
                    expect(allArgs[0][0].key).toEqual({ type: type });
                    expect(allArgs[0][0].channel).toEqual({ [jcm.CHANNEL.JOB]: jobId });
                    expect(allArgs[0][0].handle).toEqual(jasmine.any(Function));
                });

                it('will not add listeners of invalid types', function () {
                    expect(this.jobManagerInstance.listeners).toEqual({});
                    expect(() => {
                        this.jobManagerInstance.addListener(
                            'modelUpdate',
                            jcm.CHANNEL.JOB,
                            [1, 2, 3]
                        );
                    }).toThrowError(/addListener: invalid listener modelUpdate supplied/);
                    expect(this.jobManagerInstance.listeners).toEqual({});
                });

                it('will not listen to invalid channels', function () {
                    expect(this.jobManagerInstance.listeners).toEqual({});
                    expect(() => {
                        this.jobManagerInstance.addListener(
                            jcm.MESSAGE_TYPE.INFO,
                            'channel',
                            [1, 2, 3]
                        );
                    }).toThrowError(/addListener: invalid channel type channel supplied/);
                    expect(() => {
                        this.jobManagerInstance.addListener(jcm.MESSAGE_TYPE.INFO, null, [1, 2, 3]);
                    }).toThrowError(/addListener: invalid channel type null supplied/);
                    expect(this.jobManagerInstance.listeners).toEqual({});
                });

                it('will not add undefined or null listeners', function () {
                    expect(this.jobManagerInstance.listeners).toEqual({});
                    this.jobManagerInstance.addListener(jcm.MESSAGE_TYPE.STATUS, jcm.CHANNEL.JOB, [
                        null,
                        '',
                        undefined,
                    ]);
                    expect(this.jobManagerInstance.listeners).toEqual({});
                });

                it('will take a list of job IDs', function () {
                    const msgType = jcm.MESSAGE_TYPE.INFO,
                        channelType = jcm.CHANNEL.JOB,
                        jobIdList = ['fee', 'fi', 'fo', 'fum'];
                    expect(this.jobManagerInstance.listeners).toEqual({});
                    spyOn(this.bus, 'listen').and.returnValue(true);
                    this.jobManagerInstance.addListener(msgType, channelType, jobIdList);
                    jobIdList.forEach((jobId) => {
                        const channelString = this.jobManagerInstance._encodeChannel(
                            channelType,
                            jobId
                        );
                        expect(this.jobManagerInstance.listeners[channelString][msgType]).toEqual(
                            true
                        );
                    });
                    expect(this.bus.listen).toHaveBeenCalledTimes(4);
                    const allArgs = this.bus.listen.calls.allArgs();
                    allArgs.forEach((arg, ix) => {
                        expect(arg.length).toEqual(1);
                        expect(arg[0].key).toEqual({ type: msgType });
                        expect(arg[0].channel).toEqual({ [jcm.CHANNEL.JOB]: jobIdList[ix] });
                        expect(arg[0].handle).toEqual(jasmine.any(Function));
                    });
                });

                it('will also add handlers', function () {
                    // add a mix of valid and invalid handlers
                    const type = jcm.MESSAGE_TYPE.INFO,
                        jobIdList = ['this', 'that', 'the_other'];
                    expect(() => {
                        this.jobManagerInstance.addListener(type, jcm.CHANNEL.JOB, jobIdList, {
                            scream,
                            shout,
                            let_it_all: {},
                            out: null,
                        });
                    }).toThrowError(recheckHandlersErr + 'let_it_all, out');
                    expectHandlersDefined(this.jobManagerInstance, type, true, ['scream', 'shout']);
                    expectHandlersDefined(this.jobManagerInstance, type, false, [
                        'let_it_all',
                        'out',
                    ]);
                });
            });

            describe('removeListener', () => {
                beforeEach(function () {
                    this.jobManagerInstance = createJobManagerInstance(this, JobManagerCore);
                });

                it('does not die if the job or listener does not exist', function () {
                    expect(() => {
                        this.jobManagerInstance.removeListener(
                            jcm.CHANNEL.JOB,
                            'fakeJob',
                            jcm.MESSAGE_TYPE.INFO
                        );
                    }).not.toThrow();
                });

                it('will remove a specified job ID / type listener combo', function () {
                    spyOn(this.bus, 'removeListener').and.returnValue(true);
                    const channelType = jcm.CHANNEL.JOB,
                        channelId = 'fakeJob',
                        listeners = {
                            [jcm.MESSAGE_TYPE.INFO]: 'job-info-fake-job',
                            [jcm.MESSAGE_TYPE.STATUS]: 'job-status-fake-job',
                            [jcm.MESSAGE_TYPE.LOGS]: 'job-logs-fake-job',
                        },
                        channelString = this.jobManagerInstance._encodeChannel(
                            channelType,
                            channelId
                        );
                    this.jobManagerInstance.listeners[channelString] = listeners;

                    this.jobManagerInstance.removeListener(
                        channelType,
                        channelId,
                        jcm.MESSAGE_TYPE.INFO
                    );
                    const expected = {
                        [jcm.MESSAGE_TYPE.STATUS]: 'job-status-fake-job',
                        [jcm.MESSAGE_TYPE.LOGS]: 'job-logs-fake-job',
                    };

                    expect(this.jobManagerInstance.listeners[channelString]).toEqual(expected);
                    expect(this.bus.removeListener).toHaveBeenCalledTimes(1);
                    expect(this.bus.removeListener.calls.allArgs()).toEqual([
                        ['job-info-fake-job'],
                    ]);
                });
            });

            describe('removeChannelListener', () => {
                beforeEach(function () {
                    this.jobManagerInstance = createJobManagerInstance(this, JobManagerCore);
                });
                it('will remove all listeners from a certain job ID', function () {
                    const channelType = jcm.CHANNEL.JOB,
                        channelId = 'fakeJob',
                        fakeJobListeners = {
                            [jcm.MESSAGE_TYPE.INFO]: 'job-info-fake-job',
                            [jcm.MESSAGE_TYPE.STATUS]: 'job-status-fake-job',
                            [jcm.MESSAGE_TYPE.LOGS]: 'job-logs-fake-job',
                        },
                        removalArgs = Object.keys(fakeJobListeners).map((listener) => {
                            return [channelType, channelId, listener];
                        });
                    const channelString = this.jobManagerInstance._encodeChannel(
                        channelType,
                        channelId
                    );
                    this.jobManagerInstance.listeners[channelString] = fakeJobListeners;
                    spyOn(this.jobManagerInstance, 'removeListener').and.callThrough();
                    this.jobManagerInstance.removeChannelListeners(channelType, channelId);
                    expect(this.jobManagerInstance.listeners).toEqual({});
                    expect(this.jobManagerInstance.removeListener.calls.allArgs()).toEqual(
                        jasmine.arrayWithExactContents(removalArgs)
                    );
                });

                it('survives a job without listeners', function () {
                    expect(this.jobManagerInstance.listeners).toEqual({});
                    expect(() => {
                        this.jobManagerInstance.removeChannelListeners(jcm.CHANNEL.JOB, 'fakeJob');
                    }).not.toThrow();
                    expect(this.jobManagerInstance.listeners).toEqual({});
                });
            });
        });

        /* defaultHandlerMixin */
        function setUpHandlerTest(context, event, channelType, channelIdList) {
            context.jobManagerInstance.addEventHandler(event, { handler_1: scream });
            expect(Object.keys(context.jobManagerInstance.handlers[event]).sort()).toEqual([
                `__default_${event}`,
                'handler_1',
            ]);
            context.jobManagerInstance.addListener(event, channelType, channelIdList);
        }

        function getMessages(msgType) {
            const error = 'some error string';
            // all the data
            let dataSource = {},
                // the batch ID for the data source
                batchId;
            if (msgType === jcm.MESSAGE_TYPE.INFO) {
                // filter out the non-batch jobs
                Object.values(JobsData.example.INFO.valid).forEach((jobInfo) => {
                    if ('batch_id' in jobInfo && jobInfo.batch_id) {
                        dataSource[jobInfo.job_id] = jobInfo;
                    }
                });
                batchId = Object.values(dataSource)[0].batch_id;
            } else if (msgType === jcm.MESSAGE_TYPE.RETRY) {
                dataSource = JobsData.batchJob.retryMessages;
                batchId = JobsData.batchJob.batchId;
            }

            // use a job in the batch, not the batch parent
            const jobIdList = Object.keys(dataSource),
                jobId = jobIdList[0] === batchId ? jobIdList[1] : jobIdList[0];

            return {
                'by job ID': {
                    jobIdList: [jobId],
                    message: { [jobId]: dataSource[jobId] },
                    channelType: jcm.CHANNEL.JOB,
                    channelId: jobId,
                    error: { [jobId]: { [jcm.PARAM.JOB_ID]: jobId, error } },
                },
                'by batch ID': {
                    jobIdList: [jobId],
                    message: { [jobId]: dataSource[jobId] },
                    channelType: jcm.CHANNEL.BATCH,
                    channelId: batchId,
                    error: { [jobId]: { [jcm.PARAM.JOB_ID]: jobId, error } },
                },
                'all batch': {
                    jobIdList: Object.keys(dataSource),
                    message: dataSource,
                    channelType: jcm.CHANNEL.BATCH,
                    channelId: batchId,
                    error: jobIdList.reduce((acc, curr) => {
                        acc[curr] = { [jcm.PARAM.JOB_ID]: curr, error };
                        return acc;
                    }, {}),
                },
            };
        }

        function checkForHandlers(jobManagerInstance) {
            const currentHandlers = jobManagerInstance.handlers;
            expect(Object.keys(currentHandlers)).toEqual(
                jasmine.arrayWithExactContents([
                    jcm.MESSAGE_TYPE.INFO,
                    jcm.MESSAGE_TYPE.RETRY,
                    jcm.MESSAGE_TYPE.STATUS,
                ])
            );
            Object.keys(currentHandlers).forEach((handlerName) => {
                const expected = {};
                expected[`__default_${handlerName}`] = jasmine.any(Function);
                expect(currentHandlers[handlerName]).toEqual(expected);
            });
        }

        describe('default handlers', () => {
            beforeEach(function () {
                this.bus = Runtime.make().bus();
                this.jobManagerInstance = createJobManagerInstance(
                    this,
                    DefaultHandlerMixin(JobManagerCore)
                );
            });

            describe('constructor', () => {
                it('has handlers assigned by the constructor', function () {
                    checkForHandlers(this.jobManagerInstance);
                });
            });
            describe('addDefaultHandlers', () => {
                it('can add a set of default handlers to the jobManager', function () {
                    this.jobManagerInstance.handlers = {};
                    expect(this.jobManagerInstance.handlers).toEqual({});
                    this.jobManagerInstance.addDefaultHandlers();
                    checkForHandlers(this.jobManagerInstance);
                });
            });

            describe('handleJobInfo', () => {
                const event = jcm.MESSAGE_TYPE.INFO,
                    inputs = getMessages(event);

                Object.keys(inputs).forEach((inputName) => {
                    const { channelType, channelId, message, jobIdList, error } = inputs[inputName],
                        channelData = { channelType, channelId };

                    it(`handles successful job info requests, ${inputName}`, function () {
                        setUpHandlerTest(this, event, channelType, [channelId]);
                        jobIdList.forEach((jobId) => {
                            expect(
                                this.jobManagerInstance.model.getItem(`exec.jobs.info.${jobId}`)
                            ).not.toBeDefined();
                        });

                        return new Promise((resolve) => {
                            // add a handler that acts after the default handler so we know
                            // the default action has already been done
                            this.jobManagerInstance.addListener(event, channelType, channelId, {
                                zzz_resolve_promise: (...args) => {
                                    // eslint-disable-next-line no-unused-vars
                                    const [_, msg, channel] = args;
                                    expect(msg).toEqual(message);
                                    expect(channel).toEqual(channelData);
                                    resolve();
                                },
                            });
                            TestUtil.sendBusMessage({
                                bus: this.bus,
                                message,
                                channelType,
                                channelId,
                                type: event,
                            });
                        }).then(() => {
                            jobIdList.forEach((jobId) => {
                                expect(
                                    this.jobManagerInstance.model.getItem(`exec.jobs.info.${jobId}`)
                                ).toEqual(message[jobId]);
                                if (channelType === jcm.CHANNEL.JOB) {
                                    const channelString = this.jobManagerInstance._encodeChannel(
                                        jcm.CHANNEL.JOB,
                                        jobId
                                    );
                                    expect(
                                        this.jobManagerInstance.listeners[channelString][event]
                                    ).not.toBeDefined();
                                }
                            });
                            if (channelType === jcm.CHANNEL.BATCH) {
                                const channelString = this.jobManagerInstance._encodeChannel(
                                    jcm.CHANNEL.BATCH,
                                    channelId
                                );
                                expect(
                                    this.jobManagerInstance.listeners[channelString][event]
                                ).toBeDefined();
                            }
                        });
                    });

                    it(`handles errors in job info requests, ${inputName}`, function () {
                        setUpHandlerTest(this, event, channelType, [channelId]);
                        jobIdList.forEach((jobId) => {
                            expect(
                                this.jobManagerInstance.model.getItem(`exec.jobs.params.${jobId}`)
                            ).not.toBeDefined();
                        });
                        return new Promise((resolve) => {
                            this.jobManagerInstance.addListener(event, channelType, channelId, {
                                zzz_resolve_promise: () => {
                                    resolve();
                                },
                            });
                            TestUtil.sendBusMessage({
                                bus: this.bus,
                                message: error,
                                channelType,
                                channelId,
                                type: event,
                            });
                        }).then(() => {
                            jobIdList.forEach((jobId) => {
                                expect(
                                    this.jobManagerInstance.model.getItem(
                                        `exec.jobs.params.${jobId}`
                                    )
                                ).not.toBeDefined();
                                if (channelType === jcm.CHANNEL.JOB) {
                                    const channelString = this.jobManagerInstance._encodeChannel(
                                        jcm.CHANNEL.JOB,
                                        jobId
                                    );
                                    expect(
                                        this.jobManagerInstance.listeners[channelString][event]
                                    ).toBeDefined();
                                }
                            });
                        });
                    });
                });
            });

            describe('handleJobRetry', () => {
                const event = jcm.MESSAGE_TYPE.RETRY,
                    inputs = getMessages(event);

                Object.keys(inputs).forEach((inputName) => {
                    const { channelType, channelId, message, error } = inputs[inputName],
                        channelData = { channelType, channelId };

                    it(`handles successful job retries, ${inputName}`, function () {
                        setUpHandlerTest(this, event, channelType, [channelId]);
                        Jobs.populateModelFromJobArray(
                            this.jobManagerInstance.model,
                            Object.values(JobsData.batchJob.originalJobsNoRetryData)
                        );
                        const preRetryJobIdList = Object.keys(
                            JobsData.batchJob.originalJobsNoRetryData
                        );
                        expect(
                            Object.keys(this.jobManagerInstance.model.getItem('exec.jobs.byId'))
                        ).toEqual(jasmine.arrayWithExactContents(preRetryJobIdList));

                        spyOn(this.bus, 'emit');
                        spyOn(this.jobManagerInstance, 'updateModel').and.callThrough();
                        return new Promise((resolve) => {
                            this.jobManagerInstance.addListener(event, channelType, channelId, {
                                zzz_resolve_promise: (...args) => {
                                    // ensure the args are as expected
                                    // eslint-disable-next-line no-unused-vars
                                    const [_, msg, channel] = args;
                                    expect(msg).toEqual(message);
                                    expect(channel).toEqual(channelData);
                                    resolve();
                                },
                            });
                            // ensure the retry listener is in place
                            const channelString = this.jobManagerInstance._encodeChannel(
                                channelType,
                                channelId
                            );
                            expect(
                                this.jobManagerInstance.listeners[channelString][event]
                            ).toBeDefined();
                            TestUtil.sendBusMessage({
                                bus: this.bus,
                                message,
                                channelType,
                                channelId,
                                type: event,
                            });
                        }).then(() => {
                            expect(this.bus.emit).toHaveBeenCalled();
                            const storedJobs =
                                this.jobManagerInstance.model.getItem('exec.jobs.byId');
                            const updateRequests = [],
                                updatedJobs = [];
                            Object.values(message).forEach((retryBlob) => {
                                expect(storedJobs[retryBlob.job_id]).toEqual(
                                    retryBlob.job.jobState
                                );
                                expect(storedJobs[retryBlob.retry_id]).toEqual(
                                    retryBlob.retry.jobState
                                );
                                ['job', 'retry'].forEach((jobType) => {
                                    updatedJobs.push(retryBlob[jobType].jobState);
                                });
                                if (channelType === jcm.CHANNEL.JOB) {
                                    const channelString = this.jobManagerInstance._encodeChannel(
                                        jcm.CHANNEL.JOB,
                                        retryBlob.retry_id
                                    );
                                    expect(
                                        this.jobManagerInstance.listeners[channelString][
                                            jcm.MESSAGE_TYPE.STATUS
                                        ]
                                    ).toBeDefined();
                                }
                                // expect a status request for the retried job
                                updateRequests.push(retryBlob.retry_id);
                            });
                            expect(this.jobManagerInstance.bus.emit.calls.allArgs()).toEqual([
                                [
                                    jcm.MESSAGE_TYPE.STATUS,
                                    {
                                        [jcm.PARAM.JOB_ID_LIST]:
                                            jasmine.arrayWithExactContents(updateRequests),
                                    },
                                ],
                            ]);
                            expect(this.jobManagerInstance.updateModel).toHaveBeenCalledTimes(1);
                            expect(this.jobManagerInstance.updateModel.calls.allArgs()).toEqual([
                                [jasmine.arrayWithExactContents(updatedJobs)],
                            ]);
                        });
                    });

                    it(`handles unsuccessful retries, ${inputName}`, function () {
                        setUpHandlerTest(this, event, channelType, [channelId]);
                        Jobs.populateModelFromJobArray(
                            this.jobManagerInstance.model,
                            Object.values(JobsData.batchJob.originalJobsNoRetryData)
                        );
                        const preRetryJobIdList = Object.keys(
                            JobsData.batchJob.originalJobsNoRetryData
                        );
                        expect(
                            Object.keys(this.jobManagerInstance.model.getItem('exec.jobs.byId'))
                        ).toEqual(jasmine.arrayWithExactContents(preRetryJobIdList));

                        spyOn(this.bus, 'emit');
                        spyOn(this.jobManagerInstance, 'updateModel').and.callThrough();
                        return new Promise((resolve) => {
                            this.jobManagerInstance.addListener(event, channelType, channelId, {
                                zzz_resolve_promise: () => {
                                    resolve();
                                },
                            });
                            // ensure the retry listener is in place
                            const channelString = this.jobManagerInstance._encodeChannel(
                                channelType,
                                channelId
                            );
                            expect(
                                this.jobManagerInstance.listeners[channelString][event]
                            ).toBeDefined();
                            TestUtil.sendBusMessage({
                                bus: this.bus,
                                message: error,
                                channelType,
                                channelId,
                                type: event,
                            });
                        }).then(() => {
                            expect(this.bus.emit).not.toHaveBeenCalled();
                            expect(this.jobManagerInstance.updateModel).not.toHaveBeenCalled();
                        });
                    });
                });
            });

            describe('handleJobStatus', () => {
                const event = jcm.MESSAGE_TYPE.STATUS;

                // TODO: add error updates!!
                describe('single job, multiple updates', () => {
                    const jobState = TestUtil.JSONcopy(JobsData.allJobsWithBatchParent)[0],
                        jobId = jobState.job_id;

                    const inputs = {
                        'by job ID': {
                            channelType: jcm.CHANNEL.JOB,
                            channelId: jobId,
                        },
                        'by batch ID': {
                            channelType: jcm.CHANNEL.BATCH,
                            channelId: JobsData.batchJob.batchId,
                        },
                    };

                    Object.keys(inputs).forEach((inputName) => {
                        it(`can update the model if a job has been updated, ${inputName}`, function () {
                            const { channelType, channelId } = inputs[inputName],
                                messageAddress = {
                                    type: event,
                                    channelType,
                                    channelId,
                                },
                                channelData = { channelType, channelId };

                            this.jobId = jobId;
                            setUpHandlerTest(this, event, channelType, [channelId]);
                            Jobs.populateModelFromJobArray(
                                this.jobManagerInstance.model,
                                JobsData.allJobsWithBatchParent
                            );
                            // create an update for the job
                            const updateOne = Object.assign({}, jobState, {
                                    updated: jobState.updated + 10,
                                }),
                                updateTwo = Object.assign({}, jobState, {
                                    retry_ids: [1, 2, 3],
                                }),
                                messageOne = { [jobId]: { [jcm.PARAM.JOB_ID]: jobId, jobState } },
                                messageTwo = {
                                    [jobId]: { [jcm.PARAM.JOB_ID]: jobId, jobState: updateOne },
                                },
                                messageThree = {
                                    [jobId]: { [jcm.PARAM.JOB_ID]: jobId, jobState: updateTwo },
                                };

                            spyOn(console, 'error');
                            spyOn(this.jobManagerInstance, 'updateModel').and.callThrough();
                            // the first message will not trigger `updateModel` as it is identical to the existing jobState
                            return new Promise((resolve) => {
                                this.jobManagerInstance.addListener(
                                    jcm.MESSAGE_TYPE.STATUS,
                                    channelType,
                                    channelId,
                                    {
                                        zzz_resolve_promise: (...args) => {
                                            // eslint-disable-next-line no-unused-vars
                                            const [_, msg, channel] = args;
                                            expect(msg).toEqual(messageOne);
                                            expect(channel).toEqual(channelData);
                                            resolve();
                                        },
                                    }
                                );
                                TestUtil.sendBusMessage({
                                    bus: this.bus,
                                    message: messageOne,
                                    ...messageAddress,
                                });
                            }).then(() => {
                                expect(
                                    this.jobManagerInstance.model.getItem(`exec.jobState`)
                                ).toEqual(jobState);
                                expect(console.error).toHaveBeenCalledTimes(1);
                                expect(this.jobManagerInstance.updateModel).toHaveBeenCalledTimes(
                                    0
                                );

                                return new Promise((resolve) => {
                                    // Read it and weep
                                    this.jobManagerInstance.removeHandlerFunction(
                                        'zzz_resolve_promise'
                                    );
                                    this.jobManagerInstance.addEventHandler(
                                        jcm.MESSAGE_TYPE.STATUS,
                                        {
                                            zzz_resolve_promise: () => {
                                                resolve();
                                            },
                                        }
                                    );
                                    // the second message will trigger `updateModel`
                                    TestUtil.sendBusMessage({
                                        bus: this.bus,
                                        message: messageTwo,
                                        ...messageAddress,
                                    });
                                }).then(() => {
                                    expect(
                                        this.jobManagerInstance.model.getItem(`exec.jobState`)
                                    ).toEqual(updateOne);
                                    expect(console.error).toHaveBeenCalledTimes(2);
                                    expect(
                                        this.jobManagerInstance.updateModel
                                    ).toHaveBeenCalledTimes(1);
                                    let updateModelCallArgs =
                                        this.jobManagerInstance.updateModel.calls.allArgs();
                                    // updateModel takes [jobState] as an argument
                                    expect(updateModelCallArgs).toEqual([[[updateOne]]]);

                                    return new Promise((resolve) => {
                                        this.jobManagerInstance.removeHandlerFunction(
                                            'zzz_resolve_promise'
                                        );
                                        this.jobManagerInstance.addEventHandler(
                                            jcm.MESSAGE_TYPE.STATUS,
                                            {
                                                zzz_resolve_promise: () => {
                                                    resolve();
                                                },
                                            }
                                        );
                                        // third message will also trigger an update
                                        TestUtil.sendBusMessage({
                                            bus: this.bus,
                                            message: messageThree,
                                            ...messageAddress,
                                        });
                                    }).then(() => {
                                        expect(
                                            this.jobManagerInstance.model.getItem(`exec.jobState`)
                                        ).toEqual(updateTwo);
                                        expect(console.error).toHaveBeenCalledTimes(3);
                                        expect(
                                            this.jobManagerInstance.updateModel
                                        ).toHaveBeenCalledTimes(2);
                                        updateModelCallArgs =
                                            this.jobManagerInstance.updateModel.calls.allArgs();
                                        expect(updateModelCallArgs).toEqual([
                                            [[updateOne]],
                                            [[updateTwo]],
                                        ]);
                                    });
                                });
                            });
                        });
                    });
                });

                describe('multiple job updates', () => {
                    const updatedJobStates = {};

                    const terminal = [],
                        listening = [];

                    JobsData.allJobsWithBatchParent.forEach((job) => {
                        // these jobs should have status listeners after the update
                        if (!job.meta.terminal || job.meta.canRetry) {
                            listening.push(job.job_id);
                        } else {
                            // these jobs are terminal and cannot be retried
                            terminal.push(job.job_id);
                        }
                        // set up the expected job statuses post-update
                        updatedJobStates[job.job_id] = {
                            ...TestUtil.JSONcopy(job),
                            updated: job.updated + 10,
                        };
                    });
                    const channelIdList = [];
                    const batchMessage = {};

                    const messageList = Object.values(updatedJobStates).map((job) => {
                        channelIdList.push(job.job_id);
                        batchMessage[job.job_id] = {
                            [jcm.PARAM.JOB_ID]: job.job_id,
                            jobState: job,
                        };
                        return {
                            [job.job_id]: {
                                [jcm.PARAM.JOB_ID]: job.job_id,
                                jobState: job,
                            },
                        };
                    });
                    const inputs = {
                        'by job ID': {
                            channelType: jcm.CHANNEL.JOB,
                            channelIdList,
                            messageList,
                        },
                        'by batch ID': {
                            channelType: jcm.CHANNEL.BATCH,
                            channelIdList: [JobsData.batchJob.batchId],
                            messageList: [batchMessage],
                        },
                    };

                    Object.keys(inputs).forEach((inputName) => {
                        const { channelType, channelIdList, messageList } = inputs[inputName];
                        it(`updates multiple jobs, ${inputName}`, function () {
                            setUpHandlerTest(this, event, channelType, channelIdList);
                            Jobs.populateModelFromJobArray(
                                this.jobManagerInstance.model,
                                JobsData.allJobsWithBatchParent
                            );
                            spyOn(console, 'error');
                            spyOn(this.bus, 'emit');
                            spyOn(this.jobManagerInstance, 'updateModel').and.callThrough();

                            return new Promise((resolve) => {
                                if (channelType === jcm.CHANNEL.JOB) {
                                    // resolve the promise when the last update comes through
                                    this.jobManagerInstance.addListener(
                                        jcm.MESSAGE_TYPE.STATUS,
                                        channelType,
                                        channelIdList[channelIdList.length - 1],
                                        {
                                            zzz_job_action: () => {
                                                resolve();
                                            },
                                        }
                                    );
                                } else {
                                    // otherwise, there will only be one update
                                    this.jobManagerInstance.addListener(
                                        jcm.MESSAGE_TYPE.STATUS,
                                        channelType,
                                        channelIdList[0],
                                        {
                                            zzz_job_action: () => {
                                                resolve();
                                            },
                                        }
                                    );
                                }
                                messageList.forEach((message) => {
                                    const channelId =
                                        channelType === jcm.CHANNEL.BATCH
                                            ? channelIdList[0]
                                            : Object.keys(message)[0];
                                    TestUtil.sendBusMessage({
                                        bus: this.bus,
                                        message,
                                        channelType,
                                        channelId,
                                        type: event,
                                    });
                                });
                            }).then(() => {
                                // check all jobs
                                expect(
                                    this.jobManagerInstance.model.getItem(`exec.jobs.byId`)
                                ).toEqual(updatedJobStates);

                                const nUpdates = messageList.length;
                                expect(this.jobManagerInstance.updateModel).toHaveBeenCalledTimes(
                                    nUpdates
                                );
                                expect(console.error).toHaveBeenCalledTimes(nUpdates);
                                expect(this.bus.emit).not.toHaveBeenCalled();

                                if (channelType === jcm.CHANNEL.JOB) {
                                    // for non-terminal jobs or those that can be retried
                                    // the listener should still be in place
                                    const hasStatusListeners = Object.keys(
                                        this.jobManagerInstance.listeners
                                    )
                                        .filter((channelString) => {
                                            return (
                                                this.jobManagerInstance.listeners[channelString] &&
                                                this.jobManagerInstance.listeners[channelString][
                                                    event
                                                ]
                                            );
                                        })
                                        .map((channelString) => {
                                            const { channelId } =
                                                this.jobManagerInstance._decodeChannel(
                                                    channelString
                                                );
                                            return channelId;
                                        });
                                    expect(hasStatusListeners).toEqual(
                                        jasmine.arrayWithExactContents(listening)
                                    );
                                }
                            });
                        });
                    });
                });

                describe('missing child jobs', () => {
                    // this will be the updated job
                    const batchParent = TestUtil.JSONcopy(JobsData.batchParentJob),
                        batchParentUpdate = TestUtil.JSONcopy(JobsData.batchParentJob),
                        jobId = batchParent.job_id;
                    const inputs = {
                        'by job ID': {
                            channelType: jcm.CHANNEL.JOB,
                        },
                        'by batch ID': {
                            channelType: jcm.CHANNEL.BATCH,
                        },
                    };
                    Object.keys(inputs).forEach((inputName) => {
                        it(`adds missing child IDs, ${inputName}`, function () {
                            const channelType = inputs[inputName].channelType,
                                channelId = jobId,
                                messageAddress = {
                                    type: event,
                                    channelType,
                                    channelId,
                                };

                            // remove the child jobs from the original batch parent
                            batchParent.child_jobs = [];
                            // change the update time for the updated batch parent
                            batchParentUpdate.updated += 10;
                            setUpHandlerTest(this, event, channelType, [channelId]);
                            Jobs.populateModelFromJobArray(this.jobManagerInstance.model, [
                                batchParent,
                            ]);
                            this.jobManagerInstance.addListener(event, channelType, [channelId]);

                            expect(this.jobManagerInstance.model.getItem('exec.jobState')).toEqual(
                                batchParent
                            );
                            const channelString = this.jobManagerInstance._encodeChannel(
                                channelType,
                                channelId
                            );
                            expect(
                                this.jobManagerInstance.listeners[channelString][event]
                            ).toBeDefined();

                            spyOn(console, 'error');
                            spyOn(this.bus, 'emit');
                            spyOn(this.jobManagerInstance, 'updateModel').and.callThrough();

                            // trigger the update
                            return new Promise((resolve) => {
                                const message = {
                                    [jobId]: {
                                        jobState: batchParentUpdate,
                                        [jcm.PARAM.JOB_ID]: jobId,
                                    },
                                };
                                this.jobManagerInstance.addListener(event, channelType, channelId, {
                                    zzz_job_action: () => {
                                        resolve();
                                    },
                                });
                                TestUtil.sendBusMessage({
                                    bus: this.bus,
                                    message,
                                    ...messageAddress,
                                });
                            }).then(() => {
                                expect(
                                    this.jobManagerInstance.model.getItem(`exec.jobState`)
                                ).toEqual(batchParentUpdate);
                                expect(
                                    this.jobManagerInstance.listeners[channelString][event]
                                ).toBeDefined();
                                expect(this.jobManagerInstance.updateModel).toHaveBeenCalledTimes(
                                    1
                                );
                                expect(console.error).toHaveBeenCalledTimes(1);

                                if (channelType === jcm.CHANNEL.BATCH) {
                                    expect(Object.keys(this.jobManagerInstance.listeners)).toEqual([
                                        channelString,
                                    ]);
                                } else {
                                    // all child jobs should have job status and job info listeners
                                    batchParentUpdate.child_jobs.forEach((_jobId) => {
                                        const channelStr = this.jobManagerInstance._encodeChannel(
                                            jcm.CHANNEL.JOB,
                                            _jobId
                                        );
                                        ['STATUS', 'ERROR', 'INFO'].forEach((msgType) => {
                                            expect(
                                                this.jobManagerInstance.listeners[channelStr][
                                                    jcm.MESSAGE_TYPE[msgType]
                                                ]
                                            ).toBeDefined();
                                        });
                                    });
                                }
                                const callArgs = this.bus.emit.calls.allArgs();
                                expect(this.bus.emit).toHaveBeenCalledTimes(1);
                                expect(callArgs).toEqual([
                                    [
                                        jcm.MESSAGE_TYPE.STATUS,
                                        {
                                            [jcm.PARAM.JOB_ID_LIST]: jasmine.arrayWithExactContents(
                                                batchParentUpdate.child_jobs
                                            ),
                                        },
                                    ],
                                ]);
                            });
                        });
                    });
                });
            });
        });

        /* jobActionsMixin */
        describe('job action functions', () => {
            beforeEach(function () {
                this.jobManagerInstance = createJobManagerInstance(
                    this,
                    JobActionsMixin(JobManagerCore)
                );
            });

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
                    beforeEach(function () {
                        const { model } = createModelWithBatchJobWithRetries();
                        this.jobManagerInstance = new JobManager({
                            model,
                            bus: this.bus,
                            devMode: true,
                        });
                    });

                    actionStatusMatrix[action].valid.forEach((status) => {
                        const jobId = JobsData.jobsByStatus[status][0].job_id;
                        it(`can ${action} a job in status ${status}`, function () {
                            spyOn(this.bus, 'emit');
                            const result = this.jobManagerInstance[`${action}Job`](`${jobId}-v2`);
                            expect(result).toBeTrue();
                            expect(this.bus.emit).toHaveBeenCalled();
                            // check the args to bus.emit were correct
                            const callArgs = this.bus.emit.calls.allArgs();
                            const actionRequest = actionStatusMatrix[action].jobRequest;
                            expect(callArgs[0]).toEqual([
                                actionRequest,
                                { [jcm.PARAM.JOB_ID_LIST]: [`${jobId}-v2`] },
                            ]);
                        });
                        it(`can ${action} a retried job in status ${status}`, function () {
                            spyOn(this.bus, 'emit');
                            const result = this.jobManagerInstance[`${action}Job`](
                                `${jobId}-retry`
                            );
                            expect(result).toBeTrue();
                            expect(this.bus.emit).toHaveBeenCalled();
                            // check the args to bus.emit were correct
                            const callArgs = this.bus.emit.calls.allArgs();
                            const actionRequest = actionStatusMatrix[action].jobRequest;
                            // if this is a retry, use the retry parent ID
                            const actionJobId = action === 'retry' ? jobId : `${jobId}-retry`;
                            expect(callArgs[0]).toEqual([
                                actionRequest,
                                { [jcm.PARAM.JOB_ID_LIST]: [actionJobId] },
                            ]);
                        });
                    });
                    actionStatusMatrix[action].invalid.forEach((status) => {
                        const jobId = JobsData.jobsByStatus[status][0].job_id;
                        it(`cannot ${action} a job in status ${status}`, function () {
                            spyOn(this.bus, 'emit');
                            const result = this.jobManagerInstance[`${action}Job`](`${jobId}-v2`);
                            expect(result).toBeFalse();
                            expect(this.bus.emit).not.toHaveBeenCalled();
                        });
                        it(`cannot ${action} a retried job in status ${status}`, function () {
                            spyOn(this.bus, 'emit');
                            const result = this.jobManagerInstance[`${action}Job`](
                                `${jobId}-retry`
                            );
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
                                data: {},
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
                            const requestType = actionStatusMatrix[action].jobRequest;
                            // all the jobs of status `status` should be included
                            const expectedJobIds = Object.values(JobsData.jobsByStatus[status]).map(
                                (jobState) => jobState.job_id
                            );
                            expect(callArgs.length).toEqual(1);
                            expect(callArgs[0][0]).toEqual(requestType);
                            expect(callArgs[0][1][jcm.PARAM.JOB_ID_LIST]).toEqual(
                                jasmine.arrayWithExactContents(expectedJobIds)
                            );
                        });

                        it(`can ${action} a batch of jobs, including retries, in status ${status}`, async function () {
                            const { model, allJobs } = createModelWithBatchJobWithRetries();
                            this.jobManagerInstance = new JobManager({
                                model,
                                bus: this.bus,
                                devMode: true,
                            });
                            expect(
                                Object.keys(this.jobManagerInstance.model.getItem('exec.jobs.byId'))
                            ).toEqual(
                                jasmine.arrayWithExactContents(
                                    allJobs.map((job) => {
                                        return job.job_id;
                                    })
                                )
                            );

                            spyOn(this.bus, 'emit');
                            spyOn(UI, 'showConfirmDialog').and.resolveTo(true);
                            await this.jobManagerInstance[`${action}JobsByStatus`]([status]);
                            expect(UI.showConfirmDialog).toHaveBeenCalled();
                            expect(this.bus.emit).toHaveBeenCalled();

                            const callArgs = this.bus.emit.calls.allArgs();
                            const requestType = actionStatusMatrix[action].jobRequest;
                            // all the jobs of status `status` should be included
                            const expectedJobIds = Object.values(JobsData.jobsByStatus[status])
                                .map((jobState) => {
                                    if (action === 'retry') {
                                        return [jobState.job_id, jobState.job_id + '-v2'];
                                    }
                                    return [jobState.job_id + '-retry', jobState.job_id + '-v2'];
                                })
                                .flat();
                            expect(callArgs.length).toEqual(1);
                            expect(callArgs[0][0]).toEqual(requestType);
                            expect(callArgs[0][1][jcm.PARAM.JOB_ID_LIST]).toEqual(
                                jasmine.arrayWithExactContents(expectedJobIds)
                            );
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
                    action: 'retry',
                    statusList: ['created', 'estimating', 'queued'],
                    title: 'Retry queued jobs',
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
                    body: 'Please note that jobs are rerun using the same parameters. Any jobs that failed due to issues with the input, such as misconfigured parameters or corrupted input data, are likely to throw the same errors when run again.',
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
                    const requestType = actionStatusMatrix[test.action].jobRequest;

                    expect(callArgs.length).toEqual(1);
                    expect(callArgs[0][0]).toEqual(requestType);

                    // this is an ugly way to do this,
                    // but we don't want to just mimic the code we're testing
                    let acc = 0;
                    test.statusList.forEach((status) => {
                        Object.values(JobsData.jobsByStatus[status])
                            .map((jobState) => jobState.job_id)
                            .forEach((jobId) => {
                                expect(
                                    callArgs[0][1][jcm.PARAM.JOB_ID_LIST].includes(jobId)
                                ).toBeTrue();
                                acc++;
                            });
                    });
                    expect(callArgs[0][1][jcm.PARAM.JOB_ID_LIST].length).toEqual(acc);
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

        /**
         * @param {object} ctx  this context
         */
        function check_initJobs(ctx) {
            const channelString = ctx.jobManagerInstance._encodeChannel(
                jcm.CHANNEL.BATCH,
                BATCH_ID
            );

            expect(Object.keys(ctx.jobManagerInstance.listeners)).toEqual(
                jasmine.arrayWithExactContents([channelString])
            );
            expect(Object.keys(ctx.jobManagerInstance.listeners[channelString])).toEqual(
                jasmine.arrayWithExactContents(ALL_LISTENERS)
            );
            expect(ctx.jobManagerInstance.handlers[jcm.MESSAGE_TYPE.STATUS].batchStatus).toEqual(
                jasmine.any(Function)
            );

            const busCallArgs = [
                [jcm.MESSAGE_TYPE.STATUS, { [jcm.PARAM.BATCH_ID]: BATCH_ID }],
                [jcm.MESSAGE_TYPE.INFO, { [jcm.PARAM.BATCH_ID]: BATCH_ID }],
            ];

            expect(ctx.jobManagerInstance.bus.emit.calls.allArgs()).toEqual(
                jasmine.arrayWithExactContents(busCallArgs)
            );
        }

        describe('batch job initialisation', () => {
            beforeEach(function () {
                this.bus = Runtime.make().bus();
                this.jobManagerInstance = createJobManagerInstance(
                    this,
                    BatchMixin(JobManagerCore)
                );
            });

            it('cannot _initJobs without a batch ID', function () {
                expect(() => {
                    this.jobManagerInstance._initJobs({ batch_id: BATCH_ID });
                }).toThrowError('Cannot init jobs without a batch ID');
            });

            it('can _initJobs', async function () {
                this.container = document.createElement('div');
                expect(this.jobManagerInstance.model.getItem('exec.jobState')).toEqual(
                    JobsData.batchParentJob
                );

                // minimise the delay between receiving a status message and requesting a new one
                this.jobManagerInstance.looper = new Looper({ pollInterval: 50 });
                let acc = 0;

                spyOn(this.jobManagerInstance.bus, 'emit').and.callFake((...args) => {
                    // if the job manager requests a status message, oblige it
                    if (args[0] === jcm.MESSAGE_TYPE.STATUS) {
                        TestUtil.sendBusMessage({
                            bus: this.jobManagerInstance.bus,
                            message: {
                                BATCH_PARENT: {
                                    jobState: JobsData.batchParentJob,
                                    [jcm.PARAM.JOB_ID]: BATCH_ID,
                                    msg_no: acc,
                                },
                            },
                            channelType: jcm.CHANNEL.BATCH,
                            channelId: BATCH_ID,
                            type: jcm.MESSAGE_TYPE.STATUS,
                        });
                        acc++;
                    }
                });

                spyOn(this.jobManagerInstance.bus, 'send').and.callThrough();
                spyOn(this.jobManagerInstance, 'requestBatchStatus').and.callThrough();

                // add an extra status handler so we can keep track of when status
                // messages are received by the JM
                this.jobManagerInstance.addEventHandler(jcm.MESSAGE_TYPE.STATUS, {
                    zzz_resolve_promise: () => {
                        // expect recurring job status requests to be set up
                        expect(this.jobManagerInstance.looper.requestLoop).not.toBeNull();

                        // for every update, add a span element to the indicator div
                        // this is clumsy, but Jasmine didn't seem to want to hang around
                        // waiting for a mere promise to be resolved
                        const sp = document.createElement('span');
                        sp.classList.add('jobUpdate');
                        sp.textContent = 'job update';
                        this.container.append(sp);
                    },
                });

                this.jobManagerInstance._initJobs({
                    batchId: BATCH_ID,
                });

                await TestUtil.waitForElementState(this.container, () => {
                    // wait until the JM has processed four status updates
                    return this.container.querySelectorAll('.jobUpdate').length === 4;
                });

                const channelString = this.jobManagerInstance._encodeChannel(
                    jcm.CHANNEL.BATCH,
                    BATCH_ID
                );
                expect(Object.keys(this.jobManagerInstance.listeners)).toEqual(
                    jasmine.arrayWithExactContents([channelString])
                );
                expect(Object.keys(this.jobManagerInstance.listeners[channelString])).toEqual(
                    jasmine.arrayWithExactContents(ALL_LISTENERS)
                );
                expect(
                    this.jobManagerInstance.handlers[jcm.MESSAGE_TYPE.STATUS].batchStatus
                ).toEqual(jasmine.any(Function));

                // should have the initial status and info requests, and then three
                // requests triggered by the batch request status function
                const busCallArgs = [
                    [jcm.MESSAGE_TYPE.STATUS, { [jcm.PARAM.BATCH_ID]: BATCH_ID }],
                    [jcm.MESSAGE_TYPE.INFO, { [jcm.PARAM.BATCH_ID]: BATCH_ID }],
                    [jcm.MESSAGE_TYPE.STATUS, { [jcm.PARAM.BATCH_ID]: BATCH_ID }],
                    [jcm.MESSAGE_TYPE.STATUS, { [jcm.PARAM.BATCH_ID]: BATCH_ID }],
                    [jcm.MESSAGE_TYPE.STATUS, { [jcm.PARAM.BATCH_ID]: BATCH_ID }],
                ];

                const allArgs = this.jobManagerInstance.bus.emit.calls.allArgs().filter((call) => {
                    return call[0] !== 'clock-tick';
                });
                expect(allArgs).toEqual(jasmine.arrayWithExactContents(busCallArgs));

                // requestBatchStatus should have been called three times -- triggered
                // by receiving the first status message, and then it is called again every
                // time that a further message is received.
                expect(this.jobManagerInstance.requestBatchStatus).toHaveBeenCalledTimes(3);
            });
        });

        describe('initBatchJob', () => {
            beforeEach(function () {
                this.bus = Runtime.make().bus();
                this.jobManagerInstance = createJobManagerInstance(
                    this,
                    BatchMixin(JobManagerCore)
                );
            });

            const childIds = ['this', 'that', 'the other'],
                batchId = BATCH_ID;

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

            it('adds job data when given the appropriate input', function () {
                this.model = Props.make({
                    data: {},
                });
                this.jobManagerInstance.model = this.model;
                ['exec.jobs.byId', 'exec.jobState'].forEach((modelItem) => {
                    expect(this.jobManagerInstance.model.getItem(modelItem)).toEqual(undefined);
                });
                expect(this.jobManagerInstance.listeners).toEqual({});
                spyOn(this.jobManagerInstance.bus, 'emit');
                this.jobManagerInstance.initBatchJob({
                    batch_id: batchId,
                    child_job_ids: childIds,
                });
                expect(
                    Object.keys(this.jobManagerInstance.model.getItem('exec.jobs.byId'))
                ).toEqual(jasmine.arrayWithExactContents([batchId, ...childIds]));
                expect(this.jobManagerInstance.model.getItem('exec.jobState').job_id).toEqual(
                    batchId
                );
                // check that the appropriate messages have been sent out
                check_initJobs(this);
            });

            it('replaces any existing job data with the new input', function () {
                expect(
                    Object.keys(this.jobManagerInstance.model.getItem('exec.jobs.byId'))
                ).toEqual(
                    jasmine.arrayWithExactContents(
                        JobsData.allJobsWithBatchParent.map((job) => {
                            return job.job_id;
                        })
                    )
                );
                expect(this.jobManagerInstance.model.getItem('exec.jobState')).toEqual(
                    JobsData.batchParentJob
                );

                spyOn(this.jobManagerInstance.bus, 'emit');

                this.jobManagerInstance.initBatchJob({
                    batch_id: batchId,
                    child_job_ids: childIds,
                });
                expect(
                    Object.keys(this.jobManagerInstance.model.getItem('exec.jobs.byId'))
                ).toEqual(jasmine.arrayWithExactContents([batchId, ...childIds]));
                expect(this.jobManagerInstance.model.getItem('exec.jobState').job_id).toEqual(
                    batchId
                );

                check_initJobs(this);
            });
        });

        describe('restoreFromSaved', () => {
            beforeEach(function () {
                this.bus = Runtime.make().bus();
                this.model = Props.make({
                    data: {},
                });
            });

            it('does nothing if there are no jobs saved', function () {
                this.jobManagerInstance = createJobManagerInstance(
                    this,
                    BatchMixin(JobManagerCore)
                );
                spyOn(this.jobManagerInstance.bus, 'emit');
                expect(this.jobManagerInstance.listeners).toEqual({});
                expect(this.jobManagerInstance.model.getItem('exec')).toEqual(undefined);

                this.jobManagerInstance.restoreFromSaved();
                expect(this.jobManagerInstance.listeners).toEqual({});
                expect(this.jobManagerInstance.bus.emit.calls.allArgs()).toEqual([]);
                expect(this.jobManagerInstance.model.getItem('exec')).toEqual(undefined);
            });

            it('sets up the appropriate listeners if there is data saved', function () {
                Jobs.populateModelFromJobArray(this.model, JobsData.allJobsWithBatchParent);
                this.jobManagerInstance = createJobManagerInstance(
                    this,
                    BatchMixin(JobManagerCore)
                );
                expect(this.jobManagerInstance.listeners).toEqual({});
                spyOn(this.jobManagerInstance.bus, 'emit');
                this.jobManagerInstance.restoreFromSaved();

                check_initJobs(this);
            });

            it('sets up the appropriate listeners even if child jobs are missing', function () {
                Jobs.populateModelFromJobArray(this.model, [JobsData.batchParentJob]);
                this.jobManagerInstance = createJobManagerInstance(
                    this,
                    BatchMixin(JobManagerCore)
                );
                expect(this.jobManagerInstance.listeners).toEqual({});
                spyOn(this.jobManagerInstance.bus, 'emit');
                this.jobManagerInstance.restoreFromSaved();

                check_initJobs(this);
            });
        });

        describe('getFsmStateFromJobs', () => {
            beforeEach(function () {
                this.jobManagerInstance = createJobManagerInstance(
                    this,
                    BatchMixin(JobManagerCore)
                );
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

        describe('requestBatchUpdate', () => {
            beforeEach(function () {
                this.jobManagerInstance = createJobManagerInstance(
                    this,
                    BatchMixin(JobManagerCore)
                );
            });

            it('requests the status of active jobs', function () {
                spyOn(this.jobManagerInstance.bus, 'emit');
                this.jobManagerInstance.requestBatchStatus();
                expect(this.bus.emit.calls.allArgs()).toEqual([
                    [
                        jcm.MESSAGE_TYPE.STATUS,
                        { [jcm.PARAM.JOB_ID_LIST]: jasmine.arrayWithExactContents(ACTIVE_JOB_IDS) },
                    ],
                ]);
            });

            it('does not make a request if there are no active jobs', function () {
                const terminalJobs = JobsData.allJobs.filter((job) => {
                    return !ACTIVE_JOB_IDS.includes(job.job_id);
                });
                terminalJobs.push(JobsData.batchParentJob);
                Jobs.populateModelFromJobArray(this.jobManagerInstance.model, terminalJobs);
                spyOn(this.jobManagerInstance.bus, 'emit');
                this.jobManagerInstance.requestBatchStatus();
                expect(this.bus.emit.calls.allArgs()).toEqual([]);
            });

            it('does not make a request if the batch job is terminal', function () {
                // update the batch job to terminated
                this.jobManagerInstance.model.setItem('exec.jobState', {
                    ...this.jobManagerInstance.model.getItem('exec.jobState'),
                    status: 'terminated',
                });
                spyOn(this.jobManagerInstance.bus, 'emit');
                this.jobManagerInstance.requestBatchStatus();
                expect(this.bus.emit.calls.allArgs()).toEqual([]);
            });
        });

        describe('requestBatchInfo', () => {
            beforeEach(function () {
                this.jobManagerInstance = createJobManagerInstance(
                    this,
                    BatchMixin(JobManagerCore)
                );
            });

            it('requests info for the batch if none is present', function () {
                spyOn(this.jobManagerInstance.bus, 'emit');
                this.jobManagerInstance.requestBatchInfo();

                this.jobManagerInstance.model.setItem('exec.jobs.info', {});
                this.jobManagerInstance.requestBatchInfo();

                expect(this.bus.emit.calls.allArgs()).toEqual([
                    [jcm.MESSAGE_TYPE.INFO, { [jcm.PARAM.BATCH_ID]: BATCH_ID }],
                    [jcm.MESSAGE_TYPE.INFO, { [jcm.PARAM.BATCH_ID]: BATCH_ID }],
                ]);
            });

            it('requests info for jobs that lack it', function () {
                const jobData = this.jobManagerInstance.model.getItem('exec.jobs'),
                    jobIdList = Object.keys(jobData.byId),
                    missingJobIds = [];
                let bool = true;

                // populate some job info but not others
                jobData.info = jobIdList.reduce((acc, curr) => {
                    bool = !bool;
                    if (bool) {
                        acc[curr] = { job_params: [{}] };
                    } else {
                        missingJobIds.push(curr);
                    }
                    return acc;
                }, {});
                this.jobManagerInstance.model.setItem('exec.jobs', jobData);

                spyOn(this.jobManagerInstance.bus, 'emit');
                this.jobManagerInstance.requestBatchInfo();
                expect(this.bus.emit.calls.allArgs()).toEqual([
                    [
                        jcm.MESSAGE_TYPE.INFO,
                        { [jcm.PARAM.JOB_ID_LIST]: jasmine.arrayWithExactContents(missingJobIds) },
                    ],
                ]);
            });
        });

        describe('cancelBatchJob', () => {
            beforeEach(function () {
                this.jobManagerInstance = createJobManagerInstance(
                    this,
                    BatchMixin(JobManagerCore)
                );
            });
            it('cancels the current batch parent job', function () {
                spyOn(this.bus, 'emit');
                const allBatchJobIds = JobsData.allJobsWithBatchParent.map((jobState) => {
                    return jobState.job_id;
                });
                expect(
                    Object.keys(this.jobManagerInstance.model.getItem('exec.jobs.byId'))
                ).toEqual(jasmine.arrayWithExactContents(allBatchJobIds));
                expect(this.jobManagerInstance.listeners).toBeDefined();
                this.jobManagerInstance.cancelBatchJob();
                // check the args to bus.emit were correct
                expect(this.bus.emit).toHaveBeenCalled();
                const callArgs = this.bus.emit.calls.allArgs();
                const actionRequest = actionStatusMatrix.cancel.jobRequest;
                expect(callArgs).toEqual(
                    jasmine.arrayWithExactContents([
                        [actionRequest, { [jcm.PARAM.JOB_ID_LIST]: [BATCH_ID] }],
                    ])
                );
                // the job model should be unchanged
                expect(
                    Object.keys(this.jobManagerInstance.model.getItem('exec.jobs.byId'))
                ).toEqual(jasmine.arrayWithExactContents(allBatchJobIds));
                expect(this.jobManagerInstance.listeners).toEqual({});
            });
        });

        describe('resetJobs', () => {
            beforeEach(function () {
                this.jobManagerInstance = createJobManagerInstance(
                    this,
                    BatchMixin(JobManagerCore)
                );
            });

            function runResetTest(ctx, thisCellId = null) {
                spyOn(ctx.bus, 'emit');
                spyOn(Date, 'now').and.returnValue(1234567890);
                expect(Object.keys(ctx.jobManagerInstance.model.getItem('exec.jobs.byId'))).toEqual(
                    jasmine.arrayWithExactContents(
                        JobsData.allJobsWithBatchParent.map((jobState) => {
                            return jobState.job_id;
                        })
                    )
                );
                expect(ctx.jobManagerInstance.listeners).toBeDefined();
                ctx.jobManagerInstance.resetJobs();
                expect(ctx.jobManagerInstance.model.getItem('exec')).not.toBeDefined();
                expect(ctx.jobManagerInstance.listeners).toEqual({});
                // check the args to bus.emit were correct
                if (thisCellId) {
                    expect(ctx.bus.emit).toHaveBeenCalled();
                    const callArgs = ctx.bus.emit.calls.allArgs();
                    expect(callArgs).toEqual([['reset-cell', { cellId, ts: 1234567890 }]]);
                } else {
                    expect(ctx.bus.emit).not.toHaveBeenCalled();
                }
            }
            it('can reset the stored jobs and listeners', function () {
                runResetTest(this);
            });

            it('can reset stored jobs, listeners, and cells', function () {
                this.jobManagerInstance.cellId = cellId;
                runResetTest(this, cellId);
            });
        });
    });
});
