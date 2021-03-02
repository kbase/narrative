define([
    'jquery',
    'base/js/namespace',
    'common/cellComponents/paramsWidget',
    'common/runtime',
    'common/props',
    'common/spec',
    '/test/data/testAppObj',
], ($, Jupyter, ParamsWidget, Runtime, Props, Spec, TestAppObject) => {
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
        beforeAll(() => {
            window.kbaseRuntime = null;
            Jupyter.narrative = {
                getAuthToken: () => 'fakeToken',
            };
        });

        afterAll(() => {
            Jupyter.narrative = null;
        });

        beforeEach(async () => {
            const bus = Runtime.make().bus();
            this.node = document.createElement('div');
            document.getElementsByTagName('body')[0].appendChild(this.node);

            const model = Props.make({
                data: TestAppObject,
                onUpdate: () => {},
            });

            const spec = Spec.make({
                appSpec: model.getItem('app.spec'),
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

        afterEach(async () => {
            if (this.paramsWidgetInstance) {
                await this.paramsWidgetInstance.stop();
            }
            window.kbaseRuntime = null;
            document.body.innerHTML = '';
        });

        it('should render the correct parameters', () => {
            //Regular (non-advanced) params
            const paramContainers = $('div.kb-field-cell__param_container');

            paramContainers.each(function () {
                //each param container should have ONE label
                const label = $(this).find('label.kb-field-cell__cell_label');
                expect(label).toBeDefined();
                expect(label.length).toBe(1);

                //each label should also have a title
                const title = label.attr('title');
                expect(title).toBeDefined();

                //each param container should have ONE input control
                const inputControl = $(this).find('div.kb-field-cell__input_control');
                expect(inputControl).toBeDefined();
                expect(inputControl.length).toBe(1);
            });
        });

        it('should render with advanced parameters hidden', () => {
            //get all advanced params using the spec
            const advancedParams = [];
            for (const [, entry] of Object.entries(this.parameters.specs)) {
                if (entry.ui.advanced) {
                    advancedParams.push(entry.id);
                }
            }

            //search for these on the rendered page, make sure they are there and have the correct class
            advancedParams.forEach((param) => {
                const renderedAdvancedParam = $('div[data-advanced-parameter="' + param + '"]');
                expect(renderedAdvancedParam).toBeDefined();
                const hidden = renderedAdvancedParam.hasClass(
                    'kb-app-params__fields--parameters__hidden_field'
                );

                expect(hidden).toBeTrue();
            });
        });

        it('should stop itself and empty the node it was in', () => {
            this.paramsWidgetInstance.stop().then(() => {
                expect(this.node.innerHTML).toEqual('');
                this.paramsWidgetInstance = null;
            });
        });
    });
});
