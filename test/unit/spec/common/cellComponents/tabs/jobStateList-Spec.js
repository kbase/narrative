define([
    'common/cellComponents/tabs/jobStatus/jobStateList',
    'common/jobs',
    'common/props',
    'common/runtime',
    'testUtil',
    '/test/data/jobsData',
], (JobStateList, Jobs, Props, Runtime, TestUtil, JobsData) => {
    'use strict';

    const model = Props.make({
        data: {
            exec: {
                jobs: Jobs.jobArrayToIndexedObject(JobsData.validJobs),
            },
        },
    });

    function createInstance(config = {}) {
        return JobStateList.make(
            Object.assign(
                {},
                {
                    model: model,
                    jobManager: {},
                    devMode: true,
                },
                config
            )
        );
    }

    async function createStartedInstance(container, config = {}) {
        const instance = createInstance(config);
        await instance.start({
            node: container,
        });
        return instance;
    }

    describe('The job state list module', () => {
        it('loads', () => {
            expect(JobStateList).not.toBe(null);
        });

        it('has expected functions', () => {
            expect(JobStateList.make).toEqual(jasmine.any(Function));
        });

        it('has a cssBaseClass variable', () => {
            expect(JobStateList.cssBaseClass).toEqual(jasmine.any(String));
            expect(JobStateList.cssBaseClass).toContain('kb-job-status');
        });
    });

    describe('The job state list instance', () => {
        let container;
        beforeEach(function () {
            container = document.createElement('div');
            this.jobStateListInstance = createInstance();
        });

        afterEach(() => {
            container.remove();
        });
        it('has a make function that returns an object', function () {
            expect(this.jobStateListInstance).not.toBe(null);
            expect(this.jobStateListInstance).toEqual(jasmine.any(Object));
        });

        it('has the required methods', function () {
            ['start', 'stop'].forEach((fn) => {
                expect(this.jobStateListInstance[fn]).toBeDefined();
                expect(this.jobStateListInstance[fn]).toEqual(jasmine.any(Function));
            }, this);
        });

        it('should start, and populate a node', async function () {
            expect(container.children.length).toBe(0);
            await this.jobStateListInstance.start({
                node: container,
            });
            expect(container.children.length).toBeGreaterThan(0);
        });
    });

    describe('the started job state list instance', () => {
        const cssBaseClass = JobStateList.cssBaseClass;
        describe('structure and content', () => {
            let container;
            beforeAll(async function () {
                container = document.createElement('div');
                this.jobStateListInstance = await createStartedInstance(container);
            });

            afterAll(async function () {
                await this.jobStateListInstance.stop();
                container.remove();
            });

            const classContents = [
                `${cssBaseClass}__table`,
                `${cssBaseClass}__table_head`,
                `${cssBaseClass}__table_head_row`,
                `${cssBaseClass}__table_body`,
                `${cssBaseClass}__row`,
            ];

            classContents.forEach((item) => {
                it(`should have an element with class ${item}`, () => {
                    expect(container.querySelectorAll(`.${item}`).length).toBeGreaterThan(0);
                });
            });

            const tableHeadCells = {
                action: 'Action',
                'log-view': 'Status details',
                object: 'Object',
                status: 'Status',
            };
            Object.keys(tableHeadCells).forEach((key) => {
                it(`should generate appropriate table header cell for ${key}`, () => {
                    expect(
                        container.querySelectorAll(`.${cssBaseClass}__table_head_cell--${key}`)
                            .length
                    ).toEqual(1);
                    expect(
                        container.querySelector(`.${cssBaseClass}__table_head_cell--${key}`)
                            .textContent
                    ).toContain(tableHeadCells[key]);
                });
            });

            it('should generate a row for each job', () => {
                expect(container.querySelectorAll(`.${cssBaseClass}__row`).length).toEqual(
                    Object.keys(JobsData.validJobs).length
                );
            });
        });

        describe('actions', () => {
            const jobFunctions = [
                'cancelJob',
                'cancelJobsByStatus',
                'retryJob',
                'retryJobsByStatus',
                'viewJobResults',
                'updateJobState',
            ];

            const actionButtonToFunction = {
                cancel: 'cancelJob',
                retry: 'retryJob',
                'go-to-results': 'viewJobResults',
            };
            const dropdownButtonToFunction = {
                cancel: 'cancelJobsByStatus',
                retry: 'retryJobsByStatus',
            };

            const jobManager = {};
            jobFunctions.forEach((fn) => {
                jobManager[fn] = () => {};
            });

            describe('table row actions', () => {
                let container;

                beforeEach(async function () {
                    container = document.createElement('div');
                    this.jobManager = jobManager;
                    this.jobStateListInstance = await createStartedInstance(container, {
                        jobManager: this.jobManager,
                    });
                });

                afterEach(async function () {
                    await this.jobStateListInstance.stop();
                    container.remove();
                });

                Object.keys(actionButtonToFunction).forEach((action) => {
                    it(`should do the ${action} action`, function () {
                        const resultsButtons = container.querySelectorAll(
                            `tr [data-action="${action}"]`
                        );
                        expect(resultsButtons.length).toBeGreaterThan(0);

                        return new Promise((resolve) => {
                            // resolve the promise when we see this.jobManager getting called
                            Object.keys(this.jobManager).forEach((fn) => {
                                spyOn(this.jobManager, fn).and.callFake((...args) => {
                                    resolve(args);
                                });
                            });
                            resultsButtons[0].click();
                        }).then(() => {
                            const jobId = resultsButtons[0].getAttribute('data-target');
                            const expectedFunction = actionButtonToFunction[action];
                            expect(this.jobManager[expectedFunction]).toHaveBeenCalledWith(jobId);
                            Object.values(dropdownButtonToFunction).forEach((fn) => {
                                expect(this.jobManager[fn]).not.toHaveBeenCalled();
                            });
                        });
                    });
                });

                it('should perform dropdown options', function () {
                    const dropdownButtons = container.querySelectorAll(`.dropdown [data-action]`);
                    let actionCounter = 0;

                    return new Promise((resolve) => {
                        Object.keys(this.jobManager).forEach((fn) => {
                            spyOn(this.jobManager, fn).and.callFake((...args) => {
                                actionCounter++;
                                if (actionCounter === dropdownButtons.length) {
                                    resolve(args);
                                }
                            });
                        });
                        dropdownButtons.forEach((button) => {
                            button.click();
                        });
                    }).then(() => {
                        Object.values(actionButtonToFunction).forEach((fn) => {
                            expect(this.jobManager[fn]).not.toHaveBeenCalled();
                        });
                        const argCombos = Array.from(dropdownButtons).map((button) => {
                            return [
                                button.getAttribute('data-action'),
                                button.getAttribute('data-target').split('||'),
                            ];
                        });
                        argCombos.forEach((args) => {
                            const expectedFunction = dropdownButtonToFunction[args[0]];
                            expect(this.jobManager[expectedFunction]).toHaveBeenCalledWith(args[1]);
                        });
                    });
                });
            });
        });
        describe('response to updates', () => {
            let container;
            beforeEach(async function () {
                container = document.createElement('div');
                window.kbaseRuntime = null;
                this.bus = Runtime.make().bus();
                this.jobStateUpdated = false;
                this.jobStateListInstance = await createStartedInstance(container, {
                    jobManager: {
                        updateJobState: () => {
                            this.jobStateUpdated = true;
                        },
                    },
                });
            });

            afterEach(async function () {
                await this.jobStateListInstance.stop();
                container.remove();
                window.kbaseRuntime = null;
            });

            it('should respond to a job status update', async function () {
                // update the queued job to running
                document.body.append(container);
                const queuedJob = JobsData.jobsByStatus.queued[0],
                    runningJob = JobsData.jobsByStatus.running[0];

                ['doesNotExist', 'params', 'status'].forEach((type) => {
                    expect(
                        this.jobStateListInstance.listeners[`${type}__${queuedJob.job_id}`]
                    ).toBeDefined();
                });
                // wait for change under the queuedJob.job_id node
                await TestUtil.waitForElementChange(
                    container.querySelector(`[data-element-job-id="${queuedJob.job_id}"]`),
                    () => {
                        this.bus.send(
                            {
                                jobState: Object.assign({}, runningJob, {
                                    job_id: queuedJob.job_id,
                                    status: 'running',
                                }),
                            },
                            {
                                channel: {
                                    jobId: queuedJob.job_id,
                                },
                                key: {
                                    type: 'job-status',
                                },
                            }
                        );
                    }
                );
                expect(
                    this.jobStateListInstance.listeners[`doesNotExist__${queuedJob.job_id}`]
                ).not.toBeDefined();
                expect(this.jobStateUpdated).toBeTrue();
                expect(model.getItem('exec.jobs.byStatus.queued')).not.toBeDefined();
                const runningJobs = model.getItem('exec.jobs.byStatus.running');
                expect(Object.keys(runningJobs).length).toEqual(2);
            });
        });
    });
});
