define([
    'jquery',
    'testUtil',
    'common/runtime',
    'widgets/appWidgets2/view/select2ObjectView',
    'widgets/appWidgets2/validators/constants',
    'base/js/namespace',
    'narrativeMocks',
    'narrativeConfig',
], ($, TestUtil, Runtime, Select2ObjectView, Constants, Jupyter, Mocks, Config) => {
    'use strict';

    const AUTH_TOKEN = 'fakeAuthToken';
    // this is a bit of a cheat, as it relies on this specific version of Select2.
    // but Select2 does some annoying things where the rendered text doesn't get stored
    // anywhere else (like in a data accessor), so we have to use this to check
    // for expected object version text.
    const RENDERED_ELEM_SELECTOR = 'span.select2-selection__rendered';

    const PARAM_SPEC = {
        data: {
            defaultValue: 'default_value',
            nullValue: '',
            constraints: {
                required: false,
                defaultValue: 'default_value',
                types: ['KBaseFile.SingleEndLibrary'],
            },
        },
    };

    const refLookupItem = [
            22,
            'SomeObject',
            'KBaseObject.Object-1.1',
            '2023-04-21T12:45:00+0000',
            33,
            'someuser',
            11,
            'someuser:narrative12345',
            '1231231234',
            100,
            {},
        ],
        defaultRef = '11/22/33';

    function objectify(infoArr) {
        const splitType = infoArr[2].split('-');
        const moduleAndType = splitType[0].split('.');
        return {
            id: infoArr[0],
            name: infoArr[1],
            ref: [infoArr[6], infoArr[0], infoArr[4]].join('/'),
            metadata: infoArr[10],
            type: infoArr[2],
            obj_id: 'ws.' + infoArr[6] + '.obj.' + infoArr[0],
            save_date: infoArr[3],
            version: infoArr[4],
            wsid: infoArr[6],
            saveDate: new Date(infoArr[3]),
            typeModule: moduleAndType[0],
            typeName: moduleAndType[1],
        };
    }

    describe('Select 2 Object View tests', () => {
        let bus, container, runtime, runtimeBus;

        function updateData(data, objectInfo) {
            runtime.bus().set(
                {
                    data,
                    timestamp: new Date().getTime(),
                    objectInfo,
                },
                {
                    channel: 'data',
                    key: {
                        type: 'workspace-data-updated',
                    },
                }
            );
        }

        beforeEach(() => {
            container = document.createElement('div');
            runtime = Runtime.make();
            runtimeBus = runtime.bus();
            Mocks.setAuthToken(AUTH_TOKEN);
            Jupyter.narrative = {
                getAuthToken: () => AUTH_TOKEN,
                userId: 'test_user',
            };
            bus = runtimeBus.makeChannelBus({
                description: 'select input testing',
            });

            jasmine.Ajax.install();

            Mocks.mockJsonRpc1Call({
                url: Config.url('workspace'),
                body: /11\/22\/33/,
                response: [refLookupItem],
            });
            updateData([], []);
        });

        afterEach(() => {
            jasmine.Ajax.uninstall();
            bus.stop();
            runtime.destroy();
            TestUtil.clearRuntime();
            Jupyter.narrative = null;
            container.remove();
        });

        it('Should be instantiable, basic test', () => {
            const initialValue = 'SomeInputObject';
            const widget = Select2ObjectView.make({
                parameterSpec: PARAM_SPEC,
                bus,
                initialValue,
                channelName: bus.channelName,
            });
            expect(widget).toEqual(jasmine.any(Object));
            ['start', 'stop'].forEach((fn) => {
                expect(widget[fn]).toBeDefined();
                expect(widget[fn]).toEqual(jasmine.any(Function));
            });
        });

        async function startWidgetTest(initialValue, initialExpected) {
            const widget = Select2ObjectView.make({
                parameterSpec: PARAM_SPEC,
                bus,
                initialValue,
                channelName: bus.channelName,
            });
            await widget.start({ node: container });
            expect(container.childElementCount).toBeGreaterThan(0);
            const input = container.querySelector('select[data-element="input"]');
            expect(input).toBeDefined();
            expect(container.querySelector(RENDERED_ELEM_SELECTOR).textContent).toBe(
                initialExpected
            );
            return widget;
        }

        it('Should start and stop with some default text value', async () => {
            const initialValue = 'SomeInputObject';
            const widget = await startWidgetTest(initialValue, initialValue);
            await widget.stop();
            expect(container.childElementCount).toBe(0);
        });

        it('Should render an UPA as its object name + version', async () => {
            const initialValue = defaultRef;
            const initialExpected = `${refLookupItem[1]} (v${refLookupItem[4]})`;
            const widget = await startWidgetTest(initialValue, initialExpected);
            await widget.stop();
            expect(container.childElementCount).toBe(0);
        });

        it('Should respond to messages over the data channel with a new object version by not changing the view', async () => {
            const initialValue = defaultRef;
            const initialExpected = `${refLookupItem[1]} (v${refLookupItem[4]})`;
            const widget = await startWidgetTest(initialValue, initialExpected);
            // send an update over the data channel - code lifted from the kbaseNarrativeDataList module.
            const newObjInfo = Array.from(refLookupItem);
            newObjInfo[4] = '123';
            updateData([newObjInfo], [objectify(newObjInfo)]);
            // gonna cheat here and say that nothing happens after 500ms
            await TestUtil.wait(500);
            expect(container.querySelector(RENDERED_ELEM_SELECTOR).textContent).toBe(
                initialExpected
            );
            await widget.stop();
        });

        it('Should respond to messages over the data channel with a new object name by updating', async () => {
            const initialValue = defaultRef;
            const initialExpected = `${refLookupItem[1]} (v${refLookupItem[4]})`;
            const newName = 'New Object Name';
            const widget = await startWidgetTest(initialValue, initialExpected);
            // send an update over the data channel - code lifted from the kbaseNarrativeDataList module.
            const newObjInfo = Array.from(refLookupItem);
            newObjInfo[1] = newName;

            await TestUtil.waitForElementChange(
                container.querySelector(RENDERED_ELEM_SELECTOR),
                () => {
                    updateData([newObjInfo], [objectify(newObjInfo)]);
                }
            );
            const newExpectation = `${newObjInfo[1]} (v${refLookupItem[4]})`;
            expect(container.querySelector(RENDERED_ELEM_SELECTOR).textContent).toBe(
                newExpectation
            );
            await widget.stop();
        });

        it('Should ignore data channel messages if the given value is not a UPA/objectInfo', async () => {
            const initialValue = 'SomeInputObject';
            const widget = await startWidgetTest(initialValue, initialValue);
            updateData([refLookupItem], [objectify(refLookupItem)]);
            // gonna cheat here and say that nothing happens after 500ms
            await TestUtil.wait(500);
            expect(container.querySelector(RENDERED_ELEM_SELECTOR).textContent).toBe(initialValue);
            await widget.stop();
        });

        it('Should respond to the "update" bus message', async () => {
            const initialValue = 'SomeInputObject';
            const widget = await startWidgetTest(initialValue, initialValue);
            await TestUtil.waitForElementChange(
                container.querySelector(RENDERED_ELEM_SELECTOR),
                () => {
                    bus.emit('update', { value: defaultRef });
                }
            );
            const newExpectation = `${refLookupItem[1]} (v${refLookupItem[4]})`;
            expect(container.querySelector(RENDERED_ELEM_SELECTOR).textContent).toBe(
                newExpectation
            );
            await widget.stop();
        });

        it('Should respond to the "reset-to-defaults" bus message', async () => {
            const initialValue = 'SomeInputObject';
            const widget = await startWidgetTest(initialValue, initialValue);
            await TestUtil.waitForElementChange(
                container.querySelector(RENDERED_ELEM_SELECTOR),
                () => {
                    bus.emit('reset-to-defaults');
                }
            );
            expect(container.querySelector(RENDERED_ELEM_SELECTOR).textContent).toBe(
                PARAM_SPEC.data.defaultValue
            );
            await widget.stop();
        });

        [null, undefined, ''].forEach((initValue) => {
            it(`Should show an empty name if "${initValue}" is provided`, async () => {
                const widget = await startWidgetTest(initValue, '');
                await widget.stop();
            });
        });

        it('Should show an error if the UPA cannot be resolved to a name', async () => {
            const initValue = 'xx/yy/zz';
            Mocks.mockJsonRpc1Call({
                url: Config.url('workspace'),
                body: new RegExp(initValue),
                statusCode: 500,
                isError: true,
            });
            const widget = await startWidgetTest(initValue, `Error resolving ${initValue}`);
            await widget.stop();
        });
    });
});
