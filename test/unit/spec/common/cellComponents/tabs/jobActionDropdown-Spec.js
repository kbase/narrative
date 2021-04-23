define([
    'common/cellComponents/tabs/jobStatus/jobActionDropdown',
    'common/props',
    '/test/data/testAppObj',
], (JobActionDropdown, Props, TestAppObj) => {
    'use strict';

    const batchJobModel = Props.make({
        data: {
            exec: {
                jobs: TestAppObj.exec.jobs,
            },
        },
    });

    function createInstance(config) {
        return JobActionDropdown.make(
            Object.assign(
                {
                    jobManager: {
                        updateState: () => {
                            /* nothing */
                        },
                    },
                    model: batchJobModel,
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

    describe('The job action dropdown module', () => {
        it('loads', () => {
            expect(JobActionDropdown).not.toBe(null);
        });

        it('has expected functions', () => {
            expect(JobActionDropdown.make).toEqual(jasmine.any(Function));
        });

        it('has a cssBaseClass variable', () => {
            expect(JobActionDropdown.cssBaseClass).toEqual(jasmine.any(String));
            expect(JobActionDropdown.cssBaseClass).toContain('kb-job-action');
        });
    });

    describe('The job action dropdown instance', () => {
        let container;
        beforeEach(function () {
            container = document.createElement('div');
            this.jobActionDropdownInstance = createInstance();
        });

        afterEach(() => {
            container.remove();
        });

        it('has a make function that returns an object', function () {
            expect(this.jobActionDropdownInstance).not.toBe(null);
            expect(this.jobActionDropdownInstance).toEqual(jasmine.any(Object));
        });

        it('has the required methods', function () {
            ['start', 'stop', 'updateState'].forEach((fn) => {
                expect(this.jobActionDropdownInstance[fn]).toBeDefined();
                expect(this.jobActionDropdownInstance[fn]).toEqual(jasmine.any(Function));
            }, this);
        });

        it('should start, and populate a node', async function () {
            expect(container.children.length).toBe(0);
            await this.jobActionDropdownInstance.start({
                node: container,
            });
            expect(container.children.length).toBeGreaterThan(0);
            // button to trigger the dropdown, four dropdown options
            expect(container.querySelectorAll('button').length).toBe(5);
        });
    });

    describe('the started job action dropdown instance', () => {
        describe('buttons', () => {
            let container;

            beforeEach(() => {
                container = document.createElement('div');
            });

            afterEach(() => {
                container.remove();
            });

            it('should perform dropdown options when clicked', async () => {
                const results = [];

                await createStartedInstance(container, {
                    jobManager: {
                        retryJobsByStatus: (args) => {
                            results.push(['retry', args]);
                        },
                        cancelJobsByStatus: (args) => {
                            results.push(['cancel', args]);
                        },
                    },
                });

                const dropdownButtons = container.querySelectorAll(`.dropdown [data-action]`);
                dropdownButtons.forEach((button) => {
                    button.click();
                });

                const argCombos = Array.from(dropdownButtons).map((button) => {
                    return [
                        button.getAttribute('data-action'),
                        button.getAttribute('data-target').split('||'),
                    ];
                });
                expect(results).toEqual(argCombos);
            });
        });

        describe('button state', () => {
            let container;

            beforeAll(async function () {
                container = document.createElement('div');
                this.model = Props.make({ data: { exec: { jobs: { byStatus: {} } } } });
                this.jobActionDropdownInstance = await createStartedInstance(container, {
                    model: this.model,
                });
            });

            afterAll(async function () {
                await this.jobActionDropdownInstance.stop();
                container.remove();
            });

            it('should not have any buttons enabled without jobs', function () {
                this.model.setItem('byStatus', {});
                this.jobActionDropdownInstance.updateState();
                const dropdownButtons = container.querySelectorAll(`.dropdown [data-action]`);
                dropdownButtons.forEach((button) => {
                    expect(button.disabled).toBeTrue();
                });
            });

            it('should not have any buttons enabled if all jobs are completed', function () {
                this.model.setItem('exec.jobs.byStatus', {
                    completed: {
                        job_1: true,
                        job_2: true,
                    },
                });
                this.jobActionDropdownInstance.updateState();
                const dropdownButtons = container.querySelectorAll(`.dropdown [data-action]`);
                dropdownButtons.forEach((button) => {
                    expect(button.disabled).toBeTrue();
                });
            });

            it('should not have any buttons enabled if all jobs are not found', function () {
                this.model.setItem('exec.jobs.byStatus', {
                    does_not_exist: {
                        job_1: true,
                        job_2: true,
                    },
                });
                this.jobActionDropdownInstance.updateState();
                const dropdownButtons = container.querySelectorAll(`.dropdown [data-action]`);
                dropdownButtons.forEach((button) => {
                    expect(button.disabled).toBeTrue();
                });
            });

            it('should have all buttons enabled with one job of each type', function () {
                // the default set-up (batchJobModel) should have all buttons active
                this.model.setItem(
                    'exec.jobs.byStatus',
                    batchJobModel.getItem('exec.jobs.byStatus')
                );
                this.jobActionDropdownInstance.updateState();
                const dropdownButtons = container.querySelectorAll(`.dropdown [data-action]`);
                dropdownButtons.forEach((button) => {
                    expect(button.disabled).toBeFalse();
                });
            });

            it('queued and running jobs: cancel buttons active, retry buttons disabled', function () {
                this.model.setItem('exec.jobs.byStatus', {
                    queued: { job_1: true, job_2: true },
                    running: { job_3: true },
                });
                this.jobActionDropdownInstance.updateState();
                const dropdownButtons = container.querySelectorAll(`.dropdown [data-action]`);
                dropdownButtons.forEach((button) => {
                    if (button.getAttribute('data-action') === 'cancel') {
                        expect(button.disabled).toBeFalse();
                    } else {
                        expect(button.disabled).toBeTrue();
                    }
                });
            });

            it('queued and running jobs: cancel buttons active, retry buttons disabled', function () {
                this.model.setItem('exec.jobs.byStatus', {
                    created: { job_1: true },
                    estimating: { job_2: true },
                    running: { job_3: true },
                });
                this.jobActionDropdownInstance.updateState();
                const dropdownButtons = container.querySelectorAll(`.dropdown [data-action]`);
                dropdownButtons.forEach((button) => {
                    if (button.getAttribute('data-action') === 'cancel') {
                        expect(button.disabled).toBeFalse();
                    } else {
                        expect(button.disabled).toBeTrue();
                    }
                });
            });

            it('cancelled and failed jobs: retry buttons active, cancel buttons disabled', function () {
                this.model.setItem('exec.jobs.byStatus', {
                    error: {
                        job_1: true,
                        job_2: true,
                    },
                    terminated: {
                        job_3: true,
                    },
                });
                this.jobActionDropdownInstance.updateState();
                const dropdownButtons = container.querySelectorAll(`.dropdown [data-action]`);
                dropdownButtons.forEach((button) => {
                    if (button.getAttribute('data-action') === 'retry') {
                        expect(button.disabled).toBeFalse();
                    } else {
                        expect(button.disabled).toBeTrue();
                    }
                });
            });
        });
    });
});
