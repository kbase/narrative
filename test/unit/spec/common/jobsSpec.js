define(['common/jobs', '/test/data/jobsData'], (Jobs, JobsData) => {
    'use strict';

    function arrayToHTML(array) {
        return array.map((item) => `<div>${item}</div>`).join('\n');
    }

    const jobsModuleExports = [
        'createJobStatusLines',
        'jobAction',
        'jobLabel',
        'niceState',
        'validJobStates',
        'isValidJobStateObject',
    ];

    describe('Test Jobs module', () => {
        it('Should be loaded with the right functions', () => {
            expect(Jobs).toBeDefined();
            jobsModuleExports.forEach((f) => {
                expect(Jobs[f]).toBeDefined();
            });
        });
    });

    const badStates = [undefined, null, 'Mary Poppins', 12345678];

    describe('The isValidJobStateObject function', () => {
        it('Should know how to tell good job states', () => {
            JobsData.allJobs.forEach((elem) => {
                expect(Jobs.isValidJobStateObject(elem)).toBeTrue();
            });
        });

        it('Should know how to tell bad job states', () => {
            JobsData.invalidJobs.forEach((elem) => {
                expect(Jobs.isValidJobStateObject(elem)).toBeFalse();
            });
        });
    });

    describe('The isValidJobInfoObject function', () => {
        JobsData.validInfo.forEach((elem) => {
            it(`passes ${JSON.stringify(elem)}`, () => {
                expect(Jobs.isValidJobInfoObject(elem)).toBeTrue();
            });
        });

        JobsData.invalidInfo.forEach((elem) => {
            it(`fails ${JSON.stringify(elem)}`, () => {
                expect(Jobs.isValidJobInfoObject(elem)).toBeFalse();
            });
        });
    });

    describe('createJobStatusLines', () => {
        const div = document.createElement('div');
        const args = [false, true];
        JobsData.allJobs.forEach((state) => {
            it(`should create an appropriate status string for ${state.job_id}`, () => {
                const statusLines = Jobs.createJobStatusLines(state);
                div.innerHTML = arrayToHTML(statusLines);
                expect(div.textContent).toContain(state.meta.createJobStatusLines.line);
            });
        });
        JobsData.allJobs.forEach((state) => {
            it(`should create an appropriate array in history mode for ${state.job_id}`, () => {
                const statusLines = Jobs.createJobStatusLines(state, true);
                div.innerHTML = arrayToHTML(statusLines);
                state.meta.createJobStatusLines.history.forEach((historyLine) => {
                    expect(div.textContent).toContain(historyLine);
                });
            });
        });

        it('should create an appropriate string if the job does not exist', () => {
            const state = { job_state: 'does_not_exist' };
            // Jobs.createJobStatusLines returns the same content, whether or not
            // history is shown
            args.forEach((arg) => {
                const statusLines = Jobs.createJobStatusLines(state, arg);
                div.innerHTML = arrayToHTML(statusLines);
                expect(div.textContent).toContain(JobsData.jobStrings.not_found);
            });
        });

        it('should return an appropriate string for dodgy jobStates', () => {
            JobsData.invalidJobs.forEach((state) => {
                args.forEach((arg) => {
                    const statusLines = Jobs.createJobStatusLines(state, arg);
                    div.innerHTML = arrayToHTML(statusLines);
                    expect(div.textContent).toContain(JobsData.jobStrings.unknown);
                });
            });
        });
    });

    describe('jobLabel', () => {
        const labelToState = [
            ['Mary Poppins', 'Job not found'],
            [null, 'Job not found'],
            [undefined, 'Job not found'],
            ['does_not_exist', 'Job not found'],
            ['estimating', 'Queued'],
            ['queued', 'Queued'],
            ['error', 'Failed'],
            ['terminated', 'Cancelled'],
            ['running', 'Running'],
        ];
        labelToState.forEach((entry) => {
            it(`should create an abbreviated label when given the job state ${entry[0]}`, () => {
                expect(Jobs.jobLabel(entry[0])).toEqual(entry[1]);
            });
        });
    });

    describe('jobAction, valid data', () => {
        JobsData.allJobs.forEach((state) => {
            it(`should generate a job action with the job state ${state.status}`, () => {
                expect(Jobs.jobAction(state.status)).toEqual(state.meta.jobAction);
            });
        });
    });
    describe('jobAction, invalid data', () => {
        badStates.forEach((item) => {
            it(`should generate a retry action with the job state ${item}`, () => {
                expect(Jobs.jobAction(item)).toEqual(JobsData.jobStrings.action.retry);
            });
        });
    });

    describe('jobLabel', () => {
        badStates.forEach((item) => {
            it(`creates an appropriate label with the input ${item}`, () => {
                expect(Jobs.jobLabel(item)).toEqual('Job not found');
            });
        });
        JobsData.allJobs.forEach((state) => {
            it(`creates an appropriate label with the input ${state}`, () => {
                expect(Jobs.jobLabel(state.status)).toEqual(state.meta.jobLabel);
            });
        });
    });

    describe('niceState', () => {
        const div = document.createElement('div');

        badStates.forEach((item) => {
            it(`should generate a nice state for the input ${item}`, () => {
                div.innerHTML = Jobs.niceState(item);
                const span = div.querySelector('span');
                expect(span).toHaveClass('kb-job-status__summary');
                expect(span.textContent).toContain('invalid');
            });
        });

        JobsData.allJobs.forEach((state) => {
            it(`should generate a nice state for ${state.status}`, () => {
                div.innerHTML = Jobs.niceState(state.status);
                const span = div.querySelector('span');
                expect(span).toHaveClass(state.meta.niceState.class);
                expect(span.textContent).toContain(state.meta.niceState.label);
            });
        });
    });
});
