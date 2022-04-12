define(['bluebird', 'uuid'], (Promise, Uuid) => {
    'use strict';

    function factory(config) {
        const { root, name } = config;
        const serviceId = new Uuid(4).format();

        let lastId = 0; //: number;
        const partners = {}; // Object<String, any>;
        const listeners = {}; //Object<String, Array<any>>;
        const awaitingResponse = {}; //: Object<String, any>;

        function genId() {
            lastId += 1;
            return 'msg_' + String(lastId);
        }

        function addPartner(_config) {
            partners[_config.name] = _config;
        }

        function listen(listener) {
            if (!listeners[listener.name]) {
                listeners[listener.name] = [];
            }
            listeners[listener.name].push(listener);
        }

        function receive(event) {
            const message = event.data;
            let response;

            if (!message.address && !message.address.to) {
                console.warn('Message without address.to - ignored (iframe)', message);
                return;
            }

            if (message.address.to !== serviceId) {
                return;
            }

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
                listeners[message.name].forEach((_listener) => {
                    try {
                        _listener.handler(message);
                        return;
                    } catch (ex) {
                        console.error('Error handling listener for message ', message, ex);
                    }
                });
            }
        }

        function getPartner(_name) {
            if (!partners[_name]) {
                throw new Error('Partner ' + _name + ' not registered');
            }
            return partners[_name];
        }

        function send(partnerName, message) {
            const partner = getPartner(partnerName);
            message.from = name;
            message.address = {
                to: partner.serviceId,
                from: serviceId,
            };
            partner.window.postMessage(message, partner.host);
        }

        function sendRequest(partnerName, message, handler) {
            const id = genId();
            message.id = id;
            awaitingResponse[id] = {
                started: new Date(),
                handler: handler,
            };
            send(partnerName, message);
        }

        function request(partnerName, message) {
            return new Promise((resolve) => {
                sendRequest(partnerName, message, (response) => {
                    resolve(response);
                });
            });
        }

        function start() {
            root.addEventListener('message', receive, false);
        }

        function stop() {
            root.removeEventListener('message', receive);
        }

        return Object.freeze({
            start,
            stop,
            send,
            request,
            receive,
            listen,
            addPartner,
            serviceId,
        });
    }

    return {
        make: function (config) {
            return factory(config);
        },
    };
});
