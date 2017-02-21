/*global define,jasmine,describe,it,expect*/
/*jslint white:true,browser:true*/
define([
    'common/monoBus'
], function(Bus) {
    'use strict';

    // Setting a shorter timeout pretty much forces us to set a timeout explicitly
    // per async test which falls outside of this reasonable setting for "normal"
    // async code. When we simulate async failures, or chained async calls, we 
    // need to controle the timing expectations within the test itself.
    jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000;
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
                test: function(message) {
                    return (message.type === 'test');
                },
                handle: function(message) {
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
                handle: function(message) {
                    expect(message.prop).toEqual('test2');
                    done();
                }
            });
            bus.send({ prop: 'test2' }, {
                key: 'mykey'
            });
        });

        it('Send and receive an object key based message', function(done) {
            var bus = Bus.make();
            bus.listen({
                key: { type: 'test' },
                handle: function(message) {
                    expect(message.prop).toEqual('test2');
                    done();
                }
            });
            bus.send({ prop: 'test2' }, {
                key: { type: 'test' }
            });
        });

        it('Request/response', function(done) {
            var bus = Bus.make();
            bus.respond({
                key: { type: 'test' },
                handle: function(message) {
                    return { reply: 'this is my reply' };
                }
            });
            bus.request({}, {
                    key: { type: 'test' }
                })
                .then(function(response) {
                    expect(response.reply).toEqual('this is my reply');
                    done();
                });
        });

        it('Send and receive a message using the simple api', function(done) {
            var bus = Bus.make();
            bus.on('test', function(message) {
                expect(message.say).toEqual('hi');
                done();
            });
            bus.emit('test', { say: 'hi' });
        });

        // CHANNELS

        it('Send and receive a test based message over a new channel', function(done) {
            var bus = Bus.make();
            bus.listen({
                channel: 'my-test-channel',
                test: function(message) {
                    return (message.type === 'test');
                },
                handle: function(message) {
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

        it('Send and receive a test based message over a new channel with object name', function(done) {
            var bus = Bus.make();
            bus.listen({
                channel: {
                    name: 'my-test-channel'
                },
                test: function(message) {
                    return (message.type === 'test');
                },
                handle: function(message) {
                    expect(message.type).toEqual('test');
                    done();
                }
            });
            bus.send({
                type: 'test'
            }, {
                channel: {
                    name: 'my-test-channel'
                }
            });
        });

        it('Send and receive a test based message over a channel bus', function(done) {
            var bus = Bus.make(),
                myBus = bus.makeChannelBus();

            myBus.on('talk', function(message) {
                expect(message.say).toEqual('hello');
                done();
            });
            myBus.emit('talk', { say: 'hello' });
        });

        it('Send and receive a test based message over a channel bus', function(done) {
            var bus = Bus.make(),
                myBus = bus.makeChannelBus();

            myBus.on('talk', function(message) {
                expect(message.say).toEqual('hello');
                done();
            });
            myBus.emit('talk', { say: 'hello' });
        });

        it('Send and receive a test based message over the main bus from a channel bus', function(done) {
            var bus = Bus.make(),
                myBus = bus.makeChannelBus();

            myBus.bus().on('talk', function(message) {
                expect(message.say).toEqual('hello');
                done();
            });
            myBus.bus().emit('talk', { say: 'hello' });
        });

        it('Send and receive a test based message over the main bus on a new channel from a channel bus', function(done) {
            var bus = Bus.make(),
                myBus = bus.makeChannelBus();

            myBus.bus().listen({
                channel: 'my-new-channel',
                test: function(message) {
                    return true;
                },
                handle: function(message) {
                    expect(message.test).toEqual('123');
                    done();
                }
            });
            myBus.bus().send({
                test: '123'
            }, {
                channel: 'my-new-channel'
            });
        });

        it('Send and receive a test based message over a channel bus', function(done) {
            var bus = Bus.make(),
                myBus = bus.makeChannelBus();

            myBus.listen({
                test: function(message) {
                    return (message.language === 'english');
                },
                handle: function(message) {
                    expect(message.greeting).toEqual('hello');
                    done();
                }
            });
            myBus.send({
                language: 'english',
                greeting: 'hello'
            });
        });

        it('Channel bus Request/response', function(done) {
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
                handle: function(message) {
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
                .then(function(response) {
                    expect(response.value).toEqual('value1');
                    done();
                });
        });

        it('Nested bus Request/response', function(done) {
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
                handle: function(message) {
                    return {
                        value: data[message.propertyName]
                    };
                }
            });
            bus2.respond({
                key: {
                    type: 'get-value'
                },
                handle: function(message) {
                    return bus1.request({
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
                .then(function(response) {
                    expect(response.value).toEqual('value1');
                    done();
                });
        });

        it('Send and receive a keyed, persistent message over a channel, listen first', function(done) {
            var bus = Bus.make();
            bus.listen({
                channel: 'my-test-channel',
                key: 'my-test-key',
                handle: function(message) {
                    expect(message.name).toEqual('Winnie');
                    done();
                }
            });
            bus.send({
                name: 'Winnie'
            }, {
                channel: 'my-test-channel',
                key: 'my-test-key',
                persistent: true
            });
        });

        it('Send and receive a keyed, persistent message over a channel, send first', function(done) {
            var bus = Bus.make();
            bus.set({
                name: 'Winnie'
            }, {
                channel: 'my-test-channel',
                key: 'my-test-key'
            });
            window.setTimeout(function() {
                bus.listen({
                    channel: 'my-test-channel',
                    key: 'my-test-key',
                    handle: function(message) {
                        expect(message.name).toEqual('Winnie');
                        done();
                    }
                });
            }, 1000);
        }, 5000);

        it('Send and receive a keyed, persistent message over a channel, send first, then update', function(done) {
            var bus = Bus.make(),
                times = 0;
            bus.set({
                name: 'Winnie'
            }, {
                channel: 'my-test-channel',
                key: 'my-test-key'
            });
            window.setTimeout(function() {
                bus.listen({
                    channel: 'my-test-channel',
                    key: 'my-test-key',
                    handle: function(message) {
                        if (times === 0) {
                            times += 1;
                            bus.set({
                                name: 'Tigger'
                            }, {
                                channel: 'my-test-channel',
                                key: 'my-test-key'
                            });
                        } else {
                            expect(message.name).toEqual('Tigger');
                            done();
                        }
                    }
                });
            }, 1000);
        }, 5000);



        it('Create a working test based message route, then remove the listener, should fail.', function(done) {
            var bus = Bus.make(),
                count = 0,
                listener = bus.listen({
                    test: function(message) {
                        return (message.what === 'test');
                    },
                    handle: function(message) {
                        if (count === 0) {
                            count += 1;
                            bus.removeListener(listener);
                            expect(message.what).toEqual('test');
                            bus.send({ what: 'test' });
                            window.setTimeout(function() {
                                expect(count).toEqual(1);
                                done();
                            }, 3000);
                        } else if (count === 1) {
                            count += 1;
                        }
                    }
                });
            bus.send({
                what: 'test'
            });
        }, 5000);
    });

    it('Send and receive a test based message over a named channel using a connection', function(done) {
        var bus = Bus.make(),
            connection = bus.connect();

        connection.channel('test').on('my-message', function(message) {
            expect(message.msg).toEqual('greetings');
            done();
        });
        connection.channel('test').emit('my-message', {
            msg: 'greetings'
        });

    });

    it('A connection should destroy all listenrs upon stop', function(done) {
        var bus = Bus.make(),
            connection = bus.connect();

        connection.channel('test').on('test', function(message) {
            // do nothing...
        });

        connection.channel('test').on('my-message', function(message) {
            // expect(message.msg).toEqual('greetings');
            expect(connection.stats().listeners.active).toEqual(2);
            connection.stop();
            var stats = connection.stats();
            expect(stats.listeners.active).toEqual(0);
            done();
        });
        connection.channel('test').emit('my-message', {
            msg: 'greetings'
        });

    });

    it('Send and receive an async message over a named channel using a connection', function(done) {
        var bus = Bus.make(),
            connection = bus.connect();

        connection.channel('test').when('my-message')
            .then(function(message) {
                expect(message.msg).toEqual('greetings');
                done();
            });

        connection.channel('test').set('my-message', {
            msg: 'greetings'
        });
    });

    it('Send and receive an async message over a named channel using a connection, then another', function(done) {
        var bus = Bus.make(),
            connection = bus.connect();

        connection.channel('test').when('my-message')
            .then(function(message) {
                expect(message.msg).toEqual('greetings');
                connection.channel('test').on('my-message', function(message) {
                    expect(message.msg).toEqual('goodbye');
                    connection.stop();
                    done();
                })
            });

        connection.channel('test').set('my-message', {
            msg: 'greetings'
        });
        connection.channel('test').set('my-message', {
            msg: 'goodbye'
        });
    });

    it('Set a persistent message and get it syncronously', function(done) {
        var bus = Bus.make(),
            connection = bus.connect();

        connection.channel('test').set('my-message', {
            msg: 'greetings'
        });

        var message = connection.channel('test').get('my-message');

        expect(message.msg).toEqual('greetings');
        done();
        connection.stop();
    });

    it('Set a persistent message and get it syncronously, failed', function(done) {
        var bus = Bus.make(),
            connection = bus.connect();

        connection.channel('test').set('my-message', {
            msg: 'greetings'
        });

        var message = connection.channel('test').get('my-messagex', { msg: 'goodbye' });

        expect(message.msg).toEqual('goodbye');
        done();
        connection.stop();
    });

    it('Set a persistent message and get it syncronously, set after get, should get default value', function(done) {
        var bus = Bus.make(),
            connection = bus.connect();


        var message = connection.channel('test').get('my-messagex', { msg: 'goodbye' });

        connection.channel('test').set('my-message', {
            msg: 'greetings'
        });

        expect(message.msg).toEqual('goodbye');
        done();
        connection.stop();
    });

    it('Send and receive an async message over a named channel using a connection, then another', function(done) {
        var bus = Bus.make(),
            connection = bus.connect();

        var started = new Date().getTime();

        // var test2Called = 0;

        var test2 = connection.channel('test').plisten({
            key: {
                type: 'my-message'
            },
            handle: function(message) {
                done.fail();
            }
        });


        // var test3 = connection.channel('test').plisten({
        //     key: {
        //         type: 'my-message'
        //     },
        //     handle: function(message) {
        //         done.fail();
        //     }
        // });
        // test3.promise.then(function() {
        //     done.fail();
        // });

        // var test4 = connection.channel('test').plisten({
        //     key: {
        //         type: 'my-message'
        //     },
        //     handle: function(message) {
        //         done.fail();
        //     }
        // });
        // test4.promise.then(function() {
        //     done.fail();
        // });

        var result = connection.channel('test').plisten({
            key: {
                type: 'my-message'
            },
            handle: function(message) {
                var elapsed = new Date().getTime() - started;
                expect(elapsed > 1000).toBeTruthy();
                expect(message.msg).toEqual('goodbye');
                done();
            }
        });

        // test2.promise
        //     .then(function(message) {
        //         expect(message.msg).toEqual('hello');
        //     });

        // connection.channel('test2').set('my-message', {
        //     msg: 'hello'
        // });
        // connection.channel('test2').set('my-message', {
        //     msg: 'hi!'
        // });

        result.promise
            .then(function(message) {
                expect(message.msg).toEqual('greetings');
                done();
            });

        connection.channel('test').set('my-message', {
            msg: 'greetings'
        });
        // window.setTimeout(function() {
        //     connection.channel('test').set('my-message', {
        //         msg: 'goodbye'
        //     });
        // }, 2000);
    });



});