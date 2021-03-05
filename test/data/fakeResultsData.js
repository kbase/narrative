/**
 * The results tab and its child tabs - reports and objects viewers - use some
 * fake data described here for unit tests.
 *
 * This returns a set of fake, good, data with 3 keys:
 *  reports: a set of dummy report objects keyed on report reference
 *  objectInfos: a set of dummy workspace object info parts (just the first 3 parts of the usual
 *      ObjectInfo tuple), keyed on object reference,
 *  objectData: an array of post-processed set of object data. This is the result of running
 *      `ResultsTab.fetchReportData`, and is fed to both the outputWidget and reportWidget.
 */
define([], () => {
    'use strict';
    return {
        reports: {
            '1/2/3': {
                objects_created: [
                    {
                        description: 'An Object',
                        ref: '7/8/9',
                    },
                ],
            },
            '4/5/6': {
                objects_created: [
                    {
                        description: 'Another Object',
                        ref: '10/11/12',
                    },
                ],
            },
        },

        objectInfos: {
            '7/8/9': [8, 'SomeObject', 'KBaseGenomes.Genome-1.0'],
            '10/11/12': [11, 'SomeOtherObject', 'KBaseGenomeAnnotations.Assembly-2.0'],
        },

        // gets fed directly to common/cellComponents/tabs/results/reportWidget and
        // common/cellComponents/tabs/results/outputWidget
        objectData: [
            {
                name: 'SomeObject',
                type: 'KBaseGenomes.Genome-1.0',
                description: 'An Object',
                reportRef: '1/2/3',
                ref: '7/8/9',
            },
            {
                name: 'SomeOtherObject',
                type: 'KBaseGenomeAnnotations.Assembly-2.0',
                description: 'Another Object',
                reportRef: '4/5/6',
                ref: '10/11/12',
            },
        ],
    };
});
