/*global define,describe,it,expect*/
/*jslint white:true,browser:true*/
define([
    'microBus'
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
        it('Listens for a message, receive it', function(done) {
            var bus = Bus.make();
            bus.listen({
                test: function() {
                    return true;
                },
                handle: function(message) {
                    expect(message.message).toEqual('message');
                    done();
                }
            });
            bus.send({
                message: 'message'
            });
        });
        it('Listens for a message, receive with filter', function(done) {
            var bus = Bus.make();
            bus.listen({
                test: function(message) {
                    if (message.condition === 'condition') {
                        return true;
                    }
                },
                handle: function(message) {
                    expect(message.message).toEqual('message');
                    done();
                }
            });
            bus.send({
                condition: 'condition',
                message: 'message'
            });
        });
        // Hmm, need to figure out how to specifiy that we want a spec
        // to actually fail via timeout.
        //
        // it('Listens for a message, fail to receive with filter', function (done) {
        //   var bus = Bus.makeBus();
        //   bus.listen({
        //     test: function (message) {
        //       if (message.condition === 'condition') {
        //         return true;
        //       }
        //     },
        //     handle: function (message) {
        //       expect(message.message).toEqual('message');
        //       done();
        //     }
        //   });
        //   bus.send({condition: 'conditionx', message: 'message'});
        // });
        /*
         * This works by creating 100 separate listeners and then issueing 100
         * matching messages.
         */
        it('100 messages and listeners, receive them all', function(done) {
            var bus = Bus.make(),
                count = 100,
                i, id;
            // First, create 100 listeners.
            for (i = 0; i < count; i += 1) {
                id = String(i);
                bus.listen({
                    test: function(message) {
                        if (message.id === id) {
                            return true;
                        }
                    },
                    handle: function(message) {
                        expect(message.id).toEqual(id);
                        done();
                    }
                });
            }
            // Then send 100 Messages
            for (i = 0; i < count; i += 1) {
                var id = String(i);
                bus.send({
                    id: id
                });
            }
        });

        /*
         * This one is a little different. It creates one listener which keeps track
         * of all 100 messages, and succeeds when all have been received, and fails
         * if it receives a message that is not in the set of sent messages.
         */
        it('100 messages and listeners, receive them all', function(done) {
            var bus = Bus.make(),
                count = 100,
                sent = {},
                i;
            // First, create 100 listeners.
            bus.listen({
                test: function(message) {
                    if (message.id) {
                        return true;
                    }
                },
                handle: function(message) {
                    if (!sent[message.id]) {
                        done.fail();
                    } else {
                        delete sent[message.id];
                        if (Object.keys(sent).length === 0) {
                            done();
                        }
                    }
                }
            });
            // Then send 100 Messages
            for (i = 0; i < count; i += 1) {
                var id = String(i);
                bus.send({
                    id: id
                });
                sent[id] = id;
            }
        });
        /*
         * This one is a little different. Emit the 100 messages with a random short
         * timeout.
         */
        it('100 messages and listeners, receive them all', function(done) {
            var bus = Bus.make(),
                count = 100,
                sent = {},
                i;
            // First, create 100 listeners.
            bus.listen({
                test: function(message) {
                    if (message.id) {
                        return true;
                    }
                },
                handle: function(message) {
                    if (!sent[message.id]) {
                        done.fail();
                    } else {
                        delete sent[message.id];
                        if (Object.keys(sent).length === 0) {
                            done();
                        }
                    }
                }
            });
            // Then send 100 Messages
            for (i = 0; i < count; i += 1) {
                var id = String(i);
                sent[id] = id;
            }

            function sender(sendCount, interval) {
                window.setTimeout(function() {
                    var id = String(sendCount);
                    bus.send({
                        id: id
                    });
                    sent[id] = id;
                    if (sendCount > 0) {
                      sender(sendCount-1, Math.random() * 0.01);
                    }
                }, interval);
            }
            sender(count, Math.random() * 0.01);
        });
    });
});
