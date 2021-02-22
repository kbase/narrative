/* eslint-disable prefer-arrow-callback */
define([
    'base/js/namespace',
    'common/cellComponents/filePathWidget',
    'jquery',
    'common/runtime',
    'common/props',
    'common/spec',
    '/test/data/testAppObj',
], (Jupyter, FilePathWidget, $, Runtime, Props, Spec, TestAppObject) => {
    'use strict';

    describe('The file path widget module', () => {
        it('loads', () => {
            expect(FilePathWidget).not.toBe(null);
        });

        it('has expected functions', () => {
            expect(FilePathWidget.make).toBeDefined();
        });
    });

    describe('The file path widget instance', () => {

        beforeEach(function () {
            window.kbaseRuntime = null;
            Jupyter.narrative = {
                getAuthToken: () => 'fakeToken',
            };
            const bus = Runtime.make().bus();
            const model = Props.make({
                data: TestAppObject,
                onUpdate: () => {},
            });

            this.spec = Spec.make({
                appSpec: model.getItem('app.spec'),
            });

            this.parameters = this.spec.getSpec().parameters;

            const workspaceId = 54745;
            this.filePathWidgetParams = {
                bus,
                workspaceId,
                initialParams: model.getItem('params')
            };
        });

        afterEach(() => {
            Jupyter.narrative = null;
            window.kbaseRuntime = null;
        });

        it('has a make function that returns an object', function () {
            const fpw = FilePathWidget.make(this.filePathWidgetParams);
            expect(fpw).not.toBe(null);
            expect(fpw).toEqual(jasmine.any(Object));
        });

        it('has the required methods', function () {
            const fpw = FilePathWidget.make(this.filePathWidgetParams);
            ['bus', 'start', 'stop'].forEach((fn) => {
                expect(fpw[fn]).toBeDefined();
            });
        });

        describe('should start', () => {
            beforeEach(async function () {
                this.node = document.createElement('div');
                document.getElementsByTagName('body')[0].appendChild(this.node);
                this.fpwStartParams = {
                    node: this.node,
                    appSpec: this.spec,
                    parameters: this.parameters
                };
                this.filePathWidget = FilePathWidget.make(this.filePathWidgetParams);
                await this.filePathWidget.start(this.fpwStartParams);
            });

            afterEach(function() {
                document.body.innerHTML = '';
            });

            it('should render itself', function () {
                // const fpw =
                const innerHTML = this.node.innerHTML;
                const contents = [
                    'File Paths',
                    'kb-file-path__table',
                    'kb-file-path__table_row',
                    'kb-file-path__file_number',
                    '1',
                    'fastq_rev_staging_file_name',
                    'fa fa-trash-o fa-lg',
                    'Add Row',
                ];
                contents.forEach((item) => {
                    expect(innerHTML).toContain(item);
                });
            });

            it('should add a row when Add Row button is clicked', function (done) {
                // const fpw = FilePathWidget.make(this.filePathWidgetParams);
                // await fpw.start(this.fpwStartParams)
                const preClickNumberOfRows = $(this.node).find('tr').length;
                expect(preClickNumberOfRows).toEqual(1);
                $(this.node).find('.kb-file-path__button--add_row').click();
                setTimeout(() => {
                    const postClickNumberOfRows = $(this.node).find('tr').length;
                    expect(postClickNumberOfRows).toEqual(2);
                    done();
                }, 500);
            });

            it('should delete a row when trashcan button is clicked', function (done) {
                // const fpw = FilePathWidget.make(this.filePathWidgetParams);
                // await fpw.start(this.fpwStartParams)
                const preClickNumberOfRows = $(this.node).find('tr').length;
                expect(preClickNumberOfRows).toEqual(1);
                $(this.node).find('.kb-file-path__button--delete').click();
                setTimeout(() => {
                    const postClickNumberOfRows = $(this.node).find('tr').length;
                    expect(postClickNumberOfRows).toEqual(0);
                    done();
                }, 500);
            });
        });
    });
});
