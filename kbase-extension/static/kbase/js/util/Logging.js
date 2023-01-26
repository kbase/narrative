define([], () => {
    /**
     * 
     * @param {string} code - executable Python code in a string
     * @returns {Promise<string>} - A promise which will result in a string the value
     *                              of which was that returned by the last statement
     *                              in the Python code.
     */
    async function executePython(code) {
        return new Promise((resolve, reject) => {
            Jupyter.notebook.kernel.execute(code, {
                iopub: {
                    output: (msg) => {
                        if ('content' in msg) {
                            if ('data' in msg.content) {
                                if ('text/plain' in msg.content.data) {
                                    resolve(msg.content.data['text/plain']);
                                }  else {
                                    reject(new Error('Cannot locate "text/plain" response in "content.data" of output message'));
                                }
                            } else if ('ename' in msg.content) {
                                reject(new Error(`Error executing logging kernel command: ${msg.content.ename}, ${msg.content.evalue}`))
                            } else {
                                reject(new Error('Cannot locate "data" or "ename" in output message "content"'))
                            }
                        } else {
                            reject(new Error('Cannot locate "content" in output message'));
                        }
                    }
                }
            }, { 
                store_history: false,
                silent: false
            });
        });
    }
    class Logging {
        async execBackendLogging(event, data, level) {
            // Is it really possible to go to this code if the nodebook
            // and kernel have not been initialized?
            if (!Jupyter || !Jupyter.notebook || !Jupyter.notebook.kernel) {
                console.warn('Jupyter not fully set up, cannot log');
                return;
            }

            if (!Jupyter.notebook.kernel.is_connected()) {
                console.warn('Jupyter kernel not connected, cannot log');
                return
            }

            const code = `
                from biokbase.narrative.common.kblogging import log_ui_event
                log_ui_event("${event}", ${JSON.stringify(data)}, "${level}")
            `

            // Wrap in try/catch to be resilient to logging failures.
            try {
                return await executePython(code);
            } catch (ex) {
                console.error('Error executing logging code', ex);
            }
        }
        log(event, data, level) {
            return this.execBackendLogging(event, data, level);
        }
        // One method per logging level. These are the methods
        // that should be used for logging.
        debug(event, data) {
            return this.log(event, data, 'debug');
        }
        info(event, data) {
            return this.log(event, data, 'info');
        }
        warning(event, data) {
            return this.log(event, data, 'warning');
        }
        error(event, data) {
            return this.log(event, data, 'error');
        }
        critical(event, data) {
            return this.log(event, data, 'critical');
        }
    }

    return Logging
})