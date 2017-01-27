define([
    './messages'
], function (IFrameMessages) {


// interface ConstructorParams {
//     interval: number,
//     messageManager: IFrameMessages,
//     nodeGetter: Function
// }

    function factory(config) {

        var resizeCheckInterval = config.interval;
        var messageManager = config.messageManager;
        var nodeGetter = config.nodeGetter;

        var lastHeight; //: number;
        var intervalId; //: number;

        function getHeight() {
            var node = node || (nodeGetter && nodeGetter());
            if (!node) {
                return;
            }
            var rect = node.getBoundingClientRect();
            return rect.height;
        }

        function sendSize() {
            messageManager.send('parent', {
                name: 'rendered',
                height: getHeight()
            });
        }

        function listenForResize() {
            lastHeight = getHeight();
            intervalId = window.setInterval(function () {
                var currentHeight = getHeight();
                if (!currentHeight) {
                    return;
                }
                if (lastHeight !== currentHeight) {
                    lastHeight = currentHeight;
                    sendSize();
                }
            }, resizeCheckInterval);
        }

        function start() {
            sendSize();
            listenForResize();
        }

        function stop() {
            if (intervalId) {
                window.clearInterval(intervalId);
            }
        }

        return {
            start: start,
            stop: stop
        };
    }

    return {
        make: function (config) {
            return factory(config);
        }
    };
});