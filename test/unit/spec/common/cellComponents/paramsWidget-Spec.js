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
            Jupyter.narrative = {
                getAuthToken: () => 'fakeToken',
            };
        });

        afterAll(() => {
            Jupyter.narrative = null;
        });

        let paramsWidgetInstance, node, parameters;

        beforeEach(async () => {
            const bus = Runtime.make().bus();
            node = document.createElement('div');
            document.getElementsByTagName('body')[0].appendChild(node);

            const model = Props.make({
                data: TestAppObject,
                onUpdate: () => {},
            });

            const spec = Spec.make({
                appSpec: model.getItem('app.spec'),
            });

            parameters = spec.getSpec().parameters;
            const workspaceId = 54745;
            const initialParams = model.getItem('params');

            paramsWidgetInstance = ParamsWidget.make({
                bus: bus,
                workspaceId: workspaceId,
                initialParams: initialParams,
            });

            await paramsWidgetInstance.start({
                node: node,
                appSpec: spec,
                parameters: parameters,
            });
        });

        afterEach(() => {
            paramsWidgetInstance.stop().then(() => {
                node.remove();
                node = null;
                paramsWidgetInstance = null;
                parameters = null;
                window.kbaseRuntime = null;
                $('body').empty();
            });
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
            for (const [, entry] of Object.entries(parameters.specs)) {
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
            paramsWidgetInstance.stop().then(() => {
                expect(node.innerHTML).toEqual('');
            });
        });
    });
});
