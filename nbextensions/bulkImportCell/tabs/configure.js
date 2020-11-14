define([], () => {
    'use strict';

    class ConfigureWidget {
        constructor() {
            this.container = null;
        }

        start(args) {
            this.container = args.node;
            this.container.innerHTML = 'configure some things!';
        }

        stop() {
            this.container.innerHTML = '';
        }
    }

    return ConfigureWidget;
});
