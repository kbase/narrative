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

    const { TEST_JOB_ID } = JobsData,
        TEST_JOB_LIST = [TEST_JOB_ID, 'anotherJob', 'aThirdJob'],
        ERROR_STR = 'Some error string';

    const responseDataJobMapping = {};
    const batchJobs = {};

    // generate the expected mapping of job IDs to batch IDs
    Object.values(ResponseData[jcm.MESSAGE_TYPE.INFO]).forEach((job) => {
        if ('batch_id' in job && job.batch_id) {
            responseDataJobMapping[job.job_id] = { [jcm.PARAM.BATCH_ID]: job.batch_id };
            if (job.batch_id === job.job_id) {
                batchJobs[job.batch_id] = 1;
            }
        } else {
            responseDataJobMapping[job.job_id] = { [jcm.PARAM.JOB_ID]: job.job_id };
        }
    });

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

    describe('The JobCommChannel', () => {
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
                    'JobComm().start_job_status_loop(cell_list=cell_list, init_jobs=True)',
                ]);
            });

            it('should generate the correct python code for an empty narrative', () => {
                Jupyter.notebook = makeMockNotebook();
                const comm = new JobCommChannel();
                const jobCommInitString = comm.getJobInitCode();
                expect(jobCommInitString.split('\n')).toEqual([
                    'from biokbase.narrative.jobs.jobcomm import JobComm',
                    'cell_list = []',
                    'JobComm().start_job_status_loop(cell_list=cell_list, init_jobs=True)',
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
                [jcm.MESSAGE_TYPE.STATUS, { [jcm.PARAM.JOB_ID]: 0 }],
                [jcm.MESSAGE_TYPE.STATUS, { [jcm.PARAM.JOB_ID]: 1 }],
                [jcm.MESSAGE_TYPE.STATUS, { [jcm.PARAM.JOB_ID]: 2 }],
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
                        [jcm.PARAM.JOB_ID]: num,
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
                        if (args[1][jcm.PARAM.JOB_ID] === 2) {
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
                        const jobId = args[1][jcm.PARAM.JOB_ID];
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
                        const jobId = args[1][jcm.PARAM.JOB_ID];
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
                    message: { [jcm.PARAM.JOB_ID]: TEST_JOB_ID },
                    expected: {
                        request_type: jcm.MESSAGE_TYPE.LOGS,
                        [jcm.PARAM.JOB_ID]: TEST_JOB_ID,
                    },
                },
                {
                    channel: jcm.MESSAGE_TYPE.LOGS,
                    message: {
                        [jcm.PARAM.JOB_ID]: TEST_JOB_ID,
                        latest: true,
                    },
                    expected: {
                        request_type: jcm.MESSAGE_TYPE.LOGS,
                        [jcm.PARAM.JOB_ID]: TEST_JOB_ID,
                        latest: true,
                    },
                },
                {
                    channel: jcm.MESSAGE_TYPE.LOGS,
                    message: {
                        [jcm.PARAM.JOB_ID]: TEST_JOB_ID,
                        first_line: 2000,
                        latest: true,
                    },
                    expected: {
                        request_type: jcm.MESSAGE_TYPE.LOGS,
                        [jcm.PARAM.JOB_ID]: TEST_JOB_ID,
                        first_line: 2000,
                        latest: true,
                    },
                },
                {
                    channel: jcm.MESSAGE_TYPE.CANCEL,
                    message: { [jcm.PARAM.JOB_ID]: TEST_JOB_ID },
                    expected: {
                        request_type: jcm.MESSAGE_TYPE.CANCEL,
                        [jcm.PARAM.JOB_ID]: TEST_JOB_ID,
                    },
                },
                {
                    channel: jcm.MESSAGE_TYPE.CANCEL,
                    message: { [jcm.PARAM.JOB_ID_LIST]: TEST_JOB_LIST },
                    expected: {
                        request_type: jcm.MESSAGE_TYPE.CANCEL,
                        [jcm.PARAM.JOB_ID_LIST]: TEST_JOB_LIST,
                    },
                },
                {
                    channel: jcm.MESSAGE_TYPE.RETRY,
                    message: { [jcm.PARAM.JOB_ID]: TEST_JOB_ID },
                    expected: {
                        request_type: jcm.MESSAGE_TYPE.RETRY,
                        [jcm.PARAM.JOB_ID]: TEST_JOB_ID,
                    },
                },
                {
                    channel: jcm.MESSAGE_TYPE.RETRY,
                    message: { [jcm.PARAM.JOB_ID_LIST]: TEST_JOB_LIST },
                    expected: {
                        request_type: jcm.MESSAGE_TYPE.RETRY,
                        [jcm.PARAM.JOB_ID_LIST]: TEST_JOB_LIST,
                    },
                },
            ];

            const batchRequests = ['INFO', 'STATUS', 'START_UPDATE', 'STOP_UPDATE'];
            // all these can have a single job ID, a job ID list, or a batch ID as input
            batchRequests.forEach((type) => {
                busMsgCases.push(
                    {
                        channel: jcm.MESSAGE_TYPE[type],
                        message: { [jcm.PARAM.JOB_ID]: TEST_JOB_ID },
                        expected: {
                            request_type: jcm.MESSAGE_TYPE[type],
                            [jcm.PARAM.JOB_ID]: TEST_JOB_ID,
                        },
                    },
                    {
                        channel: jcm.MESSAGE_TYPE[type],
                        message: { [jcm.PARAM.JOB_ID_LIST]: TEST_JOB_LIST },
                        expected: {
                            request_type: jcm.MESSAGE_TYPE[type],
                            [jcm.PARAM.JOB_ID_LIST]: TEST_JOB_LIST,
                        },
                    },
                    {
                        channel: jcm.MESSAGE_TYPE[type],
                        message: { [jcm.PARAM.BATCH_ID]: 'batch_job' },
                        expected: {
                            request_type: `${jcm.MESSAGE_TYPE[type]}`,
                            [jcm.PARAM.BATCH_ID]: 'batch_job',
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
                    comm.sendCommMessage('unknown', { [jcm.CHANNEL.JOB]: TEST_JOB_ID })
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

            function generateMultiJobResponse(messageType) {
                const output = {};
                Object.keys(ResponseData[messageType]).forEach((jobId) => {
                    const outputId = responseDataJobMapping[jobId][jcm.PARAM.BATCH_ID]
                        ? responseDataJobMapping[jobId][jcm.PARAM.BATCH_ID]
                        : responseDataJobMapping[jobId][jcm.PARAM.JOB_ID];

                    if (!(outputId in output)) {
                        output[outputId] = {};
                    }
                    output[outputId][jobId] = ResponseData[messageType][jobId];
                });

                const channelOutput = [];
                Object.keys(output).forEach((jobId) => {
                    const address = {
                        channel: { [jcm.CHANNEL.JOB]: jobId },
                        key: { type: messageType },
                    };

                    if (jobId in batchJobs) {
                        address.channel = { [jcm.CHANNEL.BATCH]: jobId };
                    }
                    channelOutput.push([output[jobId], address]);
                });
                return channelOutput;
            }

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
                    expectedMultiple: [
                        [
                            {
                                event: 'launched_job',
                                event_at: 12345,
                                job_id: TEST_JOB_ID,
                                cell_id: 'bar',
                                run_id: 54321,
                            },
                            {
                                channel: { [jcm.CHANNEL.CELL]: 'bar' },
                                key: { type: jcm.MESSAGE_TYPE.RUN_STATUS },
                            },
                        ],
                    ],
                },
                {
                    // info multiple jobs
                    type: jcm.MESSAGE_TYPE.INFO,
                    message: ResponseData[jcm.MESSAGE_TYPE.INFO],
                    expectedMultiple: generateMultiJobResponse(jcm.MESSAGE_TYPE.INFO),
                },
                {
                    // status for multiple jobs
                    type: jcm.MESSAGE_TYPE.STATUS,
                    message: ResponseData[jcm.MESSAGE_TYPE.STATUS],
                    expectedMultiple: generateMultiJobResponse(jcm.MESSAGE_TYPE.STATUS),
                },
                {
                    // status all message
                    type: jcm.MESSAGE_TYPE.STATUS_ALL,
                    message: ResponseData[jcm.MESSAGE_TYPE.STATUS],
                    expectedMultiple: generateMultiJobResponse(jcm.MESSAGE_TYPE.STATUS),
                },
                {
                    // logs for multiple jobs
                    type: jcm.MESSAGE_TYPE.LOGS,
                    message: ResponseData[jcm.MESSAGE_TYPE.LOGS],
                    expectedMultiple: generateMultiJobResponse(jcm.MESSAGE_TYPE.LOGS),
                },
                {
                    // retry multiple jobs
                    type: jcm.MESSAGE_TYPE.RETRY,
                    message: ResponseData[jcm.MESSAGE_TYPE.RETRY],
                    expectedMultiple: generateMultiJobResponse(jcm.MESSAGE_TYPE.RETRY),
                },
            ];

            busTests.forEach((test) => {
                it(`should send a ${test.type} message to the bus`, () => {
                    const msg = makeCommMsg(test.type, test.message),
                        comm = new JobCommChannel();
                    return comm.initCommChannel().then(() => {
                        spyOn(testBus, 'send');
                        comm.handleCommMessages(msg);
                        expect(testBus.send.calls.allArgs()).toEqual(
                            jasmine.arrayWithExactContents(test.expectedMultiple)
                        );
                    });
                });
            });

            ['STATUS', 'INFO', 'RETRY', 'LOGS'].forEach((type) => {
                const msgType = jcm.MESSAGE_TYPE[type];
                const validAndInvalidData = {},
                    expectedInvalid = {};
                let i = 0;
                // collate all valid and invalid data. Add fake job_ids for the invalid data as it
                // won't necessarily have a job ID
                JobsData.example[type].invalid.forEach((elem) => {
                    validAndInvalidData[`job_${i}`] = elem;
                    expectedInvalid[`job_${i}`] = elem;
                    i++;
                });
                JobsData.example[type].valid.forEach((elem) => {
                    validAndInvalidData[elem.job_id] = elem;
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
                    const msg = makeCommMsg(msgType, expectedInvalid),
                        comm = new JobCommChannel();
                    return comm.initCommChannel().then(() => {
                        spyOn(comm, 'reportCommMessageError');
                        spyOn(console, 'error');
                        comm.handleCommMessages(msg);
                        expect(comm.reportCommMessageError.calls.allArgs()).toEqual([
                            [{ msgType, msgData: expectedInvalid }],
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
                            [{ msgType, msgData: expectedInvalid }],
                        ]);
                        const expectedMessages = generateMultiJobResponse(msgType);
                        expect(testBus.send.calls.allArgs()).toEqual(
                            jasmine.arrayWithExactContents(expectedMessages)
                        );
                    });
                });
            });

            describe('error message distribution', () => {
                const BATCH_PARENT = 'BATCH_PARENT';
                const errors = {
                    simple: {
                        name: 'ValueError',
                        message: 'Some text',
                    },
                    complex: {
                        name: 'ServerException',
                        message: 'Some exception',
                        error: 'Unable to perform this request',
                        code: -1,
                    },
                    jobRequestException: {
                        name: 'JobRequestException',
                        message: 'Some text',
                    },
                };

                const jobMapping = {
                    JOB_A: { [jcm.PARAM.BATCH_ID]: BATCH_PARENT },
                    JOB_B: { [jcm.PARAM.BATCH_ID]: BATCH_PARENT, [jcm.PARAM.JOB_ID]: 'JOB_B' },
                    JOB_C: { [jcm.PARAM.BATCH_ID]: BATCH_PARENT },
                    JOB_D: { [jcm.PARAM.JOB_ID]: 'JOB_D' },
                    BATCH_PARENT: { [jcm.PARAM.BATCH_ID]: BATCH_PARENT },
                };

                const requests = {
                    jobIdList: {
                        request: {
                            request_type: jcm.MESSAGE_TYPE.STATUS,
                            [jcm.PARAM.JOB_ID_LIST]: ['A_JOB', 'B_JOB', 'C_JOB'],
                        },
                        channelsNoMap: [
                            { [jcm.CHANNEL.JOB]: 'A_JOB' },
                            { [jcm.CHANNEL.JOB]: 'B_JOB' },
                            { [jcm.CHANNEL.JOB]: 'C_JOB' },
                        ],
                        channelsWithMap: [
                            { [jcm.CHANNEL.JOB]: 'B_JOB' },
                            { [jcm.CHANNEL.BATCH]: BATCH_PARENT },
                        ],
                        allIds: ['A_JOB', 'B_JOB', 'C_JOB'],
                    },

                    jobId: {
                        request: {
                            request_type: jcm.MESSAGE_TYPE.INFO,
                            [jcm.PARAM.JOB_ID]: 'D_JOB',
                        },
                        channelsNoMap: [{ [jcm.CHANNEL.JOB]: 'D_JOB' }],
                        channelsWithMap: [{ [jcm.CHANNEL.BATCH]: BATCH_PARENT }],
                        allIds: ['D_JOB'],
                    },

                    batchId: {
                        request: {
                            request_type: jcm.MESSAGE_TYPE.RETRY,
                            [jcm.PARAM.BATCH_ID]: BATCH_PARENT,
                        },
                        channelsNoMap: [{ [jcm.CHANNEL.JOB]: BATCH_PARENT }],
                        channelsWithMap: [{ [jcm.CHANNEL.BATCH]: BATCH_PARENT }],
                        allIds: [BATCH_PARENT],
                    },
                };

                function generateErrorMessage(type, req) {
                    const reqData = requests[req];
                    const errorMessage = {
                        ...errors[type],
                        request: reqData.request,
                        source: reqData.request.request_type,
                        [jcm.PARAM.JOB_ID_LIST]: reqData.allIds,
                    };
                    return {
                        type: `${type} error, ${req} params`,
                        message: errorMessage,
                        expected: reqData.channelsNoMap.map((channel) => {
                            return [
                                errorMessage,
                                {
                                    key: { type: jcm.MESSAGE_TYPE.ERROR },
                                    channel,
                                },
                            ];
                        }),
                        expectedWithMap: reqData.channelsNoMap.map((channel) => {
                            return [
                                errorMessage,
                                {
                                    key: { type: jcm.MESSAGE_TYPE.ERROR },
                                    channel,
                                },
                            ];
                        }),
                    };
                }

                const busTests = [];
                ['simple', 'complex'].forEach((type) => {
                    Object.keys(requests).forEach((req) => {
                        busTests.push(generateErrorMessage(type, req));
                    });
                });
                // these messages do not get passed on to the frontend as they're not very useful
                Object.keys(requests).forEach((req) => {
                    const test = generateErrorMessage('jobRequestException', req);
                    test.expected = [];
                    test.expectedWithMap = [];
                    busTests.push(test);
                });

                // no mapping in place
                busTests.forEach((test) => {
                    it(`should send a ${test.type} message to the bus`, () => {
                        const msg = makeCommMsg(jcm.MESSAGE_TYPE.ERROR, test.message),
                            comm = new JobCommChannel();
                        return comm.initCommChannel().then(() => {
                            spyOn(testBus, 'send');
                            comm.handleCommMessages(msg);
                            expect(testBus.send.calls.allArgs()).toEqual(
                                jasmine.arrayWithExactContents(test.expected)
                            );
                            // create the mapping and handle the message again
                            comm._jobMapping = jobMapping;
                            comm.handleCommMessages(msg);
                            expect(testBus.send.calls.allArgs()).toEqual(
                                jasmine.arrayWithExactContents(
                                    test.expected.concat(test.expectedWithMap)
                                )
                            );
                        });
                    });
                });
            });
        });

        describe('job mapping', () => {
            ['STATUS', 'INFO', 'RETRY', 'LOGS'].forEach((type) => {
                it(`should create a job mapping from ${type} data`, () => {
                    const comm = new JobCommChannel(),
                        msg = makeCommMsg(
                            jcm.MESSAGE_TYPE[type],
                            ResponseData[jcm.MESSAGE_TYPE[type]]
                        );

                    return comm.initCommChannel().then(() => {
                        comm.handleCommMessages(msg);
                        expect(comm._jobMapping).toEqual(responseDataJobMapping);
                    });
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
