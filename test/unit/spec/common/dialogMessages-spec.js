define(['common/dialogMessages', 'common/ui'], (DialogMessages, UI) => {
    'use strict';

    describe('The DialogMessages module', () => {
        it('loads', () => {
            expect(DialogMessages).not.toBe(null);
        });

        it('has expected exports', () => {
            const exports = ['showDialog', 'generateDialogArgs'];
            exports.forEach((ex) => {
                expect(DialogMessages[ex]).toBeDefined();
            });
        });

        describe('showDialog', () => {
            it('sends the result of `generateDialogArgs` to `UI.showConfirmDialog`', () => {
                const methodArgs = { action: 'cancelApp' };
                const methodResults = DialogMessages.generateDialogArgs(methodArgs);
                // don't show the dialog; just check the input is correct
                spyOn(UI, 'showConfirmDialog');
                DialogMessages.showDialog(methodArgs);
                expect(UI.showConfirmDialog.calls.allArgs()).toEqual([[methodResults]]);
            });
        });

        describe('generateDialogArgs', () => {
            it('throws an error if the action is empty', () => {
                expect(() => {
                    DialogMessages.generateDialogArgs();
                }).toThrowError(/Cannot generate dialog args for invalid action "undefined"/);
            });

            it('throws an error if the action is unknown', () => {
                expect(() => {
                    DialogMessages.generateDialogArgs({ action: 'snap!' });
                }).toThrowError(/Cannot generate dialog args for invalid action "snap!"/);
            });

            it('generates appropriate strings for cancelling jobs', () => {
                const tests = [
                    {
                        statusList: ['created', 'estimating', 'queued'],
                        jobList: [1, 2, 3, 4],
                        output: /Canceling all queued jobs will terminate the processing of 4 jobs\./,
                    },
                    {
                        statusList: ['created', 'estimating', 'running'],
                        jobList: [1],
                        output: /Canceling all queued and running jobs will terminate the processing of 1 job\./,
                    },
                    {
                        statusList: ['running'],
                        jobList: [1, 2, 3],
                        output: /Canceling all running jobs will terminate the processing of 3 jobs\./,
                    },
                ];

                tests.forEach((test) => {
                    const { output, statusList, jobList } = test;
                    const action = 'cancelJobs';
                    const result = DialogMessages.generateDialogArgs({
                        action,
                        statusList,
                        jobList,
                    });
                    expect(result.body).toMatch(output);
                });
            });

            it('generates appropriate strings for rerunning jobs', () => {
                const tests = [
                    {
                        statusList: ['terminated', 'error'],
                        jobList: [1, 2, 3, 4],
                        output: /Retrying all failed and cancelled jobs will rerun 4 jobs\./,
                    },
                    {
                        statusList: ['error'],
                        jobList: [1],
                        output: /Retrying all failed jobs will rerun 1 job\./,
                    },
                    {
                        statusList: ['terminated'],
                        jobList: [1, 2, 3],
                        output: /Retrying all cancelled jobs will rerun 3 jobs\./,
                    },
                ];
                tests.forEach((test) => {
                    const { output, statusList, jobList } = test;
                    const action = 'retryJobs';
                    const result = DialogMessages.generateDialogArgs({
                        action,
                        statusList,
                        jobList,
                    });
                    expect(result.body).toMatch(output);
                    if (test.statusList.includes('error')) {
                        expect(result.body).toMatch(
                            /Please note that jobs are rerun using the same parameters/
                        );
                    } else {
                        expect(result.body).not.toMatch(
                            /Please note that jobs are rerun using the same parameters/
                        );
                    }
                });
            });

            it('generates the appropriate string for terminating a batch job', () => {
                const result = DialogMessages.generateDialogArgs({ action: 'cancelBulkImport' });
                expect(result.body).toMatch(
                    /Canceling the job will halt the processing of all jobs in the batch./
                );
            });
        });
    });
});
