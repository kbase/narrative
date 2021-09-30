define(['bluebird', 'uuid'], (Promise, Uuid) => {
    function factory(config) {
        const root = config.root;
        const name = config.name;

        const serviceId = new Uuid(4).format();

        let lastId = 0; //: number;
        let sentCount; //: number;
        let receivedCount; //: number;
        const partners = {}; // Map<String, any>;
        const listeners = {}; //Map<String, Array<any>>;
        const awaitingResponse = {}; //: Map<String, any>;

        function genId() {
            lastId += 1;
            return 'msg_' + String(lastId);
        }

        function addPartner(config) {
            partners[config.name] = config;
        }

        function listen(listener) {
            if (!listeners[listener.name]) {
                listeners[listener.name] = [];
            }
            listeners[listener.name].push(listener);
        }

        function receive(event) {
            let origin = event.origin || event.originalEvent.origin,
                message = event.data,
                listener,
                response;

            receivedCount += 1;

            if (!message.address && !message.address.to) {
                console.warn('Message without address.to - ignored (iframe)', message);
                return;
            }

            if (message.address.to !== serviceId) {
                // console.log('not for us (iframe) ... ignoring', message, serviceId);
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
                listeners[message.name].forEach((listener) => {
                    try {
                        listener.handler(message);
                        return;
                    } catch (ex) {
                        console.error('Error handling listener for message ', message, ex);
                    }
                });
            }
        }

        function getPartner(name) {
            if (!partners[name]) {
                throw new Error('Partner ' + name + ' not registered');
            }
            return partners[name];
        }

        function send(partnerName, message) {
            const partner = getPartner(partnerName);
            message.from = name;
            message.address = {
                to: partner.serviceId,
                from: serviceId,
            };
            sentCount += 1;
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
            return new Promise((resolve, reject) => {
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
            start: start,
            stop: stop,
            send: send,
            request: request,
            receive: receive,
            listen: listen,
            addPartner: addPartner,
            serviceId: serviceId,
        });
    }

    return {
        make: function (config) {
            return factory(config);
        },
    };
});
