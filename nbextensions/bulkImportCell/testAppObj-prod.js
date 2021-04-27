define(['./jobsData', 'common/jobs', 'json!./testAppObj-prod.json'], (
    JobsData,
    Jobs,
    ProdTestAppObj
) => {
    'use strict';

    const jobRemapping = {
        'job cancelled whilst in the queue': '6071b90acdf16d2d16260b34',
        'job cancelled during run': '6072fa3abdaed71883f702cf',
        'job died with error': '6072fa25eeb773acaf9df397',
        'job finished with success': '6072f9a6d9eade396406283e',
    };

    // switch fake job IDs for real ones -- see narrative http://localhost:8888/narrative/notebooks/ws.87935.obj.15
    // n.b. the three existing jobs will return 'Not found' as they are from a different narrative
    const jobData = JSON.parse(JSON.stringify(JobsData.allJobs)).map((job) => {
        if (jobRemapping[job.job_id]) {
            job.job_id = jobRemapping[job.job_id];
        }
        if (job.result) {
            job.result = [];
        }
        return job;
    });

    ProdTestAppObj.exec.jobs = Jobs.jobArrayToIndexedObject(
        ProdTestAppObj.exec.jobState.child_jobs.concat(jobData)
    );

    return ProdTestAppObj;
});
