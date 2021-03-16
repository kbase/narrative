define(['util/jobLogViewer', 'common/runtime'], (JobLogViewer, Runtime) => {
    'use strict';
    jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000;
    describe('Test the job log viewer module', () => {
        const cssBaseClass = 'kb-log';
        let hostNode = null,
            runtimeBus = null;

        beforeAll(() => {
            window.kbaseRuntime = null;
        });
        beforeEach(() => {
            hostNode = document.createElement('div');
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
            const viewer = JobLogViewer.make();
            ['start', 'stop', 'detach'].forEach((fn) => {
                expect(viewer[fn]).toEqual(jasmine.any(Function));
            });
        });

        it('Should fail to start without a node', async function () {
            const jobLogViewerInstance = JobLogViewer.make();
            try {
                await jobLogViewerInstance.start({
                    jobId: 'fakejob',
                });
                fail('this should not have completed successfully');
            } catch (error) {
                expect(error).toMatch(/Requires a node to start/);
            }
        });

        it('Should fail to start without a jobId', async function () {
            const jobLogViewerInstance = JobLogViewer.make();
            try {
                await jobLogViewerInstance.start({
                    node: hostNode,
                });
                fail('this should not have completed successfully');
            } catch (error) {
                expect(error).toMatch(/Requires a job id to start/);
            }
        });

        it('Should start as expected with inputs, and be stoppable and detachable', async () => {
            const viewer = JobLogViewer.make();
            const arg = {
                node: hostNode,
                jobId: 'someFakeJob',
            };
            await viewer.start(arg);
            expect(hostNode.querySelector('div[data-element="kb-log"]')).toBeDefined();
            viewer.detach();
            expect(hostNode.innerHTML).toBe('');
        });

        it('Should send a bus messages requesting job status information at startup', async (done) => {
            const viewer = JobLogViewer.make();
            const jobId = 'testJob1';
            const arg = {
                node: hostNode,
                jobId: jobId,
            };
            runtimeBus.on('request-job-status', (msg) => {
                expect(msg).toEqual({ jobId: jobId });
                viewer.detach();
                done();
            });
            await viewer.start(arg);
        });

        it('Should react to job status messages', async (done) => {
            const viewer = JobLogViewer.make();
            const jobId = 'testJobStatusMsg';
            const arg = {
                node: hostNode,
                jobId: jobId,
            };
            runtimeBus.on('request-job-status', (msg) => {
                expect(msg).toEqual({ jobId: jobId });
                runtimeBus.send(
                    {
                        jobId: jobId,
                        jobState: {
                            status: 'running',
                        },
                    },
                    {
                        channel: {
                            jobId: jobId,
                        },
                        key: {
                            type: 'job-status',
                        },
                    }
                );
                viewer.detach();
                done();
            });
            await viewer.start(arg);
        });

        it('Should start with all buttons disabled', async () => {
            const viewer = JobLogViewer.make();
            const jobId = 'testBtnState';
            const arg = {
                node: hostNode,
                jobId: jobId,
            };
            await viewer.start(arg);
            const btns = hostNode.querySelectorAll('div[data-element="header"] button');
            btns.forEach((btn) => {
                expect(btn.classList.contains('disabled')).toBeTruthy();
            });
            viewer.detach();
        });

        it('Should render on job-logs messages immediately on startup', async (done) => {
            const viewer = JobLogViewer.make();
            const jobId = 'testJobLogMsgResp';
            const arg = {
                node: hostNode,
                jobId: jobId,
            };
            runtimeBus.on('request-job-status', (msg) => {
                expect(msg).toEqual({ jobId: jobId });
                runtimeBus.send(
                    {
                        jobId: jobId,
                        jobState: {
                            status: 'running',
                        },
                    },
                    {
                        channel: {
                            jobId: jobId,
                        },
                        key: {
                            type: 'job-status',
                        },
                    }
                );
            });

            runtimeBus.on('request-latest-job-log', (msg) => {
                expect(msg).toEqual({ jobId: jobId, options: {} });
                runtimeBus.send(
                    {
                        jobId: jobId,
                        latest: true,
                        logs: {
                            first: 0,
                            job_id: jobId,
                            latest: true,
                            max_lines: 2,
                            lines: [
                                {
                                    is_error: 0,
                                    line: 'line 1 - log',
                                    linepos: 1,
                                    ts: 123456789,
                                },
                                {
                                    is_error: 1,
                                    line: 'line 2 - error',
                                    linepos: 1,
                                    ts: 123456790,
                                },
                            ],
                        },
                    },
                    {
                        channel: {
                            jobId: jobId,
                        },
                        key: {
                            type: 'job-logs',
                        },
                    }
                );
                setTimeout(() => {
                    const panel = hostNode.querySelector('[data-element="log-panel"]');
                    expect(panel.children.length).toEqual(2);
                    const logLine = panel.children[0];
                    expect(logLine.classList.toLocaleString()).toContain(
                        `${cssBaseClass}__line_container`
                    );
                    expect(logLine.innerHTML).toContain('line 1 - log');
                    const errorLine = panel.children[1];
                    expect(errorLine.classList.toLocaleString()).toContain(
                        `${cssBaseClass}__line_container--error`
                    );
                    expect(errorLine.innerHTML).toContain('line 2 - error');
                    viewer.detach();
                    done();
                }, 500);
            });
            await viewer.start(arg);
        });

        it('Should render a queued message for queued jobs', async (done) => {
            const viewer = JobLogViewer.make();
            const jobId = 'testJobQueued',
                arg = {
                    node: hostNode,
                    jobId: jobId,
                },
                jobData = {
                    jobId: jobId,
                    jobState: {
                        status: 'queued',
                    },
                },
                channelData = {
                    channel: {
                        jobId: jobId,
                    },
                    key: {
                        type: 'job-status',
                    },
                };

            runtimeBus.on('request-job-status', (msg) => {
                expect(msg).toEqual({ jobId: jobId });
                runtimeBus.send(jobData, channelData);
            });

            runtimeBus.on('request-job-update', (msg) => {
                expect(msg).toEqual({ jobId: jobId });
                runtimeBus.send(jobData, channelData);

                setTimeout(() => {
                    const panel = hostNode.querySelector('[data-element="log-panel"]');
                    expect(panel.children.length).toEqual(1);
                    expect(panel.children[0].innerHTML).toContain('Job is queued'); //, logs will be available when the job is running.');
                    done();
                }, 500);
            });
            await viewer.start(arg);
        });

        xit('Should render a canceled message for canceled jobs', () => {});

        xit('Should render an error message for errored jobs', () => {});

        xit('Should have the top button go to the top', () => {});

        xit('Should have the bottom button go to the end', () => {});

        xit('Should have the stop button make sure it stops', () => {});
    });
});
