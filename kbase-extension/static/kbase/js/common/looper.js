define([], () => {
    'use strict';

    const debugFn = (...args) => {
        // eslint-disable-next-line no-console
        console.log(...args);
    };

    class Looper {
        constructor(config = {}) {
            this.requestLoop = null;
            this.pollInterval = config.pollInterval || 2500;
            this.devMode = config.devMode || false;
            this.debug = this.devMode
                ? debugFn
                : () => {
                      /* no op */
                  };
        }

        scheduleRequest(fn, ...args) {
            const self = this;
            if (self.requestLoop) {
                self.debug('function already scheduled; ignoring new scheduling request');
                return;
            }
            self.requestLoop = window.setTimeout(() => {
                self.debug('executing scheduled function');
                fn(...args);
                self.requestLoop = null;
            }, self.pollInterval);
        }

        clearRequest() {
            if (this.requestLoop) {
                window.clearTimeout(this.requestLoop);
                this.requestLoop = null;
            }
        }
    }
    return Looper;
});
