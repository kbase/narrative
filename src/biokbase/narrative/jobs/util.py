import copy
import json
import os
import time


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
    with open(os.path.join(*full_path)) as fh:
        config = json.load(fh)
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
            "RUN_STATUS",
        ],
        "params": [
            "BATCH_ID",
            "CELL_ID_LIST",
            "FIRST_LINE",
            "JOB_ID_LIST",
            "JOB_ID",
            "LATEST",
            "NUM_LINES",
            "TS"
        ],
    }

    # ensure we have all the required message type and param names
    missing = []
    for datatype, example_list in REQUIRED.items():
        if datatype not in config:
            raise ValueError(
                f"job_config.json is missing the '{datatype}' config section"
            )
        missing = [item for item in example_list if item not in config[datatype]]
        if missing:
            raise ValueError(
                f"job_config.json is missing the following values for {datatype}: "
                + ", ".join(missing)
            )

    return (config["params"], config["message_types"])


def time_ns():
    """Simulate time.time_ns() which is only available in python 3.7+"""
    return int(time.time() * 1e9)


def merge(d0: dict, d1: dict):
    d0 = copy.deepcopy(d0)
    merge_inplace(d0, d1)
    return d0


def merge_inplace(d0: dict, d1: dict):
    """
    Recursively merge nested dicts d1 into d0,
    overwriting any values in d0 that are not nested dicts.
    Mutates d0
    """
    for k, v1 in d1.items():
        if k in d0:
            v0 = d0[k]
            is_dict_0 = isinstance(v0, dict)
            is_dict_1 = isinstance(v1, dict)
            if is_dict_0 ^ is_dict_1:
                raise ValueError(f"For key {k}: is_dict(v0) xor is_dict(v1)")
            elif not is_dict_0 and not is_dict_1:
                d0[k] = v1
            elif is_dict_0 and is_dict_1:
                merge_inplace(v0, v1)
        else:
            d0[k] = v1
