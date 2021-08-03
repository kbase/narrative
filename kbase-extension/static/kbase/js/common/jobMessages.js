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
     *      {array} jobList - array of job objects
     * @returns {object} arguments to create a modal to confirm or cancel the action
     */

    function generateDialogArgs(args) {
        const { action, statusList, jobList } = args;
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
                .map((status) => Jobs.jobLabel({ status: status }))
        );
        const jobString = jobList.length === 1 ? '1 job' : jobList.length + ' jobs';
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
