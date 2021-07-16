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

        function makeFilePathWidget(fpwArgs, viewOnly) {
            if (viewOnly !== undefined) {
                fpwArgs.viewOnly = viewOnly;
            }
            return FilePathWidget.make(fpwArgs);
        }

        beforeAll(function () {
            window.kbaseRuntime = null;
            Jupyter.narrative = {
                getAuthToken: () => 'fakeToken',
            };

            this.workspaceId = 54745;
            this.defaultArgs = {
                workspaceId: this.workspaceId,
                initialParams: [
                    {
                        actual_input_object: 'foo',
                        actual_output_object: 'bar',
                    },
                ],
                paramIds: ['actual_input_object', 'actual_output_object'],
                availableFiles: ['file1', 'file2'],
            };
            this.appSpec = Spec.make({
                appSpec: TestSpec,
            });
            this.parameters = this.appSpec.getSpec().parameters;
        });

        afterAll(() => {
            Jupyter.narrative = null;
        });

        beforeEach(function () {
            this.bus = Runtime.make().bus();
            container = document.createElement('div');
            this.node = document.createElement('div');
            document.body.append(container);
            container.appendChild(this.node);
            this.fpwArgs = Object.assign({ bus: this.bus }, this.defaultArgs);
        });

        afterEach(() => {
            container.remove();
            window.kbaseRuntime = null;
        });

        [
            {
                label: 'default',
            },
            {
                label: 'edit',
                viewOnly: false,
            },
            {
                label: 'view',
                viewOnly: true,
            },
        ].forEach((testCase) => {
            it(`it can be made in ${testCase.label} mode`, function () {
                const filePathWidget = makeFilePathWidget(this.fpwArgs, testCase.viewOnly);
                return filePathWidget
                    .start({
                        node: this.node,
                        appSpec: this.appSpec,
                        parameters: this.parameters,
                    })
                    .then(() => {
                        const viewOnly = testCase.viewOnly || false;
                        const inputField = this.node.querySelector(
                            '[data-parameter="actual_input_object"] [data-element="input"]'
                        );
                        expect(inputField.hasAttribute('readonly')).toBe(viewOnly);
                    });
            });
        });

        it('has a make function that returns an object', function () {
            const filePathWidget = makeFilePathWidget(this.fpwArgs);
            expect(filePathWidget).not.toBeNull();
            expect(filePathWidget).toEqual(jasmine.any(Object));
        });

        it('has the required methods', function () {
            const filePathWidget = makeFilePathWidget(this.fpwArgs);
            ['bus', 'start', 'stop'].forEach((fn) => {
                expect(filePathWidget[fn]).toBeDefined();
            });
        });

        describe('the started widget', () => {
            beforeEach(async function () {
                this.filePathWidgetInstance = makeFilePathWidget(this.fpwArgs);
                await this.filePathWidgetInstance.start({
                    node: this.node,
                    appSpec: this.appSpec,
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
                this.node.querySelector('.kb-file-path__button--add_row').click();

                return TestUtil.waitForElementChange(
                    this.node.querySelector('ol.kb-file-path__list')
                ).then(() => {
                    // there should now be two rows of file paths
                    const postClickNumberOfRows = $node.find('li').length;
                    expect(postClickNumberOfRows).toEqual(2);
                });
            });

            it('should delete a row when trashcan button is clicked', function () {
                const $node = $(this.node);
                const preClickNumberOfRows = $node.find('li.kb-file-path__list_item').length;
                expect(preClickNumberOfRows).toEqual(1);
                const listNode = this.node.querySelector('ol.kb-file-path__list');
                const deleteBtn = listNode.querySelector('button.kb-file-path__button--delete');

                // Set up an observer to look for deletion of the <li> for the
                // row we deleted. This gets returned as a Promise after the simulated click.
                return TestUtil.waitFor({
                    config: { childList: true },
                    documentElement: container.querySelector('ol.kb-file-path__list'),
                    domStateFunction: (mutations) => {
                        if (!mutations) {
                            return false;
                        }
                        for (const mutationRecord of mutations) {
                            if (mutationRecord.removedNodes) {
                                for (const removedNode of mutationRecord.removedNodes) {
                                    if (removedNode.classList.contains('kb-file-path__list_item')) {
                                        return true;
                                    }
                                }
                            }
                        }
                        return false;
                    },
                    executeFirst: () => {
                        deleteBtn.click();
                    },
                }).then(() => {
                    // the file path list should be empty
                    const postClickNumberOfRows = $node.find('li.kb-file-path__list_item').length;
                    expect(postClickNumberOfRows).toEqual(0);
                });
            });
        });
    });
});
