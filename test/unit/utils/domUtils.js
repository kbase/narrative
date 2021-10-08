define([], () => {
    'use strict';

    function waitFor(fun, timeout) {
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
                        reject(new Error(`condition not detected within timeout period after ${elapsed}ms`));
                    }
                    loop();
                }, 0.1);
            }
            if (fun()) {
                resolve(true);
                return;
            }
            loop();
        });
    }

    return { waitFor };
});
