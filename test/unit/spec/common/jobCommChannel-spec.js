define([
    'common/jobCommChannel',
    'common/jobCommMessages',
    'base/js/namespace',
    'common/runtime',
    '/test/data/jobsData',
    'testUtil',
    'narrativeMocks',
    'json!/src/biokbase/narrative/tests/data/response_data.json',
], (JobCommChannel, jcm, Jupyter, Runtime, JobsData, TestUtil, Mocks, ResponseData) => {
    'use strict';

    // allow spies to be overwritten
    jasmine.getEnv().allowRespy(true);

    const TEST_JOB_ID = 'someJob',
        TEST_JOB_LIST = [TEST_JOB_ID, 'anotherJob', 'aThirdJob'],
        ERROR_STR = 'Some error string';

    const { JOB_ID, JOB_ID_LIST, BATCH_ID } = jcm.PARAM,
        JOB_CHANNEL = jcm.CHANNEL.JOB,
        CELL_CHANNEL = jcm.CHANNEL.CELL;

    function makeMockNotebook(commInfoReturn, registerTargetReturn, executeReply, cells = []) {
        return Mocks.buildMockNotebook({
            commInfoReturn,
            registerTargetReturn,
            executeReply,
            cells,
        });
    }

    function makeCommMsg(msg_type, content) {
        return {
            content: {
                data: {
                    msg_type,
                    content,
                },
            },
        };
    }

    const convertToJobState = (acc, curr) => {
        acc[curr.job_id] = {
            [JOB_ID]: curr.job_id,
            jobState: curr,
            outputWidgetInfo: {},
        };
        return acc;
    };

    const convertToJobStateBusMessage = (job) => {
        return [
            {
                [JOB_ID]: job.job_id,
                jobState: job,
                outputWidgetInfo: {},
            },
            {
                channel: { [JOB_CHANNEL]: job.job_id },
                key: { type: jcm.MESSAGE_TYPE.STATUS },
            },
        ];
    };

    describe('The JobCommChannel', () => {
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

        describe('start up', () => {
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
                    evalue: ERROR_STR,
                    error: 'Yes. Very yes.',
                });
                const comm = new JobCommChannel();
                expect(comm.comm).toBeUndefined();
                await expectAsync(comm.initCommChannel()).toBeRejectedWith(
                    new Error(`Failed to start: ${ERROR_STR}`)
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
                [jcm.MESSAGE_TYPE.STATUS, { [JOB_ID]: 0 }],
                [jcm.MESSAGE_TYPE.STATUS, { [JOB_ID]: 1 }],
                [jcm.MESSAGE_TYPE.STATUS, { [JOB_ID]: 2 }],
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
                        request_type: jcm.MESSAGE_TYPE.STATUS,
                        [JOB_ID]: num,
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
                        if (args[1][JOB_ID] === 2) {
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
                        const jobId = args[1][JOB_ID];
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
                        expect(comm.sendCommMessage).toHaveBeenCalledTimes(
                            messagesToSend.length + 1
                        );
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
                        const jobId = args[1][JOB_ID];
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
        });
        describe('bus messages', () => {
            const busMsgCases = [
                {
                    channel: jcm.MESSAGE_TYPE.LOGS,
                    message: { [JOB_ID]: TEST_JOB_ID },
                    expected: {
                        request_type: jcm.MESSAGE_TYPE.LOGS,
                        [JOB_ID]: TEST_JOB_ID,
                    },
                },
                {
                    channel: jcm.MESSAGE_TYPE.LOGS,
                    message: {
                        [JOB_ID]: TEST_JOB_ID,
                        latest: true,
                    },
                    expected: {
                        request_type: jcm.MESSAGE_TYPE.LOGS,
                        [JOB_ID]: TEST_JOB_ID,
                        latest: true,
                    },
                },
                {
                    channel: jcm.MESSAGE_TYPE.LOGS,
                    message: {
                        [JOB_ID]: TEST_JOB_ID,
                        first_line: 2000,
                        latest: true,
                    },
                    expected: {
                        request_type: jcm.MESSAGE_TYPE.LOGS,
                        [JOB_ID]: TEST_JOB_ID,
                        first_line: 2000,
                        latest: true,
                    },
                },
                {
                    channel: jcm.MESSAGE_TYPE.CANCEL,
                    message: { [JOB_ID]: TEST_JOB_ID },
                    expected: {
                        request_type: jcm.MESSAGE_TYPE.CANCEL,
                        [JOB_ID]: TEST_JOB_ID,
                    },
                },
                {
                    channel: jcm.MESSAGE_TYPE.CANCEL,
                    message: { [JOB_ID_LIST]: TEST_JOB_LIST },
                    expected: {
                        request_type: jcm.MESSAGE_TYPE.CANCEL,
                        [JOB_ID_LIST]: TEST_JOB_LIST,
                    },
                },
                {
                    channel: jcm.MESSAGE_TYPE.RETRY,
                    message: { [JOB_ID]: TEST_JOB_ID },
                    expected: {
                        request_type: jcm.MESSAGE_TYPE.RETRY,
                        [JOB_ID]: TEST_JOB_ID,
                    },
                },
                {
                    channel: jcm.MESSAGE_TYPE.RETRY,
                    message: { [JOB_ID_LIST]: TEST_JOB_LIST },
                    expected: {
                        request_type: jcm.MESSAGE_TYPE.RETRY,
                        [JOB_ID_LIST]: TEST_JOB_LIST,
                    },
                },
            ];

            const batchRequests = ['INFO', 'STATUS', 'START_UPDATE', 'STOP_UPDATE'];
            // all these can have a single job ID, a job ID list, or a batch ID as input
            batchRequests.forEach((type) => {
                busMsgCases.push(
                    {
                        channel: jcm.MESSAGE_TYPE[type],
                        message: { [JOB_ID]: TEST_JOB_ID },
                        expected: {
                            request_type: jcm.MESSAGE_TYPE[type],
                            [JOB_ID]: TEST_JOB_ID,
                        },
                    },
                    {
                        channel: jcm.MESSAGE_TYPE[type],
                        message: { [JOB_ID_LIST]: TEST_JOB_LIST },
                        expected: {
                            request_type: jcm.MESSAGE_TYPE[type],
                            [JOB_ID_LIST]: TEST_JOB_LIST,
                        },
                    },
                    {
                        channel: jcm.MESSAGE_TYPE[type],
                        message: { [BATCH_ID]: 'batch_job' },
                        expected: {
                            request_type: `${jcm.MESSAGE_TYPE[type]}`,
                            [BATCH_ID]: 'batch_job',
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
                    comm.sendCommMessage('unknown', { [JOB_CHANNEL]: TEST_JOB_ID })
                ).toBeRejectedWithError(
                    'ERROR sending comm message: Ignoring unknown message type "unknown"'
                );
            });
        });
        describe('messages from the kernel', () => {
            /*
             * Mocking out comm messages coming back over the channel is gruesome. Just
             * calling the handleCommMessage function directly.
             */
            it(`Should respond to ${jcm.MESSAGE_TYPE.NEW} by saving the Narrative`, () => {
                const comm = new JobCommChannel();
                spyOn(Jupyter.notebook, 'save_checkpoint');
                return comm.initCommChannel().then(() => {
                    comm.handleCommMessages(makeCommMsg(jcm.MESSAGE_TYPE.NEW, {}));
                    expect(Jupyter.notebook.save_checkpoint).toHaveBeenCalled();
                });
            });

            ['job-status', 'start', 'error', 'NEW', jcm.MESSAGE_TYPE.CANCEL].forEach((type) => {
                it(`should reject invalid message type ${type}`, () => {
                    const comm = new JobCommChannel();
                    spyOn(comm, 'reportCommMessageError');
                    return comm.initCommChannel().then(() => {
                        comm.handleCommMessages(makeCommMsg(type, null));
                        expect(comm.reportCommMessageError.calls.allArgs()).toEqual([
                            [{ msgType: type, msgData: null }],
                        ]);
                    });
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
                        comm.handleCommMessages(makeCommMsg(jcm.MESSAGE_TYPE.STATUS, sample));
                        expect(comm.reportCommMessageError.calls.allArgs()).toEqual([
                            [{ msgType: jcm.MESSAGE_TYPE.STATUS, msgData: sample }],
                        ]);
                    });
                });
            });

            const busTests = [
                {
                    type: jcm.MESSAGE_TYPE.RUN_STATUS,
                    message: {
                        event: 'launched_job',
                        event_at: 12345,
                        job_id: TEST_JOB_ID,
                        cell_id: 'bar',
                        run_id: 54321,
                    },
                    expected: [
                        {
                            event: 'launched_job',
                            event_at: 12345,
                            job_id: TEST_JOB_ID,
                            cell_id: 'bar',
                            run_id: 54321,
                        },
                        {
                            channel: { [CELL_CHANNEL]: 'bar' },
                            key: { type: jcm.MESSAGE_TYPE.RUN_STATUS },
                        },
                    ],
                },
                {
                    // info multiple jobs
                    type: jcm.MESSAGE_TYPE.INFO,
                    message: ResponseData[jcm.MESSAGE_TYPE.INFO],
                    expectedMultiple: Object.values(ResponseData[jcm.MESSAGE_TYPE.INFO]).map(
                        (info) => {
                            return [
                                info,
                                {
                                    channel: { [JOB_CHANNEL]: info.job_id },
                                    key: { type: jcm.MESSAGE_TYPE.INFO },
                                },
                            ];
                        }
                    ),
                },
                {
                    // status for multiple jobs
                    type: jcm.MESSAGE_TYPE.STATUS,
                    message: ResponseData[jcm.MESSAGE_TYPE.STATUS],
                    expectedMultiple: Object.values(ResponseData[jcm.MESSAGE_TYPE.STATUS]).map(
                        (status) => {
                            return [
                                status,
                                {
                                    channel: { [JOB_CHANNEL]: status.job_id },
                                    key: { type: jcm.MESSAGE_TYPE.STATUS },
                                },
                            ];
                        }
                    ),
                },
                {
                    // logs for multiple jobs
                    type: jcm.MESSAGE_TYPE.LOGS,
                    message: ResponseData[jcm.MESSAGE_TYPE.LOGS],
                    expectedMultiple: Object.values(ResponseData[jcm.MESSAGE_TYPE.LOGS]).map(
                        (logs) => {
                            return [
                                logs,
                                {
                                    channel: { [JOB_CHANNEL]: logs.job_id },
                                    key: { type: jcm.MESSAGE_TYPE.LOGS },
                                },
                            ];
                        }
                    ),
                },
                {
                    // retry multiple jobs
                    type: jcm.MESSAGE_TYPE.RETRY,
                    message: ResponseData[jcm.MESSAGE_TYPE.RETRY],
                    expectedMultiple: Object.values(ResponseData[jcm.MESSAGE_TYPE.RETRY]).map(
                        (retry) => {
                            return [
                                retry,
                                {
                                    channel: { [JOB_CHANNEL]: retry.job_id },
                                    key: { type: jcm.MESSAGE_TYPE.RETRY },
                                },
                            ];
                        }
                    ),
                },
                {
                    type: jcm.MESSAGE_TYPE.STATUS_ALL,
                    message: JobsData.allJobsWithBatchParent.reduce(convertToJobState, {}),
                    expectedMultiple: JobsData.allJobsWithBatchParent.map(
                        convertToJobStateBusMessage
                    ),
                },
                {
                    type: jcm.MESSAGE_TYPE.ERROR,
                    message: {
                        job_id: TEST_JOB_ID,
                        message: 'cancel error',
                        source: 'cancel_job',
                        code: 'RED',
                    },
                    expected: [
                        {
                            [JOB_ID]: TEST_JOB_ID,
                            error: {
                                job_id: TEST_JOB_ID,
                                message: 'cancel error',
                                source: 'cancel_job',
                                code: 'RED',
                            },
                            request: 'cancel_job',
                        },
                        {
                            channel: { [JOB_CHANNEL]: TEST_JOB_ID },
                            key: { type: jcm.MESSAGE_TYPE.ERROR },
                        },
                    ],
                },
                {
                    // unrecognised error type
                    type: jcm.MESSAGE_TYPE.ERROR,
                    message: {
                        source: 'some-unknown-error',
                        job_id: TEST_JOB_ID,
                        message: 'some random error',
                        code: 404,
                    },
                    expected: [
                        {
                            [JOB_ID]: TEST_JOB_ID,
                            error: {
                                source: 'some-unknown-error',
                                job_id: TEST_JOB_ID,
                                message: 'some random error',
                                code: 404,
                            },
                            request: 'some-unknown-error',
                        },
                        {
                            channel: { [JOB_CHANNEL]: TEST_JOB_ID },
                            key: { type: jcm.MESSAGE_TYPE.ERROR },
                        },
                    ],
                },
                {
                    type: jcm.MESSAGE_TYPE.ERROR,
                    message: {
                        [JOB_ID_LIST]: [
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
                                [JOB_ID]: 'job_1_RetryWithErrors',
                                error: {
                                    [JOB_ID_LIST]: [
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
                                channel: { [JOB_CHANNEL]: 'job_1_RetryWithErrors' },
                                key: { type: jcm.MESSAGE_TYPE.ERROR },
                            },
                        ],
                        [
                            {
                                [JOB_ID]: 'job_2_RetryWithErrors',
                                error: {
                                    [JOB_ID_LIST]: [
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
                                channel: { [JOB_CHANNEL]: 'job_2_RetryWithErrors' },
                                key: { type: jcm.MESSAGE_TYPE.ERROR },
                            },
                        ],
                        [
                            {
                                [JOB_ID]: 'job_3_RetryWithErrors',
                                error: {
                                    [JOB_ID_LIST]: [
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
                                channel: { [JOB_CHANNEL]: 'job_3_RetryWithErrors' },
                                key: { type: jcm.MESSAGE_TYPE.ERROR },
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

            ['STATUS', 'INFO', 'RETRY', 'LOGS'].forEach((type) => {
                const msgType = jcm.MESSAGE_TYPE[type];
                const validAndInvalidData = {},
                    expected = {};
                let i = 0;
                ['valid', 'invalid'].forEach((validity) => {
                    expected[validity] = {};
                    JobsData.example[type][validity].forEach((elem) => {
                        validAndInvalidData[`job_${i}`] = elem;
                        expected[validity][`job_${i}`] = elem;
                        i++;
                    });
                });

                // message containing data for one job
                JobsData.example[type].invalid.forEach((value) => {
                    it(`should not send a ${msgType} message, one job, invalid`, () => {
                        const comm = new JobCommChannel(),
                            msgData = { [TEST_JOB_ID]: value },
                            msg = makeCommMsg(msgType, msgData);

                        return comm.initCommChannel().then(() => {
                            spyOn(comm, 'reportCommMessageError');
                            spyOn(console, 'error');
                            comm.handleCommMessages(msg);
                            expect(comm.reportCommMessageError.calls.allArgs()).toEqual([
                                [{ msgType, msgData }],
                            ]);
                        });
                    });
                });

                // message where all data is invalid
                it(`should not send a ${msgType} message, many jobs, invalid`, () => {
                    const msg = makeCommMsg(msgType, expected.invalid),
                        comm = new JobCommChannel();
                    return comm.initCommChannel().then(() => {
                        spyOn(comm, 'reportCommMessageError');
                        spyOn(console, 'error');
                        comm.handleCommMessages(msg);
                        expect(comm.reportCommMessageError.calls.allArgs()).toEqual([
                            [{ msgType, msgData: expected.invalid }],
                        ]);
                    });
                });

                // message with a mix of valid and invalid data
                it(`should separate out valid and invalid ${type} data`, () => {
                    const msg = makeCommMsg(msgType, validAndInvalidData),
                        comm = new JobCommChannel();
                    return comm.initCommChannel().then(() => {
                        spyOn(comm, 'reportCommMessageError');
                        spyOn(console, 'error');
                        spyOn(testBus, 'send');
                        comm.handleCommMessages(msg);
                        expect(comm.reportCommMessageError.calls.allArgs()).toEqual([
                            [{ msgType, msgData: expected.invalid }],
                        ]);

                        const expectedMessages = Object.keys(expected.valid).map((key) => {
                            return [
                                expected.valid[key],
                                {
                                    channel: { [JOB_CHANNEL]: key },
                                    key: { type: msgType },
                                },
                            ];
                        });

                        expect(testBus.send.calls.allArgs()).toEqual(
                            jasmine.arrayWithExactContents(expectedMessages)
                        );
                    });
                });
            });
        });

        describe('job mapping', () => {
            const statusData = ResponseData[jcm.MESSAGE_TYPE.STATUS];
            // generate the expected mapping
            const responseDataMapping = {};
            Object.values(statusData).forEach((job) => {
                const jobId = job[jcm.PARAM.JOB_ID];
                if (job.jobState && job.jobState.batch_id) {
                    responseDataMapping[jobId] = { [jcm.PARAM.BATCH_ID]: job.jobState.batch_id };
                } else {
                    responseDataMapping[jobId] = { [jcm.PARAM.JOB_ID]: jobId };
                }
            });

            it('should create a job mapping from job updates', () => {
                const comm = new JobCommChannel(),
                    msg = makeCommMsg(jcm.MESSAGE_TYPE.STATUS, statusData);

                return comm.initCommChannel().then(() => {
                    comm.handleCommMessages(msg);
                    expect(comm._jobMapping).toEqual(responseDataMapping);
                });
            });

            it('should create a job mapping from job info data', () => {
                const infoData = ResponseData[jcm.MESSAGE_TYPE.INFO];
                const comm = new JobCommChannel(),
                    msg = makeCommMsg(jcm.MESSAGE_TYPE.INFO, infoData);

                return comm.initCommChannel().then(() => {
                    comm.handleCommMessages(msg);
                    expect(comm._jobMapping).toEqual(responseDataMapping);
                });
            });

            // since the retry data includes the job status,
            // we can reconstitute the job mapping from it
            it('should create a job mapping from job retry data', () => {
                const retryData = ResponseData[jcm.MESSAGE_TYPE.RETRY];
                const comm = new JobCommChannel(),
                    msg = makeCommMsg(jcm.MESSAGE_TYPE.RETRY, retryData);

                return comm.initCommChannel().then(() => {
                    comm.handleCommMessages(msg);
                    expect(comm._jobMapping).toEqual(responseDataMapping);
                });
            });

            it('should create and maintain a job mapping', () => {
                const batchUpdates = JobsData.batchJob.jobUpdateSeries;
                const comm = new JobCommChannel();
                return comm.initCommChannel().then(() => {
                    spyOn(testBus, 'send');
                    batchUpdates.forEach((update) => {
                        comm.handleCommMessages(makeCommMsg(update.type, update.msg));
                        expect(Object.keys(comm._jobMapping)).toEqual(
                            jasmine.arrayWithExactContents(update.allJobIds)
                        );
                    });
                });
            });
        });
    });
});
