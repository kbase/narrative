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

        it('should throw an error without the required start argument', async function () {
            await expectAsync(this.jobActionDropdownInstance.start({})).toBeRejectedWithError(
                /start argument must have the key "node"/
            );
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

                const dropdownButtons = container.querySelectorAll('.dropdown [data-action]');
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
            let container, jobActionDropdownInstance;

            /**
             * Test the expected state of the job action dropdown buttons
             *
             * @param {array}   expectations in the form [
             *                      ['querySelectorString', expectedValue],
             *                      ['querySelectorString', expectedValue],
             *                  ]
             *                  where querySelectorString is used to select elements
             *                  using container.querySelectorAll
             *
             *                  e.g. ['.dropdown [data-action]', true]
             *                  expect all elements with a data-action attribute to be disabled
             *
             *                  if no expectations are supplied, it is assumed that
             *                  all buttons are disabled
             */
            function expectButtonState(expectations) {
                jobActionDropdownInstance.updateState();
                if (!expectations || !expectations.length) {
                    expectations = [['.dropdown [data-action]', true]];
                }
                expectations.forEach((expectation) => {
                    const dropdownButtons = container.querySelectorAll(expectation[0]);
                    dropdownButtons.forEach((button) => {
                        expect(button.disabled).toBe(expectation[1]);
                    });
                });
            }

            beforeAll(async function () {
                container = document.createElement('div');
                this.model = Props.make({ data: { exec: { jobs: { byStatus: {} } } } });
                jobActionDropdownInstance = await createStartedInstance(container, {
                    model: this.model,
                });
            });

            afterAll(async () => {
                await jobActionDropdownInstance.stop();
                container.remove();
            });

            it('should not have any buttons enabled without jobs', function () {
                this.model.setItem('exec.jobs.byStatus', {});
                expectButtonState();
            });

            it('should not have any buttons enabled if all jobs are completed', function () {
                this.model.setItem('exec.jobs.byStatus', {
                    completed: {
                        job_1: true,
                        job_2: true,
                    },
                });
                expectButtonState();
            });

            it('should not have any buttons enabled if all jobs are not found', function () {
                this.model.setItem('exec.jobs.byStatus', {
                    does_not_exist: {
                        job_1: true,
                        job_2: true,
                    },
                });
                expectButtonState();
            });

            it('should have all buttons enabled with one job of each type', function () {
                // the default set-up (batchJobModel) should have all buttons active
                this.model.setItem(
                    'exec.jobs.byStatus',
                    batchJobModel.getItem('exec.jobs.byStatus')
                );
                expectButtonState([['.dropdown [data-action]', false]]);
            });

            it('queued and running jobs: cancel buttons active, retry buttons disabled', function () {
                this.model.setItem('exec.jobs.byStatus', {
                    queued: { job_1: true, job_2: true },
                    running: { job_3: true },
                });
                expectButtonState([
                    ['.dropdown [data-action="cancel"]', false],
                    ['.dropdown [data-action="retry"]', true],
                ]);
            });

            it('queued and running jobs: cancel buttons active, retry buttons disabled', function () {
                this.model.setItem('exec.jobs.byStatus', {
                    created: { job_1: true },
                    estimating: { job_2: true },
                    running: { job_3: true },
                });
                expectButtonState([
                    ['.dropdown [data-action="cancel"]', false],
                    ['.dropdown [data-action="retry"]', true],
                ]);
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
                expectButtonState([
                    ['.dropdown [data-action="cancel"]', true],
                    ['.dropdown [data-action="retry"]', false],
                ]);
            });
        });
    });
});