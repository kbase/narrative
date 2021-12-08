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

    const JobCommChannel = JobComms.JobCommChannel,
        jcm = JobComms.JobCommMessages;

    const TEST_JOB_ID = 'someJob',
        TEST_JOB_LIST = [TEST_JOB_ID, 'anotherJob', 'aThirdJob'];

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
            jobState: curr,
            outputWidgetInfo: {},
        };
        return acc;
    };

    const convertToJobStateBusMessage = (job) => {
        return [
            {
                jobState: job,
                outputWidgetInfo: {},
            },
            {
                channel: { jobId: job.job_id },
                key: { type: jcm.RESPONSES.STATUS },
            },
        ];
    };

    describe('The jobCommChannel widget', () => {
        let testBus;
        beforeEach(() => {
            testBus = Runtime.make().bus();
            Jupyter.notebook = makeMockNotebook();
        });

        afterEach(() => {
            TestUtil.clearRuntime();
            Jupyter.notebook = null;
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

        const messagesToSend = [
            [jcm.REQUESTS.STATUS, { jobId: 0 }],
            [jcm.REQUESTS.STATUS, { jobId: 1 }],
            [jcm.REQUESTS.STATUS, { jobId: 2 }],
        ];
        const messagesInQueue = messagesToSend.map((arg) => {
            return {
                msgType: arg[0],
                msgData: arg[1],
            };
        });
        const messagesSent = [0, 1, 2].map((num) => {
            return [
                {
                    target_name: 'KBaseJobs',
                    request_type: jcm.BACKEND_REQUESTS.STATUS,
                    job_id: num,
                },
            ];
        });

        it('should not lose messages if the comm channel is not inited', () => {
            const comm = new JobCommChannel();
            expect(comm.comm).toBeUndefined();

            // send three messages over the channel
            // expect all three to be stored in comm.messageQueue
            return new Promise((resolve) => {
                spyOn(comm, 'sendCommMessage').and.callFake(async (...args) => {
                    // expect sendCommMessage to throw an error
                    await expectAsync(
                        comm.sendCommMessage.and.originalFn.call(comm, ...args)
                    ).toBeRejectedWithError(
                        'ERROR sending comm message: ' + comm.ERROR_COMM_CHANNEL_NOT_INIT
                    );
                    // resolve the promise on receiving the last message
                    if (args[1].jobId === 2) {
                        resolve();
                    }
                });
                messagesToSend.forEach((msg) => {
                    testBus.emit(...msg);
                });
            }).then(() => {
                expect(comm.sendCommMessage).toHaveBeenCalledTimes(messagesToSend.length);
                expect(comm.sendCommMessage.calls.allArgs()).toEqual(messagesToSend);
                expect(comm.messageQueue).toEqual(messagesInQueue);
            });
        });

        it('should send any stored messages on initing the comm channel', () => {
            const comm = new JobCommChannel();
            expect(comm.comm).toBeUndefined();
            // send three messages over the bus
            // init the comm channel after the last message
            // all messages should generate an error and be stored
            // when the channel is initialised, the stored messages will be sent
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
                    const { jobId } = args[1];
                    // original function should throw an error
                    await expectAsync(
                        comm.sendCommMessage.and.originalFn.call(comm, ...args)
                    ).toBeRejectedWithError(
                        'ERROR sending comm message: ' + comm.ERROR_COMM_CHANNEL_NOT_INIT
                    );
                    // resolve the promise on receiving the last message
                    if (jobId === 2) {
                        resolve();
                    }
                });
                // emit the messages
                messagesToSend.forEach((msg) => {
                    testBus.emit(...msg);
                });
            }).then(() => {
                // all messages will be stored
                expect(comm.messageQueue).toEqual(messagesInQueue);
                // init the comm channel, which will send everything in the message queue
                return comm.initCommChannel().then(() => {
                    expect(comm.comm).not.toBeNull();
                    expect(comm.sendCommMessage).toHaveBeenCalledTimes(messagesToSend.length + 1);
                    // the last call comes from comm.initCommChannel, and has no args
                    expect(comm.sendCommMessage.calls.allArgs()).toEqual(
                        messagesToSend.concat([[]])
                    );

                    expect(comm.comm.send).toHaveBeenCalled();
                    expect(comm.comm.send.calls.allArgs()).toEqual(messagesSent);
                });
            });
        });

        it('should send new and stored messages after initing the channel', () => {
            const comm = new JobCommChannel();
            expect(comm.comm).toBeUndefined();
            // send three messages over the bus
            // init the comm channel after the second message
            // the first two messages should generate an error and be stored
            // the third message should be processed successfully
            return new Promise((resolve) => {
                spyOn(comm, 'sendCommMessage').and.callFake(async (...args) => {
                    if (!args.length) {
                        if (comm.comm) {
                            spyOn(comm.comm, 'send');
                        }
                        return comm.sendCommMessage.and.originalFn.call(comm, ...args);
                    }
                    const { jobId } = args[1];
                    if (jobId < 2) {
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
                    // resolve the promise on receiving the second message
                    // this allows the test to progress to the next "then"
                    if (jobId === 1) {
                        resolve();
                    }
                });
                // emit the first two messages
                [0, 1].forEach((ix) => {
                    testBus.emit(...messagesToSend[ix]);
                });
            }).then(() => {
                // first two messages will be stored
                expect(comm.messageQueue).toEqual(messagesInQueue.slice(0, 2));
                // init the comm channel and send the last message
                return comm.initCommChannel().then(() => {
                    expect(comm.comm).not.toBeNull();
                    return new Promise((resolve) => {
                        // resolve the promise when we see comm.comm.send(...)
                        spyOn(comm.comm, 'send').and.callFake(() => {
                            resolve();
                        });
                        // emit the last message
                        testBus.emit(...messagesToSend[2]);
                    }).then(() => {
                        expect(comm.sendCommMessage).toHaveBeenCalledTimes(
                            messagesToSend.length + 1
                        );
                        expect(comm.sendCommMessage.calls.allArgs()).toEqual([
                            messagesToSend[0],
                            messagesToSend[1],
                            [],
                            messagesToSend[2],
                        ]);

                        expect(comm.comm.send).toHaveBeenCalled();
                        expect(comm.comm.send.calls.allArgs()).toEqual(messagesSent);
                    });
                });
            });
        });

        const busMsgCases = [
            {
                channel: jcm.REQUESTS.LOGS,
                message: { jobId: TEST_JOB_ID },
                expected: {
                    request_type: jcm.BACKEND_REQUESTS.LOGS,
                    job_id: TEST_JOB_ID,
                },
            },
            {
                channel: jcm.REQUESTS.LOGS,
                message: {
                    jobId: TEST_JOB_ID,
                    latest: true,
                },
                expected: {
                    request_type: jcm.BACKEND_REQUESTS.LOGS,
                    job_id: TEST_JOB_ID,
                    latest: true,
                },
            },
            {
                channel: jcm.REQUESTS.LOGS,
                message: {
                    jobId: TEST_JOB_ID,
                    first_line: 2000,
                    latest: true,
                },
                expected: {
                    request_type: jcm.BACKEND_REQUESTS.LOGS,
                    job_id: TEST_JOB_ID,
                    first_line: 2000,
                    latest: true,
                },
            },
            {
                channel: jcm.REQUESTS.CANCEL,
                message: { jobId: TEST_JOB_ID },
                expected: { request_type: jcm.BACKEND_REQUESTS.CANCEL, job_id: TEST_JOB_ID },
            },
            {
                channel: jcm.REQUESTS.CANCEL,
                message: { jobIdList: TEST_JOB_LIST },
                expected: { request_type: jcm.BACKEND_REQUESTS.CANCEL, job_id_list: TEST_JOB_LIST },
            },
            {
                channel: jcm.REQUESTS.RETRY,
                message: { jobId: TEST_JOB_ID },
                expected: { request_type: jcm.BACKEND_REQUESTS.RETRY, job_id: TEST_JOB_ID },
            },
            {
                channel: jcm.REQUESTS.RETRY,
                message: { jobIdList: TEST_JOB_LIST },
                expected: { request_type: jcm.BACKEND_REQUESTS.RETRY, job_id_list: TEST_JOB_LIST },
            },
        ];

        const batchRequests = ['INFO', 'STATUS', 'START_UPDATE', 'STOP_UPDATE'];
        // all these can have a single job ID, a job ID list, or a batch ID as input
        batchRequests.forEach((type) => {
            busMsgCases.push(
                {
                    channel: jcm.REQUESTS[type],
                    message: { jobId: TEST_JOB_ID },
                    expected: {
                        request_type: jcm.BACKEND_REQUESTS[type],
                        job_id: TEST_JOB_ID,
                    },
                },
                {
                    channel: jcm.REQUESTS[type],
                    message: { jobIdList: TEST_JOB_LIST },
                    expected: {
                        request_type: jcm.BACKEND_REQUESTS[type],
                        job_id_list: TEST_JOB_LIST,
                    },
                },
                {
                    channel: jcm.REQUESTS[type],
                    message: { batchId: 'batch_job' },
                    expected: {
                        request_type: `${jcm.BACKEND_REQUESTS[type]}_batch`,
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

        it('should handle unrecognised message types', async () => {
            const comm = new JobCommChannel();
            await comm.initCommChannel();

            await expectAsync(
                comm.sendCommMessage('unknown', { jobId: TEST_JOB_ID })
            ).toBeRejectedWithError(
                'ERROR sending comm message: Ignoring unknown message type "unknown"'
            );
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
            spyOn(Jupyter.notebook, 'save_checkpoint');
            return comm.initCommChannel().then(() => {
                comm.handleCommMessages(makeCommMsg('new_job', {}));
                expect(Jupyter.notebook.save_checkpoint).toHaveBeenCalled();
            });
        });

        const tests = [
            ['null', null],
            ['undefined', undefined],
            ['number', 123456],
            ['string', 'string'],
            ['string', ''],
            ['array', [1, 2, 3]],
        ];
        tests.forEach((test) => {
            const [type, sample] = test;
            it(`should reject responses with ${type} content`, () => {
                const comm = new JobCommChannel();
                spyOn(comm, 'reportCommMessageError');
                return comm.initCommChannel().then(() => {
                    comm.handleCommMessages(makeCommMsg(jcm.BACKEND_RESPONSES.JOB_STATUS, sample));
                    expect(comm.reportCommMessageError.calls.allArgs()).toEqual([
                        [{ msgType: jcm.BACKEND_RESPONSES.JOB_STATUS, msgData: sample }],
                    ]);
                });
            });
        });

        const busTests = [
            {
                type: jcm.BACKEND_RESPONSES.RUN_STATUS,
                message: { job_id: TEST_JOB_ID, cell_id: 'bar' },
                expected: [
                    { job_id: TEST_JOB_ID, cell_id: 'bar' },
                    {
                        channel: { cell: 'bar' },
                        key: { type: jcm.RESPONSES.RUN_STATUS },
                    },
                ],
            },
            {
                // info for a single job
                type: jcm.BACKEND_RESPONSES.INFO,
                message: (() => {
                    const output = {};
                    output[JobsData.example.Info.valid[0].job_id] = JobsData.example.Info.valid[0];
                    return output;
                })(),
                expected: [
                    JobsData.example.Info.valid[0],
                    {
                        channel: { jobId: JobsData.example.Info.valid[0].job_id },
                        key: { type: jcm.RESPONSES.INFO },
                    },
                ],
            },
            {
                // info multiple jobs
                type: jcm.BACKEND_RESPONSES.INFO,
                message: JobsData.example.Info.valid.reduce((acc, curr) => {
                    acc[curr.job_id] = curr;
                    return acc;
                }, {}),
                expectedMultiple: JobsData.example.Info.valid.map((info) => {
                    return [
                        info,
                        {
                            channel: { jobId: info.job_id },
                            key: { type: jcm.RESPONSES.INFO },
                        },
                    ];
                }),
            },
            {
                type: jcm.BACKEND_RESPONSES.LOGS,
                message: {
                    someJob: JobsData.example.Logs.valid[0],
                },
                expected: [
                    JobsData.example.Logs.valid[0],
                    {
                        channel: { jobId: TEST_JOB_ID },
                        key: { type: jcm.RESPONSES.LOGS },
                    },
                ],
            },
            {
                type: jcm.BACKEND_RESPONSES.RETRY,
                message: (() => {
                    const retryData = {};
                    JobsData.example.Retry.valid.forEach((retry) => {
                        retryData[retry.job.jobState.job_id] = retry;
                    });
                    return retryData;
                })(),
                expectedMultiple: [
                    [
                        JobsData.example.Retry.valid[0],
                        {
                            channel: { jobId: JobsData.example.Retry.valid[0].job.jobState.job_id },
                            key: { type: jcm.RESPONSES.RETRY },
                        },
                    ],
                    [
                        JobsData.example.Retry.valid[1],
                        {
                            channel: { jobId: JobsData.example.Retry.valid[1].job.jobState.job_id },
                            key: { type: jcm.RESPONSES.RETRY },
                        },
                    ],
                ],
            },
            {
                // single job status message
                type: jcm.BACKEND_RESPONSES.STATUS,
                message: (() => {
                    const output = {};
                    output[JobsData.allJobs[0].job_id] = {
                        jobState: JobsData.allJobs[0],
                        outputWidgetInfo: {},
                    };
                    return output;
                })(),
                expected: [
                    {
                        jobState: JobsData.allJobs[0],
                        outputWidgetInfo: {},
                    },
                    {
                        channel: { jobId: JobsData.allJobs[0].job_id },
                        key: { type: jcm.RESPONSES.STATUS },
                    },
                ],
            },
            {
                // single job status message, ee2 error
                type: jcm.BACKEND_RESPONSES.STATUS,
                message: {
                    someJob: {
                        jobState: {
                            job_id: TEST_JOB_ID,
                            status: 'ee2_error',
                        },
                    },
                },
                expected: [
                    {
                        jobState: {
                            job_id: TEST_JOB_ID,
                            status: 'ee2_error',
                        },
                    },
                    {
                        channel: { jobId: TEST_JOB_ID },
                        key: { type: jcm.RESPONSES.STATUS },
                    },
                ],
            },
            {
                // more than one job, indexed by job ID
                type: jcm.BACKEND_RESPONSES.STATUS,
                message: JobsData.allJobs.reduce(convertToJobState, {}),
                expectedMultiple: JobsData.allJobs.map(convertToJobStateBusMessage),
            },
            {
                // OK job and an errored job
                type: jcm.BACKEND_RESPONSES.STATUS,
                message: JobsData.allJobs
                    .concat({
                        job_id: '1234567890abcdef',
                        status: 'does_not_exist',
                    })
                    .reduce(convertToJobState, {}),
                expectedMultiple: JobsData.allJobs.map(convertToJobStateBusMessage).concat([
                    [
                        {
                            jobState: {
                                job_id: '1234567890abcdef',
                                status: 'does_not_exist',
                            },
                            outputWidgetInfo: {},
                        },
                        {
                            channel: { jobId: '1234567890abcdef' },
                            key: { type: jcm.RESPONSES.STATUS },
                        },
                    ],
                ]),
            },
            {
                type: jcm.BACKEND_RESPONSES.STATUS_ALL,
                message: JobsData.allJobsWithBatchParent.reduce(convertToJobState, {}),
                expectedMultiple: JobsData.allJobsWithBatchParent.map(convertToJobStateBusMessage),
            },
            {
                type: jcm.BACKEND_RESPONSES.ERROR,
                message: {
                    job_id: TEST_JOB_ID,
                    message: 'cancel error',
                    source: 'cancel_job',
                    code: 'RED',
                },
                expected: [
                    {
                        jobId: TEST_JOB_ID,
                        error: {
                            job_id: TEST_JOB_ID,
                            message: 'cancel error',
                            source: 'cancel_job',
                            code: 'RED',
                        },
                        request: 'cancel_job',
                    },
                    {
                        channel: { jobId: TEST_JOB_ID },
                        key: { type: jcm.RESPONSES.ERROR },
                    },
                ],
            },
            {
                type: jcm.BACKEND_RESPONSES.ERROR,
                message: {
                    job_id: TEST_JOB_ID,
                    message: 'log error',
                    source: 'job_logs',
                    code: -32000,
                },
                expected: [
                    {
                        jobId: TEST_JOB_ID,
                        error: {
                            job_id: TEST_JOB_ID,
                            message: 'log error',
                            source: 'job_logs',
                            code: -32000,
                        },
                        request: 'job_logs',
                    },
                    {
                        channel: { jobId: TEST_JOB_ID },
                        key: { type: jcm.RESPONSES.LOGS },
                    },
                ],
            },
            {
                // unrecognised error type
                type: jcm.BACKEND_RESPONSES.ERROR,
                message: {
                    source: 'some-unknown-error',
                    job_id: TEST_JOB_ID,
                    message: 'some random error',
                    code: 404,
                },
                expected: [
                    {
                        jobId: TEST_JOB_ID,
                        error: {
                            source: 'some-unknown-error',
                            job_id: TEST_JOB_ID,
                            message: 'some random error',
                            code: 404,
                        },
                        request: 'some-unknown-error',
                    },
                    {
                        channel: { jobId: TEST_JOB_ID },
                        key: { type: jcm.RESPONSES.ERROR },
                    },
                ],
            },
            {
                type: jcm.BACKEND_RESPONSES.ERROR,
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
                            key: { type: jcm.RESPONSES.ERROR },
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
                            key: { type: jcm.RESPONSES.ERROR },
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
                            key: { type: jcm.RESPONSES.ERROR },
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

        ['JobState', 'Info', 'Retry', 'Logs'].forEach((type) => {
            const ucType = type === 'JobState' ? 'STATUS' : type.toUpperCase();
            const msgType = jcm.BACKEND_RESPONSES[ucType];
            const values = JobsData.example[type].invalid;

            values.forEach((value) => {
                it(`should not send a ${msgType} message if the data is invalid`, () => {
                    const jobData = {};
                    jobData[TEST_JOB_ID] = value;
                    const msg = makeCommMsg(msgType, jobData),
                        comm = new JobCommChannel();
                    return comm.initCommChannel().then(() => {
                        spyOn(comm, 'reportCommMessageError');
                        spyOn(console, 'error');
                        comm.handleCommMessages(msg);
                        expect(comm.reportCommMessageError.calls.allArgs()).toEqual([
                            [{ msgType, msgData: value }],
                        ]);
                    });
                });
            });

            if (type !== 'Logs') {
                it(`should not send a ${msgType} message with invalid data`, () => {
                    const allMsgData = {};
                    values.forEach((val, ix) => {
                        allMsgData[`test_job_${ix}`] = val;
                    });
                    const msg = makeCommMsg(msgType, allMsgData),
                        comm = new JobCommChannel();
                    return comm.initCommChannel().then(() => {
                        spyOn(comm, 'reportCommMessageError');
                        spyOn(console, 'error');
                        comm.handleCommMessages(msg);
                        expect(comm.reportCommMessageError.calls.allArgs()).toEqual(
                            values.map((msgData) => {
                                return [{ msgType, msgData }];
                            })
                        );
                    });
                });
            }
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
