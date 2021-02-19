define([
    'modelSeedVizConfig'
], function(Widget) {
    'use strict';
    describe('The modelSeedVizConfig widget', function() {
        var cfg;

        beforeEach(function() {
            cfg = new ModelSeedVizConfig();
        });

        it('Should load the functions', function() {
            expect(ModelSeedVizConfig).toBeDefined();
        });

        it('Has a known gene color', function() {
            expect(cfg.geneColor).toBe('#87CEEB');
        });

        it('Implements a getColor function', function() {
            var col = cfg.getColor(100, 100);
            expect(col).toBe('#8b0000');
        });
    });
});
