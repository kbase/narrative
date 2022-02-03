define([
    '/narrative/nbextensions/appCell2/widgets/appCellWidget',
    'common/runtime',
    'common/semaphore',
    'testUtil',
    'narrativeMocks',
    'base/js/namespace',
    'uuid',
], (AppCellWidget, Runtime, Semaphore, TestUtil, Mocks, Jupyter, UUID) => {
    'use strict';

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

    // Can only test the public functions...
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
            this.cell.code_mirror = {
                options: { readOnly: false },
                setOption: function (p, v) {
                    this.options[p] = v;
                },
                refresh: () => {},
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
                });
            });

            it('Can be instantiated', function () {
                expect(this.appCellWidgetInstance).not.toBe(null);
            });

            it('Has expected functions when instantiated', function () {
                ['init', 'attach', 'start', 'stop', 'detach'].forEach((fn) => {
                    expect(this.appCellWidgetInstance[fn]).toBeDefined();
                });
            });
        });

        describe('init method', () => {
            it('has a method "init" which sets up the code area and FSM', function () {
                this.appCellWidgetInstance = AppCellWidget.make({
                    bus: Runtime.make().bus(),
                    cell: this.cell,
                    devMode: true,
                });
                expect(this.appCellWidgetInstance.__fsm()).toBeUndefined();
                return this.appCellWidgetInstance.init().then(() => {
                    expect(this.appCellWidgetInstance.__fsm()).toEqual(jasmine.any(Object));
                    expect(this.appCellWidgetInstance.__fsm().getCurrentState().state).toEqual({
                        mode: 'new',
                    });
                });
            });

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
                    });
                    expect(this.appCellWidgetInstance.__fsm()).toBeUndefined();
                    return this.appCellWidgetInstance.init().then((initReturn) => {
                        expect(initReturn).toBeNull();
                        expect(this.appCellWidgetInstance.model).toBeDefined();
                        expect(this.appCellWidgetInstance.__fsm()).toEqual(jasmine.any(Object));
                        expect(this.appCellWidgetInstance.__fsm().getCurrentState().state).toEqual({
                            mode: 'new',
                        });
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
                expect(this.appCellWidgetInstance.__fsm().getCurrentState().state).toEqual({
                    mode: 'new',
                });
            });

            it('runs', async function () {
                await this.appCellWidgetInstance.init();
                await this.appCellWidgetInstance.attach(this.kbaseNode);
                await this.appCellWidgetInstance.start();
                // checks the app spec is valid
                await this.appCellWidgetInstance.run();

                // app spec should have been checked
                // FSM should have changed state
                expect(this.appCellWidgetInstance.__fsm().getCurrentState().state).not.toEqual({
                    mode: 'new',
                });
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
                cellStartUp(this);
                await this.appCellWidgetInstance.init();
                await this.appCellWidgetInstance.attach(this.kbaseNode);
                await this.appCellWidgetInstance.start();
                await this.appCellWidgetInstance.run();
            });

            it('stops, removing event listeners', async function () {
                expect(this.appCellWidgetInstance.__fsm().getCurrentState().state).not.toEqual({
                    mode: 'new',
                });
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
    });
});
