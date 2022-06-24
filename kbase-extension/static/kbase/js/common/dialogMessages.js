define(['common/html', 'common/jobs', 'common/ui', 'util/string'], (html, Jobs, UI, String) => {
    'use strict';

    const div = html.tag('div'),
        p = html.tag('p'),
        blockquote = html.tag('blockquote');

    const outputObjectsBlurb =
        'Any output objects already created will remain in your narrative and can be removed from the Data panel.';

    const messages = {
        deleteCell: {
            title: 'Confirm cell deletion',
            body: div([
                p([
                    'Deleting this cell will cancel any running or queued jobs, as well as deleting all input parameters and other configuration data for the cell. ',
                ]),
                p(outputObjectsBlurb),
                blockquote([
                    'Note: It is not possible to "undo" the deletion of a cell, ',
                    'but if the Narrative has not been saved you can refresh the browser window ',
                    'to load the Narrative from its previous state.',
                ]),
                p('Continue to delete the cell?'),
            ]),
        },
        cancelBulkImport: {
            title: 'Cancel batch job?',
            body: div([
                p([
                    'Canceling the job will halt the processing of all jobs in the batch. ',
                    outputObjectsBlurb,
                ]),
                p('Cancel the running batch job?'),
            ]),
        },
        cancelApp: {
            title: 'Cancel job?',
            body: div([
                p(['Canceling the job will halt the job processing. ', outputObjectsBlurb]),
                p('Cancel the running job?'),
            ]),
        },
        appReset: {
            title: 'Reset and resume editing?',
            body: div([
                p(
                    'This action will clear any errors, results, or logs, and re-enable the Configure tab for editing. You may then change inputs and run the app again.'
                ),
                p(
                    'Any output you have already produced will be left intact in the Narrative and Data Panel'
                ),
                p('Reset the app and resume editing?'),
            ]),
        },
    };

    /**
     * @param {object} args with keys
     *      {string} actionString - what action is to occur (cancel or retry)
     *      {array} statusList - array of statuses that the action applies to
     *      {array} jobList    - array of job objects
     *                           (only used to get the number of jobs)
     * @returns {object} arguments to create a modal to confirm or cancel the action
     */
    function generateCancelRetryDialogArgs(args) {
        const { actionString, statusList, jobList } = args;
        const statusSet = new Set(statusList);

        // for presentation, created and estimating jobs are listed as 'queued'
        ['created', 'estimating'].forEach((status) => {
            if (statusSet.has(status)) {
                statusSet.delete(status);
                statusSet.add('queued');
            }
        });

        const jobLabelString = String.arrayToEnglish(
            Array.from(statusSet.keys())
                .sort()
                .map((status) => Jobs.jobLabel({ status }))
        );
        const jobString = jobList.length === 1 ? '1 job' : jobList.length + ' jobs';
        const ucfirstAction = String.capitalize(actionString);
        const synonym = {
            cancel: 'terminate the processing of',
            retry: 'rerun',
        };
        return {
            title: `${ucfirstAction} ${jobLabelString} jobs`,
            body: div([
                p([
                    `${ucfirstAction}ing all ${jobLabelString} jobs will ${synonym[actionString]} ${jobString}. `,
                    outputObjectsBlurb,
                ]),
                statusList.includes('error')
                    ? p(
                          'Please note that jobs are rerun using the same parameters. Any jobs that failed due to issues with the input, such as misconfigured parameters or corrupted input data, are likely to throw the same errors when run again.'
                      )
                    : '',
                p(`${ucfirstAction} all ${jobLabelString} jobs?`),
            ]),
        };
    }

    /**
     * @param {object} args with keys
     *      {string} action - the action to generate the message for
     * @returns {object} arguments to create a modal to confirm or cancel the action
     */

    function generateDialogArgs(args = {}) {
        const { action } = args;

        if (action === 'retryJobs' || action === 'cancelJobs') {
            // remove the 'Jobs'
            args.actionString = action.substring(0, action.indexOf('J'));
            return generateCancelRetryDialogArgs(args);
        }
        if (action in messages) {
            return messages[action];
        }
        throw new Error(`Cannot generate dialog args for invalid action "${action}"`);
    }

    /**
     *
     * @param {object} args - see generateDialogArgs for arguments
     * @returns {Promise} that resolves to either true or false, depending on whether the user clicked cancel or OK
     */
    function showDialog(args) {
        return UI.showConfirmDialog(generateDialogArgs(args));
    }

    return {
        generateDialogArgs,
        showDialog,
    };
});
