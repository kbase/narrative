/*global define,describe,it,expect*/
/*jslint white:true,browser:true*/
define([
    'common/props'
], function(Props) {
    'use strict';
    
    describe('Props core functions', function() {
        it('Is alive', function() {
            var alive;
            if (Props) {
                alive = true;
            } else {
                alive = false;
            }
            expect(alive).toBeTruthy();
        });
        it('Set and get a simple string property', function() {
            var props = Props.make();
            props.setItem('color', 'green');
            expect(props.getItem('color')).toEqual('green');
        });
        it('Set and get a simple number property', function() {
            var props = Props.make();
            props.setItem('themeaningoflife', 42);
            expect(props.getItem('themeaningoflife')).toEqual(42);
        });
        it('Set and get a simple boolean property', function() {
            var props = Props.make();
            props.setItem('buggy', true);
            expect(props.getItem('buggy')).toEqual(true);
        });
        
        it('Set and get a simple object property', function() {
            var props = Props.make();
            props.setItem('pet', {type: 'dog', name: 'peet'});
            expect(props.getItem('pet')).toEqual({type: 'dog', name: 'peet'});
        });
        it('History should undefined', function() {
            var props = Props.make();
            expect(props.getHistoryCount()).toBeUndefined;
        });
//        it('History should be 1 after one change', function() {
//            var props = Props.make();
//            props.setItem('color', 'red');
//            expect(props.getHistoryCount()).toEqual(1);
//        });
        
        it('Update callback should be called', function(done) {
            var props = Props.make({
                onUpdate: function (props) {
                    expect(true).toEqual(true);
                    done();
                }
            });
            props.setItem('color', 'red');
            
        });
        
        it('History should be 1 after one change', function(done) {
            var props = Props.make({
                onUpdate: function (props) {
                    if (props.getHistoryCount() === 1) {
                        expect(props.getHistoryCount()).toEqual(1);
                        done();
                    }
                }
            });
            props.setItem('color', 'red');
            
        });
        it('Set and get a simple string property, check last value', function(done) {
            var props = Props.make({
                onUpdate: function (props) {
                    if (props.getHistoryCount() === 1) {
                        props.setItem('color', 'green');
                        return;
                    }
                    var raw = props.getRawObject(),
                        last = props.getLastRawObject();
                    
                    expect(last.color).toEqual('red');
                    done();
                }
            });
            props.setItem('color', 'red');
        });
    });
    
    
});