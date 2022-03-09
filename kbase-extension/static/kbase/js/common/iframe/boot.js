define(['./messages', './heightNotifier'], (Messages, HeightNotifier) => {
    'use strict';
    function getParams(id) {
        if (!document.getElementById(id).hasAttribute('data-params')) {
            console.warn(
                'This iframe is not configured correctly - the data-params attribute is required'
            );
            return;
        }
        return JSON.parse(
            decodeURIComponent(document.getElementById(id).getAttribute('data-params'))
        );
    }

    function factory(config) {
        const params = getParams(config.iframeId);
        const messageManager = Messages.make({
            root: window,
            iframeId: params.iframeId,
            name: params.iframeId,
        });
        const iframeHeightNotifier = HeightNotifier.make({
            interval: 200,
            messageManager: messageManager,
            nodeGetter: function () {
                return document.body;
            },
        });

        function stop(message) {
            // TODO: stop the notifier, message manager.
        }

        function start() {
            messageManager.start();

            messageManager.addPartner({
                name: 'parent',
                window: window.parent,
                host: params.parentHost,
                serviceId: params.serviceId,
            });

            messageManager.listen({
                name: 'start',
                handler: function (message) {
                    iframeHeightNotifier.start();
                },
            });

            messageManager.listen({
                name: 'stop',
                handler: function (message) {
                    stop(message);
                },
            });

            messageManager.send('parent', {
                name: 'ready',
                iframeId: params.iframeId,
            });

            document.getElementById(params.iframeId).addEventListener('click', () => {
                messageManager.send('parent', {
                    name: 'clicked',
                    iframeId: params.iframeId,
                });
            });
        }

        return {
            start: start,
            stop: stop,
        };
    }

    return {
        make: function (config) {
            return factory(config);
        },
    };
});
