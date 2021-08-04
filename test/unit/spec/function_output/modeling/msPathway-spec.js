define(['msPathway', 'jquery', 'testUtil'], (Widget, $, TestUtil) => {
    'use strict';

    describe('Test the msPathway widget', () => {
        afterAll(() => TestUtil.clearRuntime());

        it('Should load the module', () => {
            expect(ModelSeedPathway).toEqual(jasmine.any(Function));
        });

        xit('Should do something or other', () => {
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
