define(['common/pythonInterop', 'testUtil'], (PythonInterop, TestUtil) => {
    'use strict';

    afterAll(() => TestUtil.clearRuntime());

    describe('Python interoperation core functions', () => {
        it('loads the core functions', () => {
            expect(PythonInterop).toBeDefined();
            [
                'objectToNamedArgs',
                'pythonifyValue',
                'buildAppRunner',
                'buildBatchAppRunner',
                'buildEditorRunner',
                'buildViewRunner',
                'buildAdvancedViewRunner',
                'buildOutputRunner',
                'buildCustomWidgetRunner',
                'buildDataWidgetRunner',
                'buildBulkAppRunner',
            ].forEach((fn) => {
                expect(PythonInterop[fn]).toEqual(jasmine.any(Function));
            });
        });

        it('Pythonify an undefined value fails properly', () => {
            let foo;
            expect(() => {
                PythonInterop.pythonifyValue(foo);
            }).toThrow(new Error('Unsupported parameter type undefined'));
        });

        /* these are all 3-tuples:
         * label (for the test label)
         * input value
         * expected output value
         */
        const pythonifyValueCases = [
            ['a boolean', true, 'True'],
            ['a boolean', false, 'False'],
            ['a null', null, 'None'],
            ['an integer', 1, '1'],
            ['a float', 1.1, '1.1'],
            ['a string', 'one', '"one"'],
            ['a quoted string', 'a "quoted" string', '"a \\"quoted\\" string"'],
            ['an array of ints', [1, 2, 3], '[1, 2, 3]'],
            ['an array of floats', [1.2, 2.3, 3.4], '[1.2, 2.3, 3.4]'],
            ['an array of strings', ['one', 'two', 'three'], '["one", "two", "three"]'],
            [
                'a map of ints',
                { one: 1, two: 2, three: 3 },
                '{\n    "one": 1,\n    "two": 2,\n    "three": 3\n}',
            ],
            [
                'a map of floats',
                { one: 1.2, two: 2.3, three: 3.4 },
                '{\n    "one": 1.2,\n    "two": 2.3,\n    "three": 3.4\n}',
            ],
            [
                'a map of strings',
                { one: 'one', two: 'two', three: 'three' },
                '{\n    "one": "one",\n    "two": "two",\n    "three": "three"\n}',
            ],
            [
                'an array of arrays',
                [
                    [1, 2, 3],
                    ['a', 'b', 'c'],
                    [5.4, 4.3, 3.2],
                ],
                '[[1, 2, 3], ["a", "b", "c"], [5.4, 4.3, 3.2]]',
            ],
            [
                'an array of maps',
                [
                    { one: 1, two: 2, three: 3 },
                    { one: 1.2, two: 2.3, three: 3.4 },
                    { one: 'one', two: 'two', three: 'three' },
                ],
                '[{\n    "one": 1,\n    "two": 2,\n    "three": 3\n}, {\n    "one": 1.2,\n    "two": 2.3,\n    "three": 3.4\n}, {\n    "one": "one",\n    "two": "two",\n    "three": "three"\n}]',
            ],
        ];
        pythonifyValueCases.forEach((testCase) => {
            const [label, input, expected] = testCase;
            it(`Pythonify ${label}`, () => {
                expect(PythonInterop.pythonifyValue(input)).toEqual(expected);
            });
        });

        it('Build output works', () => {
            const inputs = {
                    arg1: 1,
                    arg2: 2,
                    arg3: 3,
                },
                code =
                    'from biokbase.narrative.widgetmanager import WidgetManager\n' +
                    'WidgetManager().show_output_widget(\n' +
                    '    "widget",\n' +
                    '    {\n' +
                    '        "arg1": 1,\n' +
                    '        "arg2": 2,\n' +
                    '        "arg3": 3\n' +
                    '    },\n' +
                    '    tag="tag",\n' +
                    '    cell_id="my_cell_id"\n' +
                    ')';
            expect(PythonInterop.buildOutputRunner('widget', 'tag', 'my_cell_id', inputs)).toEqual(
                code
            );
        });

        it('Build app runner works', () => {
            const cellId = 'my_cell_id',
                runId = 'my_run_id',
                app = {
                    id: 'MyModule/my_app',
                    version: 'app_version',
                    tag: 'tag',
                },
                params = {
                    arg1: 1,
                    arg2: 'two',
                    arg3: ['t', 'h', 'r', 'e', 'e'],
                    arg4: {
                        four: 4,
                    },
                },
                code =
                    'from biokbase.narrative.jobs.appmanager import AppManager\n' +
                    'AppManager().run_app(\n' +
                    '    "MyModule/my_app",\n' +
                    '    {\n' +
                    '        "arg1": 1,\n' +
                    '        "arg2": "two",\n' +
                    '        "arg3": ["t", "h", "r", "e", "e"],\n' +
                    '        "arg4": {\n' +
                    '            "four": 4\n' +
                    '        }\n' +
                    '    },\n' +
                    '    tag="tag",\n' +
                    '    version="app_version",\n' +
                    '    cell_id="my_cell_id",\n' +
                    '    run_id="my_run_id"\n' +
                    ')';
            expect(PythonInterop.buildAppRunner(cellId, runId, app, params)).toEqual(code);
        });

        it('Build app runner works for a batch', () => {
            const cellId = 'my_cell_id',
                runId = 'my_run_id',
                app = {
                    id: 'MyModule/my_app',
                    version: 'app_version',
                    tag: 'tag',
                },
                params = [
                    {
                        arg1: 1,
                        arg2: 'two',
                    },
                    {
                        arg3: ['t', 'h', 'r', 'e', 'e'],
                        arg4: {
                            four: 4,
                        },
                    },
                ],
                code =
                    'from biokbase.narrative.jobs.appmanager import AppManager\n' +
                    'AppManager().run_app_batch(\n' +
                    '    "MyModule/my_app",\n' +
                    '    [{\n' +
                    '        "arg1": 1,\n' +
                    '        "arg2": "two"\n' +
                    '    }, {\n' +
                    '        "arg3": ["t", "h", "r", "e", "e"],\n' +
                    '        "arg4": {\n' +
                    '            "four": 4\n' +
                    '        }\n' +
                    '    }],\n' +
                    '    tag="tag",\n' +
                    '    version="app_version",\n' +
                    '    cell_id="my_cell_id",\n' +
                    '    run_id="my_run_id"\n' +
                    ')';
            expect(PythonInterop.buildAppRunner(cellId, runId, app, params)).toEqual(code);
        });

        it('Builds bulk app runner', () => {
            const cellId = 'some_cell',
                runId = 'some_app_run',
                appInfo = [
                    {
                        app_id: 'some_module/some_app',
                        tag: 'release',
                        version: '1.0.0',
                        params: [
                            {
                                p1: 'v1',
                                p2: 'v2',
                            },
                            {
                                p1: 'v3',
                                p2: 'v4',
                            },
                        ],
                    },
                    {
                        app_id: 'some_other_module/some_other_app',
                        tag: 'release',
                        version: '1.1.1',
                        params: [
                            {
                                p3: 'v5',
                                p4: 'v6',
                            },
                        ],
                    },
                ],
                expectedCode = [
                    'from biokbase.narrative.jobs.appmanager import AppManager',
                    'AppManager().run_app_bulk(',
                    '    [{',
                    '        "app_id": "some_module/some_app",',
                    '        "tag": "release",',
                    '        "version": "1.0.0",',
                    '        "params": [{',
                    '            "p1": "v1",',
                    '            "p2": "v2"',
                    '        }, {',
                    '            "p1": "v3",',
                    '            "p2": "v4"',
                    '        }]',
                    '    }, {',
                    '        "app_id": "some_other_module/some_other_app",',
                    '        "tag": "release",',
                    '        "version": "1.1.1",',
                    '        "params": [{',
                    '            "p3": "v5",',
                    '            "p4": "v6"',
                    '        }]',
                    '    }],',
                    `    cell_id="${cellId}",`,
                    `    run_id="${runId}"`,
                    ')',
                ].join('\n');
            expect(PythonInterop.buildBulkAppRunner(cellId, runId, appInfo)).toEqual(expectedCode);
        });
    });
});
