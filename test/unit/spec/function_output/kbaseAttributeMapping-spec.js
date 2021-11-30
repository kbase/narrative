define([
    'jquery',
    'kbaseAttributeMapping',
    'base/js/namespace',
    'narrativeMocks',
    'narrativeConfig',
    'testUtil',
], ($, kbaseAttributeMapping, Jupyter, Mocks, Config, TestUtil) => {
    'use strict';
    describe('The kbaseAttributeMapping widget', () => {
        let container;
        beforeEach(() => {
            jasmine.Ajax.install();
            const AUTH_TOKEN = 'fakeAuthToken';
            Mocks.setAuthToken(AUTH_TOKEN);
            Jupyter.narrative = {
                getAuthToken: () => AUTH_TOKEN,
            };
            container = document.createElement('div');
        });

        afterEach(() => {
            Mocks.clearAuthToken();
            Jupyter.narrative = null;
            jasmine.Ajax.uninstall();
            container.remove();
            TestUtil.clearRuntime();
        });

        it('Should properly render AttributeMapping data', async () => {
            const attributeMappingData = {
                ontology_mapping_method: 'User Curation',
                instances: {
                    S9: ['0', '200'],
                    S8: ['0', '200'],
                    S3: ['0', '0'],
                    S2: ['0', '0'],
                    S1: ['0', '0'],
                    S7: ['0', '200'],
                    S6: ['2', '0'],
                    S5: ['2', '0'],
                    S4: ['2', '0'],
                },
                attributes: [
                    {
                        attribute_ont_id: 'Custom:Term',
                        unit_ont_id: 'Custom:Unit',
                        unit_ont_ref: 'KbaseOntologies/Custom',
                        attribute_ont_ref: 'KbaseOntologies/Custom',
                        unit: 'Hour',
                        attribute: 'Time series design',
                    },
                    {
                        attribute_ont_id: 'Custom:Term',
                        unit_ont_id: 'Custom:Unit',
                        unit_ont_ref: 'KbaseOntologies/Custom',
                        attribute_ont_ref: 'KbaseOntologies/Custom',
                        unit: 'nanogram per milliliter',
                        attribute: 'Treatment with Sirolimus',
                    },
                ],
            };
            // this code is more of less ignored, because two WS calls are made both can't be stubbed
            jasmine.Ajax.stubRequest(Config.url('workspace')).andReturn({
                status: 200,
                statusText: 'success',
                contentType: 'application/json',
                responseHeaders: '',
                responseText: JSON.stringify({
                    version: '1.1',
                    result: [
                        {
                            data: [{ data: attributeMappingData }],
                        },
                    ],
                }),
            });
            let widget;
            await TestUtil.waitForElementChange(container, () => {
                widget = new kbaseAttributeMapping($(container), { upas: { obj_ref: 'fake' } });
            });
            ['Time series design', 'Treatment with Sirolimus', 'S1', 'S9'].forEach((str) => {
                expect(container.innerHTML).toContain(str);
            });
            widget.destroy();
        });

        it('Should properly render ConditionSet data', async () => {
            const conditionSetData = {
                ontology_mapping_method: 'User Curation',
                conditions: {
                    S9: ['0', '200'],
                    S8: ['0', '200'],
                    S3: ['0', '0'],
                    S2: ['0', '0'],
                    S1: ['0', '0'],
                    S7: ['0', '200'],
                    S6: ['2', '0'],
                    S5: ['2', '0'],
                    S4: ['2', '0'],
                },
                factors: [
                    {
                        factor_ont_id: 'Custom:Term',
                        unit_ont_id: 'Custom:Unit',
                        unit_ont_ref: 'KbaseOntologies/Custom',
                        factor_ont_ref: 'KbaseOntologies/Custom',
                        unit: 'Hour',
                        factor: 'Time series design',
                    },
                    {
                        factor_ont_id: 'Custom:Term',
                        unit_ont_id: 'Custom:Unit',
                        unit_ont_ref: 'KbaseOntologies/Custom',
                        factor_ont_ref: 'KbaseOntologies/Custom',
                        unit: 'nanogram per milliliter',
                        factor: 'Treatment with Sirolimus',
                    },
                ],
            };
            // this code is more of less ignored, because two WS calls are made both can't be stubbed
            jasmine.Ajax.stubRequest(Config.url('workspace')).andReturn({
                status: 200,
                statusText: 'success',
                contentType: 'application/json',
                responseHeaders: '',
                responseText: JSON.stringify({
                    version: '1.1',
                    result: [
                        {
                            data: [{ data: conditionSetData }],
                        },
                    ],
                }),
            });
            let widget;
            await TestUtil.waitForElementChange(container, () => {
                widget = new kbaseAttributeMapping($(container), { upas: { obj_ref: 'fake' } });
            });
            ['Time series design', 'Treatment with Sirolimus', 'S1', 'S9'].forEach((str) => {
                expect(container.innerHTML).toContain(str);
            });
            widget.destroy();
        });
    });
});
