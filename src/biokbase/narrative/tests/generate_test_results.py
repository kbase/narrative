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


def generate_mappings(all_jobs):
    # collect retried jobs and generate the cell-to-job mapping
    retried_jobs = {}
    jobs_by_cell_id = {}
    batch_jobs = set()
    for job in all_jobs.values():
        if "batch_job" in job and job["batch_job"]:
            batch_jobs.add(job["job_id"])
        # save the first retry ID with the retried job
        if "retry_ids" in job and len(job["retry_ids"]) > 0:
            retried_jobs[job["job_id"]] = job["retry_ids"][0]

        cell_id = job.get("job_input", {}).get("narrative_cell_info", {}).get("cell_id", None)

        # add the new job to the jobs_by_cell_id mapping if there is a cell_id present
        if cell_id:
            if cell_id not in jobs_by_cell_id.keys():
                jobs_by_cell_id[cell_id] = set()

            jobs_by_cell_id[cell_id].add(job["job_id"])
            if job["batch_id"]:
                jobs_by_cell_id[cell_id].add(job["batch_id"])

    return (retried_jobs, jobs_by_cell_id, batch_jobs)


def _generate_job_output(job_id):
    state = get_test_job(job_id)
    job_input = state.get("job_input", {})
    narr_cell_info = job_input.get("narrative_cell_info", {})
    widget_info = state.get("widget_info", None)

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
        return {"jobState": state, "outputWidgetInfo": widget_info}

    if not widget_info:
        widget_info = {}

    return {
        "jobState": state,
        "outputWidgetInfo": widget_info
    }


def generate_bad_jobs():
    bad_jobs = {
        job_id: {"job_id": job_id, "error": generate_error(job_id, "not_found")}
        for job_id in BAD_JOBS
    }
    return bad_jobs


def generate_job_output_state(all_jobs):
    """
    Generate the expected output from a `job_status` request
    """
    job_status = generate_bad_jobs()
    for job_id in all_jobs:
        job_status[job_id] = _generate_job_output(job_id)
    return job_status


def generate_job_info(all_jobs):
    """
    Expected output from a `job_info` request
    """
    job_info = generate_bad_jobs()
    for job_id in all_jobs:
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


def generate_job_retries(all_jobs, retried_jobs):
    """
    Expected output from a `retry_job` request
    """
    job_retries = generate_bad_jobs()
    for job_id in all_jobs:
        if job_id in retried_jobs:
            job_retries[job_id] = {
                "job_id": job_id,
                "job": _generate_job_output(job_id),
                "retry": _generate_job_output(retried_jobs[job_id]),
            }
        elif "batch_job" in all_jobs[job_id] and all_jobs[job_id]["batch_job"]:
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


def generate_job_logs(all_jobs):
    """
    Expected output from a `job_logs` request. Note that only completed jobs have logs in this case.
    """
    job_logs = generate_bad_jobs()
    for job_id in all_jobs:
        if all_jobs[job_id]["status"] == COMPLETED_STATUS:
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


(RETRIED_JOBS, JOBS_BY_CELL_ID, BATCH_JOBS) = generate_mappings(TEST_JOBS)

# mapping of cell IDs to jobs
INVALID_CELL_ID = "invalid_cell_id"
TEST_CELL_ID_LIST = list(JOBS_BY_CELL_ID.keys()) + [INVALID_CELL_ID]
# mapping expected as output from get_job_states_by_cell_id
TEST_CELL_IDs = {id: list(JOBS_BY_CELL_ID[id]) for id in JOBS_BY_CELL_ID.keys()}
TEST_CELL_IDs[INVALID_CELL_ID] = []


ALL_RESPONSE_DATA = {
    STATUS: generate_job_output_state(TEST_JOBS),
    INFO: generate_job_info(TEST_JOBS),
    RETRY: generate_job_retries(TEST_JOBS, RETRIED_JOBS),
    LOGS: generate_job_logs(TEST_JOBS),
}
