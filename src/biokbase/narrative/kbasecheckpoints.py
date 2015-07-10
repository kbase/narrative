import os
from tornado.web import HTTPError

from IPython.html.services.contents.checkpoints import (
    Checkpoints,
    GenericCheckpointsMixin
)
from .narrativeio import KBaseWSManagerMixin
from IPython.utils import tz

class KBaseCheckpoints(KBaseWSManagerMixin, Checkpoints):
    def create_checkpoint(self, contents_mgr, path):
        """Create a checkpoint."""
        return dict(
            id=path,
            last_modified=tz.datetime(2015, 7, 10)
        )

    def restore_checkpoint(self, contents_mgr, checkpoint_id, path):
        """Restore a checkpoint"""
        pass

    def rename_checkpoint(self, checkpoint_id, old_path, new_path):
        """Rename a single checkpoint from old_path to new_path."""
        pass

    def delete_checkpoint(self, checkpoint_id, path):
        """delete a checkpoint for a file"""
        pass

    def list_checkpoints(self, path):
        """Return a list of checkpoints for a given file"""
        return []

    def rename_all_checkpoints(self, old_path, new_path):
        """Rename all checkpoints for old_path to new_path."""
        pass

    def delete_all_checkpoints(self, path):
        """Delete all checkpoints for the given path."""
        pass
