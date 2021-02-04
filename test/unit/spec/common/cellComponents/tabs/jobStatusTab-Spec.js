define([
    'common/cellComponents/tabs/jobStatus/jobStatusTab',
    'common/cellComponents/tabs/jobStatus/jobStateList',
    'common/props',
    '/test/data/testAppObj',
], (jobStatusTab, jobStateList, Props, TestAppObject) => {
    'use strict';

    const model = Props.make({
        data: TestAppObject,
        onUpdate: () => {},
    });
    const jobTabContainerClass = 'kb-job__tab_container';

    describe('The job status tab module', () => {
        it('loads', () => {
            expect(jobStatusTab).not.toBe(null);
        });

        it('has expected functions', () => {
            expect(jobStatusTab.make).toBeDefined();
        });
    });

    describe('The job status tab instance', () => {
        let node, jobStatusTabInstance;

        beforeEach(() => {
            node = document.createElement('div');
            jobStatusTabInstance = jobStatusTab.make({
                model: model,
            });
        });

        afterEach(() => {
            if (jobStatusTabInstance) {
                jobStatusTabInstance = null;
            }
        });

        it('has a make function that returns an object', () => {
            expect(jobStatusTabInstance).not.toBe(null);
        });

        it('has the required methods', () => {
            expect(jobStatusTabInstance.start).toBeDefined();
            expect(jobStatusTabInstance.stop).toBeDefined();
        });

        it('should start the job status tab widget', async () => {
            expect(node.classList.length).toBe(0);
            spyOn(jobStateList, 'make').and.callThrough();
            await jobStatusTabInstance.start({ node: node });

            expect(node).toHaveClass(jobTabContainerClass);
            expect(node.childNodes.length).toBe(1);

            const [firstChild] = node.childNodes;
            expect(firstChild).toHaveClass('kb-job__container');
            expect(firstChild.getAttribute('data-element')).toEqual('kb-job-list-wrapper');

            expect(jobStateList.make).toHaveBeenCalled();
        });

        it('should stop when requested to', async () => {
            expect(node.classList.length).toBe(0);
            spyOn(jobStateList, 'make').and.callThrough();

            await jobStatusTabInstance.start({ node: node });
            expect(node).toHaveClass(jobTabContainerClass);
            expect(jobStateList.make).toHaveBeenCalled();

            await jobStatusTabInstance.stop();
            // TODO: add in some sort of test here
        });
    });
});
