define(['common/jobCommChannel', 'base/js/namespace', 'common/runtime', 'testUtil'], (
    JobCommChannel,
    Jupyter,
    Runtime,
    TestUtil
) => {
    'use strict';

    const DEFAULT_COMM_INFO = {
        content: {
            comms: [],
        },
    };
    const DEFAULT_COMM = {
        on_msg: () => {},
        send: () => {},
        send_shell_message: () => {},
    };

    function makeMockNotebook(commInfoReturn, registerTargetReturn, executeReply) {
        commInfoReturn = commInfoReturn || DEFAULT_COMM_INFO;
        registerTargetReturn = registerTargetReturn || DEFAULT_COMM;
        executeReply = executeReply || {};
        return {
            save_checkpoint: () => {
                /* no op */
            },
            kernel: {
                comm_info: (name, cb) => cb(commInfoReturn),
                execute: (code, cb) => cb.shell.reply({ content: executeReply }),
                comm_manager: {
                    register_comm: () => {},
                    register_target: (name, cb) => cb(registerTargetReturn, {}),
                },
            },
        };
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

    function makeJobStatusMsg(jobId, jobState, outputWidgetInfo) {
        if (!jobState) {
            jobState = {
                job_id: jobId,
            };
        }
        return outputWidgetInfo ? { jobId, jobState, outputWidgetInfo } : { jobId, jobState };
    }

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
            expect(comm.jobStates).toEqual({});
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

        it('Should fail to initialize with a failed reply from the JobManager startup', async () => {
            const comm = new JobCommChannel();
            Jupyter.notebook = makeMockNotebook(null, null, {
                name: 'Failed to start',
                evalue: 'Some error',
                error: 'Yes. Very yes.',
            });
            await expectAsync(comm.initCommChannel()).toBeRejectedWith(
                new Error('Failed to start:Some error')
            );
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
                        batch_id: 'batch_job',
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
                        return new Promise((resolve) => {
                            // resolve the promise when we see comm.comm.send(...)
                            spyOn(comm.comm, 'send').and.callFake((...args) => {
                                resolve(args);
                            });
                            testBus.emit(testCase.channel, testCase.message);
                        });
                    })
                    .then((args) => {
                        expect(comm.comm.send).toHaveBeenCalled();
                        expect(args[0]).toEqual(
                            Object.assign(testCase.expected, { target_name: 'KBaseJobs' })
                        );
                    });
            });
        });

        it('Should error properly when trying to send a comm with an uninited channel', async () => {
            const comm = new JobCommChannel();
            await expectAsync(comm.sendCommMessage('some_msg', 'foo', {})).toBeRejected();
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

        const testJobId = 'someJob',
            testBatchId = 'someBatch';

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
                type: 'job_does_not_exist',
                message: {
                    job_id: testJobId,
                    source: 'someSource',
                },
                expected: [
                    {
                        jobId: testJobId,
                        source: 'someSource',
                    },
                    {
                        channel: { jobId: testJobId },
                        key: { type: 'job-does-not-exist' },
                    },
                ],
            },
            {
                // does_not_exist from job status call => convert to job_status
                type: 'job_does_not_exist',
                message: {
                    job_id: testJobId,
                    source: 'job_status',
                },
                expected: [
                    {
                        jobId: testJobId,
                        jobState: {
                            job_id: testJobId,
                            status: 'does_not_exist',
                        },
                    },
                    {
                        channel: { jobId: testJobId },
                        key: { type: 'job-status' },
                    },
                ],
            },
            {
                // n.b. this is not a realistic job info object!
                type: 'job_info',
                message: {
                    job_id: testJobId,
                    job_params: [1, 2, 3],
                    job_info: 'a string',
                },
                expected: [
                    {
                        jobId: testJobId,
                        jobInfo: {
                            job_id: testJobId,
                            job_params: [1, 2, 3],
                            job_info: 'a string',
                        },
                    },
                    {
                        channel: { jobId: testJobId },
                        key: { type: 'job-info' },
                    },
                ],
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
                                job_id: 12345,
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
                        },
                        retry: {},
                    },
                ],
                expectedMultiple: [
                    [
                        {
                            job: {
                                jobState: {
                                    job_id: testJobId,
                                    status: 'wherever',
                                },
                                outputWidgetInfo: {},
                            },
                            retry: {
                                jobState: {
                                    job_id: 12345,
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
                                jobState: {
                                    job_id: 'ping',
                                },
                                outputWidgetInfo: 'ping',
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
                type: 'job_status',
                message: {
                    state: {
                        job_id: testJobId,
                        made_up: true,
                    },
                    widget_info: {},
                },
                expected: [
                    {
                        jobId: testJobId,
                        jobState: {
                            job_id: testJobId,
                            made_up: true,
                        },
                        outputWidgetInfo: {},
                    },
                    {
                        channel: { jobId: testJobId },
                        key: { type: 'job-status' },
                    },
                ],
            },
            /*
            // grouping by batch ID -- to be implemented once backend is merged
            {
                type: 'job_status_batch',
                message: {
                    job_1_id: {
                        state: {
                            job_id: 'job_1_id',
                            made_up: true,
                            batch_id: testBatchId,
                        },
                        widget_info: {},
                    },
                    job_2_id: {
                        state: {
                            job_id: 'job_2_id',
                            made_up: true,
                            batch_id: testBatchId,
                        },
                        widget_info: {},
                    }
                },
                expectedMultiple: [
                    [
                        {
                            job_1_id: {
                                jobState: {
                                    job_id: 'job_1_id',
                                    made_up: true,
                                    batch_id: testBatchId,
                                },
                                outputWidgetInfo: {},
                            },
                        },
                        {
                            channel: { jobId: 'job_1_id' },
                            key: { type: 'job-status' },
                        },
                    ],
                    [
                        {
                            job_2_id: {
                                jobState: {
                                    job_id: 'job_2_id',
                                    made_up: true,
                                    batch_id: testBatchId,
                                }
                            }
                        },
                        {
                            channel: { batchId: testBatchId },
                            key: { type: 'job-status' },
                        },
                    ]
                ],
            },
*/
        ];

        busTests.forEach((test) => {
            it(`should send a ${test.type} message to the bus`, () => {
                const msg = makeCommMsg(test.type, test.message),
                    comm = new JobCommChannel();
                spyOn(testBus, 'send');
                return comm.initCommChannel().then(() => {
                    comm.handleCommMessages(msg);
                    if (test.expectedMultiple) {
                        expect(testBus.send.calls.allArgs()).toEqual(test.expectedMultiple);
                    } else if (test.expected) {
                        expect(testBus.send.calls.allArgs()).toEqual([test.expected]);
                    }
                });
            });
        });

        it('Should send a set of job statuses to the bus, and delete extras', () => {
            const id1 = 'id1',
                id2 = 'id2',
                deletedJob = 'deletedJob';

            const msg = makeCommMsg('job_status_all', {
                id1: {
                    state: {
                        job_id: id1,
                    },
                },
                id2: {
                    state: {
                        job_id: id2,
                    },
                },
            });
            const comm = new JobCommChannel();
            comm.jobStates[deletedJob] = { state: { job_id: deletedJob } };
            spyOn(testBus, 'send');
            return comm.initCommChannel().then(() => {
                comm.handleCommMessages(msg);
                expect(testBus.send).toHaveBeenCalledTimes(3);

                const allArgs = testBus.send.calls.allArgs();
                const expected = [
                    [
                        makeJobStatusMsg(id1, null),
                        {
                            channel: { jobId: id1 },
                            key: { type: 'job-status' },
                        },
                    ],
                    [
                        makeJobStatusMsg(id2, null),
                        {
                            channel: { jobId: id2 },
                            key: { type: 'job-status' },
                        },
                    ],
                    [
                        {
                            jobId: deletedJob,
                            jobState: {
                                job_id: deletedJob,
                                status: 'does_not_exist',
                            },
                        },
                        {
                            channel: { jobId: deletedJob },
                            key: { type: 'job-status' },
                        },
                    ],
                ];
                expect(allArgs).toEqual(expected);
            });
        });

        const errCases = {
            cancel_job: {
                ok: 'job-canceled',
                error: 'job-cancel-error',
            },
            job_logs: {
                ok: 'job-logs',
                error: 'job-log-deleted',
            },
        };

        Object.keys(errCases).forEach((errCase) => {
            it('Should handle job_comm_error of type ' + errCase, () => {
                const jobId = 'job-' + errCase,
                    errMsg = errCase + ' error happened!',
                    msg = makeCommMsg('job_comm_error', {
                        source: errCase,
                        job_id: jobId,
                        message: errMsg,
                    }),
                    comm = new JobCommChannel();
                spyOn(testBus, 'send');
                return comm.initCommChannel().then(() => {
                    comm.handleCommMessages(msg);
                    expect(testBus.send.calls.allArgs()).toEqual([
                        [
                            {
                                jobId: jobId,
                                message: errMsg,
                            },
                            {
                                channel: { jobId: jobId },
                                key: { type: errCases[errCase].error },
                            },
                        ],
                        [
                            {
                                jobId: jobId,
                                error: errMsg,
                            },
                            {
                                channel: { jobId: jobId },
                                key: { type: errCases[errCase].ok },
                            },
                        ],
                    ]);
                });
            });
        });

        it('Handle unknown job errors generically', () => {
            const jobId = 'jobWithErrors',
                errMsg = 'some random error',
                requestType = 'some-error',
                busMsg = {
                    source: requestType,
                    job_id: jobId,
                    message: errMsg,
                },
                msg = makeCommMsg('job_comm_error', busMsg),
                comm = new JobCommChannel();
            spyOn(testBus, 'send');
            return comm.initCommChannel().then(() => {
                comm.handleCommMessages(msg);
                expect(testBus.send).toHaveBeenCalledWith(
                    {
                        jobId: jobId,
                        message: errMsg,
                        request: requestType,
                    },
                    {
                        channel: { jobId: jobId },
                        key: { type: 'job-error' },
                    }
                );
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
