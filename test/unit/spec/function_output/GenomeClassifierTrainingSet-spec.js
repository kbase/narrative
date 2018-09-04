/*global define*/
/*global describe, it, expect*/
/*global jasmine*/
/*global beforeEach, afterEach*/
/*jslint white: true*/
define([
    'jquery',
    'GenomeClassifierTrainingSet',
    'testUtil',
    'common/runtime',
    'base/js/namespace',
    'kbaseNarrative'
], (
    $,
    GenomeClassifierTrainingSet,
    TestUtil,
    Runtime,
    Jupyter,
    Narrative
) => {
    'use strict';
    describe('Test the GenomeClassifierTrainingSet widget', () => {
        let $div = null;
        beforeEach(() => {
            jasmine.Ajax.install();
            $div = $('<div>');
            Jupyter.narrative = new Narrative();
            Jupyter.narrative.getAuthToken = () => { return 'NotARealToken!' };
        });

        afterEach(() => {
            jasmine.Ajax.uninstall();
            $div.remove();
        });

        it('Should properly render data', (done) => {
            let trainingsetdata = {
                "classes":["P","N"],
                "classification_data":[
                    {
                        "evidence_types":["another","some","list"],
                        "genome_classification":"N","genome_id": "my_genome_id",
                        "genome_name":"Acetivibrio_ethanolgignens",
                        "genome_ref":"35279/3/1",
                        "references":["some","list"]
                    },{
                        "evidence_types":["another","some","list"],
                        "genome_classification":"P",
                        "genome_id":"my_genome_id",
                        "genome_name":"Aggregatibacter_actinomycetemcomitans_serotype_b_str._SCC4092",
                        "genome_ref":"35279/4/1",
                        "references":["some","list"]
                    },{
                        "evidence_types":["another","some","list"],
                        "genome_classification":"N",
                        "genome_id":"my_genome_id",
                        "genome_name":"Afipia_felis_ATCC_53690",
                        "genome_ref":"35279/5/1",
                        "references":["some","list"]
                }],
                "classification_type":"my_classification_type",
                "description":"my_description",
                "name":"my_name",
                "number_of_classes":2,
                "number_of_genomes":3
            };
            jasmine.Ajax.stubRequest('https://ci.kbase.us/services/ws').andReturn({
                status: 200,
                statusText: 'success',
                contentType: 'application/json',
                responseHeaders: '',
                responseText: JSON.stringify({
                    version: '1.1',
                    result: [{data: [{data: trainingsetdata}]
                    }]
                })
            });
            let w = new GenomeClassifierTrainingSet($div, {upas: {upas: ['1/1/1']}});
            w.trainingSetData = trainingsetdata;
            w.render()
                .then(() => {
                    // simple string matching
                    [
                        'Overview',
                        'Training Set'
                    ].forEach((str) => {
                        expect($div.html()).toContain(str);
                    });
                    // more complex structure matching
                    let tabs = $div.find('.tabbable');
                    expect(tabs).not.toBeNull();
                    let tabsContent = $div.find('.tab-pane');
                    expect(tabsContent.length).toEqual(2);
                    [
                        'Training Set Name',
                        'my_name',
                        'Number of genomes',
                        '3',
                    ].forEach((str) => {
                        expect($(tabsContent[0]).html()).toContain(str);
                    });
                    expect($(tabsContent[1]).html()).toContain('Acetivibrio_ethanolgignens');
                    expect($(tabsContent[1]).html()).not.toContain('<table>');
                    done();
                });
        });
    })
})