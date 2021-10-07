define([
    '/narrative/nbextensions/appCell2/appCell',
    'base/js/namespace',
    'common/semaphore',
    'testUtil',
    'narrativeMocks',
    'narrativeConfig',
    'json!/test/data/NarrativeTest.test_simple_inputs.spec.json',
], (AppCell, Jupyter, Semaphore, TestUtil, Mocks, Config, TestAppSpec) => {
    'use strict';

    describe('test the base AppCell2 module', () => {
        it('loads with expected functions', () => {
            ['make', 'isAppCell'].forEach((fn) => {
                expect(AppCell[fn]).toEqual(jasmine.any(Function));
            });
        });

        beforeEach(() => {
            const commSemaphore = Semaphore.make();
            commSemaphore.add('comm', false);
            commSemaphore.set('comm', 'ready');
            jasmine.Ajax.install();
            Jupyter.notebook = {
                writable: true
            };
            Jupyter.narrative = {
                readonly: false,
                getAuthToken: () => 'fakeToken'
            };
        });

        afterEach(() => {
            TestUtil.clearRuntime();
            jasmine.Ajax.uninstall();
        });

        describe('create AppCell tests', () => {
            beforeEach(() => {
                // mock NMS.get_method_spec,
                Mocks.mockJsonRpc1Call({
                    url: Config.url('narrative_method_store'),
                    body: /get_method_spec/,
                    response: [TestAppSpec]
                });

                // mock NMS.get_method_full_info,
                Mocks.mockJsonRpc1Call({
                    url: Config.url('narrative_method_store'),
                    body: /get_method_full_info/,
                    response: [Object.assign({}, TestAppSpec.info, {
                        description: 'test app',
                        suggestions: {
                            next_methods: [],
                            related_apps: [],
                            next_apps: [],
                            related_methods: []
                        },
                        screenshots: [],
                        publications: [],
                        namespace: 'NarrativeTest'
                    })]
                });

                // mock Catalog.get_exec_aggr_stats (not used here)
                Mocks.mockJsonRpc1Call({
                    url: Config.url('catalog'),
                    body: /get_exec_aggr_stats/,
                    response: [{}]
                });
            });

            it('makes an AppCell without starting it', () => {
                const fakeCell = Mocks.buildMockCell('code');
                const appCell = AppCell.make({ cell: fakeCell });
                ['setupCell', 'upgradeToAppCell'].forEach((fn) => {
                    expect(appCell[fn]).toEqual(jasmine.any(Function));
                });
            });

            it('makes a new AppCell from scratch', () => {
                const fakeCell = Mocks.buildMockCell('code');
                const appCell = AppCell.make({ cell: fakeCell });
                const appTag = 'release';
                const appType = 'app';


                return appCell.upgradeToAppCell(TestAppSpec, appTag, appType)
                    .then(() => {
                        expect(fakeCell.metadata.kbase.type).toEqual('app');
                        expect(fakeCell.metadata.kbase.appCell).toEqual(jasmine.any(Object));
                    });
            });

            it('restores an existing AppCell', () => {
                const fakeAppCell = Mocks.buildMockCell('code', 'app');
                fakeAppCell.metadata.kbase.appCell = {
                    app: {
                        id: TestAppSpec.info.id,
                        spec: TestAppSpec,
                        tag: 'dev',
                        version: '0.0.0'
                    },
                    executionStats: {}, // provided from Catalog, not needed for mock
                    fsm: {
                        currentState: {
                            mode: 'editing',
                            params: 'incomplete'
                        }
                    },
                    output: {
                        byJob: {}
                    },
                    params: {
                        simple_string: null
                    },
                    'user-settings': {
                        showCodeInputArea: false
                    }
                };
                const appCell = AppCell.make({ cell: fakeAppCell });
                return appCell.setupCell()
                    .then(() => {
                        expect(appCell).toBeDefined();
                    });
            });
        });

        describe('isAppCell tests', () => {
            const allowedCellTypes = ['app2', 'app', 'devapp'];
            allowedCellTypes.forEach((cellType) => {
                it(`returns true for a ${cellType} tagged cell`, () => {
                    const cell = {
                        cell_type: 'code',
                        metadata: {
                            kbase: {
                                type: cellType,
                            },
                        },
                    };
                    expect(AppCell.isAppCell(cell)).toBeTrue();
                });
            });

            const badCellCases = [
                {
                    cell: { cell_type: 'markdown' },
                    label: 'a markdown Jupyter type',
                },
                {
                    cell: { cell_type: 'code', metadata: {} },
                    label: 'no kbase metadata',
                },
                {
                    cell: { cell_type: 'code', metadata: { kbase: { type: 'foo' } } },
                    label: 'mismatched kbase type',
                },
            ];
            badCellCases.forEach((testCase) => {
                it(`returns false for a cell with ${testCase.label}`, () => {
                    expect(AppCell.isAppCell(testCase.cell)).toBeFalse();
                });
            });
        });
    });
});
