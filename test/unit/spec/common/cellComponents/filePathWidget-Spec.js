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
        beforeAll(() => {
            window.kbaseRuntime = null;
            Jupyter.narrative = {
                getAuthToken: () => 'fakeToken',
            };
        });

        afterAll(() => {
            Jupyter.narrative = null;
        });

        beforeEach(() => {
            const bus = Runtime.make().bus();
            this.node = document.createElement('div');
            document.getElementsByTagName('body')[0].appendChild(this.node);

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
            document.body.innerHTML = '';
            window.kbaseRuntime = null;
        });

        it('has a make function that returns an object with expected methods', () => {
            const filePathWidgetInstance = FilePathWidget.make(this.filePathWidgetParams);
            expect(filePathWidgetInstance).not.toBe(null);
            ['bus', 'start', 'stop'].forEach((fn) => {
                expect(filePathWidgetInstance[fn]).toBeDefined();
            });
        });

        xit('should start and render itself', () => {
            const filePathWidgetInstance = FilePathWidget.make(this.filePathWidgetParams);
            return filePathWidgetInstance
                .start({
                    node: this.node,
                    appSpec: this.spec,
                    parameters: this.parameters,
                })
                .then(() => {
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
                        expect(this.node.innerHTML).toContain(item);
                    });
                });
        });

        it('should add a row when Add Row button is clicked', () => {
            const filePathWidgetInstance = FilePathWidget.make(this.filePathWidgetParams);
            return filePathWidgetInstance
                .start({
                    node: this.node,
                    appSpec: this.spec,
                    parameters: this.parameters,
                })
                .then(() => {
                    const preClickNumberOfRows = $(this.node).find('tr').length;
                    expect(preClickNumberOfRows).toEqual(1);
                    $(this.node).find('.kb-file-path__button--add_row').click();
                    const postClickNumberOfRows = $(this.node).find('tr').length;
                    expect(postClickNumberOfRows).toEqual(2);
                });
        });

        xit('should delete a row when trashcan button is clicked', () => {
            const filePathWidgetInstance = FilePathWidget.make(this.filePathWidgetParams);
            return filePathWidgetInstance
                .start({
                    node: this.node,
                    appSpec: this.spec,
                    parameters: this.parameters,
                })
                .then(() => {
                    const preClickNumberOfRows = $(this.node).find('tr').length;
                    expect(preClickNumberOfRows).toEqual(1);
                    $(this.node).find('.kb-file-path__button--delete').click();
                    const postClickNumberOfRows = $(this.node).find('tr').length;
                    expect(postClickNumberOfRows).toEqual(0);
                });
        });
    });
});
