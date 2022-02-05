define([], () => {
    'use strict';

    class Looper {
        constructor(config = {}) {
            this.requestLoop = null;
            this.pollInterval = config.pollInterval || 2500;
        }

        scheduleRequest(fn, ...args) {
            this.requestLoop = window.setTimeout(() => {
                fn(...args);
            }, this.pollInterval);
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
