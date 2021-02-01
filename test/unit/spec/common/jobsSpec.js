define([
    'common/jobs',
    'common/format',
], (Jobs, format) => {
    'use strict';

    function arrayToHTML (array) {
        return array.map((item) => `<div>${item}</div>`).join('\n');
    }


    describe('Test Jobs module', () => {
        it('Should be loaded with the right functions', () => {
            expect(Jobs).toBeDefined();
            const functions = ['isValidJobState', 'createJobStatusLines', 'niceState'];
            functions.forEach( f => {
                expect(Jobs[f]).toBeDefined();
            });
        });
    });

    const t = {
        created:    1610065000000,
        queued:     1610065200000,
        running:    1610065500000,
        finished:   1610065800000,
    };

    const jobStrings = {
        unknown: 'Determining job state...',
        not_found: 'This job was not found, or may not have been registered with this Narrative.',
        queued: 'In the queue since ' + format.niceTime(t.created),
        termination: 'Finished with cancellation at ' + format.niceTime(t.finished),
        running: 'Started running job at ' + format.niceTime(t.running),
        error: 'Finished with error at ' + format.niceTime(t.finished),
        success: 'Finished with success at ' + format.niceTime(t.finished),
        queueHistory: 'Queued for ' + format.niceDuration(t.running - t.created),
        queueHistoryNoRun: 'Queued for ' + format.niceDuration(t.finished - t.created),
        runHistory: 'Ran for ' + format.niceDuration(t.finished - t.running),
    };

    const goodJsList = [
    {
        job_id: 'unknown_job',
        created: 12345,
        job_state: 'erm...',
        other: 'key',
        another: 'key',
        expectedMessage: jobStrings.unknown,
        history: [jobStrings.unknown],
    },{
        created: t.created,
        job_id: 'job created',
        status: 'created',
        updated: t.created,
        expectedMessage: jobStrings.queued,
        history: [
            jobStrings.queued,
        ],
    },{
        created: t.created,
        job_id: 'in the queue',
        queued: t.queued,
        status: 'queued',
        updated: 12345678910,
        expectedMessage: jobStrings.queued,
        history: [
            jobStrings.queued,
        ]
    },{
        created: t.created,
        job_id: 'in the queue with a position',
        queued: t.queued,
        status: 'queued',
        updated: 12345678910,
        position: 988,
        expectedMessage: jobStrings.queued + ', currently at position 988',
        history: [
            jobStrings.queued + ', currently at position 988',
        ]
    },{
        created: t.created,
        finished: t.finished,
        job_id: 'job cancelled whilst in the queue',
        queued: t.queued,
        status: 'terminated',
        updated: 12345678910,
        expectedMessage: jobStrings.termination,
        history: [
            jobStrings.queueHistoryNoRun,
            jobStrings.termination
        ]
    },{
        created: t.created,
        job_id: 'job running',
        queued: t.queued,
        running: t.running,
        status: 'running',
        updated: 12345678910,
        expectedMessage: jobStrings.running,
        history: [
            jobStrings.queueHistory,
            jobStrings.running,
        ]
    },{
        created: t.created,
        finished: t.finished,
        job_id: 'job cancelled during run',
        queued: t.queued,
        running: t.running,
        status: 'terminated',
        updated: 12345678910,
        expectedMessage: jobStrings.termination,
        history: [
            jobStrings.queueHistory,
            jobStrings.runHistory,
            jobStrings.termination,
        ]
    },{
        error: {
            code: -32000,
            name: 'Server error',
            message: 'App woke up from its nap very cranky!',
        },
        error_code: 1,
        errormsg: 'Job output contains an error',
        created: t.created,
        finished: t.finished,
        job_id: 'job died with error',
        queued: t.queued,
        running: t.running,
        status: 'error',
        updated: 12345678910,
        expectedMessage: jobStrings.error,
        history: [
            jobStrings.queueHistory,
            jobStrings.runHistory,
            jobStrings.error,
        ]
    },{
        created: t.created,
        finished: t.finished,
        job_id: 'job finished with success',
        queued: t.queued,
        running: t.running,
        status: 'completed',
        updated: 12345678910,
        expectedMessage: jobStrings.success,
        history: [
            jobStrings.queueHistory,
            jobStrings.runHistory,
            jobStrings.success,
        ]
    }];

    const badJsList = [
        1,
        'foo',
        ['a', 'list'],
        {
            job_id: 'somejob',
            other: 'key'
        },
        {
            created: 'at_some_point',
            other: 'key'
        },
        {
            job_id: 'baz',
            create: 12345,
        },
        {
            job_id: 'whatever',
            job_state: 'who cares?',
        },
        null,
        undefined
    ];

    describe('The isValidJobState function', () => {
        it('Should know how to tell good job states', () => {
            goodJsList.forEach(elem => {
                expect(Jobs.isValidJobState(elem)).toBeTrue();
            });
        });

        it('Should know how to tell bad job states', () => {
            badJsList.forEach(elem => {
                expect(Jobs.isValidJobState(elem)).toBeFalse();
            });
        });
    });

    describe('createJobStatusLines', () => {
        const div = document.createElement('div');
        const args = [false, true];
        it('should create an appropriate string when supplied with a jobState object', () => {
            goodJsList.forEach(state => {
                const statusLines = Jobs.createJobStatusLines(state);
                div.innerHTML = arrayToHTML(statusLines);
                expect(div.textContent).toContain(state.expectedMessage);
            });
        });
        goodJsList.forEach(state => {
            it(`should create an appropriate array in history mode for ${state.job_id}`, () => {
                const statusLines = Jobs.createJobStatusLines(state, true);
                div.innerHTML = arrayToHTML(statusLines);
                state.history.forEach((historyLine) => {
                    expect(div.textContent).toContain(historyLine);
                })
            })
        });

        it('should create an appropriate string if the job does not exist', () => {
            const state = {job_state: 'does_not_exist'};
            args.forEach((arg) => {
                const statusLines = Jobs.createJobStatusLines(state, arg);
                div.innerHTML = arrayToHTML(statusLines);
                expect(div.textContent).toContain(jobStrings.not_found);
            });
        });

        it('should return an appropriate string for dodgy jobStates', () => {
            badJsList.forEach(state => {
                args.forEach((arg) => {
                    const statusLines = Jobs.createJobStatusLines(state, arg);
                    div.innerHTML = arrayToHTML(statusLines);
                    expect(div.textContent).toContain(jobStrings.unknown);
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
            ["running", 'Running'],
        ];
        labelToState.forEach((entry) => {
            it(`should create an abbreviated label when given the job state ${entry[0]}`, () => {
                expect(Jobs.jobLabel(entry[0])).toEqual(entry[1]);
            });
        })
    })
});
