define([
    'common/cellComponents/tabs/jobStatus/jobStateList',
    'common/props',
    '/test/data/testAppObj',
], (jobStateList, Props, TestAppObject) => {
    'use strict';

    let cssBaseClass;

    const model = Props.make({
        data: TestAppObject,
        onUpdate: () => {},
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
            expect(jobStateList.make).toBeDefined();
        });

        it('has a cssBaseClass variable', () => {
            expect(jobStateList.cssBaseClass).not.toBeNull;
            expect(jobStateList.cssBaseClass).toContain('kb-job');
        });
    });

    describe('The job state list instance', () => {
        let jobStateListInstance;
        beforeEach(() => {
            jobStateListInstance = createInstance();
        });

        it('has a make function that returns an object', () => {
            expect(jobStateListInstance).not.toBe(null);
        });

        it('has the required methods', () => {
            expect(jobStateListInstance.start).toBeDefined();
            expect(jobStateListInstance.stop).toBeDefined();
        });

        it('should start, and populate a node', async () => {
            const node = document.createElement('div');
            expect(node.children.length).toBe(0);
            await jobStateListInstance.start({
                node: node,
                jobState: model.getItem('exec.jobState'),
            });
            expect(node.children.length).toBeGreaterThan(0);
        });
    });

    describe('the job state list structure and content', () => {
        const node = document.createElement('div');
        let jobStateListInstance;
        cssBaseClass = jobStateList.cssBaseClass;

        beforeAll(async () => {
            jobStateListInstance = createInstance();
            await jobStateListInstance.start({
                node: node,
                jobState: model.getItem('exec.jobState'),
            });
        });

        afterAll(async () => {
            await jobStateListInstance.stop();
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
            it(`should have an element with class ${item}`, () => {
                expect(node.querySelectorAll(`.${item}`).length).toBeGreaterThan(0);
            });
        });

        it('should generate a row for each job', () => {
            expect(node.querySelectorAll(`.${cssBaseClass}__row`).length).toEqual(
                TestAppObject.exec.jobState.child_jobs.length
            );
        });
    });
});
