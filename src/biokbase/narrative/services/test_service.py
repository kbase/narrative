"""
A service with some happy fun time testing methods
"""
__author__ = 'Bill Riehl <wjriehl@lbl.gov>'
__date__ = '7/20/14'

## Imports
# Stdlib
import json
import os
import random
import numbers
import uuid
import hashlib
# Local
import biokbase.narrative.common.service as service
from biokbase.narrative.common.service import init_service, method, finalize_service
from biokbase.userandjobstate.client import UserAndJobState

## Globals

VERSION = (0, 0, 1)
NAME = "Test Service"

# Initialize
init_service(name=NAME, desc="Testing Service!", version=VERSION)

@method(name="Register Fake Job")
def _reg_fake_job(meth):
    """Tries to register a fake job id. Will fail like SO HARD.

    :return: Test. And a job id.
    :rtype: kbtypes.Unicode
    """
    meth.stages = 2
    meth.advance("Testing.")

    job_id = "12345"
    meth.register_job(job_id)

    meth.advance("Done testing!")
    return json.dumps({"test" : test,"job_id" : job_id})

@method(name="Register Real Job")
def _register_real_job(meth, job_id):
    """Registers a given job id.

    :param job_id: A job id
    :type job_id: kbtypes.Unicode
    :ui_name job_id: A *real* job id
    :rtype: kbtypes.Unicode
    :return: job info
    """
    meth.stages = 2
    meth.advance("Registering job id")

    job_info = meth.register_job(job_id)

    meth.advance("Done!")
    return json.dumps(job_info)

@method(name="View Job")
def _view_job(meth, job_id):
    """Views a job.

    :param job_id: A job id
    :type job_id: kbtypes.Unicode
    :ui_name job_id: A job id
    :rtype: kbtypes.Unicode
    :return: job info
    """
    meth.stages = 2
    meth.advance("Fetching job info")

    ujs = UserAndJobState(url=service.URLS.user_and_job_state, token=meth.token)
    job_info = ujs.get_job_info(job_id)

    meth.advance("Done!")
    return json.dumps(job_info)

@method(name="Poll Job")
def _poll_job(meth, job_id):
    """Has the job manager fetch a registered job.

    :param job_id: A job id
    :type job_id: kbtypes.Unicode
    :ui_name job_id: A job id
    :rtype: kbtypes.Unicode
    :return: job info
    :output_widget: kbaseJobWatcher
    """
    meth.stages = 2
    meth.advance("Fetching job info")

    job_info = meth.poll_job(job_id)

    return json.dumps({ "jobInfo" : job_info })

@method(name="Make Dummy Job")
def _create_dummy_job(meth, status, desc, complete):
    """Makes a dummy job, owned by the user, and NOT registered.

    :param status: Dummy job status
    :type status: kbtypes.Unicode
    :ui_name status: Job status
    :default status: Dummy status

    :param desc: Dummy job description
    :type desc: kbtypes.Unicode
    :ui_name desc: Job description
    :default desc: Dummy job description

    :param complete: Dummy job est. completion
    :type complete: kbtypes.Unicode
    :ui_name complete: Dummy completion time (timestamp)
    :default complete: 2020-04-03T08:56:32+0000
    
    :rtype: kbtypes.Unicode
    :return: job info
    """
    meth.stages = 2
    meth.advance("Creating dummy job")

    ujs = UserAndJobState(url=service.URLS.user_and_job_state, token=meth.token)
    progress = { 'ptype' : 'none' }
    job_info = ujs.create_and_start_job(meth.token, status, desc, progress, complete)

    meth.advance("Done!")
    return json.dumps(job_info)

finalize_service()
