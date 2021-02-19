define([
    'msPathway',
    'jquery'
], function(Widget, $) {
    describe('The msPathway widget', function() {
        it('Should load the module', function() {
            expect(ModelSeedPathway).toEqual(jasmine.any(Function));
        });

        xit('Should do something or other', function() {
            var nodeName = 'path-node';
            $('body').append('<div id="' + nodeName + '">');
            var pathwayWidget = new ModelSeedPathway(
                {
                    elem: nodeName,
                    mapName: '',
                    mapData: {
                        groups: [],
                        reactions: [],
                        compounds: [],
                        linkedmaps: []
                    }
                }
            );
        });
    });
});
