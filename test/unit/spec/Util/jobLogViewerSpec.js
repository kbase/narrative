/*global define, describe, it, expect, jasmine, beforeEach, afterEach*/
/*jslint white: true*/
define([
    'util/jobLogViewer',
    'common/runtime'
], (
    JobLogViewer,
    Runtime
) => {
    describe('Test the job log viewer module', () => {
        let hostNode = null,
            runtimeBus = null;
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
            expect(viewer.start).toEqual(jasmine.any(Function));
            expect(viewer.stop).toEqual(jasmine.any(Function));
            expect(viewer.detach).toEqual(jasmine.any(Function));
        });

        it('Should fail to start without a node', () => {
            let viewer = JobLogViewer.make();
            const jobId = 'fakejob';
            let arg = {
                jobId: jobId
            };
            expect(() => {viewer.start(arg)}).toThrow(new Error('Requires a node to start'));
        });

        it('Should fail to start without a jobId', () => {
            let viewer = JobLogViewer.make();
            let arg = {
                node: hostNode
            };
            expect(() => {viewer.start(arg)}).toThrow(new Error('Requires a job id to start'));
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

        it('Should render on job-logs messages', (done) => {
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
                expect(msg).toEqual({jobId: jobId});
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
    });
})
