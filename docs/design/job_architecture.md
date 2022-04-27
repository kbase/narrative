# Job Management Architecture

The Narrative job manager is based on a data flow that operates between the browser, the IPython Kernel behind the Narrative (also known as the narrative backend), and the [KBase Execution Engine](https://github.com/kbase/execution_engine2) (EE2) behind that. Some frontend components access external resources directly, but job-related data flows between those three stops across a single channel from frontend and backend, and backend and EE2.

- [Job Management Architecture](#job-management-architecture)
  - [Comm channels](#comm-channels)
    - [Frontend Comm Channel](#frontend-comm-channel)
    - [Backend JobComm module](#backend-jobcomm-module)
  - [Messages](#messages)
    - [Job communication vocabulary](#job-communication-vocabulary)
  - [Messages from frontend to backend](#messages-from-frontend-to-backend)
    - [`CANCEL`](#cancel)
    - [`INFO`](#info)
    - [`LOGS`](#logs)
    - [`RETRY`](#retry)
    - [`STATUS`](#status)
    - [To be deprecated -- do not use](#to-be-deprecated----do-not-use)
      - [`START_UPDATE`](#start_update)
      - [`STOP_UPDATE`](#stop_update)
  - [Receiving messages in the backend](#receiving-messages-in-the-backend)
  - [Messages from backend to frontend](#messages-from-backend-to-frontend)
    - [`ERROR`](#error)
    - [`INFO` (response)](#info-response)
    - [`LOGS` (response)](#logs-response)
    - [`RETRY` (response)](#retry-response)
    - [`RUN_STATUS`](#run_status)
    - [`STATUS` (response)](#status-response)
      - [Job output state](#job-output-state)
    - [`STATUS_ALL`](#status_all)
  - [Usage Examples](#usage-examples)
  - [Job Management flow](#job-management-flow)
    - [JobManager initialization and startup](#jobmanager-initialization-and-startup)
    - [Running an app](#running-an-app)
    - [App initialisation on reload](#app-initialisation-on-reload)
      - [JobComm status lookup loop -- TO BE DEPRECATED](#jobcomm-status-lookup-loop----to-be-deprecated)


## Comm channels

Jupyter provides a "Comm" object that allows for custom messaging between the frontend and the kernel ([details and documentation here](https://jupyter-notebook.readthedocs.io/en/stable/comms.html)) using WebSockets. This provides an interface for the frontend to directly request information from the kernel, and to listen to asynchronous responses. On the kernel (narrative backend) side, it allows one or more modules to register message handlers to process those requests out of the band of the usual kernel invocation. These are used to implement the Jupyter Notebook's ipywidgets, for example.

The Narrative Interface uses one of these channels to manage job information. These are funneled through an interface on the frontend side and a matching one in the kernel.

### Frontend Comm Channel

On the frontend, there's a `jobCommChannel.js` module that uses the frontend's monobus (`monobus.js`) system to communicate. Frontend modules use monobus to send messages bound for the backend over the main channel; the `jobCommChannel` module passes them to the backend over the websocket established on narrative start up.

### Backend JobComm module

The narrative backend uses the JobComm module (`jobcomm.py`) to send and receive messages from the frontend. Its main job is translating incoming messages into requests to be fulfilled by the backend JobManager (`jobmanager.py`) module, which in turn may contact external services such as the workspace or EE2 to fetch relevant data. The JobComm converts the results of the JobManager's actions into messages to be sent back over to the frontend.

## Messages

### Job communication vocabulary

The front- and backend have a shared vocabulary of message types and parameters, loaded from the file `kbase-extension/static/kbase/config/job_config.json`. In the frontend, the message param and type names are stored in the JobCommMessages object exported by `jobCommMessages.js`:

```js
define(['common/jobCommMessages'], (jcm) => {

  // use the JobCommMessages object
  console.log("job status message type: " + jcm.MESSAGE_TYPE.STATUS)
  console.log("job ID parameter: " + jcm.PARAM.JOB_ID)
```

## Messages from frontend to backend

Messages are sent from the frontend's `JobCommChannel` to the narrative backend, using a websocket established by one of the Jupyter notebook modules, `Jupyter.kernel.comm`. On the kernel side, a complementary comm channel is used. This is set up in the `biokbase.narrative.jobs.jobcomm.JobComm` class. On Narrative load, page reload, or kernel restart, the comm channel is initialized to handle any messages sent to the kernel. It uses the same controlled vocabulary of terms for message types and job parameters as the frontend.

Most of these messages take one or more inputs. These are listed below the command, where applicable.

The documentation will use the message type and parameter names used in the job config file (e.g. [`STATUS`](#status) instead of `job_status`, [`RETRY`](#retry) instead of `retry_job`, `JOB_ID` instead of `job_id`, etc.) as [the JavaScript code](#usage-examples) will refer to those values using the names in the JobCommMessages object, rather than hardcoding the strings.

### `CANCEL`

Request that the server cancel the running job(s). If the job ID supplied is a batch ID, EE2 will cancel the job and all its child jobs.

**Arguments**
  * `JOB_ID` - a string, the job id OR
  * `JOB_ID_LIST` - an array of job IDs

### `INFO`

Request information about the job(s), specifically app id, spec, input parameters and (if finished) outputs

**Arguments**
  * `JOB_ID` - a string, the job id OR
  * `JOB_ID_LIST` - an array of job IDs OR
  * `BATCH_ID` - a batch parent (make the request for all jobs in the batch)

### `LOGS`

Request the job logs starting at some given line. Note that the `FIRST_LINE`, `NUM_LINES`, and `LATEST` arguments apply to all jobs in the `JOB_ID_LIST`.

**Arguments**
  * `JOB_ID` - a string, the job id OR
  * `JOB_ID_LIST` - an array of job IDs
  * `FIRST_LINE` (optional; default 0) -  return logs from this line number onwards. Line numbers are 0-indexed.
  * `NUM_LINES` (optional) - the maximum number of lines to return; if not specified, there is no maximum.
  * `LATEST` (optional; default false) - boolean; if true and `NUM_LINES` is set, return the latest `NUM_LINES` lines from the logs. If `FIRST_LINE` is also set, `LATEST` overrides the `FIRST_LINE` parameter.

### `RETRY`

Request that the server rerun a job or set of jobs

**Arguments**
  * `JOB_ID` - a string, the job id OR
  * `JOB_ID_LIST` - an array of job IDs

### `STATUS`

Get the status for a job or an array of jobs.

**Arguments**
  * `JOB_ID` - a string, the job id OR
  * `JOB_ID_LIST` - an array of job IDs OR
  * `BATCH_ID` - a batch parent (make the request for all jobs in the batch)


### To be deprecated -- do not use

#### `START_UPDATE`

Request the status for a job or jobs, but start an update cycle so that it's continually requested.

**Arguments**
  * `JOB_ID` - a string, the job id OR
  * `JOB_ID_LIST` - an array of job IDs OR
  * `BATCH_ID` - a batch parent (make the request for all jobs in the batch)

#### `STOP_UPDATE`

Signal that the front end doesn't need any more updates for the specified job(s), so stop sending them for each loop cycle. Doesn't actually end the job, only requests for updates.

**Arguments**
  * `JOB_ID` - a string, the job id OR
  * `JOB_ID_LIST` - an array of job IDs OR
  * `BATCH_ID` - a batch parent (make the request for all jobs in the batch)


## Receiving messages in the backend

The messages listed above undergo minor modifications to be sent over the websocket to the backend. The message data structures that `JobComm` receives in the kernel has the following format:

```
{
  "msg_id": "some random string",
  "content": {
    "data": {
      "request_type": "a string",  # present in all messages
      ... other params (e.g. JOB_ID, BATCH_ID, FIRST_LINE, etc.) depending on message ...
    }
  }
}
```

All messages are assigned a `msg_id` by the Jupyter comm framework (KBase does not use this ID for anything); the message type is added as the `request_type` field, and merged with any other fields, such as `JOB_ID`, `JOB_ID_LIST`, etc.

The python `JobComm` module uses the `request_type` field to trigger the appropriate method in the `JobManager`.


## Messages from backend to frontend

These messages are sent by the python `JobComm` module and received by the `JobCommChannel` on the browser side, then parsed and distributed to frontend components over the bus system. Like other kernel messages sent by the Jupyter notebook, they have a `msg_type` field, and a `content` field containing data meant for the frontend to use. They have a rough structure like this:

```js
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
Although the backend message types are included in the controlled vocabulary, the content keys are not, as there are too many to make it worthwhile capturing them.

The full set of messages sent by the backend are described below. The name (`msg_type`) is given, followed by the keys given in the `content` block.

The backend bundles together multiple messages of the same type in an object indexed by key (usually job or cell ID). In nearly all cases, the frontend then separates out the data and sends it out on individual channels for each job, batch job, or cell. The exception to this is `ERROR` messages; if the error contains data pertaining to the original request, the request parameters (`JOB_ID`, `BATCH_ID`, etc.) can be used to route the message to specific frontend components. Otherwise, the JobCommChannel emits the message in the browser console to assist in debugging.

### `ERROR`

A general job comm error message, capturing exceptions that get thrown by the kernel. The frontend uses the `request` data to distribute error messages on the appropriate job or cell channels.

Error messages contain the following information:
  * `name` - the exception type name
  * `message` - the exception message
  * `source` - what triggered the error; this may be the request type, or a string or null in the case of errors from the backend job lookup loop. Note that the lookup loop is to be deprecated.
  * `request` - the frontend request that triggered that error, or a string or null in the case of errors from the backend job lookup loop.


### `INFO` (response)

Includes information about the running job. The frontend splits out messages and distributes them by job or batch ID.

Job metadata, keyed by job ID, with the following structure:
  * `app_id` - string, the app id (format = `module_name/app_name`)
  * `app_name` - string, the human-readable app name
  * `job_id` - string, the job id
  * `job_params` - array of job parameters sent to the execution engine
  * `batch_id` - id of batch container job

In case of error, the response has instead the keys:
  * `job_id`
  * `error` - brief message explaining the issue

Sample response JSON:
```js
{
  "job_id_1": {
    "app_id": "MyFaveApp/Best_App_in_the_World",
    "app_name": "An Overrated App",
    "job_id": "job_id_1",
    "job_params": [{"param_1": "value_1", "param_2": "value_2"}],
    "batch_id": "some_batch_id",
  },
  "error_id_1": {
    "job_id": "error_id_1",
    "error": "Something went terribly wrong."
  }
}
```


### `LOGS` (response)

Logs for a job or set of jobs. The frontend distributes these by job or batch ID. See the frontend [`LOGS`](#logs) message for the parameters of an incoming `LOGS` request.

Job logs, keyed by job ID, with the following structure:
  * `job_id` - string, the job id
  * `latest` - boolean; if returning a limited number of lines, whether these are the latest lines or not. See [`LOGS`](#logs) for details.
  * `first` - int, the index of first line included in the set
  * `max_lines` - int, the total log lines available in the server
  * `lines` - list of log line objects, each with the following structure:
    * `line` - string, the log line
    * `is_error` - 0 or 1, if 1 then the line is an "error" as reported by the server

In case of error, the response has the keys:
  * `job_id`
  * `error` - brief message explaining the issue

The most common log error encountered is that logs are not found -- this can occur if the job has not yet started running or the job was terminated whilst it was still in the job queue.


### `RETRY` (response)

Response to a request to retry one or more jobs. If the request was successful, includes the new job state; otherwise, contains an error message.

Retry data indexed by the ID of the job being retried. For each job retried, the following data is returned:
  * `job_id` - string, ID of the job that was retried (the retry parent)
  * `job` - object, the job state in the format used by the [`STATUS`](#status-response)
  * `retry_id` - string, ID of the new job
  * `retry` - string, the job state object of the new job that was launched in the format used by the [`STATUS`](#status-response)

In case of error, the response has instead the keys:
  * `job_id`
  * `error` - brief message explaining the issue

Sample response JSON:
```js
{
  "job_id_1": {
    "job_id": "job_id_1",
    "job": {"jobState": {"job_id": "job_id_1", "status": "error"}, "job_id": "job_id_1", "outputWidgetState": null},
    "retry_id": "retry_id_1",
    "retry": {"jobState": {"job_id": "retry_id_1", "status": "queued"} "job_id": "retry_id_1", "outputWidgetState": null},
  },
  "job_id_2": {
    "job_id": "job_id_2",
    "job": {"jobState": {"job_id": "job_id_2", "status": "terminated", "job_id": "job_id_2", "outputWidgetState": null},
    "error": "Cannot retry a batch parent job" // from EE2
  },
  "error_id_1": {
    "job_id": "error_id_1",
    "error": "does_not_exist"
  }
}
```

### `RUN_STATUS`

Sent during the job startup process. There are two basic message types: one for successful job launch with the ID(s) of the job(s) launched, and the other for errors during job launch. Unlike other message types, `RUN_STATUS` messages are not bundled, so each message is sent unchanged to the relevant cell.

All cases:
  * `event` - string; see below for the values
  * `event_at` - string, UTC timestamp in the format `YYYY-MM-DD HH:MM:SS.mmmmmmZ`
  * `cell_id` - the app cell id (used for routing)
  * `run_id` - the run id of the app (autogenerated by the cell)

Successful job launch, single job:
  * `event`: "launched_job"
  * `job_id` - if the job was launched successfully

Successful job launch, batch job:
  * `event`: "launched_job_batch"
  * `batch_id` - ID of the batch parent job
  * `child_job_ids` - IDs of the child jobs

Error when attempting to launch a job:
  * `event`: "error"
  * `error_message` - string, the error
  * `error_type` - string, the type of Exception that was raised.
  * `error_stacktrace` - string, a stacktrace
  * `error_code` - int, an [error code from EE2](https://github.com/kbase/execution_engine2)
  * `error_source` - string, the "source" of the error (generally "appmanager")


### `STATUS` (response)

The current job state. The frontend splits out messages and distributes them by job or batch ID.

Bundled job status information for one or more jobs, keyed by job ID, with the following structure:
  * `job_id`
  * `jobState` - see [Job output state](#job-output-state) below for the detailed structure
  * `outputWidgetInfo` - the parameters to send to output widgets, generated from the app specifications and job output. This is only available for completed jobs and is set to null otherwise.

In case of error, the response has instead the keys:
  * `job_id`
  * `error` - brief message explaining the issue

Sample response JSON:
```js
{
  "job_id_1": {
    "job_id": "job_id_1",
    "jobState": {
      "job_id": "job_id_1",
      "status": "running",
      "created": 123456789,
    },
    "outputWidgetInfo": null, // only available for completed jobs
  },
  "job_id_2": {
    "job_id": "job_id_2",
    "error": "Cannot find job with ID job_id_2"
  },
}
```

#### Job output state

As sent to browser, includes cell info and run info. The structure below indicates the type of data in each field.

```js
{
    "job_id": string,
    "outputWidgetInfo": object if job completed successfully; otherwise null
    "jobState": {
        "job_id": string,
        "status": string,
        "batch_id": str or null,
        "batch_job": bool,
        "child_jobs": array of job IDs,
        "retry_ids": array of job IDs,
        "retry_parent": str,
        "created": epoch ms,
        "queued": optional - epoch ms,
        "finished": optional - epoch ms,
        "updated": epoch ms,
        "terminated_code": optional - int,
        "error": {  // optional
          "code": int,
          "name": string,
          "message": string, (should be for the user to read),
          "error": string, (likely a stacktrace)
        },
        "run_id": string,
        "cell_id": string,
        "tag": string (release, beta, dev),
        "error_code": optional - int,
        "errormsg": optional - string,
    }
}
```


### `STATUS_ALL`

The set of all job states for all running jobs, or at least the set that should be updated (those that are complete and not requested by the front end are not included - if a job is sitting in an error or finished state, it doesn't need to be updated).

As [`STATUS`](#status-response)


## Usage Examples

The comm channel is used through the main Bus object that's instantiated through the global `Runtime` object. That needs to be included in the `define` statement for all JavaScript modules. The bus is then used with its `emit` function (you have the bus *emit* a message to its listeners), and any inputs are passed along with it.

Generally, this is used as follows (without much detail. For a readable real example, check out the `jobLogViewer.js` module):

```Javascript
define(
  ['common/runtime', ... other modules ...],
  function(Runtime, ...others...) {
    let runtime = Runtime.make();
    runtime.bus().emit('some-request', {
      param: 'value'
    });
  }
);
```

Some more specific examples:
```Javascript
define(
  ['common/runtime', 'common/jobCommMessages'],
  function(Runtime, jcm) {
    const runtime = Runtime.make();

    // request the first 10 job log lines:
    runtime.bus().emit(jcm.MESSAGE_TYPE.LOGS, {
      [jcm.PARAM.JOB_ID]: 'some_job_id',
      [jcm.PARAM.FIRST_LINE]: 0,
      [jcm.PARAM.NUM_LINES]: 10
    });

    // request the status of all jobs in a batch:
    runtime.bus().emit(jcm.MESSAGE_TYPE.STATUS, {
      [jcm.PARAM.BATCH_ID]: 'some_batch_id',
    });
  }
);
```

The front end response handling is done through the Runtime bus. The bus provides both an `on` and a `listen` function; examples will show how to use both. Generally, the `listen` function is more specific and binds the listener to a specific bus channel. These channels can invoke the jobId, or the cellId, to make sure that only information about specific jobs is listened for.

The `listen` function takes an object with three attributes as input - a channel (either the cellId or jobId), a key (with the type of message to listen for), and a handle, which is a function to process the message. This is probably the easiest way to handle messages. Usage would look like this:

```Javascript
define(
  ['common/runtime', 'common/jobCommMessages'],
  function(Runtime, jcm) {
    const runtime = Runtime.make();

    const listener = runtime.bus().listen({
      channel: {
        [jcm.CHANNEL.JOB]: 'some_job_id'
      },
      key: {
        type: jcm.MESSAGE_TYPE.STATUS,
      },
      handle: (message) => {
          // process the message...
      }
    })
  }
);
```

The `on` function requires a constructed channel bus, premade and reusable for a given channel. So you would make a channel bus that would always receive messages for that channel, and instruct it on what to do when a message of a given type arrives. That looks like this:

```Javascript
define(
  ['common/runtime', 'common/jobCommMessages'],
  function(Runtime, jcm) {
    const runtime = Runtime.make();

const cellBus = runtime.bus().makeChannelBus({
      name: {
        cell: 'some_cell_id'
      }
    });
    const listenerId = cellBus.on(jcm.MESSAGE_TYPE.RUN_STATUS, (message) => {
        // process the message...
    });
  }
);
```

Note that both of these create events that get bound to the DOM, and when the widget is removed, they should be cleaned up. This can be done by calling `bus.removeListener(id)` with the created `listenerId`. If you created a channel bus, then that bus should be used, otherwise the main `runtime.bus()` object should be used.


## Job Management flow

### JobManager initialization and startup

These steps take place whenever the user loads a narrative, or when the kernel is restarted. This ensures that the JobManager in the kernel is kept up-to-date on Job status.

* User starts kernel (opens a Narrative, or clicks Kernel -> Restart)
* `jobCommChannel.js` (front end widget) gets the IDs of the cells in the current narrative and then executes the following kernel call, using the gathered cell IDs as the `cell_list` parameter:
```py
JobManager().initialize_jobs()
JobComm().start_job_status_loop(cell_list=cell_list, init_jobs=True)
```
* The `JobManager` runs `check_workspace_jobs` on EE2 with the current workspace ID to fetch the list of jobs associated with the workspace. This is filtered to include only those in `cell_list`, and then `Job` objects are built from the data.
* The `JobComm`:
  * Starts the lookup loop thread.
  * On the first pass, this looks up status of all jobs and pushes them forward to the browser.
  * If any jobs are in a terminal state, they'll stopped being looked up automatically. If all jobs are terminated, then the loop thread itself stops.


### Running an app

These steps define the process by which jobs are created by running an app.

* User clicks "Run" on app or batch cell in the browser.
  * Cell provides app_id, cell_id, run_id, and parameters.
  * Invokes `biokbase.narrative.appmanager.AppManager.run_app` or `run_app_batch`.
* `AppManager.run_app` validates the following bits of information before passing them on to EE2:
  * App specifications (validated against the [Narrative Method Store](https://github.com/kbase/narrative_method_store))
  * Parameters (based on the app spec).
* `AppManager.run_app` preparation and start:
  * Convert app params from user-readable to machine-understandable (via the spec input_mapping).
  * Fetch cell id, run id, workspace id, user token.
  * Create an agent token on behalf of the user. This effectively makes a new authentication token with a limited lifetime, separate from the current login token. Having a separate auth token for the job allows it to continue executing even if the user's current login token expires.
  * Submit all of the above to the Execution Engine (EE2) endpoint `run_job` or `run_job_batch`.
* Get response from EE2
* Send a `RUN_STATUS` message to the browser, giving the results of the job submission; this will either contain a job ID or list of job IDs, if the submission was successful, or an error if not.
* Assuming the submission was successful, the job IDs are combined with info from the job submission to create `biokbase.narrative.jobs.job.Job` objects, and stored in the `biokbase.narrative.jobs.jobmanager.JobManager` singleton object.
* On the frontend, the cell receiving the `RUN_STATUS` message will send `STATUS` requests to the backend periodically (configurable; set in the JavaScript `JobManager` module) to track the progress of the job. Other message types (`LOGS`, `CANCEL`, `RETRY`, etc.) are sent as needed.
  * Batch cells have an update mechanism that triggers a `STATUS` request a short period after receiving the last update from the backend.
  * App cells also use the [job lookup loop](#jobcomm-status-lookup-loop----to-be-deprecated), backend code that sends periodic job updates, to keep up to date with job status.


### App initialisation on reload

These steps are taken when an app with a running (or previously-run) job starts up.
* Job ID(s) are retrieved from the app meta data
* If the job was not in a terminal state when it was saved, the app requests `STATUS` from the backend. For batch jobs, if jobs were retried but the narrative was not saved afterwards, the job retry data will be sent in the status update.
* Job request and response flow follows the pattern above.


#### JobComm status lookup loop -- TO BE DEPRECATED

* Calls `JobComm._lookup_job_status_loop`, which in turn calls `JobComm.lookup_all_job_states`. This gets forwarded to `JobManager.lookup_all_job_states`, and the results pushed to the browser as a comm channel message.
* Internal to `JobManager.lookup_all_job_states`, the following steps happen:
  * Build a list of job ids to lookup - those that are flagged for lookup.
  * Call `_construct_job_status_set`
  * Call `_get_all_job_states`
    * Gets list of all job ids the JM is tracking.
    * Retrieves some states from cache (cache is used for finalized jobs).
    * Calls `NarrativeJobService.check_jobs` on everything that's not finalized.
    * Injects `run_id` and `cell_id` into states
    * Returns dict of states.
* Sends result to browser over comm channel

Since this runs in the background on the kernel-side, it removes any need for the browser to constantly poll.
