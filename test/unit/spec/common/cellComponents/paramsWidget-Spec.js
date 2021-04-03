define([
    'base/js/namespace',
    'common/cellComponents/paramsWidget',
    'common/runtime',
    'common/props',
    'common/spec',
    '/test/data/testAppObj',
], (Jupyter, ParamsWidget, Runtime, Props, Spec, TestAppObject) => {
    'use strict';

    describe('The Parameter module', () => {
        it('loads', () => {
            expect(ParamsWidget).not.toBe(null);
        });

        it('has expected functions', () => {
            expect(ParamsWidget.make).toBeDefined();
        });
    });

    describe('The Parameter instance', () => {
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

        beforeEach(async function () {
            const bus = Runtime.make().bus();

            container = document.createElement('div');
            this.node = document.createElement('div');
            container.appendChild(this.node);

            const model = Props.make({
                data: TestAppObject,
                onUpdate: () => {},
            });

            const spec = Spec.make({
                appSpec: model.getItem(['app', 'specs', 'kb_uploadmethods/import_fastq_sra_as_reads_from_staging']),
            });

            this.parameters = spec.getSpec().parameters;
            const workspaceId = 54745;
            const initialParams = model.getItem('params');

            this.paramsWidgetInstance = ParamsWidget.make({
                bus: bus,
                workspaceId: workspaceId,
                initialParams: initialParams,
            });

            await this.paramsWidgetInstance.start({
                node: this.node,
                appSpec: spec,
                parameters: this.parameters,
            });
        });

        afterEach(async function () {
            if (this.paramsWidgetInstance) {
                await this.paramsWidgetInstance.stop();
            }
            window.kbaseRuntime = null;
            container.remove();
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
                    'kb-app-params__fields--parameters__hidden_field'
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
