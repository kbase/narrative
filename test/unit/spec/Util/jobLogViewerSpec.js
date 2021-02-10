/*jslint white: true*/
define([
    'util/jobLogViewer',
    'common/runtime'
], (
    JobLogViewer,
    Runtime
) => {
    'use strict';
    jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000;
    describe('Test the job log viewer module', () => {
        let hostNode = null,
            runtimeBus = null;

        beforeAll(() => {
            window.kbaseRuntime = null;
        });
        beforeEach(() => {
            hostNode = document.createElement('div');
            document.body.appendChild(hostNode);
            runtimeBus = Runtime.make().bus();
        });

        afterEach(() => {
            hostNode.remove();
            window.kbaseRuntime = null;
        });

        it('Should load the module code successfully', () => {
            expect(JobLogViewer).toBeDefined();
        });

        it('Should have the factory method', () => {
            expect(JobLogViewer.make).toBeDefined();
            expect(JobLogViewer.make).toEqual(jasmine.any(Function));
        });

        it('Should be created', () => {
            let viewer = JobLogViewer.make();
            ['start', 'stop', 'detach'].forEach(fn => {
                expect(viewer[fn]).toEqual(jasmine.any(Function));
            });
        });

        it('Should fail to start without a node', () => {
            let viewer = JobLogViewer.make();
            const jobId = 'fakejob';
            let arg = {
                jobId: jobId
            };
            expect(() => viewer.start(arg)).toThrow(new Error('Requires a node to start'));
        });

        it('Should fail to start without a jobId', () => {
            let viewer = JobLogViewer.make();
            let arg = {
                node: hostNode
            };
            expect(() => viewer.start(arg)).toThrow(new Error('Requires a job id to start'));
        });

        it('Should start as expected with inputs, and be stoppable and detachable', () => {
            let viewer = JobLogViewer.make();
            let arg = {
                node: hostNode,
                jobId: 'someFakeJob'
            };
            viewer.start(arg);
            expect(hostNode.querySelector('div[data-element="kb-log"]')).toBeDefined();
            viewer.detach();
            expect(hostNode.innerHTML).toBe('');
        });

        it('Should send a bus messages requesting job status information at startup', (done) => {
            let viewer = JobLogViewer.make();
            const jobId = 'testJob1';
            const arg = {
                node: hostNode,
                jobId: jobId
            };
            runtimeBus.on('request-job-status', (msg) => {
                expect(msg).toEqual({jobId: jobId});
                viewer.detach();
                done();
            });
            viewer.start(arg);
        });

        it('Should react to job status messages', (done) => {
            let viewer = JobLogViewer.make();
            const jobId = 'testJobStatusMsg';
            const arg = {
                node: hostNode,
                jobId: jobId
            };
            runtimeBus.on('request-job-status', (msg) => {
                expect(msg).toEqual({jobId: jobId});
                runtimeBus.send(
                    {
                        jobId: jobId,
                        jobState: {
                            status: 'running'
                        }
                    },
                    {
                        channel: {
                            jobId: jobId
                        },
                        key: {
                            type: 'job-status'
                        }
                    }
                );
                viewer.detach();
                done();
            });
            viewer.start(arg);
        });

        it('Should start with all buttons disabled', () => {
            let viewer = JobLogViewer.make();
            const jobId = 'testBtnState';
            const arg = {
                node: hostNode,
                jobId: jobId
            };
            viewer.start(arg);
            let btns = hostNode.querySelectorAll('div[data-element="header"] button');
            btns.forEach(btn => {
                expect(btn.classList.contains('disabled')).toBeTruthy();
            });
            viewer.detach();
        });

        it('Should render on job-logs messages immediately on startup', (done) => {
            let viewer = JobLogViewer.make();
            const jobId = 'testJobLogMsgResp';
            const arg = {
                node: hostNode,
                jobId: jobId
            };
            runtimeBus.on('request-job-status', (msg) => {
                expect(msg).toEqual({jobId: jobId});
                runtimeBus.send(
                    {
                        jobId: jobId,
                        jobState: {
                            status: 'running'
                        }
                    },
                    {
                        channel: {
                            jobId: jobId
                        },
                        key: {
                            type: 'job-status'
                        }
                    }
                );
            });

            runtimeBus.on('request-latest-job-log', (msg) => {
                expect(msg).toEqual({jobId: jobId, options: {}});
                runtimeBus.send(
                    {
                        jobId: jobId,
                        latest: true,
                        logs: {
                            first: 0,
                            job_id: jobId,
                            latest: true,
                            max_lines: 2,
                            lines: [{
                                is_error: 0,
                                line: 'line 1 - log',
                                linepos: 1,
                                ts: 123456789
                            }, {
                                is_error: 1,
                                line: 'line 2 - error',
                                linepos: 1,
                                ts: 123456790
                            }]
                        }
                    },
                    {
                        channel: {
                            jobId: jobId
                        },
                        key: {
                            type: 'job-logs'
                        }
                    }
                );
                setTimeout(() => {
                    const panel = hostNode.querySelector('[data-element="log-panel"]');
                    expect(panel.children.length).toEqual(2);
                    const logLine = panel.children[0];
                    expect(logLine.classList.toLocaleString()).toEqual('kblog-line');
                    expect(logLine.innerHTML).toContain('line 1 - log');
                    const errorLine = panel.children[1];
                    expect(errorLine.classList.toLocaleString()).toEqual('kblog-line kb-error');
                    expect(errorLine.innerHTML).toContain('line 2 - error');
                    viewer.detach();
                    done();
                }, 500);
            });
            viewer.start(arg);
        });

        it('Should render a queued message for queued jobs', (done) => {
            let viewer = JobLogViewer.make();
            const jobId = 'testJobQueued';
            const arg = {
                node: hostNode,
                jobId: jobId
            };
            runtimeBus.on('request-job-status', (msg) => {
                expect(msg).toEqual({jobId: jobId});
                runtimeBus.send(
                    {
                        jobId: jobId,
                        jobState: {
                            status: 'queued'
                        }
                    },
                    {
                        channel: {
                            jobId: jobId
                        },
                        key: {
                            type: 'job-status'
                        }
                    }
                );
            });
            runtimeBus.on('request-job-update', (msg) => {
                expect(msg).toEqual({jobId: jobId});
                runtimeBus.send(
                    {
                        jobId: jobId,
                        jobState: {
                            status: 'queued'
                        }
                    },
                    {
                        channel: {
                            jobId: jobId
                        },
                        key: {
                            type: 'job-status'
                        }
                    }
                );
                setTimeout(() => {
                    const panel = hostNode.querySelector('[data-element="log-panel"]');
                    console.log(panel);
                    expect(panel.children.length).toEqual(1);
                    expect(panel.children[0].innerHTML).toContain('Job is queued'); //, logs will be available when the job is running.');
                    done();
                }, 500);
            });
            viewer.start(arg);
        });

        xit('Should render a canceled message for canceled jobs', (done) => {
        });

        xit('Should render an error message for errored jobs', (done) => {

        });

        xit('Should have the top button go to the top', (done) => {

        });

        xit('Should have the bottom button go to the end', (done) => {

        });

        xit('Should have the stop button make sure it stops', (done) => {

        });
    });
})
