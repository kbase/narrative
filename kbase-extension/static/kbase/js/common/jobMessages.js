define(['common/html', 'common/jobs', 'common/ui', 'util/string'], (html, Jobs, UI, String) => {
    'use strict';

    const div = html.tag('div'),
        p = html.tag('p');

    const outputObjectsBlurb =
        'Any output objects already created will remain in your narrative and can be removed from the Data panel.';

    /**
     * @param {object} args with keys
     *      {string} action - what action is to occur (cancel or retry)
     *      {array} statusList - array of statuses that the action applies to
     *      {array} jobIdList - array of job IDs
     * @returns {object} arguments to create a modal to confirm or cancel the action
     */

    function generateDialogArgs(args) {
        const { action, statusList, jobIdList } = args;
        const statusIx = statusList.reduce((acc, curr) => {
            acc[curr] = 1;
            return acc;
        }, {});

        // for presentation, created and estimating jobs are listed as 'queued'
        ['created', 'estimating'].forEach((status) => {
            if (statusIx[status]) {
                delete statusIx[status];
                statusIx.queued = 1;
            }
        });

        const jobLabelString = String.arrayToEnglish(
            Object.keys(statusIx)
                .sort()
                .map((status) => Jobs.jobLabel({ status: status }))
        );
        const jobString = jobIdList.length === 1 ? '1 job' : jobIdList.length + ' jobs';
        const ucfirstAction = String.capitalize(action);
        return {
            title: `${ucfirstAction} ${jobLabelString} jobs`,
            body: div([
                p([
                    `${ucfirstAction}ing all ${jobLabelString} jobs will terminate the processing of ${jobString}. `,
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
