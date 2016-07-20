/*global define,describe,it,expect*/
/*jslint white:true,browser:true*/
define([
    'common/ui'
], function(Props) {
    'use strict';
    
    describe('UI core functions', function() {
        it('Is alive', function() {
            var alive;
            if (Props) {
                alive = true;
            } else {
                alive = false;
            }
            expect(alive).toBeTruthy();
        });
        //it('Get an element by simple path', function() {
        //    var props = Props.make();
        //    props.setItem('color', 'green');
        //    expect(props.getItem('color')).toEqual('green');
        //});
    });
        
});