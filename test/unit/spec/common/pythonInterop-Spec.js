/*global define,describe,it,expect*/
/*jslint white:true,browser:true*/
define([
    'common/pythonInterop'
], function(PythonInterop) {
    'use strict';

    describe('Props core functions', function() {
        it('Is alive', function() {
            var alive;
            if (PythonInterop) {
                alive = true;
            } else {
                alive = false;
            }
            expect(alive).toBeTruthy();
        });
        it('Pythonify an undefined value fails properly', function () {
            // expect(PythonInterop.pythonifyValue).toThrow();
            var foo;
            expect(function() { PythonInterop.pythonifyValue(foo); }).toThrow(new Error('Unsupported parameter type undefined'));
        });
        it('Pythonify a boolean value', function () {
            expect(PythonInterop.pythonifyValue(true)).toEqual('True');
            expect(PythonInterop.pythonifyValue(false)).toEqual('False');
        });
        it('Pythonify a null value', function() {
            var jsValue = null,
                pyValue = 'None';

            expect(PythonInterop.pythonifyValue(jsValue)).toEqual(pyValue);
        });

        it('Pythonify an integer value', function() {
            var jsValue = 1,
                pyValue = '1';

            expect(PythonInterop.pythonifyValue(jsValue)).toEqual(pyValue);
        });
        it('Pythonify a float value', function() {
            var jsValue = 1.1,
                pyValue = '1.1';

            expect(PythonInterop.pythonifyValue(jsValue)).toEqual(pyValue);
        });
        it('Pythonify an string value', function() {
            var jsValue = 'one',
                pyValue = '"one"';

            expect(PythonInterop.pythonifyValue(jsValue)).toEqual(pyValue);
        });
        it('Pythonify a quoted string', function () {
            var jsValue = 'a "quoted" string',
                pyValue = '"a \\"quoted\\" string"';
            expect(PythonInterop.pythonifyValue(jsValue)).toEqual(pyValue);
        });
        it('Pythonify an array of ints value', function() {
            var jsValue = [1,2,3],
                pyValue = '[1, 2, 3]';

            expect(PythonInterop.pythonifyValue(jsValue)).toEqual(pyValue);
        });
        it('Pythonify an array of floats value', function() {
            var jsValue = [1.2, 2.3, 3.4],
                pyValue = '[1.2, 2.3, 3.4]';

            expect(PythonInterop.pythonifyValue(jsValue)).toEqual(pyValue);
        });
        it('Pythonify an array of ints value', function() {
            var jsValue = ['one', 'two', 'three'],
                pyValue = '["one", "two", "three"]';

            expect(PythonInterop.pythonifyValue(jsValue)).toEqual(pyValue);
        });
        it('Pythonify a map of ints', function() {
            var jsValue = {one: 1, two: 2, three: 3},
                pyValue = '{\n    "one": 1,\n    "two": 2,\n    "three": 3\n}',
                actual = PythonInterop.pythonifyValue(jsValue);

            expect(actual).toEqual(pyValue);
        });
        it('Pythonify a map of floats', function() {
            var jsValue = {one: 1.2, two: 2.3, three: 3.4},
                pyValue = '{\n    "one": 1.2,\n    "two": 2.3,\n    "three": 3.4\n}';

            expect(PythonInterop.pythonifyValue(jsValue)).toEqual(pyValue);
        });
        it('Pythonify a map of strings', function() {
            var jsValue = {one: 'one', two: 'two', three: 'three'},
                pyValue = '{\n    "one": "one",\n    "two": "two",\n    "three": "three"\n}';

            expect(PythonInterop.pythonifyValue(jsValue)).toEqual(pyValue);
        });
        it('Pythonify an array of arrays', function() {
            var jsValue = [[1,2,3],['a', 'b', 'c'], [5.4, 4.3, 3.2]],
                pyValue = '[[1, 2, 3], ["a", "b", "c"], [5.4, 4.3, 3.2]]';

            expect(PythonInterop.pythonifyValue(jsValue)).toEqual(pyValue);
        });
        it('Pythonify an array of maps', function() {
            var jsValue = [{one: 1, two: 2, three: 3},{one: 1.2, two: 2.3, three: 3.4}, {one: 'one', two: 'two', three: 'three'}],
                pyValue = '[{\n    "one": 1,\n    "two": 2,\n    "three": 3\n}, {\n    "one": 1.2,\n    "two": 2.3,\n    "three": 3.4\n}, {\n    "one": "one",\n    "two": "two",\n    "three": "three"\n}]';

            expect(PythonInterop.pythonifyValue(jsValue)).toEqual(pyValue);
        });
        it('Build output works', function () {
            var inputs = {
                    arg1: 1,
                    arg2: 2,
                    arg3: 3
                },
                code = 'from biokbase.narrative.widgetmanager import WidgetManager\n' +
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
            expect(PythonInterop.buildOutputRunner('widget', 'tag', 'my_cell_id', inputs)).toEqual(code);
        });
        it('Build app runner works', function () {
            var cellId = 'my_cell_id',
                runId = 'my_run_id',
                app = {
                    id: 'MyModule/my_app',
                    version: 'app_version',
                    tag: 'tag'
                },
                params = {
                    arg1: 1,
                    arg2: 'two',
                    arg3: ['t', 'h', 'r', 'e', 'e'],
                    arg4: {
                        four: 4
                    }
                },
                code = 'from biokbase.narrative.jobs.appmanager import AppManager\n' +
                       'AppManager().run_app(\n' +
                       '    "MyModule/my_app",\n' +
                       '    {\n' +
                       '        "arg1": 1,\n' +
                       '        "arg2": "two",\n' +
                       '        "arg3": ["t", "h", "r", "e", "e"],\n' +
                       '        "arg4": {\n' + 
                       '            "four": 4\n' +
                       '        }\n'+
                       '    },\n' +
                       '    tag="tag",\n' +
                       '    version="app_version",\n' +
                       '    cell_id="my_cell_id",\n' +
                       '    run_id="my_run_id"\n' +
                       ')';
            expect(PythonInterop.buildAppRunner(cellId, runId, app, params)).toEqual(code);
        });
        it('Build app runner works for a batch', function () {
            var cellId = 'my_cell_id',
                runId = 'my_run_id',
                app = {
                    id: 'MyModule/my_app',
                    version: 'app_version',
                    tag: 'tag'
                },
                params = [{
                    arg1: 1,
                    arg2: 'two'
                },{
                    arg3: ['t', 'h', 'r', 'e', 'e'],
                    arg4: {
                        four: 4
                    }
                }],
                code = 'from biokbase.narrative.jobs.appmanager import AppManager\n' +
                       'AppManager().run_app_batch(\n' +
                       '    "MyModule/my_app",\n' +
                       '    [{\n' +
                       '        "arg1": 1,\n' +
                       '        "arg2": "two"\n' +
                       '    }, {\n' +
                       '        "arg3": ["t", "h", "r", "e", "e"],\n' +
                       '        "arg4": {\n' + 
                       '            "four": 4\n' +
                       '        }\n'+
                       '    }],\n' +
                       '    tag="tag",\n' +
                       '    version="app_version",\n' +
                       '    cell_id="my_cell_id",\n' +
                       '    run_id="my_run_id"\n' +
                       ')';
            expect(PythonInterop.buildAppRunner(cellId, runId, app, params)).toEqual(code);
        });
    });

});
