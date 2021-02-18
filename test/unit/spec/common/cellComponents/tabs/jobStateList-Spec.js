define([
    'common/cellComponents/tabs/jobStatus/jobStateList',
    'common/props',
    '/test/data/testAppObj',
], (jobStateList, Props, TestAppObject) => {
    'use strict';

    const model = Props.make({
        data: TestAppObject,
    });

    function createInstance() {
        return jobStateList.make({
            model: model,
        });
    }

    describe('The job state list module', () => {
        it('loads', () => {
            expect(jobStateList).not.toBe(null);
        });

        it('has expected functions', () => {
            expect(jobStateList.make).toEqual(jasmine.any(Function));
        });

        it('has a cssBaseClass variable', () => {
            expect(jobStateList.cssBaseClass).toEqual(jasmine.any(String));
            expect(jobStateList.cssBaseClass).toContain('kb-job');
        });
    });

    describe('The job state list instance', () => {
        beforeEach(function () {
            this.node = document.createElement('div');
            this.jobStateListInstance = createInstance();
        });

        afterEach(function () {
            this.node.remove();
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
            expect(this.node.children.length).toBe(0);
            await this.jobStateListInstance.start({
                node: this.node,
                jobState: model.getItem('exec.jobState'),
            });
            expect(this.node.children.length).toBeGreaterThan(0);
        });
    });

    describe('the job state list structure and content', () => {
        const cssBaseClass = jobStateList.cssBaseClass;

        beforeAll(async function () {
            this.jobStateListInstance = createInstance();
            this.node = document.createElement('div');
            await this.jobStateListInstance.start({
                node: this.node,
                jobState: model.getItem('exec.jobState'),
            });
        });

        afterAll(async function () {
            await this.jobStateListInstance.stop();
            this.node.remove();
        });

        const classContents = [
            `${cssBaseClass}__table`,
            `${cssBaseClass}__table_head`,
            `${cssBaseClass}__table_head_row`,
            `${cssBaseClass}__table_head_cell`,
            `${cssBaseClass}__table_body`,
            `${cssBaseClass}__row`,
        ];

        classContents.forEach((item) => {
            it(`should have an element with class ${item}`, function () {
                expect(this.node.querySelectorAll(`.${item}`).length).toBeGreaterThan(0);
            });
        });

        it('should generate a row for each job', function () {
            expect(this.node.querySelectorAll(`.${cssBaseClass}__row`).length).toEqual(
                TestAppObject.exec.jobState.child_jobs.length
            );
        });
    });
});
