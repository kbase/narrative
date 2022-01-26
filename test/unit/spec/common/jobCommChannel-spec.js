define([
    'common/jobCommChannel',
    'base/js/namespace',
    'common/runtime',
    '/test/data/jobsData',
    'testUtil',
    'narrativeMocks',
], (JobComms, Jupyter, Runtime, JobsData, TestUtil, Mocks) => {
    'use strict';

    // allow spies to be overwritten
    jasmine.getEnv().allowRespy(true);

    const JobCommChannel = JobComms.JobCommChannel;

    function makeMockNotebook(commInfoReturn, registerTargetReturn, executeReply, cells = []) {
        return Mocks.buildMockNotebook({
            commInfoReturn,
            registerTargetReturn,
            executeReply,
            cells,
        });
    }

    function makeCommMsg(msgType, content) {
        return {
            content: {
                data: {
                    msg_type: msgType,
                    content: content,
                },
            },
        };
    }

    const convertToJobState = (acc, curr) => {
        acc[curr.job_id] = {
            state: curr,
            widget_info: {},
        };
        return acc;
    };

    const convertToJobStateBusMessage = (job) => {
        return [
            {
                jobId: job.job_id,
                jobState: job,
                outputWidgetInfo: {},
            },
            {
                channel: { jobId: job.job_id },
                key: { type: 'job-status' },
            },
        ];
    };

    describe('The jobCommChannel widget', () => {
        let testBus;
        beforeEach(() => {
            testBus = Runtime.make().bus();
            Jupyter.notebook = makeMockNotebook();
            Jupyter.narrative = {
                saveNarrative: () => {},
            };
        });

        afterEach(() => {
            TestUtil.clearRuntime();
            Jupyter.notebook = null;
            Jupyter.narrative = null;
            testBus = null;
        });

        it('Should load properly', () => {
            expect(JobCommChannel).not.toBeNull();
        });

        it('Should be instantiable and contain the right components', () => {
            const comm = new JobCommChannel();
            expect(comm.initCommChannel).toBeDefined();
        });

        it('Should initialize correctly in the base case', () => {
            const comm = new JobCommChannel();
            return comm.initCommChannel().then(() => {
                expect(comm.comm).not.toBeNull();
            });
        });

        it('Should re-initialize with an existing channel', () => {
            const comm = new JobCommChannel();
            Jupyter.notebook = makeMockNotebook({
                content: {
                    comms: {
                        12345: {
                            target_name: 'KBaseJobs',
                        },
                    },
                },
            });
            return comm.initCommChannel().then(() => {
                expect(comm.comm).not.toBeNull();
            });
        });

        it('should generate the correct python code for the cells', () => {
            Jupyter.notebook = makeMockNotebook(null, null, null, [
                { metadata: { kbase: { attributes: { id: '12345' } } } },
                { metadata: { kbase: { attributes: { id: 'abcde' } } } },
                { id: 'whatever' },
                { metadata: { kbase: { attributes: { id: 'who cares?' } } } },
            ]);
            const comm = new JobCommChannel();
            const jobCommInitString = comm.getJobInitCode();
            expect(jobCommInitString.split('\n')).toEqual([
                'from biokbase.narrative.jobs.jobcomm import JobComm',
                'cell_list = ["12345","abcde","who cares?"]',
                // DATAUP-575: temporary disabling of cell_list
                // 'JobComm().start_job_status_loop(cell_list=cell_list, init_jobs=True)',
                'JobComm().start_job_status_loop(init_jobs=True)',
            ]);
        });

        it('should generate the correct python code for an empty narrative', () => {
            Jupyter.notebook = makeMockNotebook();
            const comm = new JobCommChannel();
            const jobCommInitString = comm.getJobInitCode();
            expect(jobCommInitString.split('\n')).toEqual([
                'from biokbase.narrative.jobs.jobcomm import JobComm',
                'cell_list = []',
                // DATAUP-575: temporary disabling of cell_list
                // 'JobComm().start_job_status_loop(cell_list=cell_list, init_jobs=True)',
                'JobComm().start_job_status_loop(init_jobs=True)',
            ]);
        });

        it('Should fail to initialize with a failed reply from the backend JobManager startup', async () => {
            Jupyter.notebook = makeMockNotebook(null, null, {
                name: 'Failed to start',
                evalue: 'Some error',
                error: 'Yes. Very yes.',
            });
            const comm = new JobCommChannel();
            expect(comm.comm).toBeUndefined();
            await expectAsync(comm.initCommChannel()).toBeRejectedWith(
                new Error('Failed to start: Some error')
            );
        });

        it('Should error properly when trying to send a comm with an uninited channel', async () => {
            const comm = new JobCommChannel();
            expect(comm.comm).toBeUndefined();
            await expectAsync(comm.sendCommMessage('some_msg', {})).toBeRejectedWithError(
                'ERROR sending comm message: ' + comm.ERROR_COMM_CHANNEL_NOT_INIT
            );
        });

        const pingArgs = [
            ['ping-comm-channel', { pingId: 0 }],
            ['ping-comm-channel', { pingId: 1 }],
            ['ping-comm-channel', { pingId: 2 }],
        ];
        const messageQueuePings = pingArgs.map((arg) => {
            return {
                msgType: arg[0],
                msgData: arg[1],
            };
        });
        const sentPings = [0, 1, 2].map((num) => {
            return [
                {
                    target_name: 'KBaseJobs',
                    request_type: 'ping',
                    ping_id: num,
                },
            ];
        });

        it('should not lose messages if the comm channel is not inited', () => {
            const comm = new JobCommChannel();
            expect(comm.comm).toBeUndefined();

            // send three pings over the channel
            // expect all three to be stored in comm.messageQueue
            return new Promise((resolve) => {
                spyOn(comm, 'sendCommMessage').and.callFake(async (...args) => {
                    // expect sendCommMessage to throw an error
                    await expectAsync(
                        comm.sendCommMessage.and.originalFn.call(comm, ...args)
                    ).toBeRejectedWithError(
                        'ERROR sending comm message: ' + comm.ERROR_COMM_CHANNEL_NOT_INIT
                    );
                    // resolve the promise on receiving the last ping
                    if (args[1].pingId === 2) {
                        resolve();
                    }
                });
                pingArgs.forEach((pingMsg) => {
                    testBus.emit(...pingMsg);
                });
            }).then(() => {
                expect(comm.sendCommMessage).toHaveBeenCalledTimes(pingArgs.length);
                expect(comm.sendCommMessage.calls.allArgs()).toEqual(pingArgs);
                expect(comm.messageQueue).toEqual(messageQueuePings);
            });
        });

        it('should send any stored messages on initing the comm channel', () => {
            const comm = new JobCommChannel();
            expect(comm.comm).toBeUndefined();
            // send three pings over the bus
            // init the comm channel after the last ping
            // all pings should generate an error and be stored
            // when the channel is initialised, the stored pings will be sent
            return new Promise((resolve) => {
                spyOn(comm, 'sendCommMessage').and.callFake(async (...args) => {
                    // after initialising the comm channel,
                    // sendCommMessage is called with no args
                    // install a spy on comm.comm.send to monitor the output
                    if (!args.length) {
                        if (comm.comm) {
                            spyOn(comm.comm, 'send');
                        }
                        return comm.sendCommMessage.and.originalFn.call(comm, ...args);
                    }
                    const { pingId } = args[1];
                    // original function should throw an error
                    await expectAsync(
                        comm.sendCommMessage.and.originalFn.call(comm, ...args)
                    ).toBeRejectedWithError(
                        'ERROR sending comm message: ' + comm.ERROR_COMM_CHANNEL_NOT_INIT
                    );
                    // resolve the promise on receiving the last ping
                    if (pingId === 2) {
                        resolve();
                    }
                });
                // emit the pings
                pingArgs.forEach((ping) => {
                    testBus.emit(...ping);
                });
            }).then(() => {
                // all pings will be stored
                expect(comm.messageQueue).toEqual(messageQueuePings);
                // init the comm channel, which will send everything in the message queue
                return comm.initCommChannel().then(() => {
                    expect(comm.comm).not.toBeNull();
                    expect(comm.sendCommMessage).toHaveBeenCalledTimes(pingArgs.length + 1);
                    // the last call comes from comm.initCommChannel, and has no args
                    expect(comm.sendCommMessage.calls.allArgs()).toEqual(pingArgs.concat([[]]));

                    expect(comm.comm.send).toHaveBeenCalled();
                    expect(comm.comm.send.calls.allArgs()).toEqual(sentPings);
                });
            });
        });

        it('should send new and stored messages after initing the channel', () => {
            const comm = new JobCommChannel();
            expect(comm.comm).toBeUndefined();
            // send three pings over the bus
            // init the comm channel after the second ping
            // the first two pings should generate an error and be stored
            // the third ping should be processed successfully
            return new Promise((resolve) => {
                spyOn(comm, 'sendCommMessage').and.callFake(async (...args) => {
                    if (!args.length) {
                        if (comm.comm) {
                            spyOn(comm.comm, 'send');
                        }
                        return comm.sendCommMessage.and.originalFn.call(comm, ...args);
                    }
                    const { pingId } = args[1];
                    if (pingId < 2) {
                        // original function should throw an error
                        await expectAsync(
                            comm.sendCommMessage.and.originalFn.call(comm, ...args)
                        ).toBeRejectedWithError(
                            'ERROR sending comm message: ' + comm.ERROR_COMM_CHANNEL_NOT_INIT
                        );
                    } else {
                        // call the original function
                        await comm.sendCommMessage.and.originalFn.call(comm, ...args);
                    }
                    // resolve the promise on receiving the second ping
                    // this allows the test to progress to the next "then"
                    if (pingId === 1) {
                        resolve();
                    }
                });
                // emit the first two pings
                [0, 1].forEach((ix) => {
                    testBus.emit(...pingArgs[ix]);
                });
            }).then(() => {
                // first two pings will be stored
                expect(comm.messageQueue).toEqual(messageQueuePings.slice(0, 2));
                // init the comm channel and send the last ping
                return comm.initCommChannel().then(() => {
                    expect(comm.comm).not.toBeNull();
                    return new Promise((resolve) => {
                        // resolve the promise when we see comm.comm.send(...)
                        spyOn(comm.comm, 'send').and.callFake(() => {
                            resolve();
                        });
                        // emit the last ping
                        testBus.emit(...pingArgs[2]);
                    }).then(() => {
                        expect(comm.sendCommMessage).toHaveBeenCalledTimes(pingArgs.length + 1);
                        expect(comm.sendCommMessage.calls.allArgs()).toEqual([
                            pingArgs[0],
                            pingArgs[1],
                            [],
                            pingArgs[2],
                        ]);

                        expect(comm.comm.send).toHaveBeenCalled();
                        expect(comm.comm.send.calls.allArgs()).toEqual(sentPings);
                    });
                });
            });
        });

        const busMsgCases = [
            {
                channel: 'ping-comm-channel',
                message: { pingId: 'ping!', pongId: 'pong!' },
                expected: { request_type: 'ping', ping_id: 'ping!', pongId: 'pong!' },
            },
            {
                channel: 'request-job-cancel',
                message: { jobId: 'someJob' },
                expected: { request_type: 'cancel_job', job_id: 'someJob' },
            },
            {
                channel: 'request-job-retry',
                message: { jobId: 'someJob' },
                expected: { request_type: 'retry_job', job_id: 'someJob' },
            },
            {
                channel: 'request-job-log',
                message: { jobId: 'someJob', options: {} },
                expected: {
                    request_type: 'job_logs',
                    job_id: 'someJob',
                },
            },
            {
                channel: 'request-job-log',
                message: { jobId: 'someJob', options: { latest: true } },
                expected: {
                    request_type: 'job_logs',
                    job_id: 'someJob',
                    latest: true,
                },
            },
            {
                channel: 'request-job-log',
                message: {
                    jobId: 'someJob',
                    options: {
                        first_line: 2000,
                        job_id: 'overridden!',
                        latest: true,
                    },
                },
                expected: {
                    request_type: 'job_logs',
                    job_id: 'overridden!',
                    first_line: 2000,
                    latest: true,
                },
            },
        ];

        const translated = {
            info: 'job_info',
            status: 'job_status',
            'updates-start': 'start_job_update',
            'updates-stop': 'stop_job_update',
        };

        // all these can have a single job ID, a job ID list, or a batch ID as input
        Object.keys(translated).forEach((type) => {
            busMsgCases.push(
                {
                    channel: `request-job-${type}`,
                    message: { jobId: 'someJob' },
                    expected: {
                        request_type: translated[type],
                        job_id: 'someJob',
                    },
                },
                {
                    channel: `request-job-${type}`,
                    message: { jobIdList: ['someJob', 'someOtherJob', 'aThirdJob'] },
                    expected: {
                        request_type: translated[type],
                        job_id_list: ['someJob', 'someOtherJob', 'aThirdJob'],
                    },
                },
                {
                    channel: `request-job-${type}`,
                    message: { batchId: 'batch_job' },
                    expected: {
                        request_type: `${translated[type]}_batch`,
                        job_id: 'batch_job',
                    },
                }
            );
        });

        busMsgCases.forEach((testCase) => {
            it(`should handle a ${testCase.channel} bus message`, () => {
                const comm = new JobCommChannel();
                return comm
                    .initCommChannel()
                    .then(() => {
                        expect(comm.comm).not.toBeNull();
                        spyOn(comm, 'sendCommMessage').and.callFake((...args) => {
                            return comm.sendCommMessage.and.originalFn.call(comm, ...args);
                        });
                        return new Promise((resolve) => {
                            // resolve the promise when we see comm.comm.send(...)
                            spyOn(comm.comm, 'send').and.callFake(() => {
                                resolve();
                            });
                            testBus.emit(testCase.channel, testCase.message);
                        });
                    })
                    .then(() => {
                        expect(comm.comm.send).toHaveBeenCalled();
                        expect(comm.comm.send.calls.allArgs()).toEqual([
                            [Object.assign(testCase.expected, { target_name: 'KBaseJobs' })],
                        ]);
                        expect(comm.sendCommMessage).toHaveBeenCalled();
                        expect(comm.sendCommMessage.calls.allArgs()).toEqual([
                            [testCase.channel, testCase.message],
                        ]);
                    });
            });
        });

        /* Mocking out comm messages coming back over the channel is gruesome. Just
         * calling the handleCommMessage function directly.
         */
        it('Should handle a start message', () => {
            const comm = new JobCommChannel();
            spyOn(console, 'warn');
            return comm.initCommChannel().then(() => {
                comm.handleCommMessages(makeCommMsg('start', {}));
                // this one's basically a no-op right now, just make sure that
                // console.warn wasn't called.
                expect(console.warn).not.toHaveBeenCalled();
            });
        });

        it('Should respond to new_job by saving the Narrative', () => {
            const comm = new JobCommChannel();
            spyOn(Jupyter.narrative, 'saveNarrative');
            return comm.initCommChannel().then(() => {
                comm.handleCommMessages(makeCommMsg('new_job', {}));
                expect(Jupyter.narrative.saveNarrative).toHaveBeenCalled();
            });
        });

        const testJobId = 'someJob';

        const busTests = [
            {
                type: 'run_status',
                message: { job_id: testJobId, cell_id: 'bar' },
                expected: [
                    { job_id: testJobId, cell_id: 'bar' },
                    {
                        channel: { cell: 'bar' },
                        key: { type: 'run-status' },
                    },
                ],
            },
            {
                type: 'result',
                message: {
                    result: [1],
                    address: { cell_id: 'bar' },
                },
                expected: [
                    {
                        result: [1],
                        address: { cell_id: 'bar' },
                    },
                    {
                        channel: { cell: 'bar' },
                        key: { type: 'result' },
                    },
                ],
            },
            {
                // info for a single job
                type: 'job_info',
                message: (() => {
                    const output = {};
                    output[JobsData.validInfo[0].job_id] = JobsData.validInfo[0];
                    return output;
                })(),
                expected: [
                    {
                        jobId: JobsData.validInfo[0].job_id,
                        jobInfo: JobsData.validInfo[0],
                    },
                    {
                        channel: { jobId: JobsData.validInfo[0].job_id },
                        key: { type: 'job-info' },
                    },
                ],
            },
            {
                // info multiple jobs
                type: 'job_info',
                message: JobsData.validInfo.reduce((acc, curr) => {
                    acc[curr.job_id] = curr;
                    return acc;
                }, {}),
                expectedMultiple: JobsData.validInfo.map((info) => {
                    return [
                        {
                            jobId: info.job_id,
                            jobInfo: info,
                        },
                        {
                            channel: { jobId: info.job_id },
                            key: { type: 'job-info' },
                        },
                    ];
                }),
            },
            {
                type: 'job_logs',
                message: {
                    job_id: testJobId,
                    latest: true,
                    logs: [
                        {
                            line: 'this',
                        },
                    ],
                },
                expected: [
                    {
                        jobId: testJobId,
                        logs: {
                            job_id: testJobId,
                            latest: true,
                            logs: [
                                {
                                    line: 'this',
                                },
                            ],
                        },
                        latest: true,
                    },
                    {
                        channel: { jobId: testJobId },
                        key: { type: 'job-logs' },
                    },
                ],
            },
            {
                type: 'jobs_retried',
                message: [
                    {
                        job: {
                            widget_info: {},
                            state: {
                                job_id: testJobId,
                                status: 'wherever',
                            },
                        },
                        retry: {
                            widget_info: 'whatever',
                            state: {
                                job_id: '1234567890abcdef',
                                status: 'whenever',
                            },
                        },
                    },
                    {
                        job: {
                            state: {
                                job_id: 'ping',
                            },
                            widget_info: 'ping',
                            cell_id: 12345,
                        },
                        retry: {},
                    },
                ],
                expectedMultiple: [
                    [
                        {
                            job: {
                                jobId: testJobId,
                                jobState: {
                                    job_id: testJobId,
                                    status: 'wherever',
                                },
                                outputWidgetInfo: {},
                            },
                            retry: {
                                jobId: '1234567890abcdef',
                                jobState: {
                                    job_id: '1234567890abcdef',
                                    status: 'whenever',
                                },
                                outputWidgetInfo: 'whatever',
                            },
                        },
                        {
                            channel: { jobId: testJobId },
                            key: { type: 'job-retry-response' },
                        },
                    ],
                    [
                        {
                            job: {
                                jobId: 'ping',
                                jobState: {
                                    job_id: 'ping',
                                },
                                outputWidgetInfo: 'ping',
                                cellId: 12345,
                            },
                            retry: {},
                        },
                        {
                            channel: { jobId: 'ping' },
                            key: { type: 'job-retry-response' },
                        },
                    ],
                ],
            },
            {
                // single job status message
                type: 'job_status',
                message: (() => {
                    const output = {};
                    output[JobsData.allJobs[0].job_id] = {
                        state: JobsData.allJobs[0],
                        widget_info: {},
                    };
                    return output;
                })(),
                expected: [
                    {
                        jobId: JobsData.allJobs[0].job_id,
                        jobState: JobsData.allJobs[0],
                        outputWidgetInfo: {},
                    },
                    {
                        channel: { jobId: JobsData.allJobs[0].job_id },
                        key: { type: 'job-status' },
                    },
                ],
            },
            {
                // single job status message, ee2 error
                type: 'job_status',
                message: {
                    ee2_error_job: {
                        job_id: 'ee2_error_job',
                        state: {
                            job_id: 'ee2_error_job',
                            status: 'ee2_error',
                        },
                    },
                },
                expected: [
                    {
                        jobId: 'ee2_error_job',
                        error: {
                            job_id: 'ee2_error_job',
                            message: 'ee2 connection error',
                            code: 'ee2_error',
                        },
                        request: 'job-status',
                    },
                    {
                        channel: { jobId: 'ee2_error_job' },
                        key: { type: 'job-error' },
                    },
                ],
            },
            {
                // more than one job, indexed by job ID
                type: 'job_status',
                message: JobsData.allJobs.reduce(convertToJobState, {}),
                expectedMultiple: JobsData.allJobs.map(convertToJobStateBusMessage),
            },
            {
                // OK job and an errored job
                type: 'job_status',
                message: JobsData.allJobs
                    .concat({
                        job_id: '1234567890abcdef',
                        status: 'does_not_exist',
                    })
                    .reduce(convertToJobState, {}),
                expectedMultiple: JobsData.allJobs.map(convertToJobStateBusMessage).concat([
                    [
                        {
                            jobId: '1234567890abcdef',
                            jobState: {
                                job_id: '1234567890abcdef',
                                status: 'does_not_exist',
                            },
                            outputWidgetInfo: {},
                        },
                        {
                            channel: { jobId: '1234567890abcdef' },
                            key: { type: 'job-status' },
                        },
                    ],
                ]),
            },
            {
                type: 'job_status_all',
                message: JobsData.allJobsWithBatchParent.reduce(convertToJobState, {}),
                expectedMultiple: JobsData.allJobsWithBatchParent.map(convertToJobStateBusMessage),
            },
            {
                type: 'job_comm_error',
                message: {
                    job_id: 'jobCancelWithErrors',
                    message: 'cancel error',
                    source: 'cancel_job',
                    code: 'RED',
                },
                expected: [
                    {
                        jobId: 'jobCancelWithErrors',
                        error: {
                            job_id: 'jobCancelWithErrors',
                            message: 'cancel error',
                            source: 'cancel_job',
                            code: 'RED',
                        },
                        request: 'cancel_job',
                    },
                    {
                        channel: { jobId: 'jobCancelWithErrors' },
                        key: { type: 'job-error' },
                    },
                ],
            },
            {
                type: 'job_comm_error',
                message: {
                    job_id: 'jobLogWithErrors',
                    message: 'log error',
                    source: 'job_logs',
                    code: -32000,
                },
                expected: [
                    {
                        jobId: 'jobLogWithErrors',
                        error: {
                            job_id: 'jobLogWithErrors',
                            message: 'log error',
                            source: 'job_logs',
                            code: -32000,
                        },
                        request: 'job_logs',
                    },
                    {
                        channel: { jobId: 'jobLogWithErrors' },
                        key: { type: 'job-logs' },
                    },
                ],
            },
            {
                // unrecognised error type
                type: 'job_comm_error',
                message: {
                    source: 'some-unknown-error',
                    job_id: 'unknownJobErrors',
                    message: 'some random error',
                    code: 404,
                },
                expected: [
                    {
                        jobId: 'unknownJobErrors',
                        error: {
                            source: 'some-unknown-error',
                            job_id: 'unknownJobErrors',
                            message: 'some random error',
                            code: 404,
                        },
                        request: 'some-unknown-error',
                    },
                    {
                        channel: { jobId: 'unknownJobErrors' },
                        key: { type: 'job-error' },
                    },
                ],
            },
            {
                type: 'job_comm_error',
                message: {
                    job_id_list: [
                        'job_1_RetryWithErrors',
                        'job_2_RetryWithErrors',
                        'job_3_RetryWithErrors',
                    ],
                    message: 'multiple job error message',
                    source: 'retry_job',
                    code: 'RED',
                },
                expectedMultiple: [
                    [
                        {
                            jobId: 'job_1_RetryWithErrors',
                            error: {
                                job_id_list: [
                                    'job_1_RetryWithErrors',
                                    'job_2_RetryWithErrors',
                                    'job_3_RetryWithErrors',
                                ],
                                message: 'multiple job error message',
                                source: 'retry_job',
                                code: 'RED',
                            },
                            request: 'retry_job',
                        },
                        {
                            channel: { jobId: 'job_1_RetryWithErrors' },
                            key: { type: 'job-error' },
                        },
                    ],
                    [
                        {
                            jobId: 'job_2_RetryWithErrors',
                            error: {
                                job_id_list: [
                                    'job_1_RetryWithErrors',
                                    'job_2_RetryWithErrors',
                                    'job_3_RetryWithErrors',
                                ],
                                message: 'multiple job error message',
                                source: 'retry_job',
                                code: 'RED',
                            },
                            request: 'retry_job',
                        },
                        {
                            channel: { jobId: 'job_2_RetryWithErrors' },
                            key: { type: 'job-error' },
                        },
                    ],
                    [
                        {
                            jobId: 'job_3_RetryWithErrors',
                            error: {
                                job_id_list: [
                                    'job_1_RetryWithErrors',
                                    'job_2_RetryWithErrors',
                                    'job_3_RetryWithErrors',
                                ],
                                message: 'multiple job error message',
                                source: 'retry_job',
                                code: 'RED',
                            },
                            request: 'retry_job',
                        },
                        {
                            channel: { jobId: 'job_3_RetryWithErrors' },
                            key: { type: 'job-error' },
                        },
                    ],
                ],
            },
        ];

        busTests.forEach((test) => {
            it(`should send a ${test.type} message to the bus`, () => {
                const msg = makeCommMsg(test.type, test.message),
                    comm = new JobCommChannel();
                spyOn(testBus, 'send');
                return comm.initCommChannel().then(() => {
                    comm.handleCommMessages(msg);
                    if (test.expectedMultiple) {
                        expect(testBus.send.calls.allArgs()).toEqual(
                            jasmine.arrayWithExactContents(test.expectedMultiple)
                        );
                    } else if (test.expected) {
                        expect(testBus.send.calls.allArgs()).toEqual([test.expected]);
                    }
                });
            });
        });

        ['job_init_err', 'job_init_lookup_err'].forEach((errType) => {
            it(`Should handle ${errType}`, () => {
                const modalQuerySelector = '.modal #kb-job-err-trace';
                const msg = makeCommMsg(errType, {
                        service: 'job service',
                        error: 'An error happened!',
                        name: 'Error',
                        source: 'jobmanager',
                    }),
                    comm = new JobCommChannel();
                return comm
                    .initCommChannel()
                    .then(() => {
                        comm.handleCommMessages(msg);
                        return TestUtil.waitForElement(document.body, modalQuerySelector);
                    })
                    .then(() => {
                        expect(document.querySelector(modalQuerySelector)).not.toBeNull();
                        // click the 'OK' button
                        document
                            .querySelector('.modal a.btn.btn-default.kb-job-err-dialog__button')
                            .click();
                        // expect it to be gone
                        return TestUtil.waitForElementState(document.body, () => {
                            return document.querySelectorAll('.modal').length === 0;
                        });
                    })
                    .then(() => {
                        expect(document.querySelector(modalQuerySelector)).toBeNull();
                    });
            });
        });

        it('Should handle unknown messages with console warnings', () => {
            const comm = new JobCommChannel(),
                msg = makeCommMsg('unknown_weird_msg', {});
            return comm.initCommChannel().then(() => {
                spyOn(console, 'warn');
                comm.handleCommMessages(msg);
                expect(console.warn).toHaveBeenCalled();
            });
        });
    });
});
