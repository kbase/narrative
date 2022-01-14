from .util import ConfigTests
import copy


config = ConfigTests()
TEST_JOBS = config.load_json_file(config.get("jobs", "ee2_job_test_data_file"))


def get_retried_jobs(all_jobs):
    # collect retried jobs
    retried_jobs = {}
    for job in all_jobs.values():
        # save the first retry ID with the retried job
        if "retry_ids" in job and len(job["retry_ids"]) > 0:
            retried_jobs[job["job_id"]] = job["retry_ids"][0]
    return retried_jobs


def generate_error(job_id, err_type):
    user_id = None
    status = None

    if job_id in TEST_JOBS:
        job = get_test_job(job_id)
        user_id = job["user"] or "fake_user"
        status = job["status"]

    error_strings = {
        "not_found": f"Cannot find job with ID {job_id}",
        "no_logs": f"Cannot find job log with id: {job_id}",
        "ee2_not_found": f"Cannot find job with ids: ['{job_id}']",
        "no_perms": f"User {user_id} does not have permission to JobPermissions.WRITE job {job_id}",
        "batch_parent_retry": "Cannot retry batch job parents. Must retry individual jobs",
        "retry_status": f"Error retrying job {job_id} with status {status}: can only retry jobs with status 'error' or 'terminated'",
    }

    if err_type not in error_strings:
        raise KeyError(f"No such error type: {err_type}")

    return error_strings[err_type]


def get_test_job(job_id):
    return copy.deepcopy(TEST_JOBS[job_id])


CLIENTS = "biokbase.narrative.clients.get"
TEST_JOB_IDS = list(TEST_JOBS.keys())
RETRIED_JOBS = get_retried_jobs(TEST_JOBS)

# test_jobs contains jobs in the following states
JOB_COMPLETED = "5d64935ab215ad4128de94d6"
JOB_CREATED = "5d64935cb215ad4128de94d7"
JOB_RUNNING = "5d64935cb215ad4128de94d8"
JOB_TERMINATED = "5d64935cb215ad4128de94d9"
JOB_ERROR = "5d64935cb215ad4128de94e0"
BATCH_PARENT = "60e7112887b7e512a899c8f1"
BATCH_COMPLETED = "60e7112887b7e512a899c8f2"
BATCH_TERMINATED = "60e7112887b7e512a899c8f3"
BATCH_TERMINATED_RETRIED = "60e7112887b7e512a899c8f4"
BATCH_ERROR_RETRIED = "60e7112887b7e512a899c8f5"
BATCH_RETRY_COMPLETED = "60e71159fce9347f2adeaac6"
BATCH_RETRY_RUNNING = "60e7165f3e91121969554d82"
BATCH_RETRY_ERROR = "60e717d78ac80701062efe63"

JOB_NOT_FOUND = "job_not_found"
BAD_JOB_ID = "a_bad_job_id"
BAD_JOB_ID_2 = "another_bad_job_id"

BAD_JOBS = [JOB_NOT_FOUND, BAD_JOB_ID, BAD_JOB_ID_2]

BATCH_CHILDREN = [
    BATCH_COMPLETED,
    BATCH_TERMINATED,
    BATCH_TERMINATED_RETRIED,
    BATCH_ERROR_RETRIED,
    BATCH_RETRY_COMPLETED,
    BATCH_RETRY_RUNNING,
    BATCH_RETRY_ERROR,
]

BATCH_PARENT_CHILDREN = [BATCH_PARENT] + BATCH_CHILDREN

JOBS_TERMINALITY = {
    JOB_COMPLETED: True,
    JOB_CREATED: False,
    JOB_RUNNING: False,
    JOB_TERMINATED: True,
    JOB_ERROR: True,
    BATCH_PARENT: False,
    BATCH_COMPLETED: True,
    BATCH_TERMINATED: True,
    BATCH_TERMINATED_RETRIED: True,
    BATCH_ERROR_RETRIED: True,
    BATCH_RETRY_COMPLETED: True,
    BATCH_RETRY_RUNNING: False,
    BATCH_RETRY_ERROR: True,
}

ALL_JOBS = list(JOBS_TERMINALITY.keys())
TERMINAL_JOBS = []
ACTIVE_JOBS = []
for key, value in JOBS_TERMINALITY.items():
    if value:
        TERMINAL_JOBS.append(key)
    else:
        ACTIVE_JOBS.append(key)

TEST_CELL_ID_LIST = [
    "9329ac6c-604c-42a9-aca2-a15dba6278ce",
    "9329ac6c-604c-42a9-aca2-a15dba6278cf",
    # batch cell
    "58356bf5-2e81-441a-b1ee-01b38eddefb0",
    # batch cell two
    "58356bf5-2e81-441a-b1ee-01b38eddefb1",
    "invalid_cell_id",
]
# expected _jobs_by_cell_id mapping in JobManager
JOBS_BY_CELL_ID = {
    TEST_CELL_ID_LIST[0]: {JOB_COMPLETED, JOB_CREATED},
    TEST_CELL_ID_LIST[1]: {JOB_RUNNING, JOB_TERMINATED, JOB_ERROR},
    TEST_CELL_ID_LIST[2]: {
        BATCH_PARENT,
        BATCH_COMPLETED,
        BATCH_TERMINATED,
        BATCH_TERMINATED_RETRIED,
        BATCH_ERROR_RETRIED,
        BATCH_RETRY_COMPLETED,
    },
    TEST_CELL_ID_LIST[3]: {
        BATCH_PARENT,
        BATCH_RETRY_RUNNING,
        BATCH_RETRY_ERROR,
    },
}

# mapping expected as output from get_job_states_by_cell_id
TEST_CELL_IDs = {id: list(JOBS_BY_CELL_ID[id]) for id in JOBS_BY_CELL_ID.keys()}
TEST_CELL_IDs[TEST_CELL_ID_LIST[4]] = []

READS_OBJ_1 = "rhodobacterium.art.q20.int.PE.reads"
READS_OBJ_2 = "rhodobacterium.art.q10.PE.reads"
