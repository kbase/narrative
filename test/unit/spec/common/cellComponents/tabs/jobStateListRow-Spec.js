define([
    'common/cellComponents/tabs/jobStatus/jobStateListRow',
    'common/props',
    'common/html',
    '/test/data/testAppObj',
    '/test/data/jobsData',
    'testUtil',
    'jquery',
    'jquery-dataTables',
], (JobStateListRow, Props, html, TestAppObject, JobsData, TestUtil, $) => {
    'use strict';

    const t = html.tag;
    const model = Props.make({
        data: TestAppObject,
    });
    const { cssBaseClass } = JobStateListRow;

    function createInstance() {
        return JobStateListRow.make({
            model: model,
        });
    }

    function getRandomJob(jobArray) {
        const randomId = Math.floor(Math.random() * Math.floor(jobArray.length));
        return jobArray[randomId];
    }

    async function startWithRandomJob(context, description) {
        context.jobId = description;
        context.job = Object.assign({}, getRandomJob(JobsData.validJobs), { job_id: description });
        context.row = document.createElement('tr');
        context.jobStateListRowInstance = createInstance();

        await context.jobStateListRowInstance.start({
            clickAction: () => {},
            jobState: context.job,
            name: 'testObject',
            node: context.row,
        });
    }

    /**
     * itHasRowStructure expects `this` to be set up as follows:
     *
     * row: a row element, altered by the jobStateListRow functions
     * job: the original job object used to create the jobStateListRow
     *      it has extra data under the key 'meta'
     * input: an altered job object with extra data under the key 'meta'
     */

    function itHasRowStructure() {
        it(`has the correct row structure`, function () {
            const row = this.row;
            const job = this.job;
            const input = this.input || job;

            // status details cell
            const logViewEl = row.querySelector(`.${cssBaseClass}__cell--log-view`);
            expect(logViewEl.textContent).toContain('Status details');

            // object name
            const objectEl = row.querySelector(`.${cssBaseClass}__cell--object`);
            if (input.meta.paramsRegex) {
                expect(objectEl.textContent).toMatch(input.meta.paramsRegex);
            } else {
                expect(objectEl.textContent).toContain('testObject');
            }

            // action
            const actionEl = row.querySelector(`.${cssBaseClass}__cell--action`);
            expect(actionEl.textContent).toContain(input.meta.jobAction);

            // status
            const statusEl = row.querySelector(`.${cssBaseClass}__cell--status`);
            expect(statusEl.textContent).toContain(input.meta.jobLabel);
        });
    }

    /**
     * itShouldUpdateWithValidInput is used to test that job state updates without throwing an error
     */
    function itShouldUpdateWithValidInput() {
        it('should update with valid input', function () {
            this.input = Object.assign({}, getRandomJob(JobsData.validJobs), {
                job_id: this.jobId,
            });
            try {
                this.jobStateListRowInstance.updateState(this.input);
                expect(true).toBeTruthy();
            } catch (err) {
                fail(err);
            }
        });
    }

    describe('The job state list row module', () => {
        it('loads', () => {
            expect(JobStateListRow).not.toBe(null);
        });

        it('has expected functions', () => {
            expect(JobStateListRow.make).toBeDefined();
            expect(JobStateListRow.make).toEqual(jasmine.any(Function));
        });

        it('has a base css class', () => {
            expect(JobStateListRow.cssBaseClass).toEqual(jasmine.any(String));
            expect(JobStateListRow.cssBaseClass).toContain('kb-job');
        });
    });

    describe('The job state list row instance', () => {
        beforeEach(function () {
            this.jobStateListRowInstance = createInstance();
        });

        it('has a make function that returns an object', function () {
            expect(this.jobStateListRowInstance).not.toBe(null);
            expect(this.jobStateListRowInstance).toEqual(jasmine.any(Object));
        });

        it('has the required methods', function () {
            const requiredFns = ['start', 'stop', 'updateState', 'updateParams'];
            requiredFns.forEach((fn) => {
                expect(this.jobStateListRowInstance[fn]).toBeDefined();
                expect(this.jobStateListRowInstance[fn]).toEqual(jasmine.any(Function));
            }, this);
        });
    });

    describe('Starting the job state list row instance', () => {
        beforeEach(function () {
            this.jobStateListRowInstance = createInstance();
        });
        const invalidArgs = [
            null,
            undefined,
            'a string',
            ['jobState'],
            {},
            {
                jobState: {},
            },
            {
                name: {},
                node: {},
            },
            {
                name: null,
                node: undefined,
                jobState: { this: 'that' },
            },
            {
                name: null,
                node: undefined,
                jobState: getRandomJob(JobsData.validJobs),
                clickAction: 1234,
            },
        ];
        invalidArgs.forEach((args) => {
            it('will throw an error with invalid args ' + JSON.stringify(args), async function () {
                await expectAsync(this.jobStateListRowInstance.start(args)).toBeRejectedWithError(
                    Error,
                    /invalid arguments supplied/
                );
            });
        });

        JobsData.invalidJobs.forEach((invalidJob) => {
            it('will throw an error with an invalid job', async function () {
                await expectAsync(
                    this.jobStateListRowInstance.start({
                        clickAction: () => {},
                        jobState: invalidJob,
                        name: 'whatever',
                        node: 'wherever',
                    })
                ).toBeRejectedWithError(
                    Error,
                    invalidJob ? /invalid job object supplied/ : /invalid arguments supplied/
                );
            });
        });
    });

    JobsData.validJobs.forEach((job) => {
        describe(`the job state list initial row structure and content for "${job.job_id}"`, () => {
            let container;
            beforeEach(async function () {
                container = document.createElement('tr');
                this.row = container;
                this.job = job;
                this.jobStateListRowInstance = createInstance();
                await this.jobStateListRowInstance.start({
                    clickAction: () => {},
                    jobState: this.job,
                    name: 'testObject',
                    node: container,
                });
            });

            afterEach(() => {
                container.remove();
            });

            itHasRowStructure();
        });
    });

    describe('the job state list row can update job state', () => {
        beforeEach(async function () {
            await startWithRandomJob(this, 'job update test');
        });
        itHasRowStructure();
        JobsData.validJobs.forEach((state) => {
            describe(`with a valid jobState object with status ${state.status}`, () => {
                // wrap `updateState` in `beforeEach` to get the correct `this` context
                beforeEach(function () {
                    this.state = state;
                    this.input = Object.assign({}, this.state, { job_id: this.jobId });
                    this.jobStateListRowInstance.updateState(this.input);
                });
                itHasRowStructure();
            });
        });
        JobsData.invalidJobs.forEach((invalidJob) => {
            beforeEach(function () {
                this.input = invalidJob;
            });
            it(`should not update with invalid job ${JSON.stringify(invalidJob)}`, function () {
                try {
                    this.jobStateListRowInstance.updateState(this.input);
                    fail('updateJob passed with an invalid job');
                } catch (err) {
                    expect(err).toMatch(/received invalid job object/);
                }
            });
            itHasRowStructure();
        });

        // test with a valid job to ensure the row is still updating
        itShouldUpdateWithValidInput();
        itHasRowStructure();
    });

    describe('the row listener ignores invalid updates', () => {
        beforeEach(async function () {
            await startWithRandomJob(this, 'invalid job update test');
        });
        itHasRowStructure();
        JobsData.validJobs.forEach((state) => {
            it('throws an error if the job ID does not match', function () {
                this.input = state;
                // toThrowError does not work here for unknown reasons
                try {
                    this.jobStateListRowInstance.updateState(this.input);
                    fail('updateJob passed with incorrect job ID');
                } catch (err) {
                    expect(err).toMatch(/received incorrect job object/);
                }
            });
            itHasRowStructure();
        });
        // test with a valid job with the correct ID to ensure the row is still updating
        itShouldUpdateWithValidInput();
        itHasRowStructure();
    });

    describe('the row listener can update job params', () => {
        beforeEach(async function () {
            await startWithRandomJob(this, 'job params update test');
        });
        itHasRowStructure();

        const tests = [
            {
                input: {
                    job_params: [{ this: 'that' }],
                },
                regex: new RegExp('this: that'),
            },
            {
                input: {
                    job_params: [{ tag_two: 'value two', tag_three: 'value three' }],
                },
                regex: new RegExp('tag_three: value three.*?tag_two: value two', 'ism'),
            },
        ];
        tests.forEach((test) => {
            describe('with input params ' + JSON.stringify(test.input), () => {
                beforeEach(function () {
                    // add in the correct jobId
                    test.input.job_id = this.jobId;
                    this.jobStateListRowInstance.updateParams(test.input);
                    this.input = Object.assign(
                        {},
                        JSON.parse(JSON.stringify(this.job)),
                        test.input
                    );
                    this.input.meta.paramsRegex = test.regex;
                });
                itHasRowStructure();
            });
        });
    });

    describe('the row listener cannot update job params', () => {
        beforeEach(async function () {
            await startWithRandomJob(this, 'job params update, invalid ID');
        });
        itHasRowStructure();
        it('will throw an error with an incorrect jobID', function () {
            // for unknown reasons, expect(...).toThrowError(...)
            // does not work here
            try {
                this.jobStateListRowInstance.updateParams({
                    job_id: 'a random and incorrect job ID',
                    job_params: [{ this: 'that' }],
                });
                fail('should not accept incorrect jobID');
            } catch (err) {
                expect(err).toMatch(/received incorrect job info/);
            }
        });
        itHasRowStructure();
    });

    describe('it cannot update job params if the job info object is invalid', () => {
        beforeEach(async function () {
            await startWithRandomJob(this, 'job params update, invalid object');
        });
        itHasRowStructure();
        JobsData.invalidInfo.forEach((invalidInfo) => {
            it('will throw an error with an invalid object', function () {
                // for unknown reasons, expect(...).toThrowError(...)
                // does not work here
                try {
                    this.jobStateListRowInstance.updateParams(invalidInfo);
                    fail('should not accept an invalid info obj');
                } catch (err) {
                    expect(err).toMatch(/received invalid job info object/);
                }
            });
            itHasRowStructure();
        });
    });

    describe('the job action button', () => {
        beforeEach(async function () {
            const completedJob = JobsData.validJobs.filter((job) => {
                return job.status === 'completed';
            })[0];

            this.jobId = 'job action button test';
            this.job = Object.assign({}, completedJob, { job_id: 'job action button test' });
            this.row = document.createElement('tr');
            this.jobStateListRowInstance = createInstance();

            await this.jobStateListRowInstance.start({
                clickAction: (e) => {
                    e.stopPropagation();
                    this.clickResult = 'Click detected!';
                },
                jobState: this.job,
                name: 'testObject',
                node: this.row,
            });
        });
        it('should trigger the click action when clicked', function () {
            expect(this.clickResult).toBeUndefined();
            this.row.querySelector('button').click();
            expect(this.clickResult).toEqual('Click detected!');
        });
    });

    function createMutationObserver(documentElement, elementStateFunction, doThisFirst) {
        return new Promise((resolve) => {
            if (elementStateFunction()) {
                resolve();
            }
            const observer = new MutationObserver(() => {
                if (elementStateFunction()) {
                    observer.disconnect();
                    resolve();
                }
            });
            observer.observe(documentElement, { attributes: true, childList: true, subtree: true });
            doThisFirst();
        });
    }

    describe('row selection', () => {
        let container;

        beforeEach(() => {
            container = document.createElement('div');
            container.innerHTML = t('table')({}, [
                t('thead')(
                    {},
                    t('tr')(
                        {},
                        ['object', 'status', 'action', 'log'].map((thing) => {
                            return t('th')(
                                {
                                    class: 'whatever',
                                },
                                thing
                            );
                        })
                    )
                ),
                t('tbody')({}, [
                    JobsData.validJobs.map((job) => {
                        return t('tr')({
                            class: `${cssBaseClass}__row`,
                            dataElementJobId: job.job_id,
                        });
                    }),
                ]),
            ]);
            const widgetsByStatus = {};
            return Promise.all(
                Array.from(container.querySelectorAll(`.${cssBaseClass}__row`)).map((tr, ix) => {
                    const job = JobsData.validJobs[ix];
                    widgetsByStatus[job.status] = JobStateListRow.make();
                    return widgetsByStatus[job.status].start({
                        node: tr,
                        jobState: job,
                        name: job.status,
                        clickAction: () => {},
                    });
                })
            ).then(() => {
                // convert to a datatable
                $(container.querySelector('table')).dataTable({ order: [2, 'asc'] });
            });
        });

        afterEach(() => {
            container.remove();
        });

        it('has no rows selected initially', () => {
            expect(container.querySelectorAll(`.${cssBaseClass}__row`).length).toEqual(
                JobsData.validJobs.length
            );
            expect(container.querySelectorAll(`.${cssBaseClass}__row--selected`).length).toEqual(0);
        });

        it('can show and hide child rows', async () => {
            const rows = container.querySelectorAll(`.${cssBaseClass}__row`);

            let $currentRow = $(rows[2]);
            await createMutationObserver(
                container.querySelector('tbody'),
                () => {
                    return container.querySelectorAll('.vertical_collapse--open').length === 1;
                },
                () => {
                    $currentRow.click();
                }
            );

            // after clicking, there should be one extra row
            expect(container.querySelectorAll('tbody tr').length).toEqual(rows.length + 1);

            // the current row should be selected and have the class 'vertical_collapse--open'
            expect($currentRow[0]).toHaveClass('vertical_collapse--open');
            expect($currentRow[0]).toHaveClass(`${cssBaseClass}__row--selected`);

            // check for the job log viewer in the row underneath the row that was clicked
            let $nextRow = $currentRow.next();
            expect($nextRow[0]).not.toHaveClass(`${cssBaseClass}__row`);
            expect($nextRow.find('.kb-log__logs_title')[0].textContent).toContain('Logs');

            // click on another row
            $currentRow = $(rows[5]);
            await createMutationObserver(
                container.querySelector('tbody'),
                () => {
                    return container.querySelectorAll('.vertical_collapse--open').length === 2;
                },
                () => {
                    $currentRow.click();
                }
            );
            expect(container.querySelectorAll('tbody tr').length).toEqual(rows.length + 2);

            // the current row should be selected and have the class 'vertical_collapse--open'
            expect($currentRow[0]).toHaveClass('vertical_collapse--open');
            expect($currentRow[0]).toHaveClass(`${cssBaseClass}__row--selected`);

            // the next row is a log viewer row
            $nextRow = $currentRow.next();
            expect($nextRow[0]).not.toHaveClass(`${cssBaseClass}__row`);
            expect($nextRow.find('.kb-log__logs_title')[0].textContent).toContain('Logs');

            // click again to remove the row
            await createMutationObserver(
                container.querySelector('tbody'),
                () => {
                    return container.querySelectorAll('.vertical_collapse--open').length === 1;
                },
                () => {
                    $currentRow.click();
                }
            );
            expect(container.querySelectorAll('tbody tr').length).toEqual(rows.length + 1);

            // the current row is still selected but does not have the class 'vertical_collapse--open'
            expect($currentRow[0]).not.toHaveClass('vertical_collapse--open');
            expect($currentRow[0]).toHaveClass(`${cssBaseClass}__row--selected`);
            // the log viewer row has been removed, so the next row is a standard table row
            expect($currentRow.next()[0]).toHaveClass(`${cssBaseClass}__row`);
        });
    });
});
