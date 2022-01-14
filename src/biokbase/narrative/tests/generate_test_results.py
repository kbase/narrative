import copy
from biokbase.narrative.tests.util import ConfigTests
from biokbase.narrative.app_util import app_version_tags

from biokbase.narrative.jobs.jobcomm import (
    INFO,
    LOGS,
    RETRY,
    STATUS,
)

from biokbase.narrative.jobs.job import (
    JOB_ATTR_DEFAULTS,
    EXCLUDED_JOB_STATE_FIELDS,
    COMPLETED_STATUS,
)
from biokbase.narrative.tests.job_test_constants import (
    BAD_JOBS,
    RETRIED_JOBS,
    BATCH_PARENT,
    JOB_COMPLETED,
    BATCH_COMPLETED,
    BATCH_RETRY_COMPLETED,
    get_test_job,
    generate_error,
)

config = ConfigTests()

TEST_JOBS = config.load_json_file(config.get("jobs", "ee2_job_test_data_file"))
spec_list = config.load_json_file(config.get("specs", "app_specs_file"))
TEST_SPECS = {}

for tag in app_version_tags:
    spec_dict = dict()
    for spec in spec_list:
        spec_dict[spec["info"]["id"]] = spec
    TEST_SPECS[tag] = spec_dict


def get_test_spec(tag, app_id):
    return copy.deepcopy(TEST_SPECS[tag][app_id])


def _generate_job_output(job_id):
    state = get_test_job(job_id)
    job_input = state.get("job_input", {})
    narr_cell_info = job_input.get("narrative_cell_info", {})

    state.update(
        {
            "batch_id": state.get(
                "batch_id", job_id if state.get("batch_job", False) else None
            ),
            "cell_id": narr_cell_info.get("cell_id", None),
            "run_id": narr_cell_info.get("run_id", None),
            "job_output": state.get("job_output", {}),
            "child_jobs": state.get("child_jobs", []),
        }
    )
    for f in EXCLUDED_JOB_STATE_FIELDS:
        if f in state:
            del state[f]

    if state["status"] != COMPLETED_STATUS:
        return {"jobState": state, "outputWidgetInfo": None}

    widget_info = {
        JOB_COMPLETED: {
            "name": "kbaseDefaultNarrativeOutput",
            "params": {"out_value": None, "report_name": None, "report_ref": None},
            "tag": "dev",
        },
        BATCH_COMPLETED: {
            "name": "no-display",
            "params": {
                "obj_ref": "18836/5/1",
                "report_name": "kb_sra_upload_report_af468a02-4278-40af-9536-0bdef1f050db",
                "report_ref": "62425/18/1",
                "report_window_line_height": "16",
                "wsName": "wjriehl:1475006266615",
            },
            "tag": "release",
        },
        BATCH_RETRY_COMPLETED: {
            "name": "no-display",
            "params": {
                "obj_ref": "18836/5/1",
                "report_name": "kb_sra_upload_report_4ffc6219-0260-4f1d-8b4d-5083e0595150",
                "report_ref": "62425/19/1",
                "report_window_line_height": "16",
                "wsName": "wjriehl:1475006266615",
            },
            "tag": "release",
        },
    }
    return {
        "jobState": state,
        "outputWidgetInfo": widget_info[job_id],
    }


def generate_bad_jobs():
    bad_jobs = {
        job_id: {"job_id": job_id, "error": generate_error(job_id, "not_found")}
        for job_id in BAD_JOBS
    }
    return bad_jobs


def generate_job_output_state():
    """
    Generate the expected output from a `job_status` request
    """
    job_status = generate_bad_jobs()
    for job_id in TEST_JOBS:
        job_status[job_id] = _generate_job_output(job_id)
    return job_status


def generate_job_info():
    """
    Expected output from a `job_info` request
    """
    job_info = generate_bad_jobs()
    for job_id in TEST_JOBS:
        test_job = get_test_job(job_id)
        job_id = test_job.get("job_id")
        app_id = test_job.get("job_input", {}).get("app_id", None)
        tag = (
            test_job.get("job_input", {})
            .get("narrative_cell_info", {})
            .get("tag", "release")
        )
        params = test_job.get("job_input", {}).get(
            "params", JOB_ATTR_DEFAULTS["params"]
        )
        batch_job = test_job.get("batch_job", JOB_ATTR_DEFAULTS["batch_job"])
        app_name = "batch" if batch_job else get_test_spec(tag, app_id)["info"]["name"]
        batch_id = (
            job_id
            if batch_job
            else test_job.get("batch_id", JOB_ATTR_DEFAULTS["batch_id"])
        )

        job_info[job_id] = {
            "app_id": app_id,
            "app_name": app_name,
            "job_id": job_id,
            "job_params": params,
            "batch_id": batch_id,
        }
    return job_info


def generate_job_retries():
    """
    Expected output from a `retry_job` request
    """
    job_retries = generate_bad_jobs()
    for job_id in TEST_JOBS:
        if job_id in RETRIED_JOBS:
            job_retries[job_id] = {
                "job_id": job_id,
                "job": _generate_job_output(job_id),
                "retry": _generate_job_output(RETRIED_JOBS[job_id]),
            }
        elif job_id == BATCH_PARENT:
            job_retries[job_id] = {
                "job_id": job_id,
                "job": _generate_job_output(job_id),
                "error": generate_error(job_id, "batch_parent_retry"),
            }
        else:
            job_retries[job_id] = {
                "job_id": job_id,
                "job": _generate_job_output(job_id),
                "error": generate_error(job_id, "retry_status"),
            }
    return job_retries


def log_gen(n_lines):
    lines = []
    for i in range(n_lines):
        lines.append({"is_error": 0, "line": f"This is line {str(i+1)}"})
    return lines


def generate_job_logs():
    """
    Expected output from a `job_logs` request. Note that only completed jobs have logs in this case.
    """
    job_logs = generate_bad_jobs()
    for job_id in TEST_JOBS:
        if job_id in [JOB_COMPLETED, BATCH_COMPLETED, BATCH_RETRY_COMPLETED]:
            job_logs[job_id] = {
                "job_id": job_id,
                "batch_id": get_test_job(job_id).get("batch_id", None),
                "first": 0,
                "latest": False,
                "max_lines": 50,
                "lines": log_gen(5),
            }
        else:
            job_logs[job_id] = {
                "batch_id": get_test_job(job_id).get("batch_id", None),
                "error": generate_error(job_id, "no_logs"),
                "job_id": job_id,
            }
    return job_logs


ALL_RESPONSE_DATA = {
    STATUS: generate_job_output_state(),
    INFO: generate_job_info(),
    RETRY: generate_job_retries(),
    LOGS: generate_job_logs(),
}
