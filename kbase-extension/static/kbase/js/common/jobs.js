define([
    'bluebird',
    'base/js/namespace'
], (Promise, Jupyter) => {
    'use strict';

    /*
     * Exceptions
     */
    function JobError(message, remoteStacktrace) {
        this.name = 'JobError';
        this.message = message;
        this.stack = (new Error()).stack;
        this.remoteStacktrace = remoteStacktrace;
    }
    JobError.prototype = Object.create(Error.prototype);
    JobError.prototype.constructor = JobError;

    function defaultHandler(call, content) {
        if (content.status === 'error') {
            console.error('Jupyter kernel request error', 'Call: ' + call, 'Content', content);
        }
    }

    /*
     * Strip out console commands from text captured from console:
     * http://search.cpan.org/~jlmorel/Win32-Console-ANSI-1.10/lib/Win32/Console/ANSI.pm
     *
     */
    function consoleToText(consoleText) {
        return consoleText.replace(/\[([\s\S]*?)m/g, '');
    }

    function runPython(command) {
        return new Promise((resolve, reject) => {
            const callbacks = {
                shell: {
                    reply: function (content) {
                        defaultHandler('reply', content);
                    },
                    payload: {
                        set_next_input: function (content) {
                            defaultHandler('set_next_input', content);
                        }
                    }
                },
                iopub: {
                    output: function (content) {
                        if (content.msg_type === 'error') {
                            const trace = content.content.traceback.map((line) => {
                                return consoleToText(line);
                            }),
                                message = 'Error in iopub output: ' + content.content.ename + ':' + content.content.evalue;
                            reject(new JobError(message, trace));
                        } else {
                            // console.log('IOPUB', content);
                            resolve(JSON.parse(content.content.text));
                        }
                    },
                    clear_output: function (content) {
                        defaultHandler('clear_output', content);
                    }
                },
                input: function (content) {
                    defaultHandler('input', content);
                }
            },
            options = {
                silent: true,
                user_expressions: {},
                allow_stdin: false,
                store_history: false
            };

            if (Jupyter.notebook.kernel.is_connected()) {
                Jupyter.notebook.kernel.execute(command, callbacks, options);
            } else {
                console.error('Not looking up jobs - kernel is not connected');
                reject(new Error('Not looking up jobs - kernel is not connected'));
            }
        });
    }

    function deleteJob(jobId) {
        /*var command = [
            'from biokbase.narrative.common.kbjob_manager import KBjobManager',
            'jm = KBjobManager()',
            'print jm.delete_jobs(["' + jobId + '"], as_json=True)'
        ].join('\n');
        return runPython(command);*/
        throw new Error("Method is not supported anymore");
    }

    /*
     * For a given job, returns the log lines after "skip" lines, as an Promise
     * which will deliver an array of strings.
     */
    function getLogData(jobId, skip) {
        /*var command = [
            'from biokbase.narrative.common.kbjob_manager import KBjobManager',
            'import json',
            'job_manager = KBjobManager()',
            'print json.dumps(job_manager.get_job_logs({"job_id":"' + jobId + '","skip_lines":' + skip + '}))'
        ].join('\n');
        return runPython(command)
            .then(function (data) {
                return data.lines;
            });*/
        throw new Error("Method is not supported anymore");
    }

    /**
     * A jobState is deemed valid if
     * 1. It's an object (not an array or atomic type)
     * 2. It has a created key
     * 3. It has a job_id key
     * 4. There's others that are necessary, but the top two are sufficient to judge if it's valid
     *    enough and up to date. This function should be updated as necessary.
     *
     * This is intended to be used to make sure that jobStates are of the latest version of the
     * execution engine.
     * @param {object} jobState
     */
    function isValidJobState(jobState) {
        if (typeof jobState === 'object' && jobState !== null) {
            return jobState.hasOwnProperty('created') && jobState.hasOwnProperty('job_id');
        }
        return false;
    }

    return {
        getLogData: getLogData,
        deleteJob: deleteJob,
        isValidJobState: isValidJobState
    };
});
