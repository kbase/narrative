define([
    'base/js/namespace',
    'common/cellComponents/filePathWidget',
    'jquery',
    'common/spec',
    'testUtil',
    'narrativeMocks',
    'narrativeConfig',
    'common/monoBus',
    'json!/test/data/NarrativeTest.test_input_params.spec.json',
], (Jupyter, FilePathWidget, $, Spec, TestUtil, Mocks, Config, Bus, TestSpec) => {
    'use strict';

    describe('The file path widget module', () => {
        afterEach(() => {
            TestUtil.clearRuntime();
        });

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
            TestUtil.clearRuntime();
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
                    {
                        actual_input_object: 'foo2',
                        actual_output_object: 'bar2',
                    },
                ],
                paramIds: ['actual_input_object', 'actual_output_object'],
                availableFiles: ['file1', 'file2'],
                unselectedOutputValues: {},
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
            this.bus = Bus.make();
            container = document.createElement('div');
            this.node = document.createElement('div');
            container.appendChild(this.node);
            this.fpwArgs = Object.assign({ bus: this.bus }, this.defaultArgs);
        });

        afterEach(() => {
            container.remove();
            TestUtil.clearRuntime();
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
                jasmine.Ajax.install();
                this.filePathWidgetInstance = makeFilePathWidget(this.fpwArgs);
                await this.filePathWidgetInstance.start({
                    node: this.node,
                    appSpec: this.appSpec,
                    parameters: this.parameters,
                });
            });

            afterEach(async function () {
                await this.filePathWidgetInstance.stop();
                jasmine.Ajax.uninstall();
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
                expect(preClickNumberOfRows).toEqual(2);

                return TestUtil.waitForElementChange(
                    this.node.querySelector('ol.kb-file-path__list'),
                    () => {
                        this.node.querySelector('.kb-file-path__button--add_row').click();
                    }
                ).then(() => {
                    // there should now be two rows of file paths
                    const postClickNumberOfRows = $node.find('li').length;
                    expect(postClickNumberOfRows).toEqual(3);
                });
            });

            it('should delete a row when trashcan button is clicked', function () {
                const $node = $(this.node);
                const preClickNumberOfRows = $node.find('li.kb-file-path__list_item').length;
                expect(preClickNumberOfRows).toEqual(2);
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
                    expect(postClickNumberOfRows).toEqual(1);
                });
            });

            it('should check for duplicate values when an input is changed', async function () {
                // this might be more of an integration test?
                // the first couple selectors depend on info from the input widget DOM structure itself,
                // so, not exactly black box.

                // We're testing duplicate values of output objects. The validator calls out
                // to the workspace to see if there's already an object of this name - crashes
                // seem to occur when it can't get there.
                Mocks.mockJsonRpc1Call({
                    url: Config.url('workspace'),
                    body: /get_object_info_new/,
                    response: {
                        data: [[null]],
                    },
                });
                const row1 = this.node.querySelector('li.kb-file-path__list_item:first-child');
                const row2 = this.node.querySelector('li.kb-file-path__list_item:nth-child(2)');
                const widgetSelector = 'div[data-parameter="actual_output_object"]';
                const rowCellSelector = `${widgetSelector} .kb-field-cell__rowCell`;
                const inputSelector = `${widgetSelector} input.form-control`;
                const dupMsgSelector = `${rowCellSelector} .kb-field-cell__message_panel__duplicate`;

                // wait on the inputs to get rendered
                const input1 = await TestUtil.waitForElement(row1, inputSelector);
                const input2 = await TestUtil.waitForElement(row2, inputSelector);

                // wait for the error class to get put on the main widget after a duplicate
                // value is set
                await TestUtil.waitForElementState(
                    this.node,
                    () => {
                        return (
                            row1
                                .querySelector(rowCellSelector)
                                .classList.contains('kb-field-cell__error_message') &&
                            row2
                                .querySelector(rowCellSelector)
                                .classList.contains('kb-field-cell__error_message')
                        );
                    },
                    () => {
                        input2.setAttribute('value', input1.getAttribute('value'));
                        input2.dispatchEvent(new Event('change'));
                    }
                );
                [row1, row2].forEach((row) => {
                    expect(row.querySelector(rowCellSelector).classList).toContain(
                        'kb-field-cell__error_message'
                    );
                    expect(row.querySelector(dupMsgSelector).classList).toContain(
                        'kb-field-cell__message_panel__error'
                    );
                    expect(row.querySelector(dupMsgSelector).classList).not.toContain('hidden');
                });
            });
        });

        it('should check for cross-tab duplicate values at start', async function () {
            this.fpwArgs.unselectedOutputValues = {
                bar: {
                    someTab: [1],
                },
            };
            const fpw = makeFilePathWidget(this.fpwArgs);
            await fpw.start({
                node: this.node,
                appSpec: this.appSpec,
                parameters: this.parameters,
            });

            // We're testing duplicate values of output objects. The validator calls out
            // to the workspace to see if there's already an object of this name - crashes
            // seem to occur when it can't get there.
            jasmine.Ajax.install();
            Mocks.mockJsonRpc1Call({
                url: Config.url('workspace'),
                body: /get_object_info_new/,
                response: {
                    data: [[null]],
                },
            });
            const row1 = this.node.querySelector('li.kb-file-path__list_item:first-child');
            const widgetSelector = 'div[data-parameter="actual_output_object"]';
            const rowCellSelector = `${widgetSelector} .kb-field-cell__rowCell`;
            const inputSelector = `${widgetSelector} input.form-control`;
            const dupMsgSelector = `${rowCellSelector} .kb-field-cell__message_panel__duplicate`;

            // wait on the inputs to get rendered
            await TestUtil.waitForElement(row1, inputSelector);

            // wait for the error class to get put on the main widget after a duplicate
            // value is set
            await TestUtil.waitForElementState(this.node, () => {
                return row1
                    .querySelector(rowCellSelector)
                    .classList.contains('kb-field-cell__error_message');
            });
            expect(row1.querySelector(rowCellSelector).classList).toContain(
                'kb-field-cell__error_message'
            );
            expect(row1.querySelector(dupMsgSelector).classList).toContain(
                'kb-field-cell__message_panel__error'
            );
            expect(row1.querySelector(dupMsgSelector).classList).not.toContain('hidden');
            await fpw.stop();
            jasmine.Ajax.uninstall();
        });
    });
});
