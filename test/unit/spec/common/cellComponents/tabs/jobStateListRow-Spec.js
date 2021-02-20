/* eslint-disable prefer-arrow-callback */
define([
    'common/cellComponents/tabs/jobStatus/jobStateListRow',
    'common/props',
    '/test/data/testAppObj',
    '/test/data/jobsData',
], (JobStateListRow, Props, TestAppObject, JobsData) => {
    'use strict';

    const model = Props.make({
        data: TestAppObject,
        onUpdate: () => {},
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

    function generateRandomInput(thisObject, jobName) {
        const row = document.createElement('tr'),
            randomJob = Object.assign({}, getRandomJob(JobsData.validJobs), { job_id: jobName });

        thisObject.row = row;
        thisObject.jobId = jobName;
        thisObject.job = randomJob;

        return thisObject;
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
            beforeEach(async function () {
                this.job = job;
                this.row = document.createElement('tr');
                this.jobStateListRowInstance = createInstance();
                await this.jobStateListRowInstance.start({
                    node: this.row,
                    jobState: this.job,
                    name: 'testObject',
                });
            });
            itHasRowStructure();
        });
    });

    describe('the job state list row can update job state', () => {
        beforeEach(async function () {
            generateRandomInput(this, 'job update test');
            this.jobStateListRowInstance = createInstance();
            await this.jobStateListRowInstance.start({
                node: this.row,
                jobState: this.job,
                name: 'testObject',
            });
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
    });

    describe('the row listener ignores invalid job state updates', () => {
        beforeEach(async function () {
            generateRandomInput(this, 'invalid job update test');
            this.jobStateListRowInstance = createInstance();
            await this.jobStateListRowInstance.start({
                node: this.row,
                jobState: this.job,
                name: 'testObject',
            });
        });
        itHasRowStructure();
        JobsData.invalidJobs.forEach((invalidJob) => {
            beforeEach(function () {
                this.input = invalidJob;
            });
            it(`should not update with invalid job ${JSON.stringify(invalidJob)}`, function () {
                try {
                    this.jobStateListRowInstance.updateState(this.input);
                    fail('updateJob passed with an invalid job');
                } catch (err) {
                    // expect(err).toBe(jasmine.any(Error));
                    expect(err).toMatch(/received invalid job object/);
                }
            });
            itHasRowStructure();
        });

        // test with a valid job to ensure the row is still updating
        it('should update with valid input', function () {
            this.input = Object.assign({}, getRandomJob(JobsData.validJobs), {
                job_id: this.jobId,
            });
            this.jobStateListRowInstance.updateState(this.input);
            expect(true).toBeTruthy();
        });
        itHasRowStructure();
    });

    describe('the row listener ignores invalid updates', () => {
        beforeEach(async function () {
            generateRandomInput(this, 'invalid job update test');
            this.jobStateListRowInstance = createInstance();
            await this.jobStateListRowInstance.start({
                node: this.row,
                jobState: this.job,
                name: 'testObject',
            });
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
        it('should update with valid input', function () {
            this.input = Object.assign({}, getRandomJob(JobsData.validJobs), {
                job_id: this.jobId,
            });
            this.jobStateListRowInstance.updateState(this.input);
            expect(true).toBeTruthy();
        });
        itHasRowStructure();
    });

    describe('the row listener can update job params', () => {
        beforeEach(async function () {
            generateRandomInput(this, 'job params update test');
            this.jobStateListRowInstance = createInstance();
            await this.jobStateListRowInstance.start({
                node: this.row,
                jobState: this.job,
                name: 'testObject',
            });
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
            generateRandomInput(this, 'job params update, invalid ID');
            this.jobStateListRowInstance = createInstance();
            await this.jobStateListRowInstance.start({
                node: this.row,
                jobState: this.job,
                name: 'testObject',
            });
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
            generateRandomInput(this, 'job params update, invalid object');
            this.jobStateListRowInstance = createInstance();
            await this.jobStateListRowInstance.start({
                node: this.row,
                jobState: this.job,
                name: 'testObject',
            });
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
});
