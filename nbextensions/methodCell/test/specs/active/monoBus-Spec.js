/*global define,describe,it,expect*/
/*jslint white:true,browser:true*/
define([
    'monoBus'
], function (Bus) {
    'use strict';

    describe('Bus core functions', function () {
        it('Is alive', function () {
            var alive;
            if (Bus) {
                alive = true;
            } else {
                alive = false;
            }
            expect(alive).toBeTruthy();
        });
        it('Send and receive a test based message', function (done) {
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
        it('Send and receive a string key based message', function (done) {
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
        it('Send and receive an object key based message', function (done) {
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

        it('Request/response', function (done) {
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
        it('Send and receive a message using the simple api', function (done) {
            var bus = Bus.make();
            bus.on('test', function (message) {
                expect(message.say).toEqual('hi');
                done();
            });
            bus.emit('test', {say: 'hi'});
        });

        // CHANNELS


        it('Send and receive a test based message over a new channel', function (done) {
            var bus = Bus.make();
            bus.listen({
                channel: 'my-test-channel',
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
            }, {
                channel: 'my-test-channel'
            });
        });

        it('Send and receive a test based message over a channel bus', function (done) {
            var bus = Bus.make(),
                myBus = bus.makeChannelBus();

            myBus.on('talk', function (message) {
                expect(message.say).toEqual('hello');
                done();
            });
            myBus.emit('talk', {say: 'hello'});
        });


        it('Send and receive a test based message over a channel bus', function (done) {
            var bus = Bus.make(),
                myBus = bus.makeChannelBus();

            myBus.on('talk', function (message) {
                expect(message.say).toEqual('hello');
                done();
            });
            myBus.emit('talk', {say: 'hello'});
        });

        it('Send and receive a test based message over the main bus from a channel bus', function (done) {
            var bus = Bus.make(),
                myBus = bus.makeChannelBus();

            myBus.bus().on('talk', function (message) {
                expect(message.say).toEqual('hello');
                done();
            });
            myBus.bus().emit('talk', {say: 'hello'});
        });

        it('Send and receive a test based message over the main bus on a new channel from a channel bus', function (done) {
            var bus = Bus.make(),
                myBus = bus.makeChannelBus();

            myBus.bus().listen({
                channel: 'my-new-channel',
                test: function (message) {
                    return true;
                },
                handle: function (message) {
                    expect(message.test).toEqual('123');
                    done();
                }
            });
            myBus.bus().send({
                test: '123'
            },
                {
                    channel: 'my-new-channel'
                });
        });

    });
    it('Send and receive a test based message over a channel bus', function (done) {
        var bus = Bus.make(),
            myBus = bus.makeChannelBus();

        myBus.listen({
            test: function (message) {
                return (message.language === 'english');
            },
            handle: function (message) {
                expect(message.greeting).toEqual('hello');
                done();
            }
        });
        myBus.send({
            language: 'english',
            greeting: 'hello'
        });
    });


    it('Channel bus Request/response', function (done) {
        var bus = Bus.make(),
            bus1 = bus.makeChannelBus(),
            bus2 = bus.makeChannelBus(),
            data = {
                key1: 'value1'
            };
        // responder 1

        bus1.respond({
            key: {
                type: 'get-value'
            },
            handle: function (message) {
                return {
                    value: data[message.propertyName]
                };
            }
        });
        bus1.request({
            propertyName: 'key1'
        }, {
            key: {
                type: 'get-value'
            }
        })
            .then(function (response) {
                expect(response.value).toEqual('value1');
                done();
            });
    });

    it('Nested bus Request/response', function (done) {
        var bus = Bus.make(),
            bus1 = bus.makeChannelBus(),
            bus2 = bus.makeChannelBus(),
            data = {
                key1: 'value1'
            };
        // responder 1

        bus1.respond({
            key: {
                type: 'get-value'
            },
            handle: function (message) {
                return {
                    value: data[message.propertyName]
                };
            }
        });
        bus2.respond({
            key: {
                type: 'get-value'
            },
            handle: function (message) {
                return  bus1.request({
                    propertyName: 'key1'
                }, {
                    key: {
                        type: 'get-value'
                    }
                });
            }
        });
 

        bus2.request({
            propertyName: 'key1'
        }, {
            key: {
                type: 'get-value'
            }
        })
            .then(function (response) {
                expect(response.value).toEqual('value1');
                done();
            });
    });

});
