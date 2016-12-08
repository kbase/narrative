/*global define*/
/*jslint white:true,browser:true*/
define([
], function () {
    'use strict';

    function Messages(config) {
        var awaitingResponse = {},
            listeners = {},
            lastId = 0,
            root = config.root,
            name = config.name;

        function genId() {
            lastId += 1;
            return 'msg_' + String(lastId);
        }
        
        var partners = {};
        function addPartner(config) {
            partners[config.name] = config;
        }

        function listenForMessage(listener) {
            if (!listeners[listener.name]) {
                listeners[listener.name] = [];
            }
            listeners[listener.name].push(listener);
        }

        function receiveMessage(event) {
            var origin = event.origin || event.originalEvent.origin,
                message = event.data,
                listener, response;
            
            if (message.id && awaitingResponse[message.id]) {
                try {
                    response = awaitingResponse[message.id];
                    delete awaitingResponse[message.id];
                    response.handler(message, event);
                    return;
                } catch (ex) {
                    console.error('Error handling response for message ', message, ex);
                }
            }

            if (listeners[message.name]) {
                listeners[message.name].forEach(function (listener) {
                    try {
                        listener.handler(message, event);
                        return;
                    } catch (ex) {
                        console.error('Error handling listener for message ', message, ex);
                    }
                });
            }

        }
        
        function getPartner(name) {
            var partner = partners[name];
            if (!partner) {
                throw new Error('Partner ' + name + ' not registered');
            }
            return partner;                
        }

        function sendMessage(partnerName, message) {
            var partner = getPartner(partnerName);
            message.from = name;
            partner.window.postMessage(message, partner.host);
        }

        function sendRequest(partnerName, message, handler) {
            var id = genId();
            message.id = id;
            awaitingResponse[id] = {
                started: new Date(),
                handler: handler
            };
            sendMessage(partnerName, message);
        }
        
        function request(partnerName, message) {
            return new Promise(function (resolve, reject) {
                sendRequest(partnerName, message, function (response) {
                    resolve(response);
                });
            });
        }
        
        function setName(newName) {
            if (name !== undefined) {
                throw new Error('Name is already set');
            }
            name = newName;
        }
        
        root.addEventListener('message', receiveMessage, false);


        return {
            addPartner: addPartner,
            request: request,
            send: sendMessage,
            // sendMessages: sendMessages,
            listen: listenForMessage,
            setName: setName
        };
    }

    return Messages;
});