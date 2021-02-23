define(['msPathway', 'jquery'], (Widget, $) => {
    'use strict';
    describe('Test the msPathway widget', () => {
        it('Should load the module', () => {
            expect(ModelSeedPathway).toEqual(jasmine.any(Function));
        });

        it('Should do something or other', () => {
            const nodeName = 'path-node';
            $('body').append('<div id="' + nodeName + '">');
            const pathwayWidget = new ModelSeedPathway({
                elem: nodeName,
                mapName: '',
                mapData: {
                    groups: [],
                    reactions: [],
                    compounds: [],
                    linkedmaps: [],
                },
            });
        });
    });
});
