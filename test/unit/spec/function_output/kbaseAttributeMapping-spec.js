define(['jquery', 'kbaseAttributeMapping', 'base/js/namespace', 'narrativeMocks'], (
    $,
    kbaseAttributeMapping,
    Jupyter,
    Mocks
) => {
    'use strict';
    describe('The kbaseAttributeMapping widget', () => {
        let $div = null;
        beforeEach(() => {
            jasmine.Ajax.install();
            const AUTH_TOKEN = 'fakeAuthToken';
            Mocks.setAuthToken(AUTH_TOKEN);
            Jupyter.narrative = {
                getAuthToken: () => AUTH_TOKEN,
            };
            $div = $('<div>');
        });

        afterEach(() => {
            Mocks.clearAuthToken();
            Jupyter.narrative = null;
            jasmine.Ajax.uninstall();
            $div.remove();
        });

        it('Should properly render AttributeMapping data', (done) => {
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
            jasmine.Ajax.stubRequest('https://ci.kbase.us/services/ws').andReturn({
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
            new kbaseAttributeMapping($div, { upas: { obj_ref: 'fake' } });
            ['Time series design', 'Treatment with Sirolimus', 'S1', 'S9'].forEach((str) => {
                expect($div.html()).toContain(str);
            });
            done();
        });

        it('Should properly render ConditionSet data', (done) => {
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
            jasmine.Ajax.stubRequest('https://ci.kbase.us/services/ws').andReturn({
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
            new kbaseAttributeMapping($div, { upas: { obj_ref: 'fake' } });
            ['Time series design', 'Treatment with Sirolimus', 'S1', 'S9'].forEach((str) => {
                expect($div.html()).toContain(str);
            });
            done();
        });
    });
});
