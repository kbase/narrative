define(['jobCommChannel', 'base/js/namespace', 'common/runtime', 'testUtil'], (
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

    describe('The jobCommChannel widget', () => {
        let testBus;
        beforeEach(() => {
            testBus = Runtime.make().bus();
            Jupyter.notebook = makeMockNotebook();
        });

        afterEach(() => {
            window.kbaseRuntime = null;
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
                channel: 'request-job-cancellation',
                message: { jobId: 'someJob' },
                expected: { request_type: 'cancel_job', job_id: 'someJob' },
            },
            {
                channel: 'request-job-retry',
                message: { jobId: 'someJob' },
                expected: { request_type: 'retry_job', job_id: 'someJob' },
            },
            {
                channel: 'request-job-status',
                message: { jobId: 'someJob', parentJobId: 'someParent' },
                expected: {
                    request_type: 'job_status',
                    job_id: 'someJob',
                    parent_job_id: 'someParent',
                },
            },
            {
                channel: 'request-job-update',
                message: { jobId: 'someJob', parentJobId: 'someParent' },
                expected: {
                    request_type: 'start_job_update',
                    job_id: 'someJob',
                    parent_job_id: 'someParent',
                },
            },
            {
                channel: 'request-job-completion',
                message: { jobId: 'someJob' },
                expected: { request_type: 'stop_job_update', job_id: 'someJob' },
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
                channel: 'request-job-log-latest',
                message: { jobId: 'someJob', options: {} },
                expected: { request_type: 'job_logs_latest', job_id: 'someJob' },
            },
            {
                channel: 'request-job-log-latest',
                message: {
                    jobId: 'someJob',
                    parentJobId: 'none',
                    options: {
                        first_line: 2000,
                        job_id: 'overridden!',
                    },
                },
                expected: {
                    request_type: 'job_logs_latest',
                    job_id: 'overridden!',
                    parent_job_id: 'none',
                    first_line: 2000,
                },
            },
            {
                channel: 'request-job-info',
                message: { jobId: 'someJob', parentJobId: 'someParent' },
                expected: {
                    request_type: 'job_info',
                    job_id: 'someJob',
                    parent_job_id: 'someParent',
                },
            },
            {
                channel: 'request-job-info',
                message: { jobIdList: ['someJob', 'someOtherJob', 'aThirdJob'] },
                expected: {
                    request_type: 'job_info',
                    job_id_list: ['someJob', 'someOtherJob', 'aThirdJob'],
                },
            },
        ];

        busMsgCases.forEach((testCase) => {
            it('Should handle a ' + testCase.channel + ' bus message', () => {
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

        it('Should send job_status messages to the bus', () => {
            const jobId = 'someJob',
                msg = makeCommMsg('job_status', {
                    state: {
                        job_id: jobId,
                    },
                    spec: {},
                    widget_info: {},
                }),
                busMsg = {
                    jobId: jobId,
                    jobState: {
                        job_id: jobId,
                    },
                    outputWidgetInfo: {},
                };

            const comm = new JobCommChannel();
            spyOn(testBus, 'send');

            return comm.initCommChannel().then(() => {
                comm.handleCommMessages(msg);
                expect(testBus.send).toHaveBeenCalledWith(busMsg, {
                    channel: { jobId: jobId },
                    key: { type: 'job-status' },
                });
            });
        });

        it('Should send a set of job statuses to the bus, and delete extras', () => {
            const msg = makeCommMsg('job_status_all', {
                id1: {
                    state: {
                        job_id: 'id1',
                    },
                },
                id2: {
                    state: {
                        job_id: 'id2',
                    },
                },
            });
            const comm = new JobCommChannel();
            comm.jobStates['deletedJob'] = { state: { job_id: 'deletedJob' } };
            spyOn(testBus, 'send');
            return comm.initCommChannel().then(() => {
                comm.handleCommMessages(msg);
                expect(testBus.send).toHaveBeenCalledTimes(3);
            });
        });

        it('Should send a job_info message to the bus', () => {
            const jobId = 'foo',
                jobStateMsg = {
                    job_id: jobId,
                    state: {
                        job_id: jobId,
                    },
                },
                busMsg = {
                    jobId: jobId,
                    jobInfo: jobStateMsg,
                },
                msg = makeCommMsg('job_info', jobStateMsg);

            const comm = new JobCommChannel();
            spyOn(testBus, 'send');
            return comm.initCommChannel().then(() => {
                comm.handleCommMessages(msg);
                expect(testBus.send).toHaveBeenCalledWith(busMsg, {
                    channel: { jobId: jobId },
                    key: { type: 'job-info' },
                });
            });
        });

        it('Should send a run_status message to the bus', () => {
            const jobId = 'foo',
                cellId = 'bar',
                busMsg = {
                    cell_id: cellId,
                    job_id: jobId,
                },
                msg = makeCommMsg('run_status', busMsg);
            const comm = new JobCommChannel();
            spyOn(testBus, 'send');
            return comm.initCommChannel().then(() => {
                comm.handleCommMessages(msg);
                expect(testBus.send).toHaveBeenCalledWith(busMsg, {
                    channel: { cell: cellId },
                    key: { type: 'run-status' },
                });
            });
        });

        it('Should send job_canceled message to the bus', () => {
            const jobId = 'foo-canceled',
                msg = makeCommMsg('job_canceled', {
                    job_id: jobId,
                });
            const comm = new JobCommChannel();
            spyOn(testBus, 'send');
            return comm.initCommChannel().then(() => {
                comm.handleCommMessages(msg);
                expect(testBus.send).toHaveBeenCalledWith(
                    {
                        jobId: jobId,
                        via: 'job_canceled',
                    },
                    {
                        channel: { jobId: jobId },
                        key: { type: 'job-canceled' },
                    }
                );
            });
        });

        it('Should send job_does_not_exist messages to the bus', () => {
            const jobId = 'foo-dne',
                msg = makeCommMsg('job_does_not_exist', {
                    job_id: jobId,
                    source: 'someSource',
                }),
                comm = new JobCommChannel();
            spyOn(testBus, 'send');
            return comm.initCommChannel().then(() => {
                comm.handleCommMessages(msg);
                expect(testBus.send).toHaveBeenCalledWith(
                    {
                        jobId: jobId,
                        source: 'someSource',
                    },
                    {
                        channel: { jobId: jobId },
                        key: { type: 'job-does-not-exist' },
                    }
                );
            });
        });

        it('Should send job_logs to the bus', () => {
            const jobId = 'foo-logs',
                msg = makeCommMsg('job_logs', {
                    job_id: jobId,
                    latest: true,
                    logs: [{}],
                }),
                comm = new JobCommChannel();
            spyOn(testBus, 'send');
            return comm.initCommChannel().then(() => {
                comm.handleCommMessages(msg);
                expect(testBus.send).toHaveBeenCalledWith(
                    {
                        jobId: jobId,
                        logs: msg.content.data.content,
                        latest: msg.content.data.content.latest,
                    },
                    {
                        channel: { jobId: jobId },
                        key: { type: 'job-logs' },
                    }
                );
            });
        });

        const errCases = {
            cancel_job: 'job-cancel-error',
            job_logs: 'job-log-deleted',
            job_logs_latest: 'job-log-deleted',
            job_status: 'job-status-error',
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
                    expect(testBus.send).toHaveBeenCalledWith(
                        {
                            jobId: jobId,
                            message: errMsg,
                        },
                        {
                            channel: { jobId: jobId },
                            key: { type: errCases[errCase] },
                        }
                    );
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

        it('Should send a result message to the bus', () => {
            const cellId = 'someCellId',
                busMsg = {
                    address: { cell_id: cellId },
                    result: [1],
                },
                msg = makeCommMsg('result', busMsg),
                comm = new JobCommChannel();
            spyOn(testBus, 'send');
            return comm.initCommChannel().then(() => {
                comm.handleCommMessages(msg);
                expect(testBus.send).toHaveBeenCalledWith(busMsg, {
                    channel: { cell: cellId },
                    key: { type: 'result' },
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
