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
                jobState: model.getItem('exec.jobState'),
            });
            expect(container.children.length).toBeGreaterThan(0);
        });
    });

    describe('the job state list structure and content', () => {
        const cssBaseClass = jobStateList.cssBaseClass;
        let container;

        beforeAll(async function () {
            this.jobStateListInstance = createInstance();
            container = document.createElement('div');
            await this.jobStateListInstance.start({
                node: container,
                jobState: model.getItem('exec.jobState'),
            });
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
                    container.querySelectorAll(`.${cssBaseClass}__table_head_cell--${key}`).length
                ).toEqual(1);
                expect(
                    container.querySelector(`.${cssBaseClass}__table_head_cell--${key}`).textContent
                ).toContain(tableHeadCells[key]);
            });
        });

        it('should generate a row for each job', () => {
            expect(container.querySelectorAll(`.${cssBaseClass}__row`).length).toEqual(
                TestAppObject.exec.jobState.child_jobs.length
            );
        });
    });
});
