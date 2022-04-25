define([
    'bluebird',
    '/narrative/nbextensions/appCell2/widgets/appCellWidget',
    '/narrative/nbextensions/appCell2/widgets/appCellWidget-fsm',
    'common/dialogMessages',
    'common/jobCommMessages',
    'common/jobs',
    'common/jupyter',
    'common/runtime',
    'common/semaphore',
    'common/ui',
    'testUtil',
    'narrativeMocks',
    '/test/data/jobsData',
    'base/js/namespace',
    'uuid',
], (
    Promise,
    AppCellWidget,
    AppStates,
    DialogMessages,
    jcm,
    Jobs,
    Narrative,
    Runtime,
    Semaphore,
    UI,
    TestUtil,
    Mocks,
    JobsData,
    Jupyter,
    UUID
) => {
    'use strict';

    const fsmState = AppStates.STATE;

    const TEST_JOB = 'test_job_id';

    const appSpec = {
        id: 'NarrativeTest/app_succeed',
        gitCommitHash: '8d1f8480aee9852e9354cf723f0808fae53b2fcc',
        version: '0.0.2',
        tag: 'dev',
        spec: {
            info: {
                id: 'NarrativeTest/app_succeed',
                module_name: 'NarrativeTest',
                git_commit_hash: '8d1f8480aee9852e9354cf723f0808fae53b2fcc',
                name: 'App Succeed',
                ver: '0.0.2',
                subtitle: 'A simple test app that always succeeds.',
                tooltip: 'A simple test app that always succeeds.',
                categories: ['active'],
                authors: ['wjriehl'],
                input_types: [],
                output_types: [],
                app_type: 'app',
                namespace: 'NarrativeTest',
            },
            widgets: {
                input: 'null',
                output: 'no-display',
            },
            parameters: [
                {
                    id: 'param',
                    ui_name: 'A String',
                    short_hint: 'A string.',
                    description: '',
                    field_type: 'text',
                    allow_multiple: 0,
                    optional: 0,
                    advanced: 0,
                    disabled: 0,
                    ui_class: 'parameter',
                    default_values: [''],
                    text_options: {
                        is_output_name: 0,
                        placeholder: '',
                        regex_constraint: [],
                    },
                },
            ],
            fixed_parameters: [],
            behavior: {
                kb_service_url: '',
                kb_service_name: 'NarrativeTest',
                kb_service_version: '8d1f8480aee9852e9354cf723f0808fae53b2fcc',
                kb_service_method: 'app_succeed',
                kb_service_input_mapping: [
                    {
                        input_parameter: 'param',
                        target_argument_position: 0,
                    },
                ],
                kb_service_output_mapping: [],
            },
            job_id_output_field: 'docker',
        },
    };

    const methodFullInfo = [
        {
            id: 'NarrativeTest/app_succeed',
            module_name: 'NarrativeTest',
            git_commit_hash: '8d1f8480aee9852e9354cf723f0808fae53b2fcc',
            name: 'App Succeed',
            ver: '0.0.2',
            authors: ['wjriehl'],
            contact: 'wjriehl@lbl.gov',
            subtitle: 'A simple test app that always succeeds.',
            tooltip: 'A simple test app that always succeeds.',
            description:
                '<p>This is a tiny, simple method intended for making sure the execution engine can succeed.</p>',
            technical_description: '',
            app_type: 'app',
            suggestions: {
                related_methods: [],
                next_methods: [],
                related_apps: [],
                next_apps: [],
            },
            categories: ['active'],
            screenshots: [],
            publications: [],
            namespace: 'NarrativeTest',
        },
    ];

    function generateCellData() {
        return TestUtil.JSONcopy({
            cell_type: 'code',
            metadata: {
                kbase: {
                    type: 'app',
                    attributes: {
                        created: 'Fri, 27 Mar 2020 17:39:10 GMT',
                        id: new UUID(4).format(),
                        info: {
                            label: 'more...',
                            url: '/#appcatalog/app/simpleapp/example_method/beta',
                        },
                        lastLoaded: 'Tue, 06 Oct 2020 23:28:26 GMT',
                        status: 'new',
                        subtitle: 'Perform some kind of method',
                        title: 'SimpleApp Simple Add',
                    },
                    appCell: {
                        app: appSpec,
                        params: {
                            param: '',
                        },
                        output: {
                            byJob: {},
                        },
                        'user-settings': {
                            showCodeInputArea: false,
                        },
                    },
                },
            },
        });
    }

    function cellStartUp(ctx) {
        const mockCell = Mocks.buildMockCell('code');
        mockCell.metadata = ctx.cell.metadata;
        ctx.kbaseNode = document.createElement('div');
        ctx.cell = mockCell;
        ctx.cell.input[0].parentNode.insertBefore(ctx.kbaseNode, ctx.cell.input[0].nextSibling);

        ctx.appCellWidgetInstance = AppCellWidget.make({
            bus: ctx.bus,
            cell: mockCell,
            devMode: true,
            saveMaxFrequency: 1,
        });

        Jupyter.notebook = {
            writable: true,
        };
        Jupyter.narrative = {
            readonly: false,
            getAuthToken: () => 'fake_token',
        };
        spyOn(window, 'NarrativeMethodStore').and.returnValue({
            get_method_full_info: () => {
                return Promise.resolve(methodFullInfo);
            },
            get_method_spec: () => {
                return Promise.resolve([appSpec.spec]);
            },
        });
        spyOn(window, 'Catalog').and.returnValue({
            get_exec_aggr_stats: () => {
                return Promise.resolve([]);
            },
        });
        return ctx.appCellWidgetInstance;
    }

    async function startRunningCell(ctx) {
        cellStartUp(ctx);
        await ctx.appCellWidgetInstance.init();
        await ctx.appCellWidgetInstance.attach(ctx.kbaseNode);
        await ctx.appCellWidgetInstance.start();
        await ctx.appCellWidgetInstance.run();
    }

    describe('The AppCellWidget module', () => {
        it('Should load and return a make function', () => {
            expect(AppCellWidget).toEqual(jasmine.any(Object));
            expect(AppCellWidget.make).toEqual(jasmine.any(Function));
        });
        it('should have cssCellType defined', () => {
            expect(AppCellWidget.cssCellType).toEqual(jasmine.any(String));
        });
    });
    describe('The AppCellWidget instance', () => {
        beforeEach(function () {
            Jupyter.notebook = {
                writable: true,
            };
            Jupyter.narrative = {
                readonly: false,
            };
            const commSemaphore = Semaphore.make();
            commSemaphore.add('comm', false);
            commSemaphore.set('comm', 'ready');
            const cell = generateCellData();
            this.bus = Runtime.make().bus();
            this.cell = cell;
            this.cell_id = cell.metadata.kbase.attributes.id;
            this.cell.code_mirror = {
                options: { readOnly: false },
                setOption: function (p, v) {
                    this.options[p] = v;
                },
                refresh: () => {
                    /* no op */
                },
            };
        });

        afterEach(() => {
            TestUtil.clearRuntime();
            Jupyter.notebook = null;
            Jupyter.narrative = null;
        });

        describe('instantiation', () => {
            beforeEach(function () {
                this.appCellWidgetInstance = AppCellWidget.make({
                    bus: this.bus,
                    cell: this.cell,
                    devMode: true,
                    saveMaxFrequency: 1,
                });
            });

            it('is successful', function () {
                expect(this.appCellWidgetInstance).not.toBe(null);
            });

            it('produces an instance with the expected methods', function () {
                ['init', 'attach', 'start', 'stop', 'detach'].forEach((fn) => {
                    expect(this.appCellWidgetInstance[fn]).toBeDefined();
                });
            });
        });

        describe('init method', () => {
            const rwOptions = [
                // notebook.writable, narrative.readonly
                [true, false],
                [true, true], // setReadOnly
                [false, false], // setReadOnly
                [false, true], // setReadOnly
            ];

            rwOptions.forEach((opt) => {
                it(`sets the cell up with opts writable ${opt[0]}, readonly ${opt[1]}`, function () {
                    Jupyter.notebook = {
                        writable: opt[0],
                    };
                    Jupyter.narrative = {
                        readonly: opt[1],
                    };
                    this.appCellWidgetInstance = AppCellWidget.make({
                        bus: Runtime.make().bus(),
                        cell: this.cell,
                        devMode: true,
                        saveMaxFrequency: 1,
                    });
                    expect(this.appCellWidgetInstance.__fsm()).toBeUndefined();
                    return this.appCellWidgetInstance.init().then((initReturn) => {
                        expect(initReturn).toBeNull();
                        expect(this.appCellWidgetInstance.model).toBeDefined();
                        expect(this.appCellWidgetInstance.__fsm()).toEqual(jasmine.any(Object));
                        expect(this.appCellWidgetInstance.__fsm().getCurrentState().state).toEqual(
                            fsmState.NEW
                        );
                        const rawModel = this.appCellWidgetInstance.model.getRawObject();
                        expect(rawModel['user-settings']).toEqual({
                            showCodeInputArea: false,
                        });
                        if (opt[0] && !opt[1]) {
                            expect(this.cell.code_mirror.options.readOnly).toEqual(false);
                        } else {
                            expect(this.cell.code_mirror.options.readOnly).toEqual('nocursor');
                        }
                    });
                });
            });
        });

        describe('cell start up', () => {
            beforeEach(function () {
                cellStartUp(this);
            });

            it('inits, setting up the FSM', async function () {
                expect(this.appCellWidgetInstance.__fsm()).toBeUndefined();
                await this.appCellWidgetInstance.init();
                expect(this.appCellWidgetInstance.__fsm()).toEqual(jasmine.any(Object));
                expect(this.appCellWidgetInstance.__fsm().getCurrentState().state).toEqual(
                    fsmState.NEW
                );
            });

            it('attaches to the DOM', async function () {
                await this.appCellWidgetInstance.init();
                // attach runs renderLayout and adds the run control panel
                await this.appCellWidgetInstance.attach(this.kbaseNode);

                const cellType = AppCellWidget.cssCellType;
                expect(this.kbaseNode.querySelector(`.${cellType}__container`)).toBeDefined();
                const widgetContainer = this.kbaseNode.querySelector(
                    `.${cellType}__widget_container`
                );
                expect(widgetContainer).toBeDefined();

                // two children, the container for the run control panel, and the tab pane
                expect(widgetContainer.childNodes.length).toEqual(2);
                expect(
                    widgetContainer.childNodes[0].childNodes[0].getAttribute('data-element')
                ).toEqual('run-control-panel');
                expect(widgetContainer.childNodes[1].getAttribute('data-element')).toEqual(
                    'tab-pane'
                );

                // all the action buttons are alive and well
                const actionButtons = this.kbaseNode.querySelectorAll(`.kb-rcp__action-button`);
                const hiddenButtons = this.kbaseNode.querySelectorAll(
                    `.kb-rcp__action-button.hidden`
                );
                expect(hiddenButtons.length).toEqual(0);
                // run, cancel, reset, rerun, offline
                expect(actionButtons.length).toBeGreaterThan(4);
            });

            it('starts, adding a load of event listeners', async function () {
                await this.appCellWidgetInstance.init();
                await this.appCellWidgetInstance.attach(this.kbaseNode);

                // start: adds a load of bus event manager stuff
                spyOn(this.appCellWidgetInstance.busEventManager, 'add');
                await this.appCellWidgetInstance.start();
                // a ton of bus events get added
                expect(
                    this.appCellWidgetInstance.busEventManager.add.calls.allArgs().length
                ).toBeGreaterThan(10);
                expect(this.appCellWidgetInstance.__fsm().getCurrentState().state).toEqual(
                    fsmState.NEW
                );
            });

            it('runs', async function () {
                await this.appCellWidgetInstance.init();
                await this.appCellWidgetInstance.attach(this.kbaseNode);
                await this.appCellWidgetInstance.start();
                // checks the app spec is valid
                await this.appCellWidgetInstance.run();

                // app spec should have been checked
                // FSM should have changed state
                expect(this.appCellWidgetInstance.__fsm().getCurrentState().state).not.toEqual(
                    fsmState.NEW
                );
                // UI should have been rendered; only one action button visible
                const actionButtons = this.kbaseNode.querySelectorAll(`.kb-rcp__action-button`);
                const hiddenButtons = this.kbaseNode.querySelectorAll(
                    `.kb-rcp__action-button.hidden`
                );
                expect(actionButtons.length).toEqual(hiddenButtons.length + 1);
            });
        });

        describe('cell stop', () => {
            beforeEach(async function () {
                await startRunningCell(this);
            });

            it('stops, removing event listeners', async function () {
                expect(this.appCellWidgetInstance.__fsm().getCurrentState().state).not.toEqual(
                    fsmState.NEW
                );
                spyOn(this.appCellWidgetInstance.busEventManager, 'removeAll');
                await this.appCellWidgetInstance.stop();
                expect(this.appCellWidgetInstance.busEventManager.removeAll).toHaveBeenCalled();
            });

            it('detaches from the DOM', async function () {
                await this.appCellWidgetInstance.stop();
                expect(this.kbaseNode.childNodes.length).toEqual(1);
                await this.appCellWidgetInstance.detach();
                expect(this.kbaseNode.childNodes.length).toEqual(0);
            });
        });

        describe('the running cell', () => {
            describe('run status messages', () => {
                beforeEach(async function () {
                    const currentState = fsmState.EDITING_COMPLETE;
                    cellStartUp(this);
                    // add a valid param so the cell starts up ready to run
                    this.cell.metadata.kbase.appCell.params.param = 'RAWR!';
                    this.cell.metadata.kbase.appCell.fsm = { currentState };
                    await this.appCellWidgetInstance.init();
                    await this.appCellWidgetInstance.attach(this.kbaseNode);
                    await this.appCellWidgetInstance.start();
                    await this.appCellWidgetInstance.run();
                    // ensure that the app cell is in the correct state
                    expect(this.appCellWidgetInstance.__fsm().getCurrentState().state).toEqual(
                        currentState
                    );
                    return new Promise((resolve) => {
                        this.cell.execute = () => {
                            resolve();
                        };
                        this.kbaseNode.querySelector('.kb-rcp__action-button.-run').click();
                    });
                });

                it('responds to the run button being clicked', function () {
                    expect(this.appCellWidgetInstance.__fsm().getCurrentState().state).toEqual(
                        fsmState.EXECUTE_REQUESTED
                    );
                    expect(
                        this.kbaseNode.querySelector(`.kb-rcp__action-button.-cancel`)
                    ).not.toHaveClass('hidden');
                });

                it('responds to job launch', function () {
                    const runStatusArgs = {
                        event: 'launched_job',
                        cell_id: this.cell_id,
                        job_id: TEST_JOB,
                    };
                    const channelKeys = Array.from(Object.keys(this.bus.channels));
                    return new Promise((resolve) => {
                        spyOn(Narrative, 'saveNotebook').and.callFake(() => {
                            resolve();
                        });
                        spyOn(this.bus, 'emit');
                        TestUtil.send_RUN_STATUS({
                            bus: this.bus,
                            runStatusArgs,
                        });
                    }).then(() => {
                        // FSM state to { mode: 'processing', stage: 'launched' }
                        expect(this.appCellWidgetInstance.__fsm().getCurrentState().state).toEqual(
                            fsmState.PROCESSING_LAUNCHED
                        );
                        const exec = this.appCellWidgetInstance.model.getItem('exec');

                        expect(exec.jobState).toEqual({
                            job_id: TEST_JOB,
                            status: 'created',
                            created: 0,
                        });
                        expect(exec.launchState).toEqual({
                            ...runStatusArgs,
                            event_at: 1234567890,
                        });
                        // action button: cancel
                        expect(
                            this.kbaseNode.querySelector(`.kb-rcp__action-button.-cancel`)
                        ).not.toHaveClass('hidden');
                        // expect the status tab to be available
                        expect(
                            this.kbaseNode.querySelector(
                                `.kb-rcp__tab-button[data-button="jobStatus"]`
                            )
                        ).not.toHaveClass('hidden');

                        // a channel should have been added to listen for job updates
                        expect(Object.keys(this.bus.channels).length).toBeGreaterThan(
                            channelKeys.length
                        );
                        expect(Object.keys(this.bus.channels)).toEqual(
                            jasmine.arrayContaining(channelKeys)
                        );
                        const busEmissions = this.bus.emit.calls.allArgs().filter((call) => {
                            return call[0] !== 'clock-tick';
                        });
                        expect(busEmissions).toContain([
                            jcm.MESSAGE_TYPE.START_UPDATE,
                            { [jcm.PARAM.JOB_ID]: TEST_JOB },
                        ]);
                    });
                });

                it('responds to launch errors', function () {
                    const runStatusArgs = { event: 'error', cell_id: this.cell_id };

                    return new Promise((resolve) => {
                        spyOn(Narrative, 'saveNotebook').and.callFake(() => {
                            resolve();
                        });
                        TestUtil.send_RUN_STATUS({ bus: this.bus, runStatusArgs });
                    }).then(() => {
                        // FSM state to { mode: 'error', stage: 'launching' }
                        expect(this.appCellWidgetInstance.__fsm().getCurrentState().state).toEqual(
                            fsmState.LAUNCH_ERROR
                        );
                        const exec = this.appCellWidgetInstance.model.getItem('exec');
                        expect(exec.launchState).toEqual({
                            ...runStatusArgs,
                            event_at: 1234567890,
                        });
                        // action button should be rerunApp
                        expect(
                            this.kbaseNode.querySelector(`.kb-rcp__action-button.-rerun`)
                        ).not.toHaveClass('hidden');
                        // expect the error tab to be visible
                        expect(
                            this.kbaseNode.querySelector(`.kb-rcp__tab-button[data-button="error"]`)
                        ).not.toHaveClass('hidden');
                    });
                });

                // TODO: ATM the app cell doesn't respond to invalid messages
                xit('responds to crazy messages', function () {
                    const runStatusArgs = { event: 'THE APOCALYPSE', cell_id: this.cell_id };
                    TestUtil.send_RUN_STATUS({
                        bus: this.bus,
                        runStatusArgs,
                    });
                    // message doesn't get saved and there's no narrative save, so how to know when
                    // message is processed?
                    expect(this.appCellWidgetInstance.__fsm().getCurrentState().state).toEqual(
                        fsmState.EDITING_COMPLETE
                    );
                });
            });
        });

        describe('cancel and reset', () => {
            const startState = { job_id: TEST_JOB, status: 'running', created: 12345678 };

            it('cancels a running job', async function () {
                // beforeEach(async function () {
                cellStartUp(this);
                this.cell.metadata.kbase.appCell.exec = {
                    launchState: { event: 'launched_job', job_id: TEST_JOB },
                    jobState: { job_id: TEST_JOB, status: 'running', created: 12345678 },
                };
                this.cell.metadata.kbase.appCell.fsm = {
                    currentState: { mode: 'processing', stage: 'running' },
                };
                await this.appCellWidgetInstance.init();
                await this.appCellWidgetInstance.attach(this.kbaseNode);
                await this.appCellWidgetInstance.start();
                await this.appCellWidgetInstance.run();
                expect(this.appCellWidgetInstance.model.getItem('exec.jobState')).toEqual(
                    startState
                );

                // confirm the cancel/reset action
                spyOn(UI, 'showConfirmDialog').and.resolveTo(true);
                spyOn(this.bus, 'emit');
                const cancelButton = this.kbaseNode.querySelector('.kb-rcp__action-button.-cancel');
                await TestUtil.waitForElementChange(
                    this.kbaseNode.querySelector('[data-element="execMessage"]'),
                    () => {
                        cancelButton.click();
                    }
                );

                expect(this.bus.emit.calls.allArgs()).toEqual([
                    [jcm.MESSAGE_TYPE.CANCEL, { [jcm.PARAM.JOB_ID]: TEST_JOB }],
                ]);
                // app state should have changed to 'CANCELING'
                expect(this.appCellWidgetInstance.__fsm().getCurrentState().state).toEqual(
                    fsmState.CANCELING
                );
                expect(
                    this.kbaseNode.querySelector('[data-element="execMessage"]').textContent
                ).toContain('Cancelling...');
            });

            // reset states
            // can also reset from fsmState.TERMINATED
            // and fsmState.LAUNCH_ERROR but the mechanism is
            // basically the same
            [
                {
                    fsm: { currentState: fsmState.RUNTIME_ERROR },
                    exec: {
                        jobState: {
                            batch_id: null,
                            batch_job: false,
                            child_jobs: [],
                            created: 1650382769000,
                            error: {
                                code: -32000,
                                error: 'Traceback (most recent call last):\n  File "/kb/module/bin/../lib/NarrativeTest/NarrativeTestServer.py", line 101, in _call_method\n    result = method(ctx, *params)\n  File "/kb/module/lib/NarrativeTest/NarrativeTestImpl.py", line 345, in app_sleep\n    raise RuntimeError(\'App woke up from its nap very cranky!\')\nRuntimeError: App woke up from its nap very cranky!\n',
                                message: "'App woke up from its nap very cranky!'",
                                name: 'Server error',
                            },
                            error_code: 1,
                            errormsg: 'Job output contains an error',
                            finished: 1650382783129,
                            job_id: '625ed7b128c29d4fd84dcf3a',
                            job_output: {},
                            queued: 1650382769657,
                            retry_count: 0,
                            retry_ids: [],
                            running: 1650382777753,
                            status: 'error',
                            updated: 1650382783214,
                        },
                        jobStateUpdated: 1650670508992,
                        launchState: {
                            cell_id: '2aff3fd9-a61c-41d9-b28e-e03ed7f0f854',
                            event: 'launched_job',
                            event_at: '2022-04-19T15:39:29.835265Z',
                            job_id: '625ed7b128c29d4fd84dcf3a',
                            run_id: '5737126c-b533-4295-aed7-075c527b84b8',
                        },
                    },
                },
                {
                    fsm: { currentState: fsmState.COMPLETED },
                    exec: {
                        jobState: {
                            batch_id: null,
                            batch_job: false,
                            child_jobs: [],
                            created: 1650894376000,
                            finished: 1650894391740,
                            job_id: '6266a62883eff4a9b770db1e',
                            job_output: {
                                id: '6266a62883eff4a9b770db1e',
                                result: [5],
                                version: '1.1',
                            },
                            queued: 1650894377047,
                            retry_count: 0,
                            retry_ids: [],
                            running: 1650894383195,
                            status: 'completed',
                            updated: 1650894392018,
                        },
                        jobStateUpdated: 1650894393361,
                        launchState: {
                            cell_id: '2245aad3-2ed0-4f50-bea2-06f17cb38fdd',
                            event: 'launched_job',
                            event_at: '2022-04-25T13:46:17.373294Z',
                            job_id: '6266a62883eff4a9b770db1e',
                            run_id: '8db0ac8a-0fad-41d8-9942-d17f0d6750c4',
                        },
                        outputWidgetInfo: {
                            name: 'no-display',
                            params: {},
                            tag: 'dev',
                        },
                    },
                },
                {
                    fsm: { currentState: fsmState.INTERNAL_ERROR },
                    button: '-reset',
                },
            ].forEach((state) => {
                it('resets the cell', async function () {
                    cellStartUp(this);
                    this.cell.metadata.kbase.appCell.exec = state.exec;
                    this.cell.metadata.kbase.appCell.fsm = state.fsm;
                    // set a valid param so the cell resets to EDITING_COMPLETE
                    this.cell.metadata.kbase.appCell.params.param = 'RAWR!';

                    await this.appCellWidgetInstance.init();
                    await this.appCellWidgetInstance.attach(this.kbaseNode);
                    await this.appCellWidgetInstance.start();
                    await this.appCellWidgetInstance.run();

                    const selector = state.button || '-rerun';
                    const resetButton = this.kbaseNode.querySelector(
                        `.kb-rcp__action-button.${selector}`
                    );
                    const runButton = this.kbaseNode.querySelector('.kb-rcp__action-button.-run');
                    // confirm the cancel/reset action
                    spyOn(UI, 'showConfirmDialog').and.resolveTo(true);
                    spyOn(this.bus, 'emit');

                    await TestUtil.waitForElementState(
                        runButton,
                        () => {
                            return !runButton.classList.contains('hidden');
                        },
                        () => {
                            // click reset and wait for the run button to appear
                            resetButton.click();
                        }
                    );

                    expect(
                        this.kbaseNode.querySelector('[data-element="execMessage"]').textContent
                    ).toEqual('');
                    expect(this.appCellWidgetInstance.model.getItem('exec')).toBeUndefined();
                    expect(this.appCellWidgetInstance.__fsm().getCurrentState().state).toEqual(
                        fsmState.EDITING_COMPLETE
                    );
                });
            });
        });

        describe('job status updates', () => {
            // ensure that the app cell goes from { mode: 'processing', stage: 'launched', }
            // to the appropriate state on receiving a job status message
            Object.keys(JobsData.jobsById).forEach((jobId) => {
                if (!JobsData.jobsById[jobId].batch_job) {
                    it(`processes a ${jobId} update`, async function () {
                        const jobState = JobsData.jobsById[jobId];
                        const currentState = fsmState.PROCESSING_LAUNCHED;
                        cellStartUp(this);
                        // start up cell as if it just received the job launched message
                        this.cell.metadata.kbase.appCell.fsm = { currentState };
                        this.cell.metadata.kbase.appCell.exec = {
                            jobState: { job_id: jobId },
                            launchState: { event: 'launched_job', job_id: jobId },
                        };

                        spyOn(this.bus, 'emit').and.callFake((...args) => {
                            const [msgType] = args;
                            if (msgType === jcm.MESSAGE_TYPE.START_UPDATE) {
                                // send a status update
                                TestUtil.send_STATUS({
                                    bus: this.bus,
                                    jobId,
                                    jobState,
                                });
                            }
                        });

                        await this.appCellWidgetInstance.init();
                        await this.appCellWidgetInstance.attach(this.kbaseNode);
                        await this.appCellWidgetInstance.start();
                        await this.appCellWidgetInstance.run();

                        // ensure that the app cell is in the correct state
                        expect(this.appCellWidgetInstance.__fsm().getCurrentState().state).toEqual(
                            currentState
                        );
                        // send a job status update; this will trigger an FSM mode change,
                        // which will enable the jobStatus tab
                        await TestUtil.waitForElementChange(
                            this.kbaseNode.querySelector('[data-button="jobStatus"]')
                        );

                        // after processing
                        expect(this.appCellWidgetInstance.__fsm().getCurrentState().state).toEqual(
                            jobState.meta.appCellFsm
                        );
                        expect(this.appCellWidgetInstance.model.getItem('exec.jobState')).toEqual(
                            jobState
                        );

                        const busEmissions = this.bus.emit.calls.allArgs().filter((call) => {
                            return call[0] !== 'clock-tick';
                        });
                        // the cell will emit at least one request for status updates when
                        // the cell starts up
                        expect(busEmissions).toContain([
                            jcm.MESSAGE_TYPE.START_UPDATE,
                            { [jcm.PARAM.JOB_ID]: jobId },
                        ]);
                        // if the job state is terminal, expect there to be a request to stop updates
                        if (Jobs.isTerminalStatus(jobState.status)) {
                            expect(busEmissions).toContain([
                                jcm.MESSAGE_TYPE.STOP_UPDATE,
                                { [jcm.PARAM.JOB_ID]: jobId },
                            ]);
                        }
                    });
                }
            });
        });
    });
});
