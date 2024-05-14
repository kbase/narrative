"""A (currently stubby) class for managing Narrative checkpoints."""

import notebook._tz as tz
from notebook.services.contents.checkpoints import Checkpoints

from .narrativeio import KBaseWSManagerMixin


class KBaseCheckpoints(KBaseWSManagerMixin, Checkpoints):
    def create_checkpoint(self, contents_mgr, path):
        """Create a checkpoint."""
        return {"id": path, "last_modified": tz.utcnow()}

    def restore_checkpoint(self, contents_mgr, checkpoint_id, path):
        """Restore a checkpoint."""

    def rename_checkpoint(self, checkpoint_id, old_path, new_path):
        """Rename a single checkpoint from old_path to new_path."""

    def delete_checkpoint(self, checkpoint_id, path):
        """Delete a checkpoint for a file."""

    def list_checkpoints(self, _path):
        """Return a list of checkpoints for a given file."""
        return []

    def rename_all_checkpoints(self, old_path, new_path):
        """Rename all checkpoints for old_path to new_path."""

    def delete_all_checkpoints(self, path):
        """Delete all checkpoints for the given path."""
