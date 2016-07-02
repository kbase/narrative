from .job import Job
from .specmanager import SpecManager
from .app_util import (
    system_variable
)
from biokbase.narrative.common.generic_service_calls import (
    get_sub_path
)
import time
import datetime

class ViewerJob(Job):
    job_id = None
    app_id = None
    app_version = None
    cell_id = None
    inputs = None
    timestamp = None

    def __init__(self, view_count, app_id, inputs, tag="release", app_version=None, cell_id=None):
        self.job_id = u"view_job" + unicode(view_count)
        self.app_id = app_id
        self.app_version = app_version
        self.tag = tag
        self.cell_id = cell_id
        self.inputs = inputs
        self.timestamp = int(time.time()*1000)
        self.timestamp_iso = datetime.datetime.utcfromtimestamp(self.timestamp/1000).isoformat()
        self.result = []

    def state(self):
        """
        This should behave like the base class state, but always returns completed, with all other fields
        appropriately created.
        """
        return {
            u'cell_id': self.cell_id,
            u'awe_job_id': None,
            u'creation_time': self.timestamp,
            u'exec_start_time': self.timestamp,
            u'finish_time': self.timestamp,
            u'finished': 1,
            u'job_id': self.job_id,
            u'job_state': u'completed',
            u'result': self.result,
            u'status': [unicode(self.timestamp_iso), u'complete', u'done', None, None, 1, 0]
        }

    def status(self):
        return u"completed"

    def parameters(self):
        return self.inputs

    def log(self, **kwargs):
        return []

    def cancel(self):
        pass

    def is_finished(self):
        return True