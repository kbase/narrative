/*global define*/
/*global describe, it, expect*/
/*global jasmine*/
/*global beforeEach, afterEach*/
/*jslint white: true*/
define([
    'jobCommChannel',
    'base/js/namespace',
    'common/runtime'
], (
    JobCommChannel,
    Jupyter,
    Runtime
) => {
    'use strict';

    const DEFAULT_COMM_INFO = {
        content: {
            comms: []
        }
    };
    const DEFAULT_COMM = {
        on_msg: () => { },
        send: () => { },
        send_shell_message: () => { }
    };

    function makeMockNotebook(commInfoReturn, registerTargetReturn, executeReply) {
        commInfoReturn = commInfoReturn || DEFAULT_COMM_INFO;
        registerTargetReturn = registerTargetReturn || DEFAULT_COMM;
        executeReply = executeReply || {}
        return {
            save_checkpoint: () => { /* no op */ },
            kernel: {
                comm_info: (name, cb) => cb(commInfoReturn),
                execute: (code, cb) => cb.shell.reply({content: executeReply}),
                comm_manager: {
                    register_comm: () => {},
                    register_target: (name, cb) => cb(registerTargetReturn, {})
                }
            }
        };
    }

    describe('Test the jobCommChannel widget', () => {
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
            let comm = new JobCommChannel();
            expect(comm.initCommChannel).toBeDefined();
            expect(comm.jobStates).toEqual({});
        });

        it('Should initialize correctly in the base case', (done, fail) => {
            let comm = new JobCommChannel();
            comm.initCommChannel()
                .then(done)
                .catch((err) => {
                    console.error(err);
                    fail();
                });
        });

        it('Should re-initialize with an existing channel', (done, fail) => {
            let comm = new JobCommChannel();
            Jupyter.notebook = makeMockNotebook({
                content: {
                    comms: {
                        '12345': {
                            target_name: 'KBaseJobs'
                        }
                    }
                }
            });
            comm.initCommChannel()
                .then(() => {
                    expect(comm.comm).not.toBeNull();
                    done();
                })
                .catch((err) => {
                    console.error(err);
                    fail();
                });
        });

        it('Should fail to initialize with a failed reply from the JobManager startup', (done, fail) => {
            let comm = new JobCommChannel();
            Jupyter.notebook = makeMockNotebook(null, null, {
                name: 'Failed to start',
                evalue: 'Some error',
                error: 'Yes. Very yes.'
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

        let busMsgCases = [
            ['ping-comm-channel', {pingId: 'ping!'}],
            ['request-job-cancellation', {jobId: 'someJob'}],
            ['request-job-status', {jobId: 'someJob', parentJobId: 'someParent'}],
            ['request-job-update', {jobId: 'someJob', parentJobId: 'someParent'}],
            ['request-job-completion', {jobId: 'someJob'}],
            ['request-job-log', {jobId: 'someJob', options: {}}],
            ['request-latest-job-log', {jobId: 'someJob', options: {}}],
            ['request-job-info', {jobId: 'someJob', parentJobId: 'someParent'}]
        ];
        busMsgCases.forEach(function (testCase) {
            it('Should handle ' + testCase[0] + 'bus message', (done) => {
                let comm = new JobCommChannel();
                comm.initCommChannel()
                    .then(() => {
                        expect(comm.comm).not.toBeNull();
                        spyOn(comm.comm, 'send');
                        runtime.bus().emit(testCase[0], testCase[1]);
                        return new Promise(resolve => setTimeout(resolve, 100));
                    })
                    .then(() => {
                        expect(comm.comm.send).toHaveBeenCalled();
                        done();
                    });
            });
        });

        it('Should error properly when trying to send a comm with an uninited channel', (done) => {
            let comm = new JobCommChannel();
            let prom = comm.sendCommMessage('some_msg', 'foo', {});
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

    });
});
