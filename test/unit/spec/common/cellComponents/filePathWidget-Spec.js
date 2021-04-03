define([
    'base/js/namespace',
    'common/cellComponents/filePathWidget',
    'jquery',
    'common/runtime',
    'common/spec',
    'json!/test/data/NarrativeTest.test_input_params.spec.json',
], (Jupyter, FilePathWidget, $, Runtime, Spec, TestSpec) => {
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
        let container;
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
            container = document.createElement('div');
            this.node = document.createElement('div');
            container.appendChild(this.node);

            this.spec = Spec.make({
                appSpec: TestSpec,
            });

            this.parameters = this.spec.getSpec().parameters;

            const workspaceId = 54745;
            this.filePathWidgetInstance = FilePathWidget.make({
                bus: bus,
                workspaceId: workspaceId,
                initialParams: [{
                    actual_input_object: 'foo',
                    actual_output_object: 'bar',
                }],
                paramIds: ['actual_input_object', 'actual_output_object'],
            });
        });

        afterEach(() => {
            container.remove();
            window.kbaseRuntime = null;
        });

        it('has a make function that returns an object', function () {
            expect(this.filePathWidgetInstance).not.toBeNull();
            expect(this.filePathWidgetInstance).toEqual(jasmine.any(Object));
        });

        it('has the required methods', function () {
            ['bus', 'start', 'stop'].forEach((fn) => {
                expect(this.filePathWidgetInstance[fn]).toBeDefined();
            });
        });

        xdescribe('the started widget', () => {
            beforeEach(async function () {
                await this.filePathWidgetInstance.start({
                    node: this.node,
                    appSpec: this.spec,
                    parameters: this.parameters,
                });
            });

            afterEach(async function () {
                await this.filePathWidgetInstance.stop();
            });

            it('should start and render itself', function () {
                const jasmineContext = this;
                const contents = [
                    'File Paths',
                    'kb-file-path__table',
                    'kb-file-path__table_row',
                    'kb-file-path__file_number',
                    '1',
                    'actual_output_object',
                    'fa fa-trash-o fa-lg',
                    'Add Row',
                ];
                contents.forEach((item) => {
                    expect(jasmineContext.node.innerHTML).toContain(item);
                });
            });

            it('should add a row when Add Row button is clicked', function () {
                const $node = $(this.node);
                const preClickNumberOfRows = $node.find('tr').length;
                expect(preClickNumberOfRows).toEqual(1);
                $node.find('.kb-file-path__button--add_row').click();
                setTimeout(() => {
                    const postClickNumberOfRows = $node.find('tr').length;
                    expect(postClickNumberOfRows).toEqual(2);
                }, 1000);
            });

            it('should delete a row when trashcan button is clicked', function () {
                const $node = $(this.node);
                const preClickNumberOfRows = $node.find('tr').length;
                expect(preClickNumberOfRows).toEqual(1);
                $node.find('.kb-file-path__button--delete').click();
                setTimeout(() => {
                    const postClickNumberOfRows = $node.find('tr').length;
                    expect(postClickNumberOfRows).toEqual(0);
                }, 1000);
            });
        });
    });
});
