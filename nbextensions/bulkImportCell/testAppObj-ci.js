define(['./jobsData', 'common/jobs', 'json!./testAppObj.json'], (JobsData, Jobs, TestAppObj) => {
    'use strict';

    const jobRemapping = {
        'job cancelled whilst in the queue': '5ffdc18a06653f3fce3dac53',
        'job running': '6082cb29d1d7027cac486f70',
        'job cancelled during run': '60145f8c6fc98a309e1a27e1',
        'job died with error': '6001e992b1fc2820d22ee7f5',
        'job finished with success': '5ff4dcd6b254b87cbf066b15',
        'job created': '6081930d4be2b75352ccfffe',
        'job estimating': '6081932b1972f3f3f9dddfc7',
        'job in the queue': '6081933d284fabc05c0342ba',
        'job died whilst queueing': '608194db8ce611e702692399',
    };

    const jobData = JSON.parse(JSON.stringify(JobsData.allJobs)).map((job) => {
        if (jobRemapping[job.job_id]) {
            job.job_id = jobRemapping[job.job_id];
        }
        return job;
    });

    // switch fake job IDs for real ones in narrative
    jobData.forEach((job) => {
        if (jobRemapping[job.job_id]) {
            job.job_id = jobRemapping[job.job_id];
        }
    });

    TestAppObj.exec.jobs = Jobs.jobArrayToIndexedObject(jobData);
    delete TestAppObj.exec.jobState;

    return {
        exec: TestAppObj.exec,
    };
});
