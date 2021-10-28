define([
    'common/cellComponents/tabs/jobStatus/jobStatusTab',
    'common/cellComponents/tabs/jobStatus/jobStatusTable',
    'common/jobManager',
    'common/props',
    'testUtil',
    '/test/data/testBulkImportObj',
], (
    JobStatusTab,
    JobStatusTableModule,
    JobManagerModule,
    Props,
    TestUtil,
    TestBulkImportObject
) => {
    'use strict';

    const { JobManager } = JobManagerModule;
    const { JobStatusTable } = JobStatusTableModule;
    const model = Props.make({
        data: TestBulkImportObject,
    });

    describe('The job status tab module', () => {
        afterEach(() => {
            TestUtil.clearRuntime();
        });

        it('loads', () => {
            expect(JobStatusTab).not.toBe(null);
        });

        it('has expected functions', () => {
            expect(JobStatusTab.make).toBeDefined();
            expect(JobStatusTab.make).toEqual(jasmine.any(Function));
        });
    });

    describe('The job status tab instance', () => {
        let container;
        beforeEach(function () {
            container = document.createElement('div');
            // spy on starting/stopping the job status table, which is part of the job status tab
            spyOn(JobStatusTable.prototype, 'start');
            spyOn(JobStatusTable.prototype, 'stop');

            this.jobStatusTabInstance = JobStatusTab.make({
                model,
                jobManager: new JobManager({
                    bus: {},
                    model,
                }),
            });
        });

        afterEach(() => {
            container.remove();
            TestUtil.clearRuntime();
        });

        it('has a make function that returns an object', function () {
            expect(this.jobStatusTabInstance).not.toBe(null);
            expect(this.jobStatusTabInstance).toEqual(jasmine.any(Object));
        });

        it('has the required methods', function () {
            ['start', 'stop'].forEach((fn) => {
                expect(this.jobStatusTabInstance[fn]).toBeDefined();
                expect(this.jobStatusTabInstance[fn]).toEqual(jasmine.any(Function));
            }, this);
        });

        it('should start the job status tab widget', async function () {
            expect(container.classList.length).toBe(0);
            await this.jobStatusTabInstance.start({ node: container });
            expect(container.childNodes.length).toBe(1);

            const [firstChild] = container.childNodes;
            expect(firstChild).toHaveClass('kb-job-status-tab__container');
            expect(firstChild.getAttribute('data-element')).toEqual('kb-job-list-wrapper');

            expect(JobStatusTable.prototype.start).toHaveBeenCalledTimes(1);
            const callArgs = JobStatusTable.prototype.start.calls.allArgs();
            expect(callArgs[0].length).toEqual(1);
            const node = callArgs[0][0].node;
            // should be the same as firstChild above
            expect(node.getAttribute('data-element')).toEqual('kb-job-list-wrapper');
        });

        it('should stop when requested to', async function () {
            expect(container.classList.length).toBe(0);

            await this.jobStatusTabInstance.start({ node: container });
            expect(JobStatusTable.prototype.start).toHaveBeenCalled();

            await this.jobStatusTabInstance.stop();
            expect(JobStatusTable.prototype.stop).toHaveBeenCalled();
            expect(container.innerHTML).toBe('');
        });
    });
});
