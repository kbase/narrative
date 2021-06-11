# Job Management Architecture
The Narrative job manager is based on a data flow that operates between the browser, the IPython Kernel behind the Narrative, and the KBase Execution Engine (EE2) behind that. In general, each bit of data flows between those three stops.

In general, there's a single point of information flow on the front end and one on the backend.

# Comm channels
Jupyter provides a "Comm" object that allows for custom messaging between the frontend and the kernel ([details and documentation here](https://jupyter-notebook.readthedocs.io/en/stable/comms.html)). This provides an interface for the frontend to directly request information from the kernel, and to listen to asynchronous responses. On the kernel-side, it allows one or more modules to register message handlers to process those requests out of the band of the usual kernel invocation. These are used to implement the Jupyter Notebook's ipywidgets, for example.

The Narrative Interface uses one of these channels to manage job information. These are funneled through an interface on the frontend side and a matching one in the kernel.

## Frontend Comm Channel
On the frontend, there's a `jobCommChannel.js` module that uses the MiniBus system to communicate. So, the following happens. Frontend modules use the bus system to send one of the following messages over the main channel, which then get interpreted and crafted into a message that gets passed through a kernel comm object. Most of these take one or more inputs. These are listed below the command, where applicable.

This section is broken into two parts - kernel requests and kernel responses. Both of these are from the perspective of the frontend Javascript stack, using an AMD module and the Runtime object. The request parameters and examples are given first, then the responses below.

## Bus requests
These messages are sent to the `JobCommChannel` on the front end, to get processed into messages sent to the kernel.
All the `request-job-*` requests take as arguments either a single job ID string, or an array of job IDs.

`ping-comm-channel` - sees that the comm channel is open through the websocket

`request-job-status` - gets the status for a job or an array of jobs.
  * `jobId` - a string, the job id OR
  * `jobIdList` - an array of job IDs
  * `parentJobId` - (optional) a string, the id of the requested job's "parent" job

`request-job-update` - request the status for a job or jobs, but start an update cycle so that it's continually requested.
  * `jobId` - a string, the job id OR
  * `jobIdList` - an array of job IDs
  * `parentJobId` - (optional) a string, the id of the requested job's "parent" job

`request-job-completion` - signal that the front end doesn't need any more updates for the specified job(s), so stop sending them for each loop cycle. Doesn't actually end the job, only requests for updates.
  * `jobId` - a string, the job id OR
  * `jobIdList` - an array of job IDs
  * `parentJobId` - (optional) a string, the id of the requested job's "parent" job

`request-job-info` - request information about the job(s), specifically app id, spec, input parameters and (if finished) outputs
  * `jobId` - a string, the job id OR
  * `jobIdList` - an array of job IDs
  * `parentJobId` - (optional) a string, the id of the requested job's "parent" job

`request-job-cancellation` - request that the server cancel the running job(s)
  * `jobId` - a string, the job id OR
  * `jobIdList` - an array of job IDs
  * `parentJobId` - (optional) a string, the id of the requested job's "parent" job

`request-job-retry` - request that the server rerun a job or set of jobs
  * `jobId` - a string, the job id OR
  * `jobIdList` - an array of job IDs

`request-job-log` - request the job logs starting at some given line.
  * `jobId` - a string, the job id OR
  * `jobIdList` - an array of job IDs
  * `options` - an object, with attributes:
    * `first_line` - the first line (0-indexed) to request
    * `num_lines` - the number of lines to request (will get back up to that many if there aren't more)

`request-job-log-latest` - request the latest several job log lines
  * `jobId` - a string, the job id OR
  * `jobIdList` - an array of job IDs
  * `options` - an object, with attributes:
    * `num_lines` - the number of lines to request (will get back up to that many if there aren't more)

### Usage Example
The comm channel is used through the main Bus object that's instantiated through the global `Runtime` object. That needs to be included in the `define` statement for all AMD modules. The bus is then used with its `emit` function (you have the bus *emit* a message to its listeners), and any inputs are passed along with it.

Generally, this is used as follows (without much detail. For a readable real example, check out the `jobLogViewer.js` module):

```Javascript
define(
  ['common/runtime', ... other modules ...],
  function(Runtime, ...others...) {
    let runtime = Runtime.make();
    runtime.bus().emit('some-request', {
      inputKey: 'value'
    });
  }
);
```

Or, a more specific usage that requests the first 10 job log lines:
```Javascript
define(
  ['common/runtime'],
  function(Runtime) {
    let runtime = Runtime.make();
    runtime.bus().emit('request-job-log', {
      jobId: 'some_job_id',
      options: {
        first_line: 0,
        num_lines: 10
      }
    });
  }
);
```

## Bus responses
When the kernel sends a message to the front end, the only module set up to listen to them is the `JobCommChannel` as mentioned above. This takes the responses, unpacks them, and turns them into a response message that is passed back over the bus to any frontend Javascript module that listens to them. The message types are described below, along with the content that gets sent, followed by an example of how to make use of them.

### Cell-related

`run-status` - updates the run status of the job - this is part of the initial flow of starting a job through the AppManager.
  * TODO

### Job-related

`job-canceled` - sent when a job has been canceled in the kernel, as a response to other messages
  * `jobId` - string, the job id
  * `via` - string, generally "job_canceled"

`job-cancel-error` - a cancel request has thrown an error
  * `jobId` - string, the job id
  * `message` - string, a reason for the error

`job-does-not-exist` - sent in response to a request for information about a job that doesn't exist. Jobs might not exist if (1) they have been previously canceled, or (2) a malformed request was sent.
  * `jobId` - string, the job id
  * `source` - string, the source of the message in the kernel (what service, or module, was invoked. Usually "JobManager" or "ExecutionEngine2")

`job-error` - sent in response to an error that happened on job information lookup, or another error that happened while processing some other message to the JobManager.
  * `jobId` - string, the job id
  * `message` - string, some message about the error

`job-info` - contains information about the current job
  * `jobId` - string, the job id
  * `jobInfo` - object, the job information object (see the **Data Structures** section below)

`job-logs` - sent with information about some job logs.
  * `jobId` - string, the job id
  * `logs` - the raw message data from the kernel. (see the **Data Structures** section below)
  * `latest` - if truthy, then these are the latest logs, if falsy, then they don't have to be the latest logs.

`job-log-deleted` - a log request has thrown an error
  * `jobId` - string, the job id
  * `message` - string, a reason for the error

`job-status` - contains the current job state
  * `jobId` - string, the job id
  * `jobState` - object, describes the job state (see the **Data Structures** section below for the structure)
  * `outputWidgetInfo` - object, contains the parameters to be sent to an output widget. This will be different for all widgets, depending on the App that invokes them.

### Usage example
As in the Bus requests section above, the front end response handling is done through the Runtime bus. The bus provides both an `on` and a `listen` function, examples will show how to use both. Generally, the `listen` function is more specific and binds the listener to a specific bus channel. These channels can invoke the jobId, or the cellId, to make sure that only information about specific jobs is listened for.

The `listen` function takes an object with three attributes as input - a channel (either the cellId or jobId), a key (with the type of message to listen for), and a handle, which is a function to process the message. This is probably the easiest way to handle messages. A usage would look like this:

```Javascript
define(['common/runtime'],
  function(Runtime) {
    let runtime = Runtime.make();
    let listenerId = runtime.bus().listen({
      channel: {
        jobId: 'some_job_id'
      },
      key: {
        type: 'job-status'
      },
      handle: (message) => {
        ...process the message...
      }
    })
  }
);
```

The `on` function requires a constructed channel bus, premade and reusable for a given channel. So you would make a channel bus that would always receive messages for that channel, and instruct it on what to do when a message of a given type arrives. That looks like this:
```Javascript
define(['common/runtime'],
  function(Runtime) {
    let runtime = Runtime.make();
    let cellBus = runtime.bus().makeChannelBus({
      name: {
        cell: 'some_cell_id'
      }
    });
    let listenerId = cellBus.on('run-status', (message) => {
      ...process the message...
    });
  }
);
```
Note that both of these create events that get bound to the DOM, and when the widget is removed, they should be cleaned up. This can be done by calling `bus.removeListener(id)` with the created `listenerId`. If you created a channel bus, then that bus should be used, otherwise the main runtime.bus() object should be used.

## Kernel Comm Channel
On the kernel side, a complementary comm channel is used. This is set up in the `biokbase.narrative.jobs.jobcomm.JobComm` class. On Narrative load, page reload, or kernel restart, this is initialized to handle any messages sent to the kernel. The structure here is slightly different than the structure used on the front end. Likewise, all the message names are different. They all have a request string, most involve a job id, and that's it. The job logs request also have which line to start with and how many lines to get back.

Note that these are autogenerated by the frontend `JobCommChannel` object, using the `Jupyter.kernel.comm` package.

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

## Messages sent to the kernel
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

`all_status` - request the status of all currently running jobs, responds with `job_status_all`

`job_status` - request job status, responds with `job_status` for each job
* `job_id` - string OR `job_id_list` - array of strings
* `parent_job_id` - optional string

`start_update_loop` - request starting the global job status update thread, no specific response, but generally with `job_status_all`

`stop_update_loop` - request stopping the global job status update thread, no response

`start_job_update` - request updating job(s) during the update thread, no specific response, but generally with `job_status`
* `job_id` - string OR `job_id_list` - array of strings
* `parent_job_id` - optional string

`stop_job_update` - request halting update for job(s) during the update thread, no response
* `job_id` - string OR `job_id_list` - array of strings
* `parent_job_id` - optional string

`job_info` - request general information about job(s), responds with `job_info` for each job
* `job_id` - string OR `job_id_list` - array of strings
* `parent_job_id` - optional string

`job_logs` - request job log information, responds with `job_logs` for each job
* `job_id` - string OR `job_id_list` - array of strings
* `parent_job_id` - optional string
* `first_line` - int >= 0,
* `num_lines` - int > 0

`job_logs_latest` - request the latest set of lines from job logs, responds with `job_logs`
* `job_id` - string OR `job_id_list` - array of strings
* `parent_job_id` - optional string
* `num_lines` - int > 0

`cancel_job` - cancel a job or list of jobs; responds with `job_canceled` for each job
* `job_id` - string OR `job_id_list` - array of strings
* `parent_job_id` - optional string

`retry_job` - retry a job or list of jobs, responds with `jobs_retried` and `new_job`
* `job_id` - string OR `job_id_list` - array of strings

## Messages sent from the kernel to the browser
These are all caught by the `JobCommChannel` on the browser side, then parsed and sent as the bus messages described above. Like other kernel messages, they have a `msg_type` field, and a `content` field containing data meant for the frontend to use. They have a rough structure like this:

```json
{
  "data": {
    "msg_type": "some_message",
    "content": {
      "key1": "value1",
      "key2": "value2"
    }
  }
}
```

a specific example:
```json
{
  "msg_id": "some_string",
  "data": {
    "msg_type": "job_status",
    "content": {
      "state": {
        "status": "running",
        ... other state keys ...
      },
      "spec": {},
      "widget_info": {}
    }
  }
}
```

These are described below. The name (`msg_type`) is given, followed by the keys given in the `content` block.

By design, these should only be seen by the `JobCommChannel` instance, then sent into bus messages that get sent on specific channels. That information is also given in each block.

### `job_does_not_exist`
This is an error message triggered when trying to get info/logs on a job that either doesn't exist in EE2 or that the JobManager doesn't have associated with the running narrative.

**content**
  * `job_id` - string OR `job_id_list` - array of strings, the job id(s)
  * `source` - string, the source of the error

**bus** `job-does-not-exist`

### `job_comm_error`
A general job comm error, capturing most errors that get thrown by the kernel

**content** (this varies, but usually includes the below)
  * `request_type` - the original request message that wound up in an error
  * `job_id` - string OR `job_id_list` - array of strings, the job id(s) (if present)
  * `message` - string, an error message

**bus** one of `job-cancel-error`, `job-log-deleted`, `job-error`

### `job_status_all`
The set of all job states for all running jobs, or at least the set that should be updated (those that are complete and not requested by the front end are not included - if a job is sitting in an error or finished state, it doesn't need ot have its app cell updated)

**content** - all of the below are included, but the top-level keys are all job id strings, e.g.:
```json
{
  "job_id_1": { ...contents... },
  "job_id_2": { ...contents... }
}
```
  * `state` - the job state (see the **Data Structures** section below for details
  * `widget_info` - the parameters to send to output widgets, only available for a completed job
  * `owner` - string, username of user who submitted the job

**bus** - a series of `job-status` or `job-deleted` messages

### `job_info`
Includes information about the running job

**content**
  * `app_id` - string, the app id (format = `module_name/app_name`)
  * `app_name` - string, the human-readable app name
  * `job_id` - string, the job id
  * `job_params` - the unstructured set of parameters sent to the execution engine

**bus** - `job-info`

### `job_status`
The current job state. This one is probably most common.

**content**
  * `state` - see **Data Structures** below for details (it's big and shouldn't be repeated all over this document). Non-existent jobs have the status `does_not_exist`
  * `widget_info` - the parameters to send to output widgets, only available for a completed job
  * `owner` - string, username of user who submitted the job

**bus** - `job-status`

### `job_logs`
Includes log statement information for a given job.

**content**
  * `job_id` - string, the job id
  * `latest` - boolean, `true` if this is just the latest set of logs
  * `first` - int, the index of first line included in the set
  * `max_lines` - int, the total log lines available in the server
  * `lines` - list of log line objects, each one has the following keys:
    * `line` - string, the log line
    * `is_error` - 0 or 1, if 1 then the line is an "error" as reported by the server

**bus** `job-logs`

### `jobs_retried`
Sent when one or more jobs is retried

**content** An array of objects, each containing the below keys, e.g.:
```json
{
  [
    { "job_id": "0", "retry_id": "1" },
    { "job_id": "2", "retry_id": "3" }
  ]
}
```
  * `job_id` - string, the job id of the retried job
  * `retry_id` - string, the job id of the job that was launched

### `new_job`
Sent when a new job is launched and serialized. This just triggers a save/checkpoint on the frontend - no other bus message is sent

**content**
  * `job_id` - string OR `job_id_list` - array of strings

### `run_status`
Sent during the job startup process. There are a few of these containing various startup status, including errors (if they happen).

**content**
All cases:
  * `event` - string, what's the run status
  * `event_at` - string, timestamp
  * `cell_id` - the app cell id (used for routing)
  * `run_id` - the run id of the app (autogenerated by the cell)

(if error)
  * `event` - string, "error",
  * `event_at` - string, timestamp
  * `error_message` - string, the error
  * `error_type` - string, the type of Exception that was raised.
  * `error_stacktrace` - string, a stacktrace
  * `error_code` - int, an error code
  * `error_source` - string, the "source" of the error (generally "appmanager")

(if ok)
  * `job_id` - if the job was launched successfully

**bus** `run-status`

### `result`
Sent at the end of a `AppManager.run_dynamic_service` call (of which there aren't many).

**content**
  * `cell_id` - the app cell id (used for routing)
  * `run_id` - the run id of the app (autogenerated by the cell)
  * `event_at` - string, timestamp
  * `result` - the result of the dynamic service call (some unspecified object)

**bus** `result` - sent to `cell_id` channel

## Job Management flow on backend (in IPython kernel, biokbase.narrative.jobs package)
These steps define the process of creating a new app running job.
1. User clicks "Run" on App Cell in browser.
  * Cell provides app_id, cell_id, run_id, and parameters.
  * Invokes biokbase.narrative.appmanager.AppManager.run_app.
2. `AppManager.run_app` validates the following bits of information before passing them on to EE2:
  * App (based on id, version, and spec).
  * Parameters (based on the app spec).
3. `AppManager.run_app` preparation and start:
  * Convert app params from user-readable to machine-understandable (via the spec input_mapping).
  * Fetch cell id, run id, workspace id, user token.
  * Create an agent token on behalf of the user. This effectively makes a new authentication token that has a two-week lifetime, separate from the current login token. For example, if the user's current login token has a remaining lifespan of 1 hour, then the new job will be able to continue long past that.
  * Submit all of the above to `NarrativeJobService.run_job`.
4. Get response from `NarrativeJobService.run_job`
  * Combine with info from step 3, create `biokbase.narrative.jobs.job.Job` object.
  * submit new `Job` to `biokbase.narrative.jobs.jobmanager.JobManager` singleton object.
5. `AppManager` tells the `JobComm` channel to (1) fetch the new job status and push it to the browser, and (2) start the job lookup loop for the newly created job. (calls `AppManager.register_new_job`)

## JobManager initialization and startup.
These steps take place whenever the user loads a narrative, or when the kernel is restarted. This ensures that the JobManager in the kernel is kept up-to-date on Job status.
1. User starts kernel (opens a Narrative, or clicks Kernel -> Restart)
2. `jobCommsChannel` (front end widget) executes the following kernel call: `JobManager().initialize_jobs(); JobComm().start_update_loop`
3. `JobManager` does:
  * Get current user and workspace id.
  * `ExecutionEngine2.check_workspace_jobs` with the workspace id - gets the set of jobs in that workspace, and builds them into `Job` objects.
4. `JobComm` does:
  * Starts the lookup loop thread.
  * On the first pass, this looks up status of all jobs and pushes them forward to the browser.
  * If any jobs are in a terminal state, they'll stopped being looked up automatically. If all jobs are terminated, then the loop thread itself stops.

## JobComm status lookup loop.
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
4. Since this runs in the background on the kernel-side, it removes any need for the browser to constantly poll.

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
        finished: optional - epoch ms,
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
