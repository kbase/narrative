define(['jobCommChannel', 'base/js/namespace', 'common/runtime'], (
    JobCommChannel,
    Jupyter,
    Runtime
) => {
    'use strict';

    jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000;
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

    /**
     * A simple channel "checker" - initializes a bus listener such that the following
     * gets passed to bus.listen():
     * {
     *     channel: {
     *         channelName: channelId
     *     },
     *     key: {
     *         type: channelKey
     *     },
     *     handle: cb
     * }
     * where cb is the callback that gets done as part of the message passing.
     * @param {string} channelName
     * @param {string} channelId
     * @param {string} channelKey
     * @param {function} cb
     */
    function channelChecker(channelName, channelId, channelKey, cb, msgCmp) {
        const channel = {
            channelName: channelId,
        };

        Runtime.make()
            .bus()
            .listen({
                channel,
                key: {
                    type: channelKey,
                },
                handle: (msg) => {
                    if (msgCmp) {
                        expect(msg).toEqual(msgCmp);
                    }
                    cb(msg);
                },
            });
    }

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
        let runtime;

        beforeEach(() => {
            runtime = Runtime.make();
            Jupyter.notebook = makeMockNotebook();
        });

        afterEach(() => {
            window.kbaseRuntime = null;
        });

        it('Should load properly', () => {
            expect(JobCommChannel).not.toBeNull();
        });

        it('Should be instantiable and contain the right components', () => {
            const comm = new JobCommChannel();
            expect(comm.initCommChannel).toBeDefined();
            expect(comm.jobStates).toEqual({});
        });

        it('Should initialize correctly in the base case', (done) => {
            const comm = new JobCommChannel();
            comm.initCommChannel()
                .then(done)
                .catch((err) => {
                    fail(err);
                });
        });

        it('Should re-initialize with an existing channel', (done) => {
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
            comm.initCommChannel()
                .then(() => {
                    expect(comm.comm).not.toBeNull();
                    done();
                })
                .catch((err) => {
                    fail(err);
                });
        });

        it('Should fail to initialize with a failed reply from the JobManager startup', (done) => {
            const comm = new JobCommChannel();
            Jupyter.notebook = makeMockNotebook(null, null, {
                name: 'Failed to start',
                evalue: 'Some error',
                error: 'Yes. Very yes.',
            });
            comm.initCommChannel()
                .then(() => {
                    console.error('Should not have succeeded.');
                    fail();
                })
                .catch((err) => {
                    expect(err).toEqual(new Error('Failed to start:Some error'));
                    done();
                });
        });

        const busMsgCases = [
            ['ping-comm-channel', { pingId: 'ping!' }],
            ['request-job-cancellation', { jobId: 'someJob' }],
            ['request-job-status', { jobId: 'someJob', parentJobId: 'someParent' }],
            ['request-job-update', { jobId: 'someJob', parentJobId: 'someParent' }],
            ['request-job-completion', { jobId: 'someJob' }],
            ['request-job-log', { jobId: 'someJob', options: {} }],
            ['request-latest-job-log', { jobId: 'someJob', options: {} }],
            ['request-job-info', { jobId: 'someJob', parentJobId: 'someParent' }],
        ];
        busMsgCases.forEach((testCase) => {
            it('Should handle ' + testCase[0] + ' bus message', (done) => {
                const comm = new JobCommChannel();
                comm.initCommChannel()
                    .then(() => {
                        expect(comm.comm).not.toBeNull();
                        spyOn(comm.comm, 'send');
                        runtime.bus().emit(testCase[0], testCase[1]);
                        return new Promise((resolve) => setTimeout(resolve, 100));
                    })
                    .then(() => {
                        expect(comm.comm.send).toHaveBeenCalled();
                        done();
                    });
            });
        });

        it('Should error properly when trying to send a comm with an uninited channel', (done) => {
            const comm = new JobCommChannel();
            const prom = comm.sendCommMessage('some_msg', 'foo', {});
            prom.then(() => {
                fail('This should have failed');
            }).catch((err) => {
                expect(err.message).toContain('ERROR sending comm message');
                done();
            });
        });

        /* Mocking out comm messages coming back over the channel is gruesome. Just
         * calling the handleCommMessage function directly.
         */
        it('Should handle a start message', (done) => {
            const comm = new JobCommChannel();
            comm.initCommChannel().then(() => {
                comm.handleCommMessages(makeCommMsg('start', {}));
                done();
            });
        });

        it('Should respond to new_job by saving the Narrative', (done) => {
            const comm = new JobCommChannel();
            spyOn(Jupyter.notebook, 'save_checkpoint');
            comm.initCommChannel().then(() => {
                comm.handleCommMessages(makeCommMsg('new_job', {}));
                expect(Jupyter.notebook.save_checkpoint).toHaveBeenCalled();
                done();
            });
        });

        it('Should send job_status messages to the bus', (done) => {
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

            channelChecker('jobId', jobId, 'job-status', done, busMsg);

            comm.initCommChannel().then(() => {
                comm.handleCommMessages(msg);
            });
        });

        it('Should send a set of job statuses to the bus, and delete extras', (done) => {
            let caughtMsgs = 0;
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
            const msgCounter = () => {
                caughtMsgs++;
                if (caughtMsgs === 3) {
                    done();
                }
            };

            ['id1', 'id2'].forEach((jobId) => {
                channelChecker('jobId', jobId, 'job-status', msgCounter, {
                    jobId: jobId,
                    jobState: {
                        job_id: jobId,
                    },
                });
            });
            channelChecker('jobId', 'deletedJob', 'job-deleted', msgCounter, {
                jobId: 'deletedJob',
                via: 'no_longer_exists',
            });
            comm.initCommChannel().then(() => {
                comm.handleCommMessages(msg);
            });
        });

        it('Should send a job-info message to the bus', (done) => {
            const jobId = 'foo',
                msg = makeCommMsg('job_info', {
                    job_id: jobId,
                    state: {
                        job_id: jobId,
                    },
                });

            channelChecker('jobId', jobId, 'job-info', done, {
                jobId: jobId,
                jobInfo: msg.content.data.content,
            });
            const comm = new JobCommChannel();
            comm.initCommChannel().then(() => {
                comm.handleCommMessages(msg);
            });
        });

        it('Should send a run_status message to the bus', (done) => {
            const jobId = 'foo',
                cellId = 'bar',
                msg = makeCommMsg('run_status', {
                    cell_id: cellId,
                    job_id: jobId,
                });
            channelChecker('cell', cellId, 'run-status', done, msg.content.data.content);
            const comm = new JobCommChannel();
            comm.initCommChannel().then(() => {
                comm.handleCommMessages(msg);
            });
        });

        it('Should send job_canceled message to the bus', (done) => {
            const jobId = 'foo-canceled',
                msg = makeCommMsg('job_canceled', {
                    job_id: jobId,
                });
            channelChecker('jobId', jobId, 'job-canceled', done, {
                jobId: jobId,
                via: 'job_canceled',
            });
            const comm = new JobCommChannel();
            comm.initCommChannel().then(() => {
                comm.handleCommMessages(msg);
            });
        });

        it('Should send job_does_not_exist messages to the bus', (done) => {
            const jobId = 'foo-dne',
                msg = makeCommMsg('job_does_not_exist', {
                    job_id: jobId,
                    source: 'someSource',
                }),
                comm = new JobCommChannel();
            channelChecker('jobId', jobId, 'job-does-not-exist', done, {
                jobId: jobId,
                source: 'someSource',
            });
            comm.initCommChannel().then(() => {
                comm.handleCommMessages(msg);
            });
        });

        it('Should send job_logs to the bus', (done) => {
            const jobId = 'foo-logs',
                msg = makeCommMsg('job_logs', {
                    job_id: jobId,
                    latest: true,
                    logs: [{}],
                }),
                comm = new JobCommChannel();
            channelChecker('jobId', jobId, 'job-logs', done, {
                jobId: jobId,
                logs: msg.content.data.content,
                latest: msg.content.data.content.latest,
            });
            comm.initCommChannel().then(() => {
                comm.handleCommMessages(msg);
            });
        });

        const errCases = {
            cancel_job: 'job-cancel-error',
            job_logs: 'job-log-deleted',
            job_logs_latest: 'job-log-deleted',
            job_status: 'job-status-error',
        };

        Object.keys(errCases).forEach((errCase) => {
            it('Should handle job_comm_error of type ' + errCase, (done) => {
                const jobId = 'job-' + errCase,
                    errMsg = errCase + ' error happened!',
                    msg = makeCommMsg('job_comm_error', {
                        source: errCase,
                        job_id: jobId,
                        message: errMsg,
                    }),
                    comm = new JobCommChannel();
                channelChecker('jobId', jobId, errCases[errCase], done, {
                    jobId: jobId,
                    message: errMsg,
                });
                comm.initCommChannel().then(() => {
                    comm.handleCommMessages(msg);
                });
            });
        });

        it('Handle unknown job errors generically', (done) => {
            const jobId = 'jobWithErrors',
                errMsg = 'some random error',
                requestType = 'some-error',
                msg = makeCommMsg('job_comm_error', {
                    source: requestType,
                    job_id: jobId,
                    message: errMsg,
                }),
                comm = new JobCommChannel();
            channelChecker('jobId', jobId, 'job-error', done, {
                jobId: jobId,
                message: errMsg,
                request: requestType,
            });
            comm.initCommChannel().then(() => {
                comm.handleCommMessages(msg);
            });
        });

        it('Should handle job_init_err and job_init_lookup_err', (done) => {
            let count = 0;
            ['job_init_err', 'job_init_lookup_err'].forEach((errType) => {
                const msg = makeCommMsg(errType, {
                        service: 'job service',
                        error: 'An error happened!',
                        name: 'Error',
                        source: 'jobmanager',
                    }),
                    comm = new JobCommChannel();
                comm.initCommChannel()
                    .then(() => {
                        comm.handleCommMessages(msg);
                        return new Promise((resolve) => {
                            setInterval(resolve, 1000);
                        });
                    })
                    .then(() => {
                        expect(document.querySelector('#kb-job-err-report')).not.toBeNull();
                        count++;
                        if (count == 2) {
                            done();
                        }
                    });
            });
        });

        it('Should send a result message to the bus', (done) => {
            const cellId = 'someCellId',
                msg = makeCommMsg('result', {
                    address: {
                        cell_id: cellId,
                    },
                    result: [1],
                }),
                comm = new JobCommChannel();
            channelChecker('cell', cellId, 'result', done, msg.content.data.content);
            comm.initCommChannel().then(() => {
                comm.handleCommMessages(msg);
            });
        });

        it('Should handle unknown messages with console warnings', (done) => {
            const comm = new JobCommChannel(),
                msg = makeCommMsg('unknown_weird_msg', {});
            comm.initCommChannel().then(() => {
                spyOn(console, 'warn');
                comm.handleCommMessages(msg);
                expect(console.warn).toHaveBeenCalled();
                done();
            });
        });
    });
});
