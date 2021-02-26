define(['./messages'], (IFrameMessages) => {
    // interface ConstructorParams {
    //     interval: number,
    //     messageManager: IFrameMessages,
    //     nodeGetter: Function
    // }

    function factory(config) {
        const resizeCheckInterval = config.interval;
        const messageManager = config.messageManager;
        const nodeGetter = config.nodeGetter;

        let lastHeight; //: number;
        let intervalId; //: number;

        function getHeight() {
            var node = node || (nodeGetter && nodeGetter());
            if (!node) {
                return;
            }
            const rect = node.getBoundingClientRect();
            return rect.height;
        }

        function sendSize() {
            messageManager.send('parent', {
                name: 'rendered',
                height: getHeight(),
            });
        }

        function listenForResize() {
            lastHeight = getHeight();
            intervalId = window.setInterval(() => {
                const currentHeight = getHeight();
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
            stop: stop,
        };
    }

    return {
        make: function (config) {
            return factory(config);
        },
    };
});
