/*global define*/
/*global describe, it, expect*/
/*global jasmine*/
/*global beforeEach, afterEach*/
/*jslint white: true*/
define([
    'jquery',
    'kbaseAlignment',
    'testUtil',
    'common/runtime',
    'base/js/namespace',
    'kbaseNarrative'
], (
    $,
    kbaseAlignment,
    TestUtil,
    Runtime,
    Jupyter,
    Narrative
) => {
    'use strict';
    describe('Test the kbaseAlignment widget', () => {
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
            let alignmentData = {
              "aligned_using": "tophat2",
              "aligner_version": "2.1.1",
              "alignment_stats": {
                "alignment_rate": 89.24360336685788,
                "mapped_reads": 1012018,
                "multiple_alignments": 0,
                "properly_paired": 0,
                "singletons": 0,
                "total_reads": 1133995,
                "unmapped_reads": 121977
              },
              "condition": "Ecoli_WT",
              "file": {
                "file_name": "merged_hits.bam",
                "hid": "KBH_2674228",
                "id": "8ed0e9da-bfb8-4e50-9d54-e146c14cf30c",
                "remote_md5": "1079e6d16a6d81c63162b093ef9f25d5",
                "type": "shock",
                "url": "https://kbase.us/services/shock-api/"
              },
              "genome_id": "29494/8/1",
              "library_type": "KBaseFile.SingleEndLibrary-2.1",
              "read_sample_id": "29494/10/1;29433/6/1",
              "size": 37291951
            };
            // this code is more of less ignored, because two WS calls are made both can't be stubbed
            jasmine.Ajax.stubRequest('https://ci.kbase.us/services/ws').andReturn({
                status: 200,
                statusText: 'success',
                contentType: 'application/json',
                responseHeaders: '',
                responseText: JSON.stringify({
                    version: '1.1',
                    result: [{
                        data: [{data: alignmentData}]
                    }]
                })
            });
            let w = new kbaseAlignment($div, {upas: {upas: ['fake']}});
            w.objData = alignmentData;
            w.render();
            [
                'Overview',
            ].forEach((str) => {
                expect($div.html()).toContain(str);
            });
            // more complex structure matching
            let tabs = $div.find('.tabbable');
            expect(tabs).not.toBeNull();
            let tabsContent = $div.find('.tab-pane');
            expect(tabsContent.length).toEqual(2);
            [
                'Aligned Using',
                'tophat2',
                'Total Reads',
                '1,133,995',
                'Mapped Reads',
                '1,012,018 (89.24%)'
            ].forEach((str) => {
                expect($(tabsContent[0]).html()).toContain(str);
            });
            done();
        });
    })
})