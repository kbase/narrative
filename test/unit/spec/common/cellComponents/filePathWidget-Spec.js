/*global beforeEach */
/*global define*/ // eslint-disable-line no-redeclare
/*global describe, expect, it*/
/*global beforeAll, afterAll*/
/*jslint white: true*/

define([
    'common/cellComponents/filePathWidget',
    'jquery',
    'common/runtime',
    'common/props',
    'common/spec',
    'json!../../../../data/testAppObj.json',
], function(
    FilePathWidget,
    $,
    Runtime,
    Props,
    Spec,
    TestAppObject
) {
    'use strict';

    describe('The file path widget module', function() {
        it('loads', function() {
            expect(FilePathWidget).not.toBe(null);
        });

        it('has expected functions', function() {
            expect(FilePathWidget.make).toBeDefined();
        });

    });

    describe('The file path widget instance', function() {
        beforeAll(() => {
            Jupyter.narrative = {
                getAuthToken: () => 'fakeToken',
            };
        });

        afterAll(() => {
            Jupyter.narrative = null;
        });

        let filePathWidget, node, spec, parameters;

        beforeEach(function () {
            const bus = Runtime.make().bus();
            node = document.createElement('div');
            document.getElementsByTagName('body')[0].appendChild(node);

            const model = Props.make({
                data: TestAppObject,
                onUpdate: (props) => {},
            });

            spec = Spec.make({
                appSpec: model.getItem('app.spec'),
            });

            parameters = spec.getSpec().parameters;

            const workspaceId = 54745;

            filePathWidget = FilePathWidget.make({
                bus: bus,
                workspaceId: workspaceId,
                initialParams: model.getItem('params'),
            });
        });

        afterEach(() => {
            $('body').empty();
        });

        it('has a factory which can be invoked', function() {
            expect(filePathWidget).not.toBe(null);
        });

        it('has the required methods', function() {
            expect(filePathWidget.start).toBeDefined();
            expect(filePathWidget.stop).toBeDefined();
            expect(filePathWidget.bus).toBeDefined();
        });

        it('should start and render itself', () => {
            return filePathWidget.start({
                node: node,
                appSpec: spec,
                parameters: parameters,
            }).then(() => {
                expect(node.innerHTML).toContain('File Paths');
                expect(node.innerHTML).toContain('kb-file-path__table');
                expect(node.innerHTML).toContain('kb-file-path__table_row');
                expect(node.innerHTML).toContain('kb-file-path__file_number');
                expect(node.innerHTML).toContain('1');
                expect(node.innerHTML).toContain('fastq_rev_staging_file_name');
                expect(node.innerHTML).toContain('sra_staging_file_name');
                expect(node.innerHTML).toContain('fa fa-trash-o fa-lg');
                expect(node.innerHTML).toContain('Add Row');
            });
        });

        it('should add a row when Add Row button is clicked', () => {
            return filePathWidget.start({
                node: node,
                appSpec: spec,
                parameters: parameters,
            }).then(() => {
                let preClickNumberOfRows = $('tr').length;
                expect(preClickNumberOfRows).toEqual(1);
                console.log($(node).find('.kb-file-path__button--add_row btn btn__text'));
                $(node).find('.kb-file-path__button--add_row btn btn__text').click();
                let postClickNumberOfRows = $('tr').length;
                expect(postClickNumberOfRows).toEqual(2);
            });
        });

        it('should delete a row when trashcan button is clicked', () => {
            return filePathWidget.start({
                node: node,
                appSpec: spec,
                parameters: parameters,
            }).then(() => {
                let preClickNumberOfRows = $('tr').length;
                expect(preClickNumberOfRows).toEqual(1);
                $('.btn btn__text').click();
                let postClickNumberOfRows = $('tr').length;
                expect(postClickNumberOfRows).toEqual(0);
            });
        });

    });
});
