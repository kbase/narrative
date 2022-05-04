define([
    'bluebird',
    '/narrative/nbextensions/appCell2/widgets/appCellWidget',
    '/narrative/nbextensions/appCell2/widgets/appCellWidget-fsm',
    'common/jobCommMessages',
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
    jcm,
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
    const { indexedAppStates } = AppStates;
    const { jobsById, JOB_NAMES } = JobsData;
    const TEST_JOB = 'test_job_id';
    const selectors = {
        actionButton: '.kb-rcp__action-button',
        cancel: '.kb-rcp__action-button.-cancel',
        run: '.kb-rcp__action-button.-run',
        reset: '.kb-rcp__action-button.-reset',
        execMessage: '[data-element="execMessage"]',
    };

    const { cssCellType, stateMessages } = AppCellWidget;

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

    function setUpCellInState(ctx, stateName) {
        ctx.cell.metadata.kbase.appCell.fsm = { currentState: fsmState[stateName] };

        if (
            [
                'NEW',
                'EDITING_BATCH_INCOMPLETE',
                'EDITING_BATCH_COMPLETE',
                'EDITING_INCOMPLETE',
            ].includes(stateName)
        ) {
            // nothing more to do here
            return;
        }

        ctx.cell.metadata.kbase.appCell.params.param = 'RAWR!';

        if (stateName === 'INTERNAL_ERROR') {
            ctx.cell.metadata.kbase.appCell.fatalError = {
                title: 'Error loading main widgets',
                message: 'Something went horribly wrong',
                advice: ['Abandon hope, all ye who enter here'],
                info: 'No further info',
                detail: 'no additional details',
            };
        }

        if (['EDITING_COMPLETE', 'EXECUTE_REQUESTED', 'INTERNAL_ERROR'].includes(stateName)) {
            return;
        }

        switch (stateName) {
            case 'PROCESSING_LAUNCHED':
                ctx.cell.metadata.kbase.appCell.exec = {
                    jobState: {
                        job_id: JOB_NAMES.QUEUED,
                        status: 'created',
                        created: 0,
                    },
                    launchState: {
                        job_id: JOB_NAMES.QUEUED,
                        event: 'launched_job',
                    },
                };
                break;

            case 'PROCESSING_QUEUED':
                ctx.cell.metadata.kbase.appCell.exec = {
                    jobState: jobsById[JOB_NAMES.QUEUED],
                    launchState: {
                        job_id: JOB_NAMES.QUEUED,
                        event: 'launched_job',
                    },
                };
                break;

            case 'CANCELING':
            case 'PROCESSING_RUNNING':
                ctx.cell.metadata.kbase.appCell.exec = {
                    jobState: jobsById[JOB_NAMES.RUNNING],
                    launchState: {
                        job_id: JOB_NAMES.RUNNING,
                        event: 'launched_job',
                    },
                };
                break;

            case 'COMPLETED':
                ctx.cell.metadata.kbase.appCell.exec = {
                    jobState: jobsById[JOB_NAMES.COMPLETED],
                    launchState: {
                        event: 'launched_job',
                        job_id: JOB_NAMES.COMPLETED,
                    },
                    outputWidgetInfo: {
                        name: 'no-display',
                        params: {},
                        tag: 'dev',
                    },
                };
                break;

            case 'TERMINATED':
                ctx.cell.metadata.kbase.appCell.exec = {
                    jobState: jobsById[JOB_NAMES.TERMINATED_WHILST_RUNNING],
                    launchState: {
                        event: 'launched_job',
                        job_id: JOB_NAMES.TERMINATED_WHILST_RUNNING,
                    },
                };
                break;

            case 'LAUNCH_ERROR':
                ctx.cell.metadata.kbase.appCell.appError = {
                    type: 'App Startup Error',
                    message: 'Something went terribly wrong',
                    code: 'throw new Error("ZOMG! NOOO!")',
                };
                break;

            case 'RUNTIME_ERROR':
                ctx.cell.metadata.kbase.appCell.exec = {
                    jobState: jobsById[JOB_NAMES.DIED_WHILST_RUNNING],
                    launchState: {
                        event: 'launched_job',
                        job_id: JOB_NAMES.DIED_WHILST_RUNNING,
                    },
                };
                break;
            default:
                throw new Error(`invalid FSM state ${stateName}`);
        }
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
        await ctx.appCellWidgetInstance.init();
        await ctx.appCellWidgetInstance.attach(ctx.kbaseNode);
        await ctx.appCellWidgetInstance.start();
        await ctx.appCellWidgetInstance.run();
    }

    /**
     * filter the "clock-tick"s out of an argument list
     * @param {function} fn
     */
    function filterClockTicks(fn) {
        return fn.calls.allArgs().filter((call) => {
            return call[0] !== 'clock-tick';
        });
    }

    describe('The AppCellWidget module', () => {
        it('Should load and return a make function', () => {
            expect(AppCellWidget).toEqual(jasmine.any(Object));
            expect(AppCellWidget.make).toEqual(jasmine.any(Function));
        });
        it('should have cssCellType defined', () => {
            expect(AppCellWidget.cssCellType).toEqual(jasmine.any(String));
        });

        it('should have stateMessages defined', () => {
            expect(AppCellWidget.stateMessages).toEqual(jasmine.any(Object));
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

                expect(this.kbaseNode.querySelector(`.${cssCellType}__container`)).toBeDefined();
                const widgetContainer = this.kbaseNode.querySelector(
                    `.${cssCellType}__widget_container`
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
                const actionButtons = this.kbaseNode.querySelectorAll(selectors.actionButton);
                const hiddenButtons = this.kbaseNode.querySelectorAll(
                    `${selectors.actionButton}.hidden`
                );
                expect(hiddenButtons.length).toEqual(0);
                // run, cancel, reset, offline
                expect(actionButtons.length).toEqual(4);
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
                ).toBeGreaterThan(8);
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
                const actionButtons = this.kbaseNode.querySelectorAll(selectors.actionButton);
                const hiddenButtons = this.kbaseNode.querySelectorAll(
                    `${selectors.actionButton}.hidden`
                );
                expect(actionButtons.length).toEqual(hiddenButtons.length + 1);
            });

            describe('app cell startup states', () => {
                it('can validate params on startup, params incomplete', async function () {
                    setUpCellInState(this, 'EDITING_INCOMPLETE');
                    spyOn(this.appCellWidgetInstance.jobManager, '_initJob').and.callThrough();
                    await startRunningCell(this);
                    expect(this.appCellWidgetInstance.__fsm().getCurrentState().state).toEqual(
                        fsmState.EDITING_INCOMPLETE
                    );
                    expect(this.appCellWidgetInstance.jobManager._initJob).not.toHaveBeenCalled();
                    const runButton = this.kbaseNode.querySelector(selectors.run);
                    expect(runButton).not.toHaveClass('hidden');
                    expect(runButton).toHaveClass('disabled');
                });

                it('can validate params on startup and be ready to run', async function () {
                    // add a valid param so the cell starts up ready to run
                    setUpCellInState(this, 'EDITING_COMPLETE');
                    spyOn(this.appCellWidgetInstance.jobManager, '_initJob').and.callThrough();
                    await startRunningCell(this);
                    expect(this.appCellWidgetInstance.__fsm().getCurrentState().state).toEqual(
                        fsmState.EDITING_COMPLETE
                    );
                    expect(this.appCellWidgetInstance.jobManager._initJob).not.toHaveBeenCalled();
                    const runButton = this.kbaseNode.querySelector(selectors.run);
                    expect(runButton).not.toHaveClass('hidden');
                    expect(runButton).not.toHaveClass('disabled');
                });

                it('restores the state of an existing job', async function () {
                    setUpCellInState(this, 'PROCESSING_RUNNING');
                    spyOn(
                        this.appCellWidgetInstance.jobManager,
                        'restoreFromSaved'
                    ).and.callThrough();
                    spyOn(this.appCellWidgetInstance.jobManager, '_initJob').and.callThrough();
                    await startRunningCell(this);
                    expect(
                        this.appCellWidgetInstance.jobManager.restoreFromSaved
                    ).toHaveBeenCalled();
                    expect(
                        this.appCellWidgetInstance.jobManager.restoreFromSaved.calls.allArgs()
                    ).toEqual([[]]);
                    expect(this.appCellWidgetInstance.jobManager._initJob).toHaveBeenCalled();
                    expect(this.appCellWidgetInstance.jobManager._initJob.calls.allArgs()).toEqual([
                        [jobsById[JOB_NAMES.RUNNING]],
                    ]);
                });

                // this should not happen but may be present in old cells
                it('calls initJob with a launch state', async function () {
                    setUpCellInState(this, 'PROCESSING_LAUNCHED');
                    // leave just the exec.launchState
                    delete this.cell.metadata.kbase.appCell.exec.jobState;
                    spyOn(this.appCellWidgetInstance.jobManager, 'initJob').and.callThrough();
                    spyOn(this.appCellWidgetInstance.jobManager, '_initJob').and.callThrough();
                    await startRunningCell(this);

                    expect(this.appCellWidgetInstance.jobManager.initJob.calls.allArgs()).toEqual([
                        [JOB_NAMES.QUEUED],
                    ]);
                    expect(this.appCellWidgetInstance.jobManager._initJob.calls.allArgs()).toEqual([
                        [{ job_id: JOB_NAMES.QUEUED, status: 'created', created: 0 }],
                    ]);
                });

                // this should not happen but may be present in old cells
                it('calls initJob with an invalid jobState', async function () {
                    setUpCellInState(this, 'PROCESSING_LAUNCHED');
                    spyOn(this.appCellWidgetInstance.jobManager, 'initJob').and.callThrough();
                    spyOn(this.appCellWidgetInstance.jobManager, '_initJob').and.callThrough();
                    this.cell.metadata.kbase.appCell.exec.jobState = { job_id: JOB_NAMES.QUEUED };
                    await startRunningCell(this);

                    expect(this.appCellWidgetInstance.jobManager.initJob.calls.allArgs()).toEqual([
                        [JOB_NAMES.QUEUED],
                    ]);
                    expect(this.appCellWidgetInstance.jobManager._initJob.calls.allArgs()).toEqual([
                        [{ job_id: JOB_NAMES.QUEUED, status: 'created', created: 0 }],
                    ]);
                });

                it('can start in an internal error state', async function () {
                    setUpCellInState(this, 'INTERNAL_ERROR');
                    await startRunningCell(this);

                    expect(this.appCellWidgetInstance.__fsm().getCurrentState().state).toEqual(
                        fsmState.INTERNAL_ERROR
                    );
                    // the reset button should be active
                    const resetButton = this.kbaseNode.querySelector(selectors.reset);
                    expect(resetButton).not.toHaveClass('hidden');
                    expect(resetButton).not.toHaveClass('disabled');
                });

                it('shows an internal error if the FSM throws a hissy fit', async function () {
                    this.cell.metadata.kbase.appCell.fsm = {
                        currentState: { this: 'does', not: 'exist' },
                    };
                    await startRunningCell(this);

                    expect(this.appCellWidgetInstance.__fsm().getCurrentState().state).toEqual(
                        fsmState.INTERNAL_ERROR
                    );
                    const expectedError = {
                        title: 'Error initializing app state',
                        message: 'Cannot find initial state',
                        advice: [
                            'Reset the app and try again.',
                            'If that fails, delete the app cell and create a new one.',
                        ],
                        info: null,
                        detail: null,
                    };
                    expect(this.appCellWidgetInstance.model.getItem('internalError')).toEqual(
                        expectedError
                    );

                    [...expectedError.advice, expectedError.title, expectedError.message].forEach(
                        (text) => {
                            expect(this.kbaseNode.textContent).toMatch(text);
                        }
                    );
                    // the reset button should be active
                    const resetButton = this.kbaseNode.querySelector(selectors.reset);
                    expect(resetButton).not.toHaveClass('hidden');
                    expect(resetButton).not.toHaveClass('disabled');
                });

                Object.keys(indexedAppStates).forEach((state) => {
                    // can't start in NEW -- it gets converted to an editing mode
                    if (state !== 'NEW' && state.indexOf('BATCH') === -1) {
                        it(`shows the correct execMessage when starting in state ${state}`, async function () {
                            setUpCellInState(this, state);
                            await startRunningCell(this);
                            expect(
                                this.appCellWidgetInstance.__fsm().getCurrentState().state
                            ).toEqual(fsmState[state]);
                            const jobState =
                                this.appCellWidgetInstance.model.getItem('exec.jobState');
                            const execMessage = this.kbaseNode.querySelector(selectors.execMessage);
                            if (state in stateMessages) {
                                expect(execMessage.textContent).toEqual(stateMessages[state]);
                            } else if (jobState) {
                                expect(execMessage.textContent.trim()).toEqual(
                                    jobState.meta.createJobStatusLines.line
                                );
                            } else {
                                fail('unexpected FSM state');
                            }
                        });
                    }
                });
            });
        });

        describe('cell stop', () => {
            beforeEach(async function () {
                cellStartUp(this);
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
                    setUpCellInState(this, 'EDITING_COMPLETE');
                    await startRunningCell(this);
                    // ensure that the app cell is in the correct state
                    expect(this.appCellWidgetInstance.__fsm().getCurrentState().state).toEqual(
                        currentState
                    );
                    return new Promise((resolve) => {
                        this.cell.execute = () => {
                            resolve();
                        };
                        this.kbaseNode.querySelector(selectors.run).click();
                    });
                });

                it('responds to the run button being clicked', function () {
                    expect(this.appCellWidgetInstance.__fsm().getCurrentState().state).toEqual(
                        fsmState.EXECUTE_REQUESTED
                    );
                    expect(this.kbaseNode.querySelector(selectors.cancel)).not.toHaveClass(
                        'hidden'
                    );
                    expect(this.kbaseNode.querySelector(selectors.execMessage).textContent).toEqual(
                        stateMessages.EXECUTE_REQUESTED
                    );
                });

                it('responds to job launch', function () {
                    const runStatusArgs = {
                        event: 'launched_job',
                        cell_id: this.cell_id,
                        job_id: TEST_JOB,
                    };
                    const channelKeys = Array.from(Object.keys(this.bus.channels));
                    expect(this.kbaseNode.querySelector(selectors.execMessage).textContent).toEqual(
                        stateMessages.EXECUTE_REQUESTED
                    );
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
                        expect(this.kbaseNode.querySelector(selectors.cancel)).not.toHaveClass(
                            'hidden'
                        );
                        // expect the status tab to be available
                        expect(
                            this.kbaseNode.querySelector(
                                `.kb-rcp__tab-button[data-button="jobStatus"]`
                            )
                        ).not.toHaveClass('hidden');
                        expect(
                            this.kbaseNode.querySelector(selectors.execMessage).textContent
                        ).toEqual(stateMessages.PROCESSING_LAUNCHED);

                        // a channel should have been added to listen for job updates
                        expect(Object.keys(this.bus.channels).length).toBeGreaterThan(
                            channelKeys.length
                        );
                        expect(Object.keys(this.bus.channels)).toEqual(
                            jasmine.arrayContaining(channelKeys)
                        );
                        const busEmissions = filterClockTicks(this.bus.emit);
                        expect(busEmissions).toContain([
                            jcm.MESSAGE_TYPE.STATUS,
                            { [jcm.PARAM.JOB_ID]: TEST_JOB },
                        ]);
                    });
                });

                function runLaunchErrorTest(ctx) {
                    expect(ctx.kbaseNode.querySelector(selectors.execMessage).textContent).toEqual(
                        stateMessages.EXECUTE_REQUESTED
                    );
                    return new Promise((resolve) => {
                        spyOn(Narrative, 'saveNotebook').and.callFake(() => {
                            resolve();
                        });
                        TestUtil.send_RUN_STATUS(ctx);
                    }).then(() => {
                        // FSM state to { mode: 'error', stage: 'launching' }
                        expect(ctx.appCellWidgetInstance.__fsm().getCurrentState().state).toEqual(
                            fsmState.LAUNCH_ERROR
                        );
                        const exec = ctx.appCellWidgetInstance.model.getItem('exec');
                        expect(exec.launchState).toEqual({
                            ...ctx.runStatusArgs,
                            event_at: 1234567890,
                        });
                        // action button should be resetApp
                        expect(ctx.kbaseNode.querySelector(`${selectors.reset}`)).not.toHaveClass(
                            'hidden'
                        );
                        // expect the error tab to be visible
                        expect(
                            ctx.kbaseNode.querySelector(`.kb-rcp__tab-button[data-button="error"]`)
                        ).not.toHaveClass('hidden');
                        expect(
                            ctx.kbaseNode.querySelector(selectors.execMessage).textContent
                        ).toEqual(stateMessages.LAUNCH_ERROR);
                        // TODO when tabs use the `cellTabs` module:
                        // test error tab content
                    });
                }
                it('responds to launch errors', function () {
                    this.runStatusArgs = {
                        event: 'error',
                        cell_id: this.cell_id,
                        error_message: 'Something went terribly wrong',
                        error_code: 'throw new Error("ZOMG! NOOO!")',
                    };
                    runLaunchErrorTest(this);
                });

                it('responds to crazy messages', function () {
                    this.runStatusArgs = {
                        event: 'THE APOCALYPSE',
                        cell_id: this.cell_id,
                        when: 'Any day now',
                    };
                    runLaunchErrorTest(this);
                });
            });
        });

        describe('cancel and reset', () => {
            it('cancels a running job', async function () {
                cellStartUp(this);
                setUpCellInState(this, 'PROCESSING_RUNNING');
                spyOn(this.bus, 'emit');
                await startRunningCell(this);
                expect(this.appCellWidgetInstance.model.getItem('exec.jobState')).toEqual(
                    jobsById[JOB_NAMES.RUNNING]
                );

                // confirm the cancel/reset action
                spyOn(UI, 'showConfirmDialog').and.resolveTo(true);
                spyOn(
                    this.appCellWidgetInstance.jobManager.looper,
                    'clearRequest'
                ).and.callThrough();
                const cancelButton = this.kbaseNode.querySelector(selectors.cancel);
                await TestUtil.waitForElementChange(
                    this.kbaseNode.querySelector(selectors.execMessage),
                    () => {
                        cancelButton.click();
                    }
                );

                expect(this.bus.emit.calls.allArgs()).toEqual([
                    // start up status call
                    [jcm.MESSAGE_TYPE.STATUS, { [jcm.PARAM.JOB_ID]: JOB_NAMES.RUNNING }],
                    // cancel request
                    [jcm.MESSAGE_TYPE.CANCEL, { [jcm.PARAM.JOB_ID]: JOB_NAMES.RUNNING }],
                ]);
                // app state should have changed to 'CANCELING'
                expect(this.appCellWidgetInstance.__fsm().getCurrentState().state).toEqual(
                    fsmState.CANCELING
                );
                expect(this.kbaseNode.querySelector(selectors.execMessage).textContent).toContain(
                    stateMessages.CANCELING
                );

                const terminatedJob = jobsById[JOB_NAMES.TERMINATED_WHILST_RUNNING];
                // send a status update to show that the job has been cancelled,
                // then wait for the execMessage to change
                await TestUtil.waitForElementChange(
                    this.kbaseNode.querySelector(selectors.execMessage),
                    () => {
                        TestUtil.sendBusMessage({
                            bus: this.bus,
                            channelId: JOB_NAMES.RUNNING,
                            channelType: jcm.CHANNEL.JOB,
                            message: {
                                [JOB_NAMES.RUNNING]: {
                                    job_id: JOB_NAMES.RUNNING,
                                    jobState: {
                                        ...terminatedJob,
                                        job_id: JOB_NAMES.RUNNING,
                                    },
                                },
                            },
                            type: jcm.MESSAGE_TYPE.STATUS,
                        });
                    }
                );

                // app state should have changed to 'TERMINATED' and the exec line updated
                expect(this.appCellWidgetInstance.__fsm().getCurrentState().state).toEqual(
                    fsmState.TERMINATED
                );
                expect(this.kbaseNode.querySelector(selectors.execMessage).textContent).toContain(
                    terminatedJob.meta.createJobStatusLines.line
                );
                // there should not be anything scheduled
                expect(this.appCellWidgetInstance.jobManager.looper.requestLoop).toEqual(null);
                expect(
                    this.appCellWidgetInstance.jobManager.looper.clearRequest
                ).toHaveBeenCalledTimes(1);
            });

            // reset states
            ['LAUNCH_ERROR', 'TERMINATED', 'RUNTIME_ERROR', 'COMPLETED', 'INTERNAL_ERROR'].forEach(
                (state) => {
                    it(`resets a cell in state ${state}`, async function () {
                        cellStartUp(this);
                        setUpCellInState(this, state);
                        await startRunningCell(this);

                        const resetButton = this.kbaseNode.querySelector(`${selectors.reset}`);
                        const runButton = this.kbaseNode.querySelector(selectors.run);
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

                        expect(this.appCellWidgetInstance.model.getItem('exec')).toBeUndefined();
                        ['app', 'fatal', 'internal'].forEach((errType) => {
                            expect(
                                this.appCellWidgetInstance.model.getItem(`${errType}error`)
                            ).toBeUndefined();
                        });
                        expect(this.appCellWidgetInstance.__fsm().getCurrentState().state).toEqual(
                            fsmState.EDITING_COMPLETE
                        );
                        expect(
                            this.kbaseNode.querySelector(selectors.execMessage).textContent
                        ).toEqual(stateMessages.EDITING_COMPLETE);
                    });
                }
            );
        });

        describe('job status updates', () => {
            // ensure that the app cell goes from { mode: 'processing', stage: 'launched', }
            // to the appropriate state on receiving a job status message
            Object.keys(jobsById).forEach((jobId) => {
                if (!jobsById[jobId].batch_job) {
                    it(`processes a ${jobId} update`, async function () {
                        const jobState = jobsById[jobId];
                        cellStartUp(this);
                        setUpCellInState(this, 'PROCESSING_LAUNCHED');

                        // start up cell as if it just received the job launched message
                        this.cell.metadata.kbase.appCell.exec = {
                            jobState: { job_id: jobId },
                            launchState: { event: 'launched_job', job_id: jobId },
                        };

                        spyOn(this.bus, 'emit');

                        await startRunningCell(this);

                        // ensure that the app cell is in the correct state
                        expect(this.appCellWidgetInstance.__fsm().getCurrentState().state).toEqual(
                            fsmState.PROCESSING_LAUNCHED
                        );
                        expect(
                            this.kbaseNode.querySelector(selectors.execMessage).textContent
                        ).toEqual(stateMessages.PROCESSING_LAUNCHED);

                        // send a job status update; this will trigger an FSM mode change,
                        // which will enable the jobStatus tab
                        await TestUtil.waitForElementChange(
                            this.kbaseNode.querySelector('[data-button="jobStatus"]'),
                            () => {
                                // send a status update
                                TestUtil.send_STATUS({
                                    bus: this.bus,
                                    jobId,
                                    jobState,
                                });
                            }
                        );

                        // after processing
                        expect(this.appCellWidgetInstance.__fsm().getCurrentState().state).toEqual(
                            jobState.meta.appCellFsm
                        );
                        expect(this.appCellWidgetInstance.model.getItem('exec.jobState')).toEqual(
                            jobState
                        );

                        const busEmissions = filterClockTicks(this.bus.emit);
                        // the cell will emit at least one request for status updates when
                        // the cell starts up
                        expect(busEmissions[0]).toEqual([
                            jcm.MESSAGE_TYPE.STATUS,
                            { [jcm.PARAM.JOB_ID]: jobId },
                        ]);

                        // if the job state is terminal, expect the jobStatusLooper handler
                        // to have been removed
                        if (jobState.meta.terminal) {
                            expect(
                                this.appCellWidgetInstance.jobManager.handlers[
                                    jcm.MESSAGE_TYPE.STATUS
                                ].jobStatusLooper
                            ).not.toBeDefined();
                            expect(
                                this.appCellWidgetInstance.jobManager.looper.requestLoop
                            ).toBeNull();
                        } else {
                            // otherwise, it should still be in place and the request loop should be defined
                            expect(
                                this.appCellWidgetInstance.jobManager.handlers[
                                    jcm.MESSAGE_TYPE.STATUS
                                ].jobStatusLooper
                            ).toBeDefined();
                            expect(
                                this.appCellWidgetInstance.jobManager.looper.requestLoop
                            ).toBeDefined();
                        }
                        // expect the execMessage to be set to the job status summary
                        expect(
                            this.kbaseNode.querySelector(selectors.execMessage).textContent
                        ).toContain(
                            jobState.meta.createJobStatusLines.summary ||
                                jobState.meta.createJobStatusLines.line
                        );
                    });
                }
            });
        });
    });
});
