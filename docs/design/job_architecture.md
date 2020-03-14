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
In kernel, as retrieved from EE2.check_job
(described by example)
```json
{
    "user": "wjriehl",
    "authstrat": "kbaseworkspace",
    "wsid": 46214,
    "status": "queued",
    "updated": 1583863267977,
    "queued": 1583863267977,
    "scheduler_type": "condor",
    "scheduler_id": "14221",
    "job_input": {
        "wsid": 46214,
        "method": "simpleapp.simple_add",
        "params": [
            {
                "workspace_name": "wjriehl:narrative_1580237536246",
                "base_number": 5
            }
        ],
        "service_ver": "f5a7586776c31b05ae3cc6923c2d46c25990d20a",
        "app_id": "simpleapp/example_method",
        "source_ws_objects": [],
        "parent_job_id": "None",
        "requirements": {
            "clientgroup": "njs",
            "cpu": 4,
            "memory": 23000,
            "disk": 100
        },
        "narrative_cell_info": {
            "run_id": "d7558838-a712-42d3-9511-c4b95f3651fe",
            "token_id": "e80f4f81-b7bb-4483-a92b-b1e0200f8a20",
            "tag": "beta",
            "cell_id": "c04c19bd-20ce-41be-b793-50f84de8f60b"
        }
    },
    "job_id": "5e67d5e395d1f00a7cf4ea21",
    "created": 1583863267000
}
```

As sent to browser, includes cell info and run info
```
{
    owner: string (username, who started the job),
    spec: app spec (optional)
    widget_info: (if not finished, None, else...) job.get_viewer_params result
    state: {
        job_id: string,
        status: string,
        created: epoch ms,
        updated: epoch ms,
        queued: optional - epoch ms,
        finished: optional - epoc ms,
        terminated_code: optional - int,
        tag: string (release, beta, dev),
        parent_job_id: optional - string or null,
        run_id: string,
        cell_id: string,
        errormsg: optional - string,
        error (optional): {
          code: int,
          name: string,
          message: string (should be for the user to read),
          error: string, (likely a stacktrace)
        },
        error_code: optional - int
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


## Message formats
Messages sent to the kernel from the front end are mostly pretty simple. They all have a request string, and most involve a job id and that's it. The job logs request also have which line to start with and how many lines to get back.

Most of these also trigger a response, though not all.

The actual message that the JobComm sees in the kernel has this format:
```
{
  "msg_id": "some random string",
  "content": {
    "data": {
      "request_type": "a string - see below",
      "job_id": "not required, but present in most"
      ... other keys, depending on message ...
    }
  }
}
```
The point here is that all messages have a `request_type`, most are accompanied by a `job_id`, and a few have some extra info. But they're in a flat structure that's formatted by the Jupyter kernel.


### Messages sent to the kernel
These are organized by the `request_type` field, followed by the expected response message. Additional parameters and their formats are given as a list below the request name. E.g. the `job_status` message will be sent as:
```json
{
  "msg_id": "some string",
  "content": {
    "data": {
      "request_type": "job_status",
      "job_id": "a_job_id",
      "parent_job_id": "another_job_id"
    }
  }
}
```

`all_status` -- responds with `job_status_all`  

`job_status` -- responds with job_status
* `job_id` - string,
* `parent_job_id` - optional string

`start_update_loop` -- no specific response, but generally with `job_status_all`  
`stop_update_loop` -- no response  
`start_job_update` -- no specific response, but generally with `job_status`
* `job_id` - string
* `parent_job_id` - optional string

`stop_job_update` -- no response
* `job_id` - string
* `parent_job_id` - optional string

`job_info` -- responds with `job_info`
* `job_id` - string
* `parent_job_id` - optional string

`job_logs` -- responds with `job_logs`
* `job_id` - string
* `parent_job_id` - optional string
* `first_line` - int >= 0,
* `num_lines` - int > 0

`job_logs_latest` -- responds with `job_logs`
* `job_id` - string
* `parent_job_id` - optional string
* `num_lines` - int > 0


### Messages sent to the browser:


to browser:

In the error 

* job_does_not_exist - this is an error message triggered when trying to get info/state/logs on a job that either doesn't exist in EE2 or that the JobManager doesn't have associated with the running narrative.
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
    user: string,
    authstrat: string,
    wsid: int,
    status: string,
    updated: int,
    queued: int,
    running: int,
    finished: int,
    scheduler_type: string,
    scheduler_id: string,
    job_input: object,
    job_output: object,
    created: int,
    cell_id: string,
    run_id: string
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
