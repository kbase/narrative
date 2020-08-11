/*global define*/
/*global describe, it, expect*/
/*global jasmine*/
/*global beforeEach, afterEach*/
/*jslint white: true*/
define([
    'jquery',
    'kbaseNarrativeSharePanel',
    'base/js/namespace',
    'kbaseNarrative',
], function($, KBaseNarrativeSharePanel, Jupyter, Narrative) {
    describe('Test the kbaseNarrativeSharePanel widget', () => {
        let sharePanel;
        const $div = $('div');
        const workspaceId = 12345;

        beforeEach(function() {
            jasmine.Ajax.install();
            Jupyter.narrative = new Narrative();
            Jupyter.narrative.userId = 'narrativetest';
            Jupyter.narrative.narrController = {
                uiModeIs: p => false
            };
            Jupyter.narrative.getAuthToken = () => { return 'NotARealToken!' };

            sharePanel = new KBaseNarrativeSharePanel($div, { wsId: workspaceId });
        });

        afterEach(() => {
            jasmine.Ajax.uninstall();
            $div.empty();
        });

        it('Should build a widget', () => {
            expect(KBaseNarrativeSharePanel).toBeDefined();
            expect(sharePanel).toBeDefined();
        });

        it('Should ')

    });
});
