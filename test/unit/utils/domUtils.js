define(['react', 'react-dom'], (React, ReactDOM) => {
    'use strict';

    const WAIT_FOR_LOOP_WAIT = 100;

    function waitFor(fun, description, timeout) {
        const started = Date.now();
        return new Promise((resolve, reject) => {
            function loop() {
                setTimeout(() => {
                    if (fun()) {
                        resolve(true);
                        return;
                    }
                    const elapsed = Date.now() - started;
                    if (elapsed > timeout) {
                        reject(new Error(`Condition not detected within timeout period after ${elapsed}ms: ${description}`));
                    } else {
                        loop();
                    }
                }, WAIT_FOR_LOOP_WAIT);
            }
            if (fun()) {
                resolve(true);
                return;
            }
            loop();
        });
    }

    function waitForText({ node, text, label, timeout }) {
        const started = Date.now();
        const test = () => {
            return node.innerText.includes(text);
        };
        return new Promise((resolve, reject) => {
            function loop() {
                setTimeout(() => {
                    if (test()) {
                        resolve(true);
                        return;
                    }
                    const elapsed = Date.now() - started;
                    if (elapsed > timeout) {
                        reject(new Error(`Text not detected within timeout period after ${elapsed}ms: expected "${text}" for the value "${label}"`));
                    } else {
                        loop();
                    }
                }, WAIT_FOR_LOOP_WAIT);
            }
            if (test()) {
                resolve(true);
                return;
            }
            loop();
        });
    }

    function renderComponent(component, props) {
        const node = document.createElement('div');

        const element = React.createElement(component, props, null);
        ReactDOM.render(element, node);
        return { node, element };
    }

    return { waitFor, waitForText, renderComponent };
});
