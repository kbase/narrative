define([
    'base/js/namespace',
    'common/cellComponents/paramsWidget',
    'common/runtime',
    'common/props',
    'common/spec',
    'testUtil',
    '/test/data/testBulkImportObj',
], (Jupyter, ParamsWidget, Runtime, Props, Spec, TestUtil, TestBulkImportObject) => {
    'use strict';

    describe('The Parameter module', () => {
        afterEach(() => {
            TestUtil.clearRuntime();
        });

        it('loads', () => {
            expect(ParamsWidget).not.toBe(null);
        });

        it('has expected functions', () => {
            expect(ParamsWidget.make).toBeDefined();
        });
    });

    describe('The Parameter instance', () => {
        let container;

        function makeParamsWidget(args, viewOnly) {
            if (viewOnly !== undefined) {
                args.viewOnly = viewOnly;
            }
            return ParamsWidget.make(args);
        }

        beforeAll(() => {
            Jupyter.narrative = {
                getAuthToken: () => 'fakeToken',
            };
        });

        afterAll(() => {
            Jupyter.narrative = null;
            TestUtil.clearRuntime();
        });

        beforeEach(function () {
            this.bus = Runtime.make().bus();

            container = document.createElement('div');
            this.node = document.createElement('div');
            container.appendChild(this.node);
            document.body.appendChild(container);

            this.model = Props.make({
                data: TestBulkImportObject,
                onUpdate: () => {},
            });

            this.spec = Spec.make({
                appSpec: this.model.getItem([
                    'app',
                    'specs',
                    'kb_uploadmethods/import_fastq_sra_as_reads_from_staging',
                ]),
            });

            this.paramIds = this.model.getItem(['app', 'otherParamIds', 'fastq_reads']);

            this.parameters = this.spec.getSpec().parameters;
            this.advancedParamIds = [];
            for (const [, entry] of Object.entries(this.parameters.specs)) {
                if (entry.ui.advanced) {
                    this.advancedParamIds.push(entry.id);
                }
            }

            this.workspaceId = 54745;
            this.initialParams = this.model.getItem('params').fastq_reads.params;

            this.defaultArgs = {
                bus: this.bus,
                workspaceId: this.workspaceId,
                initialParams: this.initialParams,
                paramIds: this.paramIds,
            };
        });

        afterEach(() => {
            container.remove();
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
            it(`can run in ${testCase.label} mode`, function () {
                const paramsWidget = makeParamsWidget(this.defaultArgs, testCase.viewOnly);
                return paramsWidget
                    .start({
                        node: this.node,
                        appSpec: this.spec,
                        parameters: this.parameters,
                    })
                    .then(() => {
                        const viewOnly = testCase.viewOnly || false;
                        const inputField = this.node.querySelector(
                            '[data-parameter="import_type"] select[data-element="input"]'
                        );
                        expect(inputField.hasAttribute('readonly')).toBe(viewOnly);
                        return paramsWidget.stop();
                    });
            });
        });

        describe('The running instance', () => {
            beforeEach(async function () {
                this.paramsWidgetInstance = makeParamsWidget(this.defaultArgs);

                await this.paramsWidgetInstance.start({
                    node: this.node,
                    appSpec: this.spec,
                    parameters: this.parameters,
                });
            });

            afterEach(async function () {
                if (this.paramsWidgetInstance) {
                    await this.paramsWidgetInstance.stop();
                }
            });

            it('should render the correct parameters', function () {
                //Regular (non-advanced) params
                const paramContainers = this.node.querySelectorAll(
                    'div.kb-field-cell__param_container'
                );
                const titleList = Object.values(this.parameters.specs).map((item) => {
                    return item.ui.label;
                });

                // there should not be an error in the advanced param header
                expect(
                    this.node.querySelector('span.kb-app-params__toggle--advanced-errors')
                ).toBeNull();

                paramContainers.forEach((paramNode) => {
                    //each param container should have ONE label
                    const labelArr = paramNode.querySelectorAll('label.kb-field-cell__cell_label');
                    expect(labelArr.length).toBe(1);
                    const label = labelArr[0];
                    expect(label).toBeDefined();
                    expect(titleList.includes(label.innerText)).toBeTrue();

                    //each label should also have a title
                    const title = label.getAttribute('title');
                    expect(title).toBeDefined();
                    expect(titleList.includes(title)).toBeTrue();

                    //each param container should have ONE input control
                    const inputControlArr = paramNode.querySelectorAll(
                        'div.kb-field-cell__input_control'
                    );
                    expect(inputControlArr).toBeDefined();
                    expect(inputControlArr.length).toBe(1);
                });
            });

            it('should render with advanced parameters hidden', function () {
                //get all advanced params using the spec
                const thisNode = this.node;

                //search for these on the rendered page, make sure they are there and have the correct class
                this.advancedParamIds.forEach((param) => {
                    const renderedAdvancedParam = thisNode.querySelector(
                        `div[data-advanced-parameter="${param}"]`
                    );
                    expect(renderedAdvancedParam).toBeDefined();
                    expect(renderedAdvancedParam).toHaveClass(
                        'kb-app-params__fields--parameters-hidden'
                    );
                });
            });

            it('should stop itself and empty the node it was in', async function () {
                await this.paramsWidgetInstance.stop();
                expect(this.node.innerHTML).toEqual('');
                this.paramsWidgetInstance = null;
            });
        });

        describe('The running instance with advanced param errors', () => {
            let advancedBus;

            beforeEach(function () {
                this.args = TestUtil.JSONcopy(this.defaultArgs);
                advancedBus = Runtime.make().bus();
                this.args.bus = null;
                // breaks the input, makes it a bad value, this should show an error
                this.args.initialParams.insert_size_std_dev = 'not a float value';
            });

            afterEach(async function () {
                if (this.paramsWidgetInstance) {
                    await this.paramsWidgetInstance.stop();
                }
                advancedBus.destroy();
            });

            it('should show an advanced parameter error after startup, when advanced params are collapsed', async function () {
                const bus = Runtime.make().bus();
                this.args.bus = bus;
                const paramsWidgetInstance = makeParamsWidget(this.args);
                await paramsWidgetInstance.start({
                    node: this.node,
                    appSpec: this.spec,
                    parameters: this.parameters,
                });
                await TestUtil.wait(1000);

                const errorNode = this.node.querySelector(
                    '.kb-app-params__toggle--advanced-errors'
                );
                expect(errorNode).not.toBeNull();
                expect(errorNode.childElementCount).toBe(3);
                expect(errorNode.firstChild.classList).toContain('fa-exclamation-triangle');
                expect(errorNode.textContent).toContain('Warning:');
                expect(errorNode.textContent).toContain('Error in advanced parameter');
                await paramsWidgetInstance.stop();
            });

            it('should toggle the error message when toggling the advanced panel', async function () {
                const bus = Runtime.make().bus();
                const thisNode = this.node;
                this.args.bus = bus;
                const paramsWidgetInstance = makeParamsWidget(this.args);
                await paramsWidgetInstance.start({
                    node: thisNode,
                    appSpec: this.spec,
                    parameters: this.parameters,
                });
                await TestUtil.wait(1000);

                const advancedMsg = thisNode.querySelector(
                    '[data-element="advanced-hidden-message"]'
                );
                expect(
                    advancedMsg.querySelector('.kb-app-params__toggle--advanced-errors')
                ).not.toBeNull();

                // wait for the advanced params to be shown
                await TestUtil.waitForElementState(
                    thisNode,
                    () => {
                        let showingParameter = false;
                        thisNode.querySelectorAll('[data-advanced-parameter]').forEach((elem) => {
                            if (
                                elem.classList.contains('kb-app-params__fields--parameters-hidden')
                            ) {
                                showingParameter = true;
                            }
                        });
                        return !showingParameter;
                    },
                    () => {
                        // click the unhide button
                        advancedMsg.querySelector('button').click();
                    }
                );
                expect(
                    advancedMsg.querySelector('.kb-app-params__toggle--advanced-errors')
                ).toBeNull();

                // click again and expect the message to show back up
                // wait for the advanced params to be shown
                await TestUtil.waitForElementState(
                    thisNode,
                    () => {
                        let numHidden = 0;
                        const advancedParams = thisNode.querySelectorAll(
                            '[data-advanced-parameter]'
                        );
                        advancedParams.forEach((elem) => {
                            if (
                                elem.classList.contains('kb-app-params__fields--parameters-hidden')
                            ) {
                                numHidden++;
                            }
                        });
                        return numHidden === advancedParams.length;
                    },
                    () => {
                        // click the unhide button
                        advancedMsg.querySelector('button').click();
                    }
                );
                expect(
                    advancedMsg.querySelector('.kb-app-params__toggle--advanced-errors')
                ).not.toBeNull();

                await paramsWidgetInstance.stop();
            });
        });
    });
});
