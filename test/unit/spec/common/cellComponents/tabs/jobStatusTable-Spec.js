define([
    'jquery',
    'bluebird',
    'util/appCellUtil',
    'common/cellComponents/tabs/jobStatus/jobStatusTable',
    'common/jobs',
    'common/jobCommMessages',
    'common/jobManager',
    'common/props',
    'common/runtime',
    'testUtil',
    '/test/data/jobsData',
], (
    $,
    Promise,
    AppCellUtil,
    JobStatusTableModule,
    Jobs,
    jcm,
    JobManagerModule,
    Props,
    Runtime,
    TestUtil,
    JobsData
) => {
    'use strict';
    const { JobManager } = JobManagerModule,
        { cssBaseClass, BatchJobStatusTable } = JobStatusTableModule;
    const allJobsWithBatchParent = JobsData.allJobsWithBatchParent;
    const allJobsNoBatchParent = JobsData.allJobs;
    const batchId = JobsData.batchParentJob.job_id;
    const typesToFiles = {
        assembly: {
            appId: 'kb_uploadmethods/import_fasta_as_assembly_from_staging',
            files: ['test_assembly.fa'],
        },
        fastq_reads_interleaved: {
            appId: 'kb_uploadmethods/import_fastq_interleaved_as_reads_from_staging',
            files: ['small.forward.fq', 'small.reverse.fq'],
        },
        sra_reads: {
            appId: 'kb_uploadmethods/import_sra_as_reads_from_staging',
            files: ['SRR976988.1'],
        },
    };
    const { fileTypeMapping } = AppCellUtil.generateFileTypeMappings(typesToFiles);

    const appData = {
        outputParamIds: {
            assembly: ['assembly_name'],
            fastq_reads_interleaved: ['name'],
            sra_reads: ['name'],
        },
        specs: {
            'kb_uploadmethods/import_fasta_as_assembly_from_staging': {
                parameters: [
                    {
                        id: 'staging_file_subdir_path',
                        ui_name: 'FASTA file path',
                    },
                    {
                        id: 'assembly_name',
                        ui_name: 'Assembly object name',
                    },
                    {
                        id: 'type',
                        ui_name: 'Assembly type',
                    },
                ],
            },
            'kb_uploadmethods/import_fastq_interleaved_as_reads_from_staging': {
                parameters: [
                    {
                        id: 'fastq_fwd_staging_file_name',
                        ui_name: 'Forward/Left FASTQ File Path',
                    },
                    {
                        id: 'name',
                        ui_name: 'Reads Object Name',
                    },
                ],
            },
            'kb_uploadmethods/import_sra_as_reads_from_staging': {
                parameters: [
                    {
                        id: 'sra_staging_file_name',
                        ui_name: 'SRA File Path',
                    },
                    {
                        id: 'name',
                        ui_name: 'Reads Object Name',
                    },
                ],
            },
        },
        tag: 'release',
    };

    const paramDisplayData = {
        fastq_reads_interleaved: {
            analysisType: 'FASTQ Reads Interleaved',
            outputParams: { name: { value: 'some_old_file', label: 'Reads Object Name' } },
            params: {
                name: { value: 'some_old_file', label: 'Reads Object Name' },
            },
        },
        assembly: {
            analysisType: 'Assembly',
            outputParams: {
                assembly_name: { value: 'assembly_file.fa', label: 'Assembly object name' },
            },
            params: {
                assembly_name: { value: 'assembly_file.fa', label: 'Assembly object name' },
                staging_file_subdir_path: { value: '/path/to/dir', label: 'FASTA file path' },
                type: { value: 'draft isolate', label: 'Assembly type' },
            },
        },
    };

    const BATCH_PARENT_ID = batchId, // for simplicity, use the same batch ID as is used in JobsData
        TEST_JOB_ID = 'TEST_JOB',
        RETRIED_JOB_ID = 'RETRIED_JOB',
        RETRY_PARENT_ID = 'RETRY_PARENT';

    const TEST_JOB = {
            job_id: TEST_JOB_ID,
            batch_id: BATCH_PARENT_ID,
            status: 'created',
            created: 0,
            meta: {
                jobAction: 'cancel',
                jobLabel: 'queued',
                retryTarget: TEST_JOB_ID,
            },
        },
        RETRIED_JOB = {
            job_id: RETRIED_JOB_ID,
            batch_id: BATCH_PARENT_ID,
            status: 'created',
            created: 50,
            retry_parent: RETRY_PARENT_ID,
            meta: {
                jobAction: 'cancel',
                jobLabel: 'queued',
                retryTarget: RETRY_PARENT_ID,
                row_id: RETRY_PARENT_ID,
            },
        },
        RETRY_PARENT = {
            batch_id: BATCH_PARENT_ID,
            job_id: RETRY_PARENT_ID,
            status: 'terminated',
            created: 10,
        },
        BATCH_PARENT = {
            batch_id: BATCH_PARENT_ID,
            job_id: BATCH_PARENT_ID,
            batch_job: true,
            status: 'created',
            child_jobs: [RETRY_PARENT_ID, RETRIED_JOB_ID],
        };

    // RETRIED_JOB should be first for createJobStatusTableWithContext
    const BATCH_WITH_RETRY = [RETRIED_JOB, RETRY_PARENT, BATCH_PARENT];

    const paramTests = [
        {
            input: {
                app_id: 'kb_uploadmethods/import_fastq_interleaved_as_reads_from_staging',
                app_name: 'Import FASTQ',
                batch_id: null,
                job_id: 'something',
                job_params: [
                    {
                        name: 'some_old_file',
                        workspace_id: 'some_workspace_id',
                    },
                ],
            },
            type: 'FASTQ Reads Interleaved',
            object: /Reads Object Name: some_old_file/,
            displayData: paramDisplayData.fastq_reads_interleaved,
        },
        {
            input: {
                app_id: 'kb_uploadmethods/import_fasta_as_assembly_from_staging',
                app_name: 'Import FASTA',
                batch_id: null,
                job_id: 'something',
                job_params: [
                    {
                        assembly_name: 'assembly_file.fa',
                        staging_file_subdir_path: '/path/to/dir',
                        type: 'draft isolate',
                        workspace_id: 'whatever',
                    },
                ],
            },
            type: 'Assembly',
            object: /Assembly object name: assembly_file.fa/,
            displayData: paramDisplayData.assembly,
        },
    ];

    function makeModel(jobs) {
        const tempModel = Props.make({
            data: {
                app: appData,
            },
        });
        Jobs.populateModelFromJobArray(tempModel, jobs);
        return tempModel;
    }

    function createInstance(config = {}) {
        // add in typesToFiles and fileTypeMapping
        return new BatchJobStatusTable(
            Object.assign(
                {},
                {
                    jobManager: new JobManager({
                        model: makeModel(allJobsWithBatchParent),
                        bus: Runtime.make().bus(),
                    }),
                    typesToFiles,
                    fileTypeMapping,
                },
                config
            )
        );
    }

    function createStartedInstance(container, config = {}) {
        const instance = createInstance(config);
        return new Promise((resolve) => {
            instance.start({
                node: container,
            });
            resolve(instance);
        });
    }

    /**
     * Create a started job status table instance and populate the context
     *
     * @param {object} context - jasmine `this` context
     * @param {object} jobArray - array of jobs to put in the job status table.
     *                            the first job in the array is assigned as context.job
     */
    async function createJobStatusTableWithContext(context, jobArray) {
        if (!Array.isArray(jobArray)) {
            jobArray = [jobArray];
        }

        context.job = jobArray[0];
        context.jobId = context.job.job_id;
        context.container = document.createElement('div');
        context.jobManager = new JobManager({
            model: makeModel(jobArray),
            bus: Runtime.make().bus(),
        });
        context.jobStatusTableInstance = await createStartedInstance(context.container, {
            jobManager: context.jobManager,
            toggleTab: context.toggleTab || null,
        }).then(() => {
            context.row = context.container.querySelector('tbody tr');
            return context.jobStatusTableInstance;
        });
    }

    /**
     * itHasRowStructure expects `this` to be set up as follows:
     *
     * row: a row element from the job status table
     * job: the original job object used to create the table row
     *      it has extra data under the key 'meta'
     * input: an altered job object with extra data under the key 'meta'
     */

    function itHasRowStructure() {
        it('has the correct row structure', function () {
            const row = this.row;
            const job = this.job;
            const input = this.input || job;
            _checkRowStructure(row, job, input);
        });
    }

    /**
     *
     * @param {DOM element} row: the row in the job status table to be tested
     * @param {object} job: the original job object used to create the row
     * @param {object} input: the input used to update the row (if applicable)
     *
     * input and/or job should have validation data under the 'meta' key
     */
    function _checkRowStructure(row, job, input) {
        if (!input) {
            input = job;
        }

        // row ID: may be specified in job.meta.row_id, e.g. if the job is a retry
        expect(row.id).toEqual(`job_${job.meta && job.meta.row_id ? job.meta.row_id : job.job_id}`);

        // type
        const typeEl = row.querySelector(`.${cssBaseClass}__cell--import-type`);
        if (input.meta.type) {
            expect(typeEl.textContent).toMatch(input.meta.type);
        } else {
            expect(typeEl.textContent).toContain(input.job_id);
        }

        // output object name
        const outputEl = row.querySelector(`.${cssBaseClass}__cell--output`);
        if (input.meta.object) {
            expect(outputEl.textContent).toMatch(input.meta.object);
        } else {
            // for a retried job, this should be input.job_id
            expect(outputEl.textContent).toEqual('');
        }

        // action
        const actionEl = row.querySelector(`.${cssBaseClass}__cell--action`);
        expect(actionEl.textContent).toEqual(input.meta.jobAction ? input.meta.jobAction : '');

        const actionButton = actionEl.querySelector('button');
        if (actionButton) {
            const target = actionButton.getAttribute('data-target');
            if (actionEl.textContent === 'retry') {
                expect(target).toEqual(input.meta.retryTarget);
            } else {
                expect(target).toEqual(input.job_id);
            }
        }

        // is the error marker showing?
        const errorEl = row.querySelector(`.${cssBaseClass}__icon--action_warning`);
        if (input.meta.error) {
            expect(errorEl).toBeDefined();
            expect(errorEl.getAttribute('data-content')).toEqual(input.meta.error);
        } else {
            expect(errorEl).toEqual(null);
        }

        // status
        const statusEl = row.querySelector(`.${cssBaseClass}__cell--status`);
        expect(statusEl.textContent.toLowerCase()).toContain(input.meta.jobLabel);
    }

    /**
     *
     * @param {DOM} container DOM element containing the table
     * @param {array[string]} expectedIdList array of IDs of jobs expected to be in the table
     *                        if expectedIdList is null, we expect the table to be empty
     */
    function _checkTableStructure(container, expectedIdList) {
        if (expectedIdList === null) {
            // empty
            // table displays a single row with content
            // <td colspan="4" class="dataTables_empty" valign="top">No data available in table</td>
            const allRows = container.querySelectorAll('tbody tr');
            expect(allRows.length).toEqual(1);
            const emptyCell = allRows[0].querySelector('.dataTables_empty');
            expect(emptyCell.textContent).toEqual('No data available in table');
            return;
        }
        const tableRowIds = Array.from(
            container.querySelectorAll('tbody tr.odd, tbody tr.even')
        ).map((row) => {
            return row.id;
        });
        expect(tableRowIds).toEqual(
            jasmine.arrayWithExactContents(
                expectedIdList.map((id) => {
                    return `job_${id}`;
                })
            )
        );
    }

    describe('The BatchJobStatusTable module', () => {
        afterEach(() => {
            TestUtil.clearRuntime();
        });

        it('loads', () => {
            expect(BatchJobStatusTable).not.toBe(null);
        });

        it('has expected functions', () => {
            expect(BatchJobStatusTable).toEqual(jasmine.any(Function));
        });

        it('has a cssBaseClass variable', () => {
            expect(cssBaseClass).toEqual(jasmine.any(String));
            expect(cssBaseClass).toContain('kb-job-status');
        });

        describe('function generateJobDisplayData', () => {
            it('exists and is a function', () => {
                expect(JobStatusTableModule.generateJobDisplayData).toEqual(jasmine.any(Function));
            });
            it('can pull out the relevant info for displaying a job in a table', () => {
                paramTests.forEach((test) => {
                    const result = JobStatusTableModule.generateJobDisplayData({
                        jobInfo: test.input,
                        appData,
                        fileTypeMapping,
                        typesToFiles,
                    });
                    expect(result).toEqual(test.displayData);
                });
            });
        });
    });

    describe('The job status table', () => {
        let container, jobStatusTableInstance;
        afterEach(() => {
            TestUtil.clearRuntime();
            if (container) {
                if (container.querySelector('table')) {
                    $(container).find('table').DataTable().clear().destroy();
                }
                container.remove();
            }
        });

        describe('instance methods', () => {
            beforeEach(function () {
                container = document.createElement('div');
                this.jobStatusTableInstance = createInstance();
            });

            it('has a make function that returns an object', function () {
                expect(this.jobStatusTableInstance).not.toBe(null);
                expect(this.jobStatusTableInstance).toEqual(jasmine.any(Object));
            });

            it('has the required methods', function () {
                ['start', 'stop'].forEach((fn) => {
                    expect(this.jobStatusTableInstance[fn]).toBeDefined();
                    expect(this.jobStatusTableInstance[fn]).toEqual(jasmine.any(Function));
                }, this);
            });

            it('should start, and populate a node', async function () {
                expect(container.children.length).toBe(0);
                await this.jobStatusTableInstance.start({
                    node: container,
                });
                expect(container.children.length).toBeGreaterThan(0);
            });
        });

        function instantiateJobStatusTable(ctx) {
            container = document.createElement('div');
            ctx.jobManager = new JobManager({
                model: makeModel(allJobsWithBatchParent),
                bus: Runtime.make().bus(),
            });
            ctx.jobStatusTableInstance = createInstance({ jobManager: ctx.jobManager });
        }

        describe('job manager', () => {
            const handlers = [
                { event: 'modelUpdate', name: 'jobStatusTable_status' },
                { event: 'modelUpdate', name: 'dropdown' },
                { event: jcm.MESSAGE_TYPE.INFO, name: 'jobStatusTable_info' },
                { event: jcm.MESSAGE_TYPE.ERROR, name: 'jobStatusTable_error' },
            ];

            it('requires a job manager with jobs', () => {
                const initError =
                    'Cannot start BatchJobStatusTable without a jobs object in the config';
                expect(() => {
                    new BatchJobStatusTable();
                }).toThrowError(initError);

                expect(() => {
                    new BatchJobStatusTable({ jobManager: {} });
                }).toThrowError(initError);

                expect(() => {
                    new BatchJobStatusTable({
                        jobManager: new JobManager({
                            model: Props.make({
                                data: {
                                    app: appData,
                                },
                            }),
                            bus: Runtime.make().bus(),
                        }),
                    });
                }).toThrowError(initError);
            });

            [null, { byId: null }, { byId: {} }].forEach((execJobsObject) => {
                // for some reason this does not work if you use expectAsync
                it(`cannot start with "exec.jobs" set to ${JSON.stringify(
                    execJobsObject
                )}`, function () {
                    instantiateJobStatusTable(this);
                    this.jobManager.model.setItem('exec.jobs', execJobsObject);
                    expect(() => {
                        this.jobStatusTableInstance.start({ node: container });
                    }).toThrowError(/Must provide at least one job to show the job status table/);
                });
            });

            it('requires a batch job to be set in the job manager', function () {
                this.jobManager = new JobManager({
                    model: makeModel([TEST_JOB]),
                    bus: Runtime.make().bus(),
                });
                // ensure there is no batch job
                expect(this.jobManager.model.getItem('exec.jobs.byId')).toEqual({
                    [TEST_JOB_ID]: TEST_JOB,
                });
                expect(this.jobManager.model.getItem('exec.jobState')).toBeUndefined();

                this.jobStatusTableInstance = new BatchJobStatusTable({
                    jobManager: this.jobManager,
                });
                expect(() => {
                    this.jobStatusTableInstance.start({ node: document.createElement('div') });
                }).toThrowError('batch job not defined');
            });

            describe('handlers', () => {
                beforeEach(async function () {
                    instantiateJobStatusTable(this);
                    await this.jobStatusTableInstance.start({
                        node: container,
                    });
                });
                describe('set up', () => {
                    handlers.forEach((handler) => {
                        const { event, name } = handler;
                        it('sets up the appropriate handlers: ' + `${event}::${name}`, function () {
                            expect(this.jobManager.handlers[event][name]).toBeDefined();
                        });
                    });
                });

                describe('tear down', () => {
                    handlers.forEach((handler) => {
                        const { event, name } = handler;
                        it(
                            'tears down the appropriate handlers: ' + `${event}::${name}`,
                            async function () {
                                expect(this.jobManager.handlers[event][name]).toBeDefined();

                                await this.jobStatusTableInstance.stop();
                                expect(this.jobManager.handlers[event][name]).not.toBeDefined();
                            }
                        );
                    });
                });
            });

            it('adds the appropriate handlers and listeners', async function () {
                instantiateJobStatusTable(this);
                const jobData = this.jobManager.model.getItem('exec.jobs'),
                    jobIdList = Object.keys(jobData.byId);
                jobData.info = jobIdList.reduce((acc, curr) => {
                    acc[curr] = { job_params: [{}] };
                    return acc;
                }, {});
                this.jobManager.model.setItem('exec.jobs', jobData);
                spyOn(this.jobManager.bus, 'emit');

                await this.jobStatusTableInstance.start({
                    node: container,
                });
                handlers.forEach((handler) => {
                    const { event, name } = handler;
                    expect(this.jobManager.handlers[event][name]).toBeDefined();
                });
                expect(this.jobManager.bus.emit.calls.allArgs()).toEqual([
                    // job status request for the full batch
                    [jcm.MESSAGE_TYPE.STATUS, { [jcm.PARAM.BATCH_ID]: batchId }],
                ]);
                // this table already has the info populated, so the job info
                // listener is not required
                jobIdList.forEach((jobId) => {
                    const channelString = JSON.stringify({ [jcm.CHANNEL.JOB]: jobId });
                    expect(Object.keys(this.jobManager.listeners[channelString])).toEqual(
                        jasmine.arrayWithExactContents([
                            jcm.MESSAGE_TYPE.STATUS,
                            jcm.MESSAGE_TYPE.ERROR,
                        ])
                    );
                });
            });
            it('requests info for jobs that do not have info defined', async function () {
                instantiateJobStatusTable(this);
                const jobData = this.jobManager.model.getItem('exec.jobs'),
                    jobIdList = Object.keys(jobData.byId),
                    missingJobIds = [];
                let bool = true;

                // populate some job info but not others
                jobData.info = jobIdList.reduce((acc, curr) => {
                    bool = !bool;
                    if (bool) {
                        acc[curr] = { job_params: [{}] };
                    } else if (curr !== batchId) {
                        missingJobIds.push(curr);
                    }
                    return acc;
                }, {});
                this.jobManager.model.setItem('exec.jobs', jobData);
                this.missingJobIds = missingJobIds;
                spyOn(this.jobManager.bus, 'emit');

                await this.jobStatusTableInstance.start({
                    node: container,
                });
                expect(this.jobManager.bus.emit.calls.allArgs()).toEqual([
                    // job info request for missing IDs
                    [jcm.MESSAGE_TYPE.INFO, { [jcm.PARAM.JOB_ID_LIST]: this.missingJobIds }],
                    // job status request for the full batch
                    [jcm.MESSAGE_TYPE.STATUS, { [jcm.PARAM.BATCH_ID]: batchId }],
                ]);
                // job info listeners only required for some jobs
                jobIdList.forEach((jobId) => {
                    const channelString = JSON.stringify({ [jcm.CHANNEL.JOB]: jobId });
                    if (missingJobIds.includes(jobId)) {
                        expect(Object.keys(this.jobManager.listeners[channelString])).toEqual(
                            jasmine.arrayWithExactContents([
                                jcm.MESSAGE_TYPE.STATUS,
                                jcm.MESSAGE_TYPE.ERROR,
                                jcm.MESSAGE_TYPE.INFO,
                            ])
                        );
                    } else {
                        expect(Object.keys(this.jobManager.listeners[channelString])).toEqual(
                            jasmine.arrayWithExactContents([
                                jcm.MESSAGE_TYPE.STATUS,
                                jcm.MESSAGE_TYPE.ERROR,
                            ])
                        );
                    }
                });
            });
        });

        describe('instance', () => {
            describe('structure and content', () => {
                beforeEach(async function () {
                    container = document.createElement('div');
                    this.jobStatusTableInstance = await createStartedInstance(container);
                });

                const classContents = [
                    `${cssBaseClass}__table`,
                    `${cssBaseClass}__table_head`,
                    `${cssBaseClass}__table_head_row`,
                    `${cssBaseClass}__table_body`,
                ];

                classContents.forEach((item) => {
                    it(`should have an element with class ${item}`, () => {
                        expect(container.querySelectorAll(`.${item}`).length).toBeGreaterThan(0);
                    });
                });

                const tableHeadCells = {
                    action: 'Action',
                    'import-type': 'Import type',
                    output: 'Output',
                    status: 'Status',
                };
                Object.keys(tableHeadCells).forEach((key) => {
                    it(`should generate appropriate table header cell for ${key}`, () => {
                        expect(
                            container.querySelectorAll(`.${cssBaseClass}__table_head_cell--${key}`)
                                .length
                        ).toEqual(1);
                        expect(
                            container.querySelector(`.${cssBaseClass}__table_head_cell--${key}`)
                                .textContent
                        ).toContain(tableHeadCells[key]);
                    });
                });

                it('should generate a row for each job', () => {
                    expect(
                        container.querySelectorAll('tbody tr.odd, tbody tr.even').length
                    ).toEqual(allJobsNoBatchParent.length);
                });
            });

            // make sure that the row contents are correct
            JobsData.allJobs.forEach((job) => {
                describe(`row content, ${job.job_id}`, () => {
                    beforeEach(async function () {
                        container = document.createElement('div');
                        this.job = TestUtil.JSONcopy(job);
                        const batchParent = {
                            batch_id: this.job.batch_id,
                            job_id: this.job.batch_id,
                            batch_job: true,
                            child_jobs: [this.job.job_id],
                            status: 'created',
                        };
                        this.jobManager = new JobManager({
                            model: makeModel([this.job, batchParent]),
                            bus: Runtime.make().bus(),
                        });
                        this.jobStatusTableInstance = await createStartedInstance(container, {
                            jobManager: this.jobManager,
                        });
                        this.row = container.querySelector('tbody tr');
                    });
                    itHasRowStructure();
                });
            });

            // ensure the table structure is correct for a batch job with retries
            describe('batch job with retries', () => {
                const batchJobData = JobsData.batchJob;
                let allRows;

                describe('table init', () => {
                    beforeEach(async function () {
                        container = document.createElement('div');
                        this.jobManager = new JobManager({
                            model: makeModel(JobsData.batchJob.jobArray),
                            bus: Runtime.make().bus(),
                        });
                        this.jobStatusTableInstance = await createStartedInstance(container, {
                            jobManager: this.jobManager,
                        });
                    });

                    it('has the correct number of rows', () => {
                        allRows = container.querySelectorAll('tbody tr');
                        // data sanity check
                        expect(batchJobData.currentJobIds.length).toEqual(
                            batchJobData.originalJobIds.length
                        );
                        expect(batchJobData.currentJobIds.length).toEqual(allRows.length);
                    });

                    it('has the correct original rows', () => {
                        allRows = Array.from(container.querySelectorAll('tbody tr'));
                        // make sure all rows are present in batchJobData.originalJobIds
                        const allIds = allRows.map((row) => {
                            return row.id;
                        });
                        const expectedIds = batchJobData.originalJobIds.map((job_id) => {
                            return `job_${job_id}`;
                        });
                        expect(allIds).toEqual(jasmine.arrayWithExactContents(expectedIds));
                    });

                    batchJobData.currentJobIds.forEach((job_id) => {
                        it(`has the correct row content for job ${job_id}`, function () {
                            this.input = batchJobData.jobsById[job_id];
                            this.job = this.input.retry_parent
                                ? batchJobData.jobsById[this.input.retry_parent]
                                : batchJobData.jobsById[job_id];
                            this.row = container.querySelector(`#job_${this.job.job_id}`);
                            // check the row content
                            _checkRowStructure(this.row, this.job, this.input);
                        });
                    });
                });
                describe('table init with job info', () => {
                    beforeEach(function () {
                        container = document.createElement('div');
                        this.job = TestUtil.JSONcopy(RETRIED_JOB);
                        this.jobManager = new JobManager({
                            model: makeModel(BATCH_WITH_RETRY),
                            bus: Runtime.make().bus(),
                        });
                        this.jobManager.addListener(
                            jcm.MESSAGE_TYPE.INFO,
                            jcm.CHANNEL.JOB,
                            BATCH_WITH_RETRY
                        );
                    });

                    async function runParamUpdateTest(ctx, test, jobInfo) {
                        // add the job info
                        ctx.jobManager.model.setItem('exec.jobs.paramDisplayData', jobInfo);
                        ctx.jobStatusTableInstance = await createStartedInstance(container, {
                            jobManager: ctx.jobManager,
                        });
                        ['type', 'object'].forEach((el) => {
                            ctx.job.meta[el] = test[el];
                        });
                        ctx.row = container.querySelector('tbody tr');
                        _checkRowStructure(ctx.row, ctx.job);
                    }

                    paramTests.forEach((test) => {
                        it(
                            'initialises correctly using the job info: ' +
                                JSON.stringify(test.input),
                            async function () {
                                const jobInfo = {
                                    [RETRIED_JOB_ID]: test.displayData,
                                };
                                await runParamUpdateTest(this, test, jobInfo);
                            }
                        );

                        // update to the retry parent info
                        it(
                            'initialises correctly using the retry parent info: ' +
                                JSON.stringify(test.input),
                            async function () {
                                const jobInfo = {
                                    [RETRY_PARENT_ID]: test.displayData,
                                };
                                await runParamUpdateTest(this, test, jobInfo);
                            }
                        );
                    });
                });
            });

            describe('row selection', () => {
                beforeEach(async function () {
                    container = document.createElement('div');
                    jobStatusTableInstance = await createStartedInstance(container);
                    this.jobStatusTableInstance = jobStatusTableInstance;
                });

                it('has no rows selected initially', () => {
                    const nRows = allJobsNoBatchParent.length;
                    expect(
                        container.querySelectorAll('tbody tr.odd, tbody tr.even').length
                    ).toEqual(nRows);
                    expect(container.querySelectorAll('tbody tr').length).toEqual(nRows);
                    expect(
                        container.querySelectorAll(`.${cssBaseClass}__row--selected`).length
                    ).toEqual(0);
                });

                function checkOpenRow($currentRow) {
                    // the current row should be selected and have the class 'vertical_collapse--open'
                    expect($currentRow[0]).toHaveClass('vertical_collapse--open');
                    expect($currentRow[0]).toHaveClass(`${cssBaseClass}__row--selected`);

                    // check for the job log viewer in the row underneath the row that was clicked
                    const $nextRow = $currentRow.next();
                    ['odd', 'even'].forEach((cls) => {
                        expect($nextRow[0]).not.toHaveClass(cls);
                    });
                    expect($nextRow.find('.kb-log__logs_title')[0].textContent).toContain('Logs');
                }

                it('can show and hide child rows', async () => {
                    const rows = container.querySelectorAll('tbody tr.odd, tbody tr.even');

                    let $currentRow = $(rows[2]);
                    await TestUtil.waitForElementState(
                        container.querySelector('tbody'),
                        () => {
                            return (
                                container.querySelectorAll('.vertical_collapse--open').length === 1
                            );
                        },
                        () => {
                            $currentRow.click();
                        }
                    );

                    // after clicking, there should be one extra row
                    expect(container.querySelectorAll('tbody tr').length).toEqual(rows.length + 1);
                    checkOpenRow($currentRow);

                    // click on another row
                    $currentRow = $(rows[5]);
                    await TestUtil.waitForElementState(
                        container.querySelector('tbody'),
                        () => {
                            return (
                                container.querySelectorAll('.vertical_collapse--open').length === 2
                            );
                        },
                        () => {
                            $currentRow.click();
                        }
                    );
                    expect(container.querySelectorAll('tbody tr').length).toEqual(rows.length + 2);
                    checkOpenRow($currentRow);

                    // click again to remove the row
                    await TestUtil.waitForElementState(
                        container.querySelector('tbody'),
                        () => {
                            return (
                                container.querySelectorAll('.vertical_collapse--open').length === 1
                            );
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
                    if ($currentRow[0].classList.contains('even')) {
                        expect($currentRow.next()[0]).toHaveClass('odd');
                    } else {
                        expect($currentRow.next()[0]).toHaveClass('even');
                    }
                });
            });

            describe('buttons,', () => {
                describe('results:', () => {
                    beforeEach(async function () {
                        this.toggleTab = () => {
                            console.warn('running toggle tab!');
                        };

                        await createJobStatusTableWithContext(this, [
                            TestUtil.JSONcopy(JobsData.jobsById['JOB_COMPLETED']),
                            BATCH_PARENT,
                        ]);
                        container = this.container;
                    });

                    it('clicking should trigger the toggleTab function', () => {
                        const button = container.querySelector('tbody tr button[data-target]');
                        expect(button.getAttribute('data-action')).toEqual('go-to-results');
                        spyOn(console, 'warn');
                        button.click();
                        expect(console.warn).toHaveBeenCalledOnceWith('running toggle tab!');
                    });
                });

                const cancelRetryArgs = {
                    cancel: 'JOB_QUEUED',
                    retry: 'JOB_TERMINATED_WHILST_RUNNING',
                };

                Object.keys(cancelRetryArgs).forEach((action) => {
                    describe(`${action}:`, () => {
                        it('clicking should trigger a job action', async function () {
                            await createJobStatusTableWithContext(this, [
                                TestUtil.JSONcopy(JobsData.jobsById[cancelRetryArgs[action]]),
                                BATCH_PARENT,
                            ]);
                            container = this.container;
                            const button = container.querySelector('tbody tr button[data-target]');
                            spyOn(this.jobManager, 'doJobAction');
                            await TestUtil.waitForElementState(
                                button,
                                () => {
                                    return button.disabled === true;
                                },
                                () => {
                                    button.click();
                                }
                            );
                            expect(this.jobManager.doJobAction).toHaveBeenCalled();
                            expect(this.jobManager.doJobAction.calls.allArgs()).toEqual([
                                [action, [this.jobId]],
                            ]);
                        });
                    });
                });
            });
        });

        describe('can update', () => {
            describe('job state:', () => {
                describe('valid', () => {
                    beforeEach(async function () {
                        await createJobStatusTableWithContext(this, [TEST_JOB, BATCH_PARENT]);
                    });
                    JobsData.allJobs.forEach((state) => {
                        it(`with status ${state.status}`, async function () {
                            // this row can't be updated as it's the same as the input
                            if (state.status === 'created') {
                                expect(1).toBeTruthy();
                                return;
                            }

                            _checkRowStructure(this.row, this.job);
                            this.state = TestUtil.JSONcopy(state);
                            this.input = {
                                ...this.state,
                                job_id: this.job.job_id,
                            };
                            // make sure that the retryTarget is updated
                            this.input.meta.retryTarget = this.job.job_id;
                            spyOn(this.jobManager, 'updateModel').and.callThrough();
                            const message = {
                                [this.jobId]: {
                                    [jcm.PARAM.JOB_ID]: this.jobId,
                                    jobState: this.input,
                                },
                            };
                            await TestUtil.waitForElementChange(this.row, () => {
                                TestUtil.sendBusMessage({
                                    bus: this.jobManager.bus,
                                    message,
                                    channelType: jcm.CHANNEL.JOB,
                                    channelId: this.jobId,
                                    type: jcm.MESSAGE_TYPE.STATUS,
                                });
                            });

                            _checkRowStructure(this.row, this.job, this.input);
                            expect(this.jobManager.updateModel).toHaveBeenCalled();
                            expect(
                                this.jobManager.model.getItem(`exec.jobs.byId.${this.job.job_id}`)
                            ).toEqual(this.input);
                            // if it is a terminal job state, the listener should have been removed
                            // if the job cannot be retried and it is in a terminal state,
                            // we expect the job-status listener to be removed
                            if (this.input.status === 'does_not_exist') {
                                expect(Object.keys(this.jobManager.listeners)).toEqual([
                                    JSON.stringify({ [jcm.CHANNEL.JOB]: BATCH_PARENT_ID }),
                                ]);
                            } else if (
                                Jobs.isTerminalStatus(this.input.status) &&
                                !this.input.meta.canRetry
                            ) {
                                const channelString = JSON.stringify({
                                    [jcm.CHANNEL.JOB]: this.job.job_id,
                                });
                                expect(
                                    this.jobManager.listeners[channelString][
                                        jcm.MESSAGE_TYPE.STATUS
                                    ]
                                ).toBeUndefined();
                            } else {
                                const channelString = JSON.stringify({
                                    [jcm.CHANNEL.JOB]: this.job.job_id,
                                });
                                expect(
                                    this.jobManager.listeners[channelString][
                                        jcm.MESSAGE_TYPE.STATUS
                                    ]
                                ).toBeDefined();
                            }
                        });
                    });
                });

                describe('valid, retried job', () => {
                    beforeEach(async function () {
                        // [RETRIED_JOB, RETRY_PARENT, BATCH_PARENT]
                        // we are updating RETRIED_JOB
                        await createJobStatusTableWithContext(this, BATCH_WITH_RETRY);
                    });
                    JobsData.allJobs.forEach((state) => {
                        it(`with status ${state.status}`, async function () {
                            _checkRowStructure(this.row, this.job);
                            this.state = TestUtil.JSONcopy(state);
                            this.input = {
                                ...this.state,
                                job_id: this.jobId,
                            };
                            // make sure that the retry_parent is updated
                            this.input.retry_parent = this.job.retry_parent;
                            this.input.meta.retryTarget = this.job.meta.retryTarget;
                            spyOn(this.jobManager, 'updateModel').and.callThrough();
                            const message = {
                                [this.jobId]: {
                                    [jcm.PARAM.JOB_ID]: this.jobId,
                                    jobState: this.input,
                                },
                            };
                            await TestUtil.waitForElementChange(this.row, () => {
                                TestUtil.sendBusMessage({
                                    bus: this.jobManager.bus,
                                    message,
                                    channelType: jcm.CHANNEL.JOB,
                                    channelId: this.jobId,
                                    type: jcm.MESSAGE_TYPE.STATUS,
                                });
                            });

                            _checkRowStructure(this.row, this.job, this.input);
                            expect(this.jobManager.updateModel).toHaveBeenCalled();
                            expect(
                                this.jobManager.model.getItem(`exec.jobs.byId.${this.input.job_id}`)
                            ).toEqual(this.input);
                        });
                    });
                });

                describe('errors', () => {
                    // cannot contact server
                    const errorTests = [
                        {
                            errorText: 'Could not cancel job.',
                            message: {
                                source: jcm.MESSAGE_TYPE.CANCEL,
                                [jcm.PARAM.JOB_ID_LIST]: ['JOB_QUEUED', 'job_1', 'job_2', 'job_3'],
                                request: {
                                    request_type: jcm.MESSAGE_TYPE.CANCEL,
                                    [jcm.PARAM.JOB_ID_LIST]: [
                                        'JOB_QUEUED',
                                        'job_1',
                                        'job_2',
                                        'job_3',
                                    ],
                                },
                                error: 'Unable to cancel job',
                                message:
                                    "HTTPSConnectionPool(host='ci.kbase.us', port=443): Max retries exceeded with url: /services/ee2 (Caused by NewConnectionError('<urllib3.connection.VerifiedHTTPSConnection object at 0x7fca286681f0>: Failed to establish a new connection: [Errno 8] nodename nor servname provided, or not known'))",
                                code: -1,
                                name: 'Exception',
                            },
                            job: 'JOB_QUEUED',
                        },
                        {
                            errorText: 'Could not retry job.',
                            message: {
                                source: jcm.MESSAGE_TYPE.RETRY,
                                [jcm.PARAM.JOB_ID_LIST]: ['JOB_DIED_WHILST_QUEUED'],
                                request: {
                                    request_type: jcm.MESSAGE_TYPE.RETRY,
                                    [jcm.PARAM.JOB_ID]: 'JOB_DIED_WHILST_QUEUED',
                                },
                                error: 'Unable to retry job(s)',
                                message:
                                    "HTTPSConnectionPool(host='ci.kbase.us', port=443): Max retries exceeded with url: /services/ee2 (Caused by NewConnectionError('<urllib3.connection.VerifiedHTTPSConnection object at 0x7fca28668940>: Failed to establish a new connection: [Errno 8] nodename nor servname provided, or not known'))",
                                code: -1,
                                name: 'Exception',
                            },
                            job: 'JOB_DIED_WHILST_QUEUED',
                        },
                    ];

                    errorTests.forEach((errorTest) => {
                        it(`with error ${errorTest.message.source}`, async function () {
                            // should not be any errors
                            await createJobStatusTableWithContext(this, [
                                JobsData.jobsById[errorTest.job],
                                BATCH_PARENT,
                            ]);
                            const nErrors = this.container.querySelectorAll(
                                `${cssBaseClass}__icon--action_warning`
                            );
                            expect(nErrors.length).toEqual(0);
                            _checkRowStructure(this.row, this.job);

                            this.input = TestUtil.JSONcopy(this.job);
                            this.input.meta.error = errorTest.errorText;
                            spyOn(this.jobManager, 'updateModel').and.callThrough();
                            // fake error response
                            await TestUtil.waitForElementChange(this.row, () => {
                                TestUtil.sendBusMessage({
                                    bus: this.jobManager.bus,
                                    message: errorTest.message,
                                    channelType: jcm.CHANNEL.JOB,
                                    channelId: this.job.job_id,
                                    type: jcm.MESSAGE_TYPE.ERROR,
                                });
                            });
                            _checkRowStructure(this.row, this.job, this.input);
                            expect(this.jobManager.updateModel).not.toHaveBeenCalled();
                        });
                    });
                });

                describe('batch with retries', () => {
                    const batchJobData = JobsData.batchJob,
                        batchParentJob = batchJobData.jobsById[batchJobData.batchId];
                    beforeEach(async function () {
                        container = document.createElement('div');
                        // update the child jobs in the batch parent
                        batchParentJob.child_jobs = batchJobData.originalJobIds;
                        // create a table from the original jobs and the batch container
                        const originalJobsIdsWithBatchJob = batchJobData.originalJobIds.concat(
                            batchJobData.batchId
                        );
                        const originalJobsData = originalJobsIdsWithBatchJob.map((jobId) => {
                            return batchJobData.jobsById[jobId];
                        });
                        this.jobManager = new JobManager({
                            model: makeModel(originalJobsData),
                            bus: Runtime.make().bus(),
                        });
                        this.jobStatusTableInstance = await createStartedInstance(container, {
                            jobManager: this.jobManager,
                        });

                        this.jobManager.addListener(
                            jcm.MESSAGE_TYPE.RETRY,
                            jcm.CHANNEL.JOB,
                            originalJobsIdsWithBatchJob
                        );
                    });

                    it('sets up a table correctly', function () {
                        // check initial table structure
                        const allRows = container.querySelectorAll('tbody tr');
                        // data sanity check
                        expect(batchJobData.originalJobIds.length).toEqual(allRows.length);

                        // make sure all rows are present in batchJobData.originalJobIds
                        const allIds = Array.from(allRows).map((row) => {
                            return row.id;
                        });
                        const expectedIds = batchJobData.originalJobIds.map((job_id) => {
                            return `job_${job_id}`;
                        });
                        expect(allIds).toEqual(jasmine.arrayWithExactContents(expectedIds));

                        batchJobData.originalJobIds.forEach((job_id) => {
                            this.job = batchJobData.jobsById[job_id];
                            this.row = container.querySelector(`#job_${job_id}`);
                            // check the row content
                            _checkRowStructure(this.row, this.job);
                        });

                        const modelIds = Object.keys(
                            this.jobManager.model.getItem('exec.jobs.byId')
                        ).map((job_id) => {
                            return `job_${job_id}`;
                        });
                        // ensure that we have all the IDs plus the batch stored in the model
                        expect(modelIds).toEqual(
                            jasmine.arrayWithExactContents(
                                allIds.concat(`job_${batchJobData.batchId}`)
                            )
                        );
                    });

                    /**
                     * This test mimics creating a table and tracking the changes to the table contents
                     * as a series of batch job updates and job retries take place. Each job update or
                     * retry is accompanied by an update to the parent batch job.
                     *
                     * Because it is not always possible to tell from the job status table when new job
                     * data has been received (e.g. if the job status data is not for the most recent
                     * job), a span element is added to the table container every time the batch job
                     * gets updated.
                     */
                    it('performs a series of updates correctly', async function () {
                        const indicator = document.createElement('div');
                        indicator.id = 'indicatorDiv';
                        container.append(indicator);

                        spyOn(this.jobManager, 'updateModel').and.callThrough();
                        this.jobManager.addEventHandler('modelUpdate', {
                            zzz_table_update: function (_, args) {
                                if (args[0].batch_job) {
                                    // for every batch job update, add a span element to the indicator div
                                    const sp = document.createElement('span');
                                    sp.classList.add('batchUpdate');
                                    sp.textContent = 'batch update';
                                    container.querySelector('#' + indicator.id).append(sp);
                                }
                            },
                        });

                        const estimatingUpdate = TestUtil.JSONcopy(
                            batchJobData.jobsById['JOB_ESTIMATING']
                        );
                        estimatingUpdate.updated += 10;
                        estimatingUpdate.status = 'queued';

                        const jobDiedWithErrorUpdate = TestUtil.JSONcopy(
                            batchJobData.jobsById['JOB_DIED_WHILST_RUNNING']
                        );
                        jobDiedWithErrorUpdate.updated += 15;
                        const rowIds = batchJobData.originalJobIds;

                        const updates = [
                            {
                                // retry of 'JOB_TERMINATED_WHILST_QUEUED'
                                retry: batchJobData.jobsById['JOB_RUNNING'],
                            },
                            {
                                // retry 1 of 'JOB_DIED_WHILST_QUEUED'
                                retry: batchJobData.jobsById['JOB_DIED_WHILST_RUNNING'],
                            },
                            {
                                // retry of 'JOB_TERMINATED_WHILST_RUNNING'
                                retry: batchJobData.jobsById['JOB_COMPLETED'],
                            },
                            {
                                // retry 2 of 'JOB_DIED_WHILST_QUEUED'
                                retry: batchJobData.jobsById['JOB_ESTIMATING'],
                            },
                            {
                                // update of 'JOB_DIED_WHILST_RUNNING'
                                // this job started before JOB_ESTIMATING
                                // so the table row will continue to show the JOB_ESTIMATING info
                                update: jobDiedWithErrorUpdate,
                                expectedRow: batchJobData.jobsById['JOB_ESTIMATING'],
                            },
                            {
                                // update of 'JOB_ESTIMATING'
                                update: estimatingUpdate,
                            },
                        ];

                        const context = this;

                        const updateTableLoop = async function (index, ctx) {
                            const update = updates[index];
                            const updatedBatchJob = TestUtil.JSONcopy(batchParentJob);
                            updatedBatchJob.updated += 5 * index + 1;

                            const input = TestUtil.JSONcopy(update.retry || update.update);
                            const retryParent = batchJobData.jobsById[input.retry_parent];
                            // ensure that the batch parent has the correct child jobs
                            if (!updatedBatchJob.child_jobs.includes(input.job_id)) {
                                updatedBatchJob.child_jobs.push(input.job_id);
                            }

                            await TestUtil.waitForElementChange(
                                container.querySelector('#' + indicator.id),
                                () => {
                                    if (update.retry) {
                                        // simulate a click to get the retry listener added
                                        container
                                            .querySelector(`[data-target="${input.retry_parent}"]`)
                                            .click();
                                        TestUtil.send_RETRY({
                                            bus: ctx.jobManager.bus,
                                            retryParent,
                                            retry: input,
                                        });
                                    } else {
                                        TestUtil.sendBusMessage({
                                            bus: ctx.jobManager.bus,
                                            message: {
                                                [input.job_id]: {
                                                    [jcm.PARAM.JOB_ID]: input.job_id,
                                                    jobState: input,
                                                },
                                            },
                                            channelType: jcm.CHANNEL.JOB,
                                            channelId: input.job_id,
                                            type: jcm.MESSAGE_TYPE.STATUS,
                                        });
                                    }
                                    // send the update for the batch parent
                                    TestUtil.sendBusMessage({
                                        bus: ctx.jobManager.bus,
                                        message: {
                                            [batchId]: {
                                                [jcm.PARAM.JOB_ID]: batchId,
                                                jobState: updatedBatchJob,
                                            },
                                        },
                                        channelType: jcm.CHANNEL.JOB,
                                        channelId: batchId,
                                        type: jcm.MESSAGE_TYPE.STATUS,
                                    });
                                }
                            );

                            index++;
                            // ensure the row displays correctly
                            const updatedRow = container.querySelector(
                                '#job_' + input.retry_parent
                            );
                            _checkRowStructure(
                                updatedRow,
                                retryParent,
                                update.expectedRow || input
                            );
                            _checkTableStructure(container, rowIds);
                            // ensure that the job has been saved
                            expect(ctx.jobManager.updateModel).toHaveBeenCalled();
                            expect(
                                ctx.jobManager.model.getItem(`exec.jobs.byId.${input.job_id}`)
                            ).toEqual(input);
                            expect(container.querySelectorAll('.batchUpdate').length).toEqual(
                                index
                            );
                            return Promise.resolve(index);
                        };

                        const doUpdates = async (startIndex, ctx) => {
                            const ix = await updateTableLoop(startIndex, ctx);
                            if (ix < updates.length) {
                                return doUpdates(ix, ctx);
                            }
                            return Promise.resolve();
                        };

                        await doUpdates(0, context);
                    });

                    describe('empty table', () => {
                        beforeEach(async function () {
                            container = document.createElement('div');
                            // start with no child jobs
                            batchParentJob.child_jobs = [];
                            this.jobManager = new JobManager({
                                model: makeModel([batchParentJob]),
                                bus: Runtime.make().bus(),
                            });
                            this.jobStatusTableInstance = await createStartedInstance(container, {
                                jobManager: this.jobManager,
                            });
                        });

                        it('sets up a table correctly', function () {
                            // check initial table structure
                            _checkTableStructure(container, null);
                            const modelIds = Object.keys(
                                this.jobManager.model.getItem('exec.jobs.byId')
                            );
                            // ensure that we have all the IDs plus the batch stored in the model
                            expect(modelIds).toEqual([batchJobData.batchId]);
                        });
                    });
                });
            });

            describe('job info', () => {
                paramTests.forEach((test) => {
                    describe('valid', () => {
                        beforeEach(async function () {
                            await createJobStatusTableWithContext(this, [TEST_JOB, BATCH_PARENT]);
                        });
                        it('will update the info ' + JSON.stringify(test.input), async function () {
                            _checkRowStructure(this.row, this.job);
                            // add in the correct jobId
                            test.input.job_id = this.jobId;
                            this.input = {
                                ...TestUtil.JSONcopy(this.job),
                                ...test.input,
                            };
                            this.input.meta.type = test.type;
                            this.input.meta.object = test.object;
                            const message = {
                                [test.input.job_id]: test.input,
                            };
                            spyOn(this.jobManager, 'removeListener').and.callThrough();
                            spyOn(this.jobManager, 'runHandler').and.callThrough();
                            await TestUtil.waitForElementChange(this.row, () => {
                                TestUtil.sendBusMessage({
                                    bus: this.jobManager.bus,
                                    message,
                                    channelType: jcm.CHANNEL.JOB,
                                    channelId: this.jobId,
                                    type: jcm.MESSAGE_TYPE.INFO,
                                });
                            });
                            expect(this.jobManager.runHandler).toHaveBeenCalled();
                            _checkRowStructure(this.row, this.job, this.input);
                        });
                    });
                });

                describe('incorrect job ID', () => {
                    beforeEach(async function () {
                        await createJobStatusTableWithContext(this, [TEST_JOB, BATCH_PARENT]);
                    });
                    it('will not update', function () {
                        _checkRowStructure(this.row, this.job);
                        const invalidId = 'a random and incorrect job ID';
                        const message = {
                            [invalidId]: {
                                ...paramTests[0].input,
                                job_id: invalidId,
                            },
                        };
                        spyOn(this.jobManager, 'removeListener').and.callThrough();
                        spyOn(this.jobManager, 'runHandler').and.callThrough();
                        TestUtil.sendBusMessage({
                            bus: this.jobManager.bus,
                            message,
                            channelType: jcm.CHANNEL.JOB,
                            channelId: invalidId,
                            type: jcm.MESSAGE_TYPE.INFO,
                        });
                        expect(this.jobManager.runHandler).not.toHaveBeenCalled();
                        expect(this.jobManager.removeListener).not.toHaveBeenCalled();
                        _checkRowStructure(this.row, this.job);
                    });
                });

                describe('retried job', () => {
                    const indicatorId = 'indicatorDiv';

                    function prepareForUpdate(ctx, test) {
                        _checkRowStructure(ctx.row, ctx.job);
                        expect(ctx.container.querySelectorAll('#' + indicatorId).length).toEqual(1);
                        // add in the correct jobId
                        test.input.job_id = ctx.jobId;
                        ctx.input = Object.assign({}, TestUtil.JSONcopy(ctx.job), test.input);
                        ctx.input.meta.type = test.type;
                        ctx.input.meta.object = test.object;

                        spyOn(ctx.jobManager, 'removeListener').and.callThrough();
                        spyOn(ctx.jobManager, 'runHandler').and.callThrough();
                    }

                    function postUpdateChecks(ctx, expectedCallArgs) {
                        expect(ctx.container.querySelectorAll('#' + indicatorId).length).toEqual(1);
                        expect(ctx.jobManager.removeListener).toHaveBeenCalledTimes(1);
                        expect(ctx.jobManager.runHandler).toHaveBeenCalled();
                        const allCalls = ctx.jobManager.runHandler.calls.allArgs();
                        expect(allCalls).toEqual([expectedCallArgs]);
                        _checkRowStructure(ctx.row, ctx.job, ctx.input);
                    }

                    beforeEach(async function () {
                        // BATCH_WITH_RETRY is [RETRIED_JOB, RETRY_PARENT, BATCH_PARENT]
                        await createJobStatusTableWithContext(this, BATCH_WITH_RETRY);
                        this.job = TestUtil.JSONcopy(RETRIED_JOB);
                        this.jobManager.addListener(jcm.MESSAGE_TYPE.INFO, jcm.CHANNEL.JOB, [
                            RETRIED_JOB_ID,
                            RETRY_PARENT_ID,
                            BATCH_PARENT_ID,
                        ]);
                        this.indicatorDiv = document.createElement('div');
                        this.indicatorDiv.id = indicatorId;
                        this.container.append(this.indicatorDiv);
                        this.jobManager.addEventHandler(jcm.MESSAGE_TYPE.INFO, {
                            zzz_table_update: () => {
                                this.indicatorDiv.textContent = 'BOOM!';
                            },
                        });
                    });

                    paramTests.forEach((test) => {
                        it(
                            'will update using the job info: ' + JSON.stringify(test.input),
                            async function () {
                                prepareForUpdate(this, test);
                                const message = {
                                    [RETRIED_JOB_ID]: {
                                        ...test.input,
                                        job_id: RETRIED_JOB_ID,
                                    },
                                };
                                await TestUtil.waitForElementChange(this.indicatorDiv, () => {
                                    TestUtil.sendBusMessage({
                                        bus: this.jobManager.bus,
                                        message,
                                        channelType: jcm.CHANNEL.JOB,
                                        channelId: RETRIED_JOB_ID,
                                        type: jcm.MESSAGE_TYPE.INFO,
                                    });
                                });
                                const expectedCallArgs = [
                                    jcm.MESSAGE_TYPE.INFO,
                                    message,
                                    {
                                        channelType: jcm.CHANNEL.JOB,
                                        channelId: RETRIED_JOB_ID,
                                    },
                                ];
                                postUpdateChecks(this, expectedCallArgs);
                            }
                        );

                        // update to the retry parent info
                        it(
                            'will update using the retry parent info: ' +
                                JSON.stringify(test.input),
                            async function () {
                                prepareForUpdate(this, test);
                                const message = {
                                    [RETRY_PARENT_ID]: {
                                        ...test.input,
                                        job_id: RETRY_PARENT_ID,
                                    },
                                };
                                await TestUtil.waitForElementChange(
                                    this.container.querySelector('#' + indicatorId),
                                    () => {
                                        TestUtil.sendBusMessage({
                                            bus: this.jobManager.bus,
                                            message,
                                            channelType: jcm.CHANNEL.JOB,
                                            channelId: RETRY_PARENT_ID,
                                            type: jcm.MESSAGE_TYPE.INFO,
                                        });
                                    }
                                );

                                const expectedCallArgs = [
                                    jcm.MESSAGE_TYPE.INFO,
                                    message,
                                    {
                                        channelType: jcm.CHANNEL.JOB,
                                        channelId: RETRY_PARENT_ID,
                                    },
                                ];
                                postUpdateChecks(this, expectedCallArgs);
                            }
                        );
                    });
                });
            });
        });
    });
});
