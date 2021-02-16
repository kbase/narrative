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
            Jupyter.narrative = {
                getAuthToken: () => 'fakeToken',
            };
        });

        afterAll(() => {
            Jupyter.narrative = null;
        });

        let filePathWidgetInstance, node, spec, parameters;

        beforeEach(() => {
            const bus = Runtime.make().bus();
            node = document.createElement('div');
            document.getElementsByTagName('body')[0].appendChild(node);

            const model = Props.make({
                data: TestAppObject,
                onUpdate: () => {},
            });

            spec = Spec.make({
                appSpec: model.getItem('app.spec'),
            });

            parameters = spec.getSpec().parameters;

            const workspaceId = 54745;

            filePathWidgetInstance = FilePathWidget.make({
                bus: bus,
                workspaceId: workspaceId,
                initialParams: model.getItem('params'),
            });
        });

        afterEach(() => {
            $('body').empty();
            filePathWidgetInstance = null;
            node = null;
            window.kbaseRuntime = null;
        });

        it('has a make function that returns an object', () => {
            expect(filePathWidgetInstance).not.toBe(null);
        });

        it('has the required methods', () => {
            ['bus', 'start', 'stop'].forEach((fn) => {
                expect(filePathWidgetInstance[fn]).toBeDefined();
                expect(filePathWidgetInstance[fn]).toEqual(jasmine.any(Function));
            });
        });

        it('should start and render itself', () => {
            return filePathWidgetInstance
                .start({
                    node: node,
                    appSpec: spec,
                    parameters: parameters,
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
                        expect(node.innerHTML).toContain(item);
                    });
                });
        });

        it('should add a row when Add Row button is clicked', () => {
            return filePathWidgetInstance
                .start({
                    node: node,
                    appSpec: spec,
                    parameters: parameters,
                })
                .then(() => {
                    const preClickNumberOfRows = $(node).find('tr').length;
                    expect(preClickNumberOfRows).toEqual(1);
                    $(node).find('.kb-file-path__button--add_row').click();
                    const postClickNumberOfRows = $(node).find('tr').length;
                    expect(postClickNumberOfRows).toEqual(2);
                });
        });

        it('should delete a row when trashcan button is clicked', () => {
            return filePathWidgetInstance
                .start({
                    node: node,
                    appSpec: spec,
                    parameters: parameters,
                })
                .then(() => {
                    const preClickNumberOfRows = $(node).find('tr').length;
                    expect(preClickNumberOfRows).toEqual(1);
                    $(node).find('.kb-file-path__button--delete').click();
                    const postClickNumberOfRows = $(node).find('tr').length;
                    expect(postClickNumberOfRows).toEqual(0);
                });
        });
    });
});
