# Job Management Architecture

## Job Management flow on backend (in IPython kernel, biokbase.narrative.jobs package)
This is mostly linear.
1. User clicks "Run" on App Cell in browser.
  * Cell provides app_id, cell_id, run_id, and parameters.
  * Invokes biokbase.narrative.appmanager.AppManager.run_app.
2. `AppManager.run_app` validation:
  * App (based on id, version, and spec).
  * Parameters.
3. `AppManager.run_app` preparation and start:
  * Convert app params from user-readable to machine-understandable (via spec input_mapping).
  * Fetch cell id, run id, workspace id, user token.
  * Create an agent token on behalf of the user.
  * Submit all of the above to `NarrativeJobService.run_job`.
4. Get response from `NarrativeJobService.run_job`
  * Combine with info from step 3, create `biokbase.narrative.jobs.job.Job` object.
  * submit new `Job` to `biokbase.narrative.jobs.jobmanager.JobManager` singleton object.
5. `AppManager` tells the `JobComm` channel to (1) fetch the new job status and push it to the browser, and (2) start the job lookup loop for the newly created job. (calls `AppManager.register_new_job`)

JobManager initialization and startup.
1. User starts kernel (opens a Narrative, or clicks Kernel -> Restart)
2. `jobCommsChannel` (front end widget) executes the following kernel call: `JobManager().initialize_jobs(); JobComm().start_update_loop`
3. `JobManager` does:
  * Get current user and workspace id.
  * `ExecutionEngine2.check_workspace_jobs` with the workspace id - gets the set of jobs in that workspace, and builds them into `Job` objects.
4. `JobComm` does:
  * Starts the lookup loop thread.
  * On the first pass, this looks up status of all jobs and pushes them forward to the browser.
  * If any jobs are in a terminal state, they'll stopped being looked up automatically. If all jobs are terminated, then the loop thread itself stops.

JobComm status lookup loop.
1. Calls `JobComm._lookup_job_status_loop`, which in turn calls `JobComm.lookup_all_job_states`. This gets forwarded to `JobManager.lookup_all_job_states`, and the results pushed to the browser as a comm channel message.
2. Internal to `JobManager.lookup_all_job_states`, the following steps happen:
  * Build a list of job ids to lookup - those that are flagged for lookup.
  * Call `_construct_job_status_set`
  * Call `_get_all_job_states`
    * Gets list of all job ids the JM is tracking.
    * Retrieves some states from cache (cache is used for finalized jobs).
    * Calls `NarrativeJobService.check_jobs` on everything that's not finalized.
    * Injects `run_id` and `cell_id` into states
    * Returns dict of states.
3. Sends result to browser over comm channel


## Data Structures
### Job state
In kernel, as retrieved from NJS.check_job
(described by example)
```json
{
    "status": [
        "2019-05-07T22:42:41+0000", 
        "started", 
        "queued", 
        null, 
        null, 
        0, 
        0
    ], 
    "job_id": "5cd209dcaa5a4d298c5dc1c2", 
    "job_state": "queued", 
    "creation_time": 1557268961909, 
    "finished": 0, 
    "sub_jobs": [], 
}
```

As sent to browser, includes cell info and run info
```
{
    owner: string (username),
    spec: app spec (optional)
    widget_info: (if not finished, None, else...) job.get_viewer_params result
    state: {
        job_state: string,
        error (if present): dict of error info,
        cell_id: string/None,
        run_id: string/None,
        canceled: 0/1
        creation_time: epoch second
        exec_start_time: epoch/none,
        finish_time: epoch/none,
        finished: 0/1,
        job_id: string,
        status: (from UJS) [
            timestamp(last_update, string),
            stage (string),
            status (string),
            progress (string/None),
            est_complete (string/None),
            complete (0/1),
            error (0/1)
        ],
    }
}
```


## Application, execution cycle notes:

User clicks App Panel -> App Cell inserted. Done!

User clicks "Run" on App Cell (or otherwise executes a function with a cell_id stuck to it) ->
App Cell executes code (should disable the Run button) ->
Kernel goes through AppManager.run_app steps:
  sends over comm channel:
  1. run_status with serialized events:
    a. validating_app
    b. validated_app
    c. launching_job
    d. launched_job
  2. job_status
  3. new_job (empty, triggers a save)
  4. run_app_error (on NJSW.run_job failure)
->
Job Panel catches these and translates messages before sending out over Bus:
  run_status -> run-status
  job_status -> job-status
  new_job -> null
  run_app_error -> ... nothing? Should get a message.

App Cell catching messages:
run-status -> updates FSM from launching..... launched Job (with an id in job-status), now listens to jobId channel
job-status -> updates copy of job state, elapsed time, display of state
job-status (with terminal status) -> updates job state, expectes no more changes, creates output cell and area

JobManager kernel loop:
  loops over all jobs, gets state, sends job_status for all
  sends job_err for individual jobs if 
    1. job is missing (e.g. JobManager maintains a handle, but job.state() fails because NJS can't find it
    2. Network error
  JobPanel translates messages

Job Canceling:
Permissions!
  View permissions - no permission to touch jobs
  Edit permissions - can cancel jobs, start jobs, delete own started job, not delete other's started jobs
  Admin - can cancel, delete, view, start

User cancels job - either in App Cell Cancel button or Job Panel Cancel button
  sends cancel-job to JobPanel
  sends cancel_job to kernel
  JobManager tries to cancel the job
    sends job_canceled if successful (or already canceled)
    sends job_err if not - with sensible reason

User deletes job - either in App Cell or Job Panel
  sends delete-job to JobPanel
  sends delete_job to kernel
  JobManager tries to cancel the job (if not in a completed state):
    sends job_canceled if successful
    sends job_err if not
  JobManager tries to delete the job:
    sends job_deleted if successful
    sends job_err if not


Messages
to kernel:
* all_status
* job_status
* start_update_loop
* stop_update_loop
* start_job_update
* stop_job_update
* job_info

to browser:
* job_does_not_exist - 
{
  job_id: string,
  source: string
}
* job_comm_error 
{

}
* job_status_all
{
  <job_id>: {
    state: {

    },
    spec: {

    },
    widget_info: {

    },
    owner: string
  }
}
* job_info
{

}
* job_status
{
  state: {
    job_id: string,

  },
  spec: {

  },
  widget_info: {

  }
}
* job_logs
{
  job_id: string,
  latest: boolean,
  first: int,
  max_lines: int,
  lines: [{
    line: str,
    is_error: 0 or 1
  }, ...]
}


* new_job --> save_checkpoint
* run_status
{

}
* job_err
{

}
* job_canceled
* job_init_err
* job_init_partial_err --> no-op (can't have partial errors anymore)
* start --> no-op
* result
