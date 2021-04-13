define([
    'base/js/namespace',
    'common/cellComponents/filePathWidget',
    'jquery',
    'common/runtime',
    'common/spec',
    'testUtil',
    'json!/test/data/NarrativeTest.test_input_params.spec.json',
], (Jupyter, FilePathWidget, $, Runtime, Spec, TestUtil, TestSpec) => {
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
                initialParams: [
                    {
                        actual_input_object: 'foo',
                        actual_output_object: 'bar',
                    },
                ],
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

        describe('the started widget', () => {
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
                    'kb-file-path__list',
                    'kb-file-path__list_item',
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
                const preClickNumberOfRows = $node.find('li').length;
                expect(preClickNumberOfRows).toEqual(1);
                $node.find('.kb-file-path__button--add_row').click();

                return TestUtil.waitForElementChange(
                    this.node.querySelector('ol.kb-file-path__list')
                ).then(() => {
                    // the job log container should be empty
                    const postClickNumberOfRows = $node.find('li').length;
                    expect(postClickNumberOfRows).toEqual(2);
                });
            });

            // TODO: this doesn't want to work and trigger the deletion event. I'm not sure why.
            xit('should delete a row when trashcan button is clicked', function () {
                const $node = $(this.node);
                const preClickNumberOfRows = $node.find('li.kb-file-path__list_item').length;
                expect(preClickNumberOfRows).toEqual(1);
                const listNode = this.node.querySelector('ol.kb-file-path__list');
                const deleteBtn = listNode.querySelector('button.kb-file-path__button--delete');
                deleteBtn.click();

                // Set up an observer to look for deletion of the <li> for the
                // row we deleted. This gets returned as a Promise after the simulated click.
                const watchPromise = new Promise((resolve) => {
                    const observer = new MutationObserver((mutationList) => {
                        for (const mutationRecord of mutationList) {
                            if (mutationRecord.removedNodes) {
                                for (const removedNode of mutationRecord.removedNodes) {
                                    if ('kb-file-path__list' in removedNode.classList) {
                                        observer.disconnect();
                                        resolve();
                                    }
                                }
                            }
                        }
                    });
                    observer.observe(listNode, { childList: true }); // leaving out the options should observe on delete
                }).then(() => {
                    // the job log container should be empty
                    const postClickNumberOfRows = $node.find('li.kb-file-path__list_item').length;
                    expect(postClickNumberOfRows).toEqual(0);
                });

                return Promise.resolve(
                    $node.find('button.kb-file-path__button--delete').click()
                ).then(() => watchPromise);
            });
        });
    });
});
