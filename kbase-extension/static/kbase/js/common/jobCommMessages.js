define(['json!kbase/config/job_config.json'], (JobConfig) => {
    'use strict';

    const REQUESTS = {},
        RESPONSES = {},
        // channel types
        CHANNEL = {
            CELL: 'cell',
            JOB: 'jobId',
        },
        // param names
        PARAM = JobConfig.params;

    JobConfig.requests.forEach((req) => {
        REQUESTS[req] = JobConfig.message_types[req];
    });

    JobConfig.responses.forEach((resp) => {
        RESPONSES[resp] = JobConfig.message_types[resp];
    });

    return {
        // message types
        MESSAGE_TYPE: JobConfig.message_types,
        RESPONSES,
        REQUESTS,
        // standardised params
        PARAM,
        // channel types
        CHANNEL,
    };
});
