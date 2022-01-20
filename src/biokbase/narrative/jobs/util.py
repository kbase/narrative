import os
import json

JOB_CONFIG_FILE_PATH_PARTS = [
    "kbase-extension",
    "static",
    "kbase",
    "config",
    "job_config.json",
]


def load_job_constants(relative_path_to_file=JOB_CONFIG_FILE_PATH_PARTS):
    """
    Load the job-related terms that are shared by front- and back ends.
    """
    full_path = [os.environ["NARRATIVE_DIR"]] + relative_path_to_file
    config_json = open(os.path.join(*full_path)).read()
    config = json.loads(config_json)
    REQUIRED = {
        "message_types": [
            "CANCEL",
            "CELL_JOB_STATUS",
            "INFO",
            "LOGS",
            "RETRY",
            "START_UPDATE",
            "STATUS",
            "STATUS_ALL",
            "STOP_UPDATE",
            "ERROR",
            "NEW",
            "RUN_STATUS",
        ],
        "params": ["BATCH_ID", "CELL_ID_LIST", "JOB_ID", "JOB_ID_LIST"],
    }

    # ensure we have all the required message type and param names
    missing = []
    for datatype, example_list in REQUIRED.items():
        if datatype not in config:
            raise ValueError(
                f"job_config.json is missing the '{datatype}' config section"
            )
        missing = [item for item in example_list if item not in config[datatype]]
        if len(missing):
            raise ValueError(
                f"job_config.json is missing the following values for {datatype}: "
                + ", ".join(missing)
            )

    return (config["params"], config["message_types"])


def sanitize_state(state):
    """
    There's too many places where there's "cancelled" or "canceled" or other weird variants
    in both narrative, UJS, and NJS. This is the central spot that attempts to deal with them.
    It does this by ONLY returning "canceled" as the state string for use by the front end.

    This takes a state structure (as returned by NJS.check_jobs or NJS.check_job) and returns
    it with some keys changed.
    """
    if "cancelled" in state:
        state["canceled"] = state.get("cancelled", 0)
        del state["cancelled"]
    if state.get("job_state", "") == "cancelled":
        state["job_state"] = "canceled"
    ujs_status = state.get("status", [])
    if (
        isinstance(ujs_status, list)
        and len(ujs_status) >= 2
        and ujs_status[1] == "cancelled"
    ):
        state["status"][1] = "canceled"
    return state


def sanitize_all_states(states):
    """
    Like sanitize_state above, but meant to be applied to the result of NJS.check_jobs. This maintains
    the plural structure provided by that function while changing the names around.
    """
    for job_id in states.get("job_states", {}):
        states["job_states"][job_id] = sanitize_state(states["job_states"][job_id])
    return states
