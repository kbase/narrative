/*global describe, it, expect*/
/*global beforeEach, beforeAll, afterAll*/
/*jslint white: true*/

define([
    'common/cellComponents/paramsWidget',
    'common/runtime',
    'common/props',
    'common/spec',
    'json!../../../../data/testAppObj.json',
], (ParamsWidget, Runtime, Props, Spec, TestAppObject) => {
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

        let paramsWidget, node, spec, parameters;

        beforeEach(() => {
            const bus = Runtime.make().bus();
            node = document.createElement('div');
            document.getElementsByTagName('body')[0].appendChild(node);

            const model = Props.make({
                data: TestAppObject,
                onUpdate: (props) => {},
            });

            spec = Spec.make({
                appSpec: model.getItem('app.spec'),
            });

            parameters = spec.getSpec().parameters;

            const workspaceId = 54745;

            paramsWidget = ParamsWidget.make({
                bus: bus,
                workspaceId: workspaceId,
                initialParams: model.getItem('params'),
            });
        });

        it('should start and render itself', () => {
            return paramsWidget
                .start({
                    node: node,
                    appSpec: spec,
                    parameters: parameters,
                })
                .then(() => {
                    expect(node.innerHTML).toContain('Parameters');

                    //we should have the option to show advanced
                    expect(node.innerHTML).toContain('show advanced');
                });
        });

        it('should stop itself and empty the node it was in', () => {
            return paramsWidget
                .start({
                    node: node,
                    appSpec: spec,
                    parameters: parameters,
                })
                .then(() => {
                    return paramsWidget.stop();
                })
                .then(() => {
                    expect(node.innerHTML).toEqual('');
                });
        });
    });
});
