define([
    'base/js/namespace',
    'common/cellComponents/filePathWidget',
    'common/runtime',
    'common/props',
    'common/spec',
    // '/test/data/testAppObj',
    'json!/test/data/NarrativeTest.test_input_params.spec.json',
    'narrativeMocks',
], (Jupyter, FilePathWidget, Runtime, Props, Spec, /*TestAppObject*/ TestSpec, Mocks) => {
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

        beforeEach(function () {
            const bus = Runtime.make().bus();
            this.node = document.createElement('div');
            document.getElementsByTagName('body')[0].appendChild(this.node);

            // const model = Props.make({
            //     data: TestAppObject,
            //     onUpdate: () => {},
            // });

            this.spec = Spec.make({
                appSpec: TestSpec, //model.getItem('app.spec'),
            });

            this.parameters = this.spec.getSpec().parameters;

            const workspaceId = 54745;

            this.filePathWidgetInstance = FilePathWidget.make({
                bus: bus,
                workspaceId: workspaceId,
                initialParams: {
                    //model.getItem('params'),
                    actual_input_object: 'foo',
                    actual_output_object: 'bar',
                },
            });
        });

        afterEach(function () {
            document.body.innerHTML = '';
            window.kbaseRuntime = null;
            this.node.remove();
            this.node = null;
        });

        it('has a make function that returns an object', function () {
            expect(this.filePathWidgetInstance).not.toBe(null);
        });

        it('has the required methods', function () {
            ['bus', 'start', 'stop'].forEach((fn) => {
                expect(this.filePathWidgetInstance[fn]).toBeDefined();
            });
        });

        it('should start and render itself', function () {
            return this.filePathWidgetInstance
                .start({
                    node: this.node,
                    appSpec: this.spec,
                    parameters: this.parameters,
                })
                .then(() => {
                    return new Promise((resolve) => {
                        setTimeout(resolve, 4000);
                    });
                })
                .then(() => {
                    const contents = [
                        'File Paths',
                        'kb-file-path__table',
                        'kb-file-path__table_row',
                        'kb-file-path__file_number',
                        '1',
                        'actual_output_object', // 'fastq_rev_staging_file_name',
                        'fa fa-trash-o fa-lg',
                        'Add Row',
                    ];
                    contents.forEach((item) => {
                        expect(this.node.innerHTML).toContain(item);
                    });
                });
        });

        xit('should add a row when Add Row button is clicked', function () {
            return this.filePathWidgetInstance
                .start({
                    node: this.node,
                    appSpec: this.spec,
                    parameters: this.parameters,
                })
                .then(() => {
                    return new Promise((resolve) => {
                        setTimeout(resolve, 4000);
                    });
                })
                .then(() => {
                    const preClickNumberOfRows = this.node.querySelectorAll('tr').length;
                    expect(preClickNumberOfRows).toEqual(1);
                    this.node.querySelector('.kb-file-path__button--add_row').click();
                    const postClickNumberOfRows = this.node.querySelectorAll('tr').length;
                    expect(postClickNumberOfRows).toEqual(2);
                });
        });

        xit('should delete a row when trashcan button is clicked', function () {
            return this.filePathWidgetInstance
                .start({
                    node: this.node,
                    appSpec: this.spec,
                    parameters: this.parameters,
                })
                .then(() => {
                    return new Promise((resolve) => {
                        setTimeout(resolve, 4000);
                    });
                })
                .then(() => {
                    const preClickNumberOfRows = this.node.querySelectorAll('tr').length;
                    expect(preClickNumberOfRows).toEqual(1);
                    this.node.querySelector('.kb-file-path__button--delete').click();
                    const postClickNumberOfRows = this.node.querySelectorAll('tr').length;
                    expect(postClickNumberOfRows).toEqual(0);
                });
        });
    });
});
