define(['modelSeedVizConfig'], (Widget) => {
    'use strict';
    describe('Test the modelSeedVizConfig widget', () => {
        let cfg;

        beforeEach(() => {
            cfg = new ModelSeedVizConfig();
        });

        it('Should load the functions', () => {
            expect(ModelSeedVizConfig).toBeDefined();
        });

        it('Has a known gene color', () => {
            expect(cfg.geneColor).toBe('#87CEEB');
        });

        it('Implements a getColor function', () => {
            const col = cfg.getColor(100, 100);
            expect(col).toBe('#8b0000');
        });
    });
});
