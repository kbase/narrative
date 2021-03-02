/**
 * The results tab and its child tabs - reports and objects viewers - use some
 * fake data described here for unit tests.
 *
 * This returns
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
    };
});
