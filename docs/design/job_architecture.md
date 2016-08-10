Some notes, first:

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
