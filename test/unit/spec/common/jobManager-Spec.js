define([
    'common/jobManager',
    'common/jobs',
    'common/props',
    'common/runtime',
    'common/ui',
    'testUtil',
    '/test/data/jobsData',
], (JobManagerModule, Jobs, Props, Runtime, UI, TestUtil, JobsData) => {
    'use strict';

    const { JobManagerCore, DefaultHandlerMixin, JobActionsMixin, BatchInitMixin, JobManager } =
        JobManagerModule;

    function createJobManagerInstance(context, jmClass = JobManager) {
        return new jmClass({
            model: context.model,
            bus: context.bus,
            devMode: true,
        });
    }

    const cellId = 'MY_FAVE_CELL_ID';

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
        const allOriginalJobs = TestUtil.JSONcopy(JobsData.allJobs).map((job) => {
            job.job_id += '-v2';
            return job;
        });

        const allJobs = [batchParent]
            .concat(allDupeJobs)
            .concat(retryParentJobs)
            .concat(allOriginalJobs);

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
                'removeJobListeners',
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
                    const event = 'job-info';
                    expect(this.jobManagerInstance.handlers).toEqual({});
                    this.jobManagerInstance.addEventHandler(event, { scream, shout });
                    expectHandlersDefined(this.jobManagerInstance, event, true, [
                        'scream',
                        'shout',
                    ]);
                });

                it('cannot add handlers that are not functions', function () {
                    const event = 'job-status';
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
                    const event = 'job-logs',
                        secondEvent = 'job-status';
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
                        secondEvent = 'job-error',
                        thirdEvent = 'job-logs';
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
                    const event = 'job-logs',
                        secondEvent = 'job-status',
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
                        secondEvent = 'job-error',
                        thirdEvent = 'job-logs',
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
                    const event = 'job-logs',
                        secondEvent = 'job-status';
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
                    const event = 'job-logs';
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
                    const event = 'job-logs';
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
                    this.jobManagerInstance = createJobManagerInstance(this, JobManagerCore);
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

                it('will not add undefined or null listeners', function () {
                    expect(this.jobManagerInstance.listeners).toEqual({});
                    this.jobManagerInstance.addListener('job-status', [null, '', undefined]);
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
                    const type = 'job-info',
                        jobIdList = ['this', 'that', 'the_other'];
                    expect(() => {
                        this.jobManagerInstance.addListener(type, jobIdList, {
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
                    this.jobManagerInstance = createJobManagerInstance(this, JobManagerCore);
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

        /* defaultHandlerMixin */
        function setUpHandlerTest(context, event) {
            context.jobManagerInstance.addEventHandler(event, { handler_1: scream });
            expect(Object.keys(context.jobManagerInstance.handlers[event]).sort()).toEqual([
                `__default_${event}`,
                'handler_1',
            ]);
            context.jobManagerInstance.addListener(event, [context.jobId]);
        }

        function checkForHandlers(jobManagerInstance) {
            const currentHandlers = jobManagerInstance.handlers;
            expect(Object.keys(currentHandlers).sort()).toEqual([
                'job-info',
                'job-retry-response',
                'job-status',
            ]);
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
                const event = 'job-info',
                    jobId = 'testJobId';
                it('handles successful job info requests', function () {
                    this.jobId = jobId;
                    const jobParams = {
                            this: 'that',
                            the: 'other',
                        },
                        jobInfo = {
                            job_id: this.jobId,
                            job_params: [jobParams],
                        };
                    this.jobId = jobId;
                    setUpHandlerTest(this, event);
                    expect(
                        this.jobManagerInstance.model.getItem(`exec.jobs.info.${jobId}`)
                    ).not.toBeDefined();
                    // rather than faffing around with sending messages over the bus,
                    // trigger the job handler directly
                    this.jobManagerInstance.runHandler('job-info', { jobInfo, jobId }, jobId);

                    expect(
                        this.jobManagerInstance.model.getItem(`exec.jobs.info.${jobId}`)
                    ).toEqual(jobInfo);
                    expect(this.jobManagerInstance.listeners[jobId][event]).not.toBeDefined();
                });

                it('handles errors in job info requests', function () {
                    this.jobId = jobId;
                    setUpHandlerTest(this, event);
                    expect(
                        this.jobManagerInstance.model.getItem(`exec.jobs.params.${jobId}`)
                    ).not.toBeDefined();
                    const error = 'Some made-up error';
                    this.jobManagerInstance.runHandler('job-info', { error, jobId }, jobId);
                    expect(
                        this.jobManagerInstance.model.getItem(`exec.jobs.params.${jobId}`)
                    ).not.toBeDefined();
                    expect(this.jobManagerInstance.listeners[jobId][event]).toBeDefined();
                });
            });

            describe('handleJobRetry', () => {
                const event = 'job-retry-response',
                    jobState = JobsData.jobsByStatus.terminated[0],
                    jobId = jobState.job_id;
                it('handles successful job retries', function () {
                    // retry a terminated job
                    this.jobId = jobId;
                    setUpHandlerTest(this, event);
                    Jobs.populateModelFromJobArray(
                        this.jobManagerInstance.model,
                        JobsData.allJobsWithBatchParent
                    );

                    // create a retry for the job
                    const updatedJobState = Object.assign({}, jobState, {
                            updated: jobState.updated + 10,
                        }),
                        newJobId = `${jobId}-retry`,
                        retryJobState = {
                            job_id: newJobId,
                            status: 'queued',
                            updated: jobState.updated + 10,
                            created: jobState.updated + 5,
                            retry_parent: this.jobId,
                        };

                    expect(
                        this.jobManagerInstance.model.getItem(`exec.jobs.params.${newJobId}`)
                    ).not.toBeDefined();
                    expect(
                        this.jobManagerInstance.listeners[jobId]['job-retry-response']
                    ).toBeDefined();
                    expect(this.jobManagerInstance.listeners[newJobId]).not.toBeDefined();

                    spyOn(this.bus, 'emit');
                    spyOn(this.jobManagerInstance, 'updateModel').and.callThrough();

                    this.jobManagerInstance.runHandler(
                        event,
                        { job: { jobState: updatedJobState }, retry: { jobState: retryJobState } },
                        jobId
                    );

                    expect(
                        this.jobManagerInstance.listeners[jobId]['job-retry-response']
                    ).toBeDefined();
                    expect(this.jobManagerInstance.listeners[newJobId]['job-status']).toBeDefined();
                    const storedJobs = this.jobManagerInstance.model.getItem('exec.jobs.byId');
                    expect(storedJobs[jobId]).toEqual(updatedJobState);
                    expect(storedJobs[newJobId]).toEqual(retryJobState);
                    expect(this.bus.emit).toHaveBeenCalled();
                    expect(this.jobManagerInstance.bus.emit.calls.allArgs()).toEqual([
                        ['request-job-updates-start', { jobId: newJobId }],
                    ]);
                });

                it('handles unsuccessful retries', function () {
                    this.jobId = jobId;
                    setUpHandlerTest(this, event);
                    Jobs.populateModelFromJobArray(
                        this.jobManagerInstance.model,
                        JobsData.allJobsWithBatchParent
                    );
                    expect(
                        this.jobManagerInstance.listeners[jobId]['job-retry-response']
                    ).toBeDefined();

                    spyOn(this.bus, 'emit');
                    spyOn(this.jobManagerInstance, 'updateModel');

                    this.jobManagerInstance.runHandler(
                        event,
                        { job: { jobState }, error: 'Could not execute action' },
                        jobId
                    );
                    expect(this.bus.emit).not.toHaveBeenCalled();
                    expect(this.jobManagerInstance.updateModel).not.toHaveBeenCalled();
                });
            });

            describe('handleJobStatus', () => {
                const event = 'job-status';

                it('can update the model if a job has been updated', function () {
                    // job to test
                    const jobState = TestUtil.JSONcopy(JobsData.allJobsWithBatchParent)[0],
                        jobId = jobState.job_id;
                    this.jobId = jobId;
                    setUpHandlerTest(this, event);
                    Jobs.populateModelFromJobArray(
                        this.jobManagerInstance.model,
                        JobsData.allJobsWithBatchParent
                    );
                    // create an update for the job
                    const updatedJobState = Object.assign({}, jobState, {
                            updated: jobState.updated + 10,
                        }),
                        messageOne = { jobState, jobId },
                        messageTwo = { jobState: updatedJobState, jobId };

                    spyOn(console, 'error');
                    spyOn(this.jobManagerInstance, 'updateModel').and.callThrough();
                    // the first message will not trigger `updateModel` as it is identical to the existing jobState
                    // the second message will trigger `updateModel`
                    this.jobManagerInstance.runHandler('job-status', messageOne, jobId);
                    expect(this.jobManagerInstance.model.getItem(`exec.jobState`)).toEqual(
                        jobState
                    );
                    this.jobManagerInstance.runHandler('job-status', messageTwo, jobId);
                    expect(this.jobManagerInstance.model.getItem(`exec.jobState`)).toEqual(
                        updatedJobState
                    );

                    expect(console.error).toHaveBeenCalledTimes(2);
                    expect(this.jobManagerInstance.updateModel).toHaveBeenCalledTimes(1);
                    const updateModelCallArgs = this.jobManagerInstance.updateModel.calls.allArgs();
                    // callArgs[0][0] and updateModel takes [jobState]
                    expect(updateModelCallArgs).toEqual([[[updatedJobState]]]);
                });

                JobsData.allJobsWithBatchParent.forEach((jobState) => {
                    it(`performs the appropriate update for ${jobState.job_id}`, function () {
                        const jobId = jobState.job_id;
                        this.jobId = jobId;
                        setUpHandlerTest(this, event);
                        Jobs.populateModelFromJobArray(
                            this.jobManagerInstance.model,
                            JobsData.allJobsWithBatchParent
                        );
                        const updatedJobState = Object.assign({}, jobState, {
                            updated: jobState.updated + 10,
                        });
                        expect(
                            this.jobManagerInstance.model.getItem(`exec.jobs.byId.${jobId}`)
                        ).toEqual(jobState);

                        spyOn(console, 'error');
                        spyOn(this.bus, 'emit');
                        spyOn(this.jobManagerInstance, 'updateModel').and.callThrough();

                        // trigger the update
                        this.jobManagerInstance.runHandler(
                            'job-status',
                            { jobState: updatedJobState, jobId },
                            jobId
                        );
                        expect(
                            this.jobManagerInstance.model.getItem(`exec.jobs.byId.${jobId}`)
                        ).toEqual(updatedJobState);

                        expect(this.jobManagerInstance.updateModel).toHaveBeenCalledTimes(1);
                        expect(console.error).toHaveBeenCalledTimes(1);
                        // for non-terminal jobs or those that can be retried
                        // the listener should still be in place
                        if (!jobState.meta.terminal || jobState.meta.canRetry) {
                            expect(
                                this.jobManagerInstance.listeners[jobId]['job-status']
                            ).toBeDefined();
                            expect(this.bus.emit).not.toHaveBeenCalled();
                        } else {
                            expect(
                                this.jobManagerInstance.listeners[jobId]['job-status']
                            ).not.toBeDefined();
                            // 'request-job-updates-stop' should have been called
                            expect(this.bus.emit).toHaveBeenCalled();
                            const callArgs = this.bus.emit.calls.allArgs();
                            expect(callArgs).toEqual([['request-job-updates-stop', { jobId }]]);
                        }
                    });
                });

                it('adds missing child IDs as required', function () {
                    // this will be the updated job
                    const batchParent = TestUtil.JSONcopy(JobsData.batchParentJob),
                        batchParentUpdate = TestUtil.JSONcopy(JobsData.batchParentJob),
                        jobId = batchParent.job_id;

                    // remove the child jobs from the original batch parent
                    batchParent.child_jobs = [];
                    // change the update time for the updated batch parent
                    batchParentUpdate.updated += 10;
                    setUpHandlerTest(this, event);
                    Jobs.populateModelFromJobArray(this.jobManagerInstance.model, [batchParent]);
                    this.jobManagerInstance.addListener('job-status', [jobId]);

                    expect(this.jobManagerInstance.model.getItem('exec.jobState')).toEqual(
                        batchParent
                    );
                    expect(this.jobManagerInstance.listeners[jobId]['job-status']).toBeDefined();

                    spyOn(console, 'error');
                    spyOn(this.bus, 'emit');
                    spyOn(this.jobManagerInstance, 'updateModel').and.callThrough();

                    // trigger the update
                    this.jobManagerInstance.runHandler(
                        'job-status',
                        { jobState: batchParentUpdate, jobId },
                        jobId
                    );
                    expect(this.jobManagerInstance.model.getItem(`exec.jobState`)).toEqual(
                        batchParentUpdate
                    );
                    expect(this.jobManagerInstance.listeners[jobId]['job-status']).toBeDefined();
                    expect(this.jobManagerInstance.updateModel).toHaveBeenCalledTimes(1);
                    expect(console.error).toHaveBeenCalledTimes(1);

                    // all child jobs should have job-status and job-info listeners
                    batchParentUpdate.child_jobs.forEach((_jobId) => {
                        expect(
                            this.jobManagerInstance.listeners[_jobId]['job-status']
                        ).toBeDefined();
                        expect(this.jobManagerInstance.listeners[_jobId]['job-info']).toBeDefined();
                    });
                    const callArgs = this.bus.emit.calls.allArgs();
                    expect(this.bus.emit).toHaveBeenCalledTimes(1);
                    expect(callArgs).toEqual([
                        [
                            'request-job-updates-start',
                            {
                                jobIdList: jasmine.arrayWithExactContents(
                                    batchParentUpdate.child_jobs
                                ),
                            },
                        ],
                    ]);
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

            const actionStatusMatrix = {
                cancel: {
                    valid: Jobs.validStatusesForAction.cancel,
                    invalid: [],
                    request: 'cancel',
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
                            const actionRequest = `request-job-${actionStatusMatrix[action].request}`;
                            expect(callArgs[0]).toEqual([
                                actionRequest,
                                { jobIdList: [`${jobId}-v2`] },
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
                            const actionRequest = `request-job-${actionStatusMatrix[action].request}`;
                            // if this is a retry, use the retry parent ID
                            const actionJobId = action === 'retry' ? jobId : `${jobId}-retry`;
                            expect(callArgs[0]).toEqual([
                                actionRequest,
                                { jobIdList: [actionJobId] },
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
                            const actionString = actionStatusMatrix[action].request;
                            // all the jobs of status `status` should be included
                            const expectedJobIds = Object.values(JobsData.jobsByStatus[status]).map(
                                (jobState) => jobState.job_id
                            );
                            expect(callArgs.length).toEqual(1);
                            expect(callArgs[0][0]).toEqual(`request-job-${actionString}`);
                            expect(callArgs[0][1].jobIdList).toEqual(
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
                            const actionString = actionStatusMatrix[action].request;
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
                            expect(callArgs[0][0]).toEqual(`request-job-${actionString}`);
                            expect(callArgs[0][1].jobIdList).toEqual(
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

            const resetJobsCallArgs = [
                'request-job-updates-stop',
                { batchId: JobsData.batchParentJob.job_id },
            ];

            describe('cancelBatchJob', () => {
                it('cancels the current batch parent job', function () {
                    spyOn(this.bus, 'emit');
                    const batchIds = JobsData.allJobsWithBatchParent.map((jobState) => {
                        return jobState.job_id;
                    });
                    expect(
                        Object.keys(this.jobManagerInstance.model.getItem('exec.jobs.byId'))
                    ).toEqual(jasmine.arrayWithExactContents(batchIds));
                    expect(this.jobManagerInstance.listeners).toBeDefined();
                    this.jobManagerInstance.cancelBatchJob();
                    // check the args to bus.emit were correct
                    expect(this.bus.emit).toHaveBeenCalled();

                    const actionRequest = `request-job-${actionStatusMatrix.cancel.request}`;
                    const expected = [
                        [actionRequest, { jobIdList: [JobsData.batchParentJob.job_id] }],
                    ];
                    const callArgs = this.bus.emit.calls.allArgs();
                    expect(callArgs).toEqual(jasmine.arrayWithExactContents(expected));
                    // the job model should be unchanged
                    expect(
                        Object.keys(this.jobManagerInstance.model.getItem('exec.jobs.byId'))
                    ).toEqual(jasmine.arrayWithExactContents(batchIds));
                    // there should be a status listener for the batch parent
                    expect(
                        this.jobManagerInstance.listeners[JobsData.batchParentJob.job_id]
                    ).toEqual({ 'job-status': this.bus.listen() });
                });
            });

            describe('resetJobs', () => {
                function runResetTest(ctx, thisCellId = null) {
                    spyOn(ctx.bus, 'emit');
                    spyOn(Date, 'now').and.returnValue(1234567890);
                    expect(
                        Object.keys(ctx.jobManagerInstance.model.getItem('exec.jobs.byId'))
                    ).toEqual(
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
                    expect(ctx.bus.emit).toHaveBeenCalled();
                    let expected = [resetJobsCallArgs];
                    if (thisCellId) {
                        expected = [resetJobsCallArgs, ['reset-cell', { cellId, ts: 1234567890 }]];
                    }
                    const callArgs = ctx.bus.emit.calls.allArgs();
                    expect(callArgs).toEqual(jasmine.arrayWithExactContents(expected));
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

        /**
         * @param {object} ctx  this context
         * @param {object} args with keys
         *          batchId         batch job ID
         *          allJobIds       IDs of batch job and all children
         *          listenerArray   listeners expected to be active; array of strings, e.g.
         *                          ['job-status', 'job-info']
         */
        function check_initJobs(ctx, args) {
            const { batchId, allJobIds, listenerArray } = args;

            expect(Object.keys(ctx.jobManagerInstance.listeners)).toEqual(
                jasmine.arrayWithExactContents(allJobIds)
            );

            Object.keys(ctx.jobManagerInstance.listeners).forEach((jobId) => {
                expect(Object.keys(ctx.jobManagerInstance.listeners[jobId])).toEqual(
                    jasmine.arrayWithExactContents(listenerArray)
                );
            });

            const busCallArgs = [['request-job-updates-start', { batchId }]];
            if (listenerArray.includes('job-info')) {
                busCallArgs.push(['request-job-info', { batchId }]);
            }

            expect(ctx.jobManagerInstance.bus.emit.calls.allArgs()).toEqual(
                jasmine.arrayWithExactContents(busCallArgs)
            );
        }

        describe('initBatchJob', () => {
            beforeEach(function () {
                this.jobManagerInstance = createJobManagerInstance(
                    this,
                    BatchInitMixin(JobManagerCore)
                );
            });
            const childIds = ['this', 'that', 'the other'],
                batchId = 'something';

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
                ).toEqual(jasmine.arrayWithExactContents([batchId, 'that', 'the other', 'this']));
                expect(this.jobManagerInstance.model.getItem('exec.jobState').job_id).toEqual(
                    batchId
                );
                // check that the appropriate messages have been sent out
                check_initJobs(this, {
                    batchId,
                    allJobIds: childIds.concat([batchId]),
                    listenerArray: ['job-status', 'job-info', 'job-error'],
                });
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
                ).toEqual(jasmine.arrayWithExactContents([batchId, 'that', 'the other', 'this']));
                expect(this.jobManagerInstance.model.getItem('exec.jobState').job_id).toEqual(
                    batchId
                );
                // check that the appropriate messages have been sent out
                check_initJobs(this, {
                    batchId,
                    allJobIds: childIds.concat([batchId]),
                    listenerArray: ['job-status', 'job-info', 'job-error'],
                });
            });
        });

        describe('restoreFromSaved', () => {
            beforeEach(function () {
                this.model = Props.make({
                    data: {},
                });
            });
            it('does nothing if there are no jobs saved', function () {
                this.jobManagerInstance = createJobManagerInstance(
                    this,
                    BatchInitMixin(JobManagerCore)
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
                    BatchInitMixin(JobManagerCore)
                );
                expect(this.jobManagerInstance.listeners).toEqual({});
                spyOn(this.jobManagerInstance.bus, 'emit');
                this.jobManagerInstance.restoreFromSaved();

                check_initJobs(this, {
                    batchId: JobsData.batchParentJob.job_id,
                    allJobIds: JobsData.allJobsWithBatchParent.map((job) => job.job_id),
                    listenerArray: ['job-status', 'job-error'],
                });
            });

            it('sets up the appropriate listeners even if child jobs are missing', function () {
                Jobs.populateModelFromJobArray(this.model, [JobsData.batchParentJob]);
                this.jobManagerInstance = createJobManagerInstance(
                    this,
                    BatchInitMixin(JobManagerCore)
                );
                expect(this.jobManagerInstance.listeners).toEqual({});
                spyOn(this.jobManagerInstance.bus, 'emit');
                this.jobManagerInstance.restoreFromSaved();

                check_initJobs(this, {
                    batchId: JobsData.batchParentJob.job_id,
                    allJobIds: JobsData.allJobsWithBatchParent.map((job) => job.job_id),
                    listenerArray: ['job-status', 'job-error'],
                });
            });
        });

        describe('getFsmStateFromJobs', () => {
            beforeEach(function () {
                this.jobManagerInstance = createJobManagerInstance(
                    this,
                    BatchInitMixin(JobManagerCore)
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
    });
});
