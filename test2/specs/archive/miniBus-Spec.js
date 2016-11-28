/*global define,describe,it,expect*/
/*jslint white:true,browser:true*/
define([
    'miniBus'
], function(Bus) {
    'use strict';

    describe('Bus core functions', function() {
        it('Is alive', function() {
            var alive;
            if (Bus) {
                alive = true;
            } else {
                alive = false;
            }
            expect(alive).toBeTruthy();
        });
        it('Send and receive a test based message', function(done) {
            var bus = Bus.make();
            bus.listen({
                test: function (message) {
                    return (message.type === 'test');
                },
                handle: function (message) {
                    expect(message.type).toEqual('test');
                    done();
                }
            });
            bus.send({
                type: 'test'
            });
        });
        it('Send and receive a string key based message', function(done) {
            var bus = Bus.make();
            bus.listen({
                key: 'mykey',
                handle: function (message) {
                    expect(message.prop).toEqual('test2');
                    done();
                }
            });
            bus.send({prop: 'test2'}, {
                key: 'mykey'
            });
        });
        it('Send and receive an object key based message', function(done) {
            var bus = Bus.make();
            bus.listen({
                key: {type: 'test'},
                handle: function (message) {
                    expect(message.prop).toEqual('test2');
                    done();
                }
            });
            bus.send({prop: 'test2'}, {
                key: {type: 'test'}
            });
        });

        it('Request/response', function(done) {
            var bus = Bus.make();
            bus.respond({
                key: {type: 'test'},
                handle: function (message) {
                    return {reply: 'this is my reply'};
                }
            });
            bus.request({}, {
                key: {type: 'test'}
            })
                .then(function (response) {
                    expect(response.reply).toEqual('this is my reply');
                    done();
                });
        });
          it('Send and receive a message using the simple api', function(done) {
            var bus = Bus.make();
            bus.on('test', function (message) {
                expect(message.say).toEqual('hi');
                done();
            });
            bus.emit('test', {say: 'hi'});
        });
    });


});
