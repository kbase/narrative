/*global define*/
/*global describe, it, expect*/
/*global jasmine*/
/*global beforeEach, afterEach*/
/*jslint white: true*/
define([
    'jquery',
    'base/js/namespace',
    'kbaseNarrative',
    'widgets/narrative_core/staticNarrativesManager'
], (
    $,
    Jupyter,
    Narrative,
    StaticNarrativesManager
) => {
    'use strict';
    let node;

    describe('Test the Static Narrative manager widget', () => {
        beforeEach(() => {
            Jupyter.narrative = new Narrative();
            Jupyter.narrative.userId = 'narrativetest';
            node = $('div');
        });

        it('Should exist', () => {
            expect(StaticNarrativesManager).toBeDefined();
        });

        it('Should be instantiable', () => {
            let widget = new StaticNarrativesManager(node);
            expect(widget).toBeDefined();
            expect(widget.refresh).toBeDefined();
        });
    });
});
