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
            this.workspaceId = 54745;
            this.initialParams = this.model.getItem('params');

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
                const advancedParams = [];
                for (const [, entry] of Object.entries(this.parameters.specs)) {
                    if (entry.ui.advanced) {
                        advancedParams.push(entry.id);
                    }
                }

                //search for these on the rendered page, make sure they are there and have the correct class
                advancedParams.forEach((param) => {
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
    });
});
