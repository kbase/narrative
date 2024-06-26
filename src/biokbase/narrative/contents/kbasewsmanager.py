"""A notebook manager that uses the KBase workspace for storage.

Authors:

* Steve Chan <sychan@lbl.gov>
* Bill Riehl <wjriehl@lbl.gov>

Copyright (C) 2013 The Regents of the University of California
Department of  Energy contract-operators of the Lawrence Berkeley National Laboratory
1 Cyclotron Road, Berkeley,  CA 94720

Copyright (C) 2013 The KBase Project

Distributed unspecified open source license as of 9/27/2013

"""

import itertools
import json
import os
import re
from typing import Any

import nbformat
from biokbase.narrative.common import util
from biokbase.narrative.common.exceptions import WorkspaceError
from biokbase.narrative.common.kblogging import get_narrative_logger
from biokbase.narrative.common.narrative_ref import NarrativeRef
from biokbase.narrative.common.url_config import URLS
from biokbase.narrative.contents.kbasecheckpoints import KBaseCheckpoints
from biokbase.narrative.contents.manager_util import base_model
from biokbase.narrative.contents.narrativeio import KBaseWSManagerMixin
from biokbase.narrative.services.user import UserService
from nbformat import ValidationError, validate
from notebook.services.contents.manager import ContentsManager
from tornado.web import HTTPError
from traitlets.traitlets import List, Unicode


class KBaseWSManager(KBaseWSManagerMixin, ContentsManager):
    """A notebook manager that uses the KBase workspace for storage.

    The Workspace backend simply adds a few metadata fields into the
    notebook object and pushes it into the workspace as the 'data'
    part of a workspace object

    Additional metadata fields
    {
        'id' : User specified title for the narrative alphanumeric + _
        'creator' : {username of the creator of this notebook},
        'description' : 'description of notebook',
        'data_dependencies' : { list of kbase id strings }
        'format' : self.node_format
        'workspace' : the workspace that it was loaded from or saved to
    }

    This handler expects that on every request, the session attribute for an
    instance will be populated by the front end handlers. That's gross, but
    that's what we're running with for now.
    Note: you'll probably see "That's gross, but..." a lot in this rev of the
    code

    Notebooks are identified with workspace identifiers of the format
    {workspace_name}.{object_name}

    Object format:
    (New)
    {
        'dependencies' : List of workspace refs,
        'notebook' : {
            <mostly, the IPython notebook object>,
            'metadata' :
        }
    }

    """

    kbasews_uri = Unicode(URLS.workspace, config=True, help="Workspace service endpoint URI")

    ipynb_type = Unicode("ipynb")
    allowed_formats = List(["json"])
    node_format = ipynb_type
    ws_type = Unicode(
        "KBaseNarrative.Narrative",
        config=True,
        help="Type to store narratives within workspace service",
    )

    # regex for parsing out workspace_id and object_id from
    # a "ws.{workspace}.{object}" string
    # should accept any of the following formats (the numbers are just random):
    # ws.123.obj.456.ver.789
    # ws.123.obj.456
    # ws.123
    # 123
    path_regex = re.compile(
        r"^(ws\.)?(?P<wsid>\d+)((\.obj\.(?P<objid>\d+))(\.ver\.(?P<ver>\d+))?)?$"
    )

    # This is a regular expression to make sure that the workspace ID
    # doesn't contain non-legit characters in the object ID field
    # We use it like this to to translate names:
    # wsid_regex.sub('',"Hello! Freaking World! 123".replace(' ','_'))
    # to get an id of 'Hello_Freaking_World_123'
    # We will enforce validation on the narrative naming GUI, but this is
    # a safety net
    wsid_regex = re.compile(r"[\W]+", re.UNICODE)

    def __init__(self: "KBaseWSManager", *args, **kwargs) -> None:
        """Verify that we can connect to the configured WS instance."""
        super(KBaseWSManager, self).__init__(*args, **kwargs)
        if not self.kbasews_uri:
            raise HTTPError(412, "Missing KBase workspace service endpoint URI.")

        # Init the session info we need.
        self.narrative_logger = get_narrative_logger()
        self.user_service = UserService()

    def _checkpoints_class_default(self: "KBaseWSManager") -> type[KBaseCheckpoints]:
        return KBaseCheckpoints

    def get_userid(self: "KBaseWSManager") -> str | None:
        """Return the current user id (if logged in), or None."""
        return util.kbase_env.user

    def _clean_id(self: "KBaseWSManager", dirty_id: str) -> str:
        """Clean any whitespace out of the given id."""
        return self.wsid_regex.sub("", dirty_id.replace(" ", "_"))

    #####
    # API part 1: methods that must be implemented in subclasses.
    #####
    def dir_exists(self: "KBaseWSManager", path: str) -> bool:
        """Returns a boolean indicating whether a directory exists.

        If it's blank, just return True -
        we'll be looking up the list of all Narratives from
        that dir, so it's real.
        """
        if not path:
            return True
        return False

    def is_hidden(self: "KBaseWSManager", _path: str) -> bool:
        """Returns a boolean indicating whether a path is hidden.

        We can only see what gets returned from Workspace lookup,
        so nothing should be hidden
        """
        return False

    def file_exists(self: "KBaseWSManager", path: str) -> bool:
        """Returns a boolean indicating whether a file exists.

        We only support narratives right now, so look up
        a narrative from that path.
        """
        ref = self._parse_path(path)
        self.log.warning("looking up whether a narrative exists")
        try:
            self.log.warning(f"trying to get narrative {ref}")
            return self.narrative_exists(ref)
        except WorkspaceError as err:
            self.log.warning(f"Error while testing narrative existence: {err!s}")
            if err.http_code == 403:
                raise HTTPError(
                    403,
                    f"You do not have permission to view the narrative with id {path}",
                ) from err
            raise HTTPError(
                err.http_code,
                f"An error occurred while trying to find the Narrative with id {path}",
            ) from err

    def exists(self: "KBaseWSManager", path: str) -> bool:
        """Returns a boolean indicating whether a file (i.e. narrative) or directory exists."""
        path = path.strip("/")
        if not path:  # it's a directory, for all narratives
            return True
        return self.file_exists(path)

    def _wsobj_to_model(self: "KBaseWSManager", nar, content: bool = True) -> dict[str, Any]:
        nar_id = f"ws.{nar['wsid']}.obj.{nar['objid']}"
        model = base_model(f"{nar['saved_by']} - {nar_id} - {nar['name']}", nar_id)
        model["format"] = "json"
        model["last_modified"] = nar["save_date"]
        model["type"] = "notebook"
        return model

    def _parse_path(self: "KBaseWSManager", path: str) -> NarrativeRef:
        """From the URL path for a Narrative, returns a NarrativeRef.

        If the path isn't parseable, this raises a 404 with the invalid path.
        """
        path = path.strip("/")
        m = self.path_regex.match(path)
        if m is None:
            raise HTTPError(404, f"Invalid Narrative path {path}")
        try:
            return NarrativeRef(
                {
                    "wsid": m.group("wsid"),
                    "objid": m.group("objid"),
                    "ver": m.group("ver"),
                }
            )
        except RuntimeError as e:
            raise HTTPError(500, str(e)) from e
        except WorkspaceError as e:
            raise HTTPError(e.http_code, e.message) from e

    def get(
        self: "KBaseWSManager",
        path: str,
        content: bool = True,
        type: str | None = None,  # noqa: A002
        format: str | None = None,  # noqa: ARG002, A002
    ) -> dict[str, Any]:
        """Get the model of a file or directory with or without content."""
        ftype = type  # type is a python built-in so rename the variable
        path = path.strip("/")
        model = base_model(path, path)
        try:
            if self.exists(path) and ftype != "directory":
                # It's a narrative object, so try to fetch it.
                ref = self._parse_path(path)
                if not ref:
                    raise HTTPError(404, f'Unknown Narrative "{path}"')
                nar_obj = self.read_narrative(ref, content=content)
                model["type"] = "notebook"
                user = self.get_userid()
                if content:
                    model["format"] = "json"
                    nb = nbformat.reads(json.dumps(nar_obj["data"]), 4)
                    nb["metadata"].pop("orig_nbformat", None)
                    self.mark_trusted_cells(nb, nar_obj["info"][5], path)
                    model["content"] = nb
                    model["name"] = nar_obj["data"]["metadata"].get("name", "Untitled")
                    util.kbase_env.narrative = f"ws.{ref.wsid}.obj.{ref.objid}"
                    util.kbase_env.workspace = model["content"].metadata.ws_name
                    self.narrative_logger.narrative_open(
                        f"{ref.wsid}/{ref.objid}", nar_obj["info"][4]
                    )
                if user is not None:
                    model["writable"] = self.narrative_writable(ref, user)
                self.log.info(f"Got narrative {model['name']}")
        except WorkspaceError as e:
            raise HTTPError(e.http_code, e.message) from e

        if not path or ftype == "directory":
            # if it's the empty string, look up all narratives, treat them as a dir
            self.log.info("Getting narrative list")
            model["type"] = ftype
            model["format"] = "json"
            if content:
                nar_list = self.list_narratives()
                self.log.info(f"Found {len(nar_list)} narratives")
                contents = [self._wsobj_to_model(nar, content=False) for nar in nar_list]
                model["content"] = contents

        return model

    def save(self: "KBaseWSManager", model: dict[str, Any], path: str) -> dict[str, Any]:
        """Save the file or directory and return the model with no content.

        Save implementations should call self.run_pre_save_hook(model=model, path=path)
        prior to writing any data.
        """
        path = path.strip("/")

        if "type" not in model:
            raise HTTPError(400, "No IPython model type provided")
        if model["type"] != "notebook":
            raise HTTPError(400, "We currently only support saving Narratives!")
        if "content" not in model and model["type"] != "directory":
            raise HTTPError(400, "No Narrative content found while trying to save")

        self.log.debug(f"writing Narrative {path}.")
        nb = nbformat.from_dict(model["content"])
        self.check_and_sign(nb, path)

        try:
            ref = self._parse_path(path)
            result = self.write_narrative(ref, nb, self.get_userid())

            new_id = f"ws.{result[1]}.obj.{result[2]}"
            util.kbase_env.narrative = new_id

            nb = result[0]
            self.validate_notebook_model(model)
            validation_message = model.get("message")

            model = self.get(path, content=False)
            if validation_message:
                model["message"] = validation_message
            self.narrative_logger.narrative_save(f"{result[1]}/{result[2]}", result[3])
            return model
        except WorkspaceError as err:
            raise HTTPError(err.http_code, f"While saving your Narrative: {err.message}") from err

    def delete_file(self: "KBaseWSManager", _path: str) -> None:
        """Delete file or directory by path."""
        raise HTTPError(
            501,
            "Narrative deletion not implemented here. Deletion is handled elsewhere.",
        )

    def rename_file(self: "KBaseWSManager", path: str, new_name: str) -> None:
        """Rename a file from old_path to new_path.

        This gets tricky in KBase since we don't deal with paths, but with
        actual file names. For now, assume that 'old_path' won't actually
        change, but the 'new_path' is actually the new Narrative name.
        """
        try:
            self.rename_narrative(self._parse_path(path), self.get_userid(), new_name)
        except WorkspaceError as err:
            raise HTTPError(err.http_code, err.message) from err
        except Exception as err:
            raise HTTPError(500, f"An error occurred while renaming your Narrative: {err}") from err

    # API part 2: methods that have useable default
    # implementations, but can be overridden in subclasses.
    def delete(self: "KBaseWSManager", path: str) -> None:
        """Delete a file/directory and any associated checkpoints."""
        path = path.strip("/")
        if not path:
            raise HTTPError(400, "Can't delete root")
        self.delete_file(path)
        self.checkpoints.delete_all_checkpoints(path)

    def rename(self: "KBaseWSManager", old_path: str, new_path: str) -> None:
        """Rename a file and any checkpoints associated with that file."""
        self.rename_file(old_path, new_path)
        self.checkpoints.rename_all_checkpoints(old_path, new_path)

    def update(self: "KBaseWSManager", model: dict[str, Any], path: str) -> dict[str, Any]:
        """Update the path for a file.

        For use in PATCH requests, to enable renaming a file without
        re-uploading its contents. Only used for renaming at the moment.
        """
        self.log.warning("update")
        self.log.warning(model)
        self.log.warning(path)

        path = path.strip("/")
        new_path = model.get("path", path).strip("/")
        if new_path.endswith(".ipynb"):
            new_path = new_path[: -len(".ipynb")]
        self.rename(path, new_path)
        model = self.get(path, content=False)
        self.log.warning(model)
        return model

    def increment_filename(
        self: "KBaseWSManager", filename: str, path: str = "", insert: str = ""
    ) -> str:
        """Increment a filename until it is unique.

        Parameters
        ----------
        filename : unicode
            The name of a file, including extension
        path : unicode
            The API path of the target's directory

        Returns:
        -------
        name : unicode
            A filename that is unique, based on the input filename.
        """
        path = path.strip("/")
        basename, ext = os.path.splitext(filename)
        for i in itertools.count():
            insert_i = f"{insert}{i}" if i else ""
            name = f"{basename}{insert_i}{ext}"
            if not self.exists(f"{path}/{name}"):
                break
        return name

    def validate_notebook_model(self: "KBaseWSManager", model: dict[str, Any]) -> dict[str, Any]:
        """Add failed-validation message to model."""
        try:
            validate(model["content"])
        except ValidationError as e:
            model["message"] = "Notebook Validation failed: {}:\n{}".format(
                e.message,
                json.dumps(e.instance, indent=1, default=lambda _: "<UNKNOWN>"),
            )
        return model

    def new_untitled(self: "KBaseWSManager", path: str = "", model_type: str = "", ext: str = ""):
        """Create a new untitled file or directory in path.

        path must be a directory

        File extension can be specified.

        Use `new` to create files with a fully specified path (including filename).
        """
        path = path.strip("/")
        if not self.dir_exists(path):
            raise HTTPError(404, f"No such directory: {path}")

        model = {}
        if model_type:
            model["type"] = model_type

        if ext == ".ipynb":
            model.setdefault("type", "notebook")
        else:
            model.setdefault("type", "file")

        insert = ""
        if model["type"] == "directory":
            untitled = self.untitled_directory
            insert = " "
        elif model["type"] == "notebook":
            untitled = self.untitled_notebook
            ext = ".ipynb"
        elif model["type"] == "file":
            untitled = self.untitled_file
        else:
            raise HTTPError(400, f"Unexpected model type: {model['type']}")

        name = self.increment_filename(untitled + ext, path, insert=insert)
        path = f"{path}/{name}"
        return self.new(model, path)

    # def new(self: "KBaseWSManager", model=None, path=""):
    #     """Create a new file or directory and return its model with no content.
    #
    #     To create a new untitled entity in a directory, use `new_untitled`.
    #     """
    #     # TODO
    #     path = path.strip("/")
    #     if model is None:
    #         model = {}
    #
    #     if path.endswith(".ipynb"):
    #         model.setdefault("type", "notebook")
    #     else:
    #         model.setdefault("type", "file")
    #
    #     # no content, not a directory, so fill out new-file model
    #     if "content" not in model and model["type"] != "directory":
    #         if model["type"] == "notebook":
    #             model["content"] = new_notebook()
    #             model["format"] = "json"
    #         else:
    #             model["content"] = ""
    #             model["type"] = "file"
    #             model["format"] = "text"
    #
    #     model = self.save(model, path)
    #     return model

    # def copy(self: "KBaseWSManager", from_path, to_path=None):
    #     """Copy an existing file and return its new model.
    #
    #     If to_path not specified, it will be the parent directory of from_path.
    #     If to_path is a directory, filename will increment `from_path-Copy#.ext`.
    #
    #     from_path must be a full path to a file.
    #     """
    #     # TODO
    #     path = from_path.strip("/")
    #     if to_path is not None:
    #         to_path = to_path.strip("/")
    #
    #     if "/" in path:
    #         from_dir, from_name = path.rsplit("/", 1)
    #     else:
    #         from_dir = ""
    #         from_name = path
    #
    #     model = self.get(path)
    #     model.pop("path", None)
    #     model.pop("name", None)
    #     if model["type"] == "directory":
    #         raise HTTPError(400, "Can't copy directories")
    #
    #     if to_path is None:
    #         to_path = from_dir
    #     if self.dir_exists(to_path):
    #         name = copy_path.sub(".", from_name)
    #         to_name = self.increment_filename(name, to_path, insert="-Copy")
    #         to_path = "{0}/{1}".format(to_path, to_name)
    #
    #     model = self.save(model, to_path)
    #     return model

    def log_info(self: "KBaseWSManager") -> None:
        """Log self.info_string at INFO level."""
        self.log.info(self.info_string())

    def trust_notebook(self: "KBaseWSManager", path: str) -> None:
        """Explicitly trust a notebook.

        Parameters
        ----------
        path : string
            The path of a notebook
        """
        model = self.get(path)
        nb = model["content"]
        self.log.warning("Trusting notebook %s", path)
        self.notary.mark_cells(nb, True)
        self.save(model, path)

    def check_and_sign(self: "KBaseWSManager", nb: dict[str, Any], path: str = "") -> None:
        """Check for trusted cells, and sign the notebook.

        Called as a part of saving notebooks.

        Parameters
        ----------
        nb : dict
            The notebook dict
        path : string
            The notebook's path (for logging)
        """
        if self.notary.check_cells(nb):
            self.notary.sign(nb)
        else:
            self.log.warning("Saving untrusted notebook %s", path)

    def mark_trusted_cells(
        self: "KBaseWSManager", nb: dict[str, Any], saved_by, path: str = ""
    ) -> None:
        """Mark cells as trusted if the notebook signature matches.

        Called as a part of loading notebooks.

        Parameters
        ----------
        nb : dict
            The notebook object (in current nbformat)
        path : string
            The notebook's path (for logging)
        """
        if self.user_service.is_trusted_user(saved_by):
            self.notary.mark_cells(nb, True)
        else:
            # commenting out, but leaving behind for a while.
            trusted = self.notary.check_signature(nb)
            if not trusted:
                self.log.warning("Notebook %s is not trusted", path)
            self.notary.mark_cells(nb, trusted)
            # self.log.warn("Notebook %s is totally trusted", path)
            # # all notebooks are trustworthy, because KBase is Pollyanna.

    # def should_list(self: "KBaseWSManager", name):
    #     """Should this file/directory name be displayed in a listing?"""
    #     return not any(fnmatch(name, glob) for glob in self.hide_globs)

    def info_string(self: "KBaseWSManager") -> str:
        """General info string about the workspace."""
        return f"Workspace Narrative Service with workspace endpoint at {self.kbasews_uri}"
