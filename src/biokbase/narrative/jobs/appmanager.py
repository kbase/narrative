"""A module for managing apps, specs, requirements, and for starting jobs."""

import datetime
import functools
import random
import re
import traceback
from collections.abc import Callable
from typing import Any

from biokbase import auth
from biokbase.narrative import clients
from biokbase.narrative.app_util import (
    extract_ws_refs,
    map_outputs_from_state,
    resolve_ref_if_typed,
    transform_param_value,
    validate_parameters,
)
from biokbase.narrative.common import kblogging
from biokbase.narrative.exception_util import transform_job_exception
from biokbase.narrative.jobs import specmanager
from biokbase.narrative.jobs.job import Job
from biokbase.narrative.jobs.jobcomm import MESSAGE_TYPE, JobComm
from biokbase.narrative.jobs.jobmanager import JobManager
from biokbase.narrative.system import strict_system_variable, system_variable
from biokbase.narrative.widgetmanager import WidgetManager

"""
A module for managing apps, specs, requirements, and for starting jobs.
"""
__author__ = "Bill Riehl <wjriehl@lbl.gov>"

BATCH_APP = {
    "APP_ID": "kb_BatchApp/run_batch",
    "METHOD": "kb_BatchApp.run_batch",
    "TAG": "dev",
    "VERSION": "dev",
}


def timestamp() -> str:
    return datetime.datetime.utcnow().isoformat() + "Z"


def _app_error_wrapper(app_func: Callable) -> Callable:
    """This is a decorator meant to wrap any of the `run_app*` methods here.
    It captures any raised exception, formats it into a message that can be sent
    over the comm channel to the frontend, then prints a more friendly form of the
    error, instead of showing an arcane traceback.
    Otherwise it runs whatever function it decorates with its expected args and kwargs
    """

    @functools.wraps(app_func)
    def wrapper(self, *args, **kwargs):
        try:
            return app_func(self, *args, **kwargs)
        except Exception as e:
            e_type = type(e).__name__
            e_message = str(e).replace("<", "&lt;").replace(">", "&gt;")
            e_trace = traceback.format_exc()
            e_trace = e_trace.replace("<", "&lt;").replace(">", "&gt;")
            e_code = getattr(e, "code", -1)
            e_source = getattr(e, "source", "appmanager")
            msg_info = {
                "event": "error",
                "event_at": timestamp(),
                "error_message": e_message,
                "error_type": e_type,
                "error_stacktrace": e_trace,
                "error_code": e_code,
                "error_source": e_source,
            }
            for key in ["cell_id", "run_id"]:
                if key in kwargs:
                    msg_info[key] = kwargs[key]
            self._send_comm_message(MESSAGE_TYPE["RUN_STATUS"], msg_info)
            if "cell_id" not in kwargs:
                print(
                    f"Error while trying to start your app ({app_func.__name__})!\n"
                    + "-----------------------------------------------------\n"
                    + str(e)
                    + "\n"
                    + "-----------------------------------------------------\n"
                    + e_trace
                )

    return wrapper


class AppManager:
    """The main class for managing how KBase apps get run. This contains functions
    for showing app descriptions, their usage (how to invoke various
    parameters), and, ultimately, for running the app.

    A typical flow might be like this.
    am = AppManager()
    am.available_apps()
        # show the set of apps with a brief description of each.
    am.app_usage(app_id)
        # show how to use a app and set its parameters.
    job = am.run_app(app_id, input1=value1, input2=value2, ...)
        # run an app with given inputs.
    """

    __instance = None

    __MAX_TOKEN_NAME_LEN = 30

    spec_manager = specmanager.SpecManager()
    _log = kblogging.get_logger(__name__)
    _comm = None
    viewer_count = 1

    def __new__(cls):
        if AppManager.__instance is None:
            AppManager.__instance = object.__new__(cls)
            AppManager.__instance._comm = None
        return AppManager.__instance

    def reload(self: "AppManager"):
        """Reloads all app specs into memory from the App Catalog.
        Any outputs of app_usage, app_description, or available_apps
        should be run again after the update.
        """
        self.spec_manager.reload()

    def app_usage(self: "AppManager", app_id: str, tag: str = "release"):
        """This shows the list of inputs and outputs for a given app with a given
        tag. By default, this is done in a pretty HTML way, but this app can be
        wrapped in str() to show a bare formatted string.

        If either the app_id is unknown, or isn't found with the given release
        tag, or if the tag is unknown, a ValueError will be raised.

        Parameters:
        -----------
        app_id : string
            A KBase app id, generally of the format Module_name/app_name
            (see available_apps for a list)
        tag : Which version of the app to view - either release, beta, or dev
            (default=release)
        """
        return self.spec_manager.app_usage(app_id, tag)

    def app_description(self: "AppManager", app_id: str, tag: str = "release"):
        """Returns the app description in a printable HTML format.

        If either the app_id is unknown, or isn't found with the given release
        tag, or if the tag is unknown, a ValueError will be raised.

        Parameters:
        -----------
        app_id : string
            A KBase app id, generally of the format Module_name/app_name
            (see available_apps for a list)
        tag : Which version of the app to view - either release, beta, or dev
            (default=release)
        """
        return self.spec_manager.app_description(app_id, tag)

    def available_apps(self: "AppManager", tag: str = "release"):
        """Lists the set of available apps for a given tag in a simple table.
        If the tag is not found, a ValueError will be raised.

        Parameters:
        -----------
        tag : Which version of the list of apps to view - either release, beta,
            or dev (default=release)

        """
        return self.spec_manager.available_apps(tag)

    @_app_error_wrapper
    def run_legacy_batch_app(
        self: "AppManager",
        app_id: str,
        params,
        tag: str = "release",
        version: str | None = None,
        cell_id: str | None = None,
        run_id: str | None = None,
        dry_run=False,
    ):
        if params is None:
            params = []
        ws_id = strict_system_variable("workspace_id")
        spec = self._get_validated_app_spec(app_id, tag, True, version=version)

        # Preflight check the params - all required ones are present, all
        # values are the right type, all numerical values are in given ranges
        spec_params = self.spec_manager.app_params(spec)

        # A list of lists of UPAs, used for each subjob.
        batch_ws_upas = []
        # The list of actual input values, post-mapping.
        batch_run_inputs = []

        for param_set in params:
            spec_params_map = {
                spec_params[i]["id"]: spec_params[i] for i in range(len(spec_params))
            }
            batch_ws_upas.append(extract_ws_refs(app_id, tag, spec_params, param_set))
            batch_run_inputs.append(
                self._map_inputs(
                    spec["behavior"]["kb_service_input_mapping"],
                    param_set,
                    spec_params_map,
                )
            )

        service_method = spec["behavior"]["kb_service_method"]
        service_name = spec["behavior"]["kb_service_name"]
        service_ver = spec["behavior"].get("kb_service_version")

        # Let the given version override the spec's version.
        if version is not None:
            service_ver = version

        # This is what calls the function in the back end - Module.method
        # This isn't the same as the app spec id.
        job_meta = {
            "tag": BATCH_APP["TAG"],
            "batch_app": app_id,
            "batch_tag": tag,
            "batch_size": len(params),
        }
        if cell_id is not None:
            job_meta["cell_id"] = cell_id
        if run_id is not None:
            job_meta["run_id"] = run_id

        # Now put these all together in a way that can be sent to the batch processing app.
        batch_params = [
            {
                "module_name": service_name,
                "method_name": service_method,
                "service_ver": service_ver,
                "wsid": ws_id,
                "meta": job_meta,
                "batch_params": [
                    {
                        "params": batch_run_inputs[i],
                        "source_ws_objects": batch_ws_upas[i],
                    }
                    for i in range(len(batch_run_inputs))
                ],
            }
        ]

        # We're now almost ready to run the job. Last, we need an agent token.
        agent_token = self._get_agent_token(app_id)
        job_meta["token_id"] = agent_token.id

        # This is the input set for ee2.run_job. Now we need the workspace id
        # and whatever fits in the metadata.
        job_runner_inputs = {
            "app_id": BATCH_APP["APP_ID"],
            "meta": job_meta,
            "method": BATCH_APP["METHOD"],
            "params": batch_params,
            "service_ver": BATCH_APP["VERSION"],
            "wsid": ws_id,
        }

        # if we're doing a dry run, just return the inputs that we made.
        if dry_run:
            return job_runner_inputs

        # Log that we're trying to run a job...
        log_info = {
            "app_id": app_id,
            "tag": BATCH_APP["TAG"],
            "version": service_ver,
            "username": system_variable("user_id"),
            "wsid": ws_id,
        }
        kblogging.log_event(self._log, "run_batch_app", log_info)

        try:
            job_id = clients.get("execution_engine2", token=agent_token.token).run_job(
                job_runner_inputs
            )
        except Exception as e:
            log_info.update({"err": str(e)})
            kblogging.log_event(self._log, "run_batch_app_error", log_info)
            raise transform_job_exception(e) from e

        new_job = Job.from_job_id(
            job_id,
            extra_data={
                # this data is not preserved in the ee2 record
                "batch_app": app_id,
                "batch_tag": tag,
                "batch_size": len(params),
            },
        )

        self._send_comm_message(
            MESSAGE_TYPE["RUN_STATUS"],
            {
                "event": "launched_job",
                "event_at": timestamp(),
                "cell_id": cell_id,
                "run_id": run_id,
                "job_id": job_id,
            },
        )
        JobManager().register_new_job(new_job, refresh=False)
        if cell_id is None:
            return new_job

    @_app_error_wrapper
    def run_app(
        self: "AppManager",
        app_id: str,
        params,
        tag: str = "release",
        version: str | None = None,
        cell_id: str | None = None,
        run_id: str | None = None,
        dry_run=False,
    ) -> dict[str, Any]:
        """Attempts to run the app, returns a Job with the running app info.
        If this is given a cell_id, then returns None. If not, it returns the
        generated Job object.

        Parameters:
        -----------
        app_id - should be from the app spec, e.g. 'build_a_metabolic_model'
                    or 'MegaHit/run_megahit'.
        params - this is the dictionary of parameters to tbe used with the app.
                 They can be found by using the app_usage function. If any
                 non-optional apps are missing, a ValueError will be raised.
        tag - optional, one of [release|beta|dev] (default=release)
        version - optional, a semantic version string. Only released modules
                  have versions, so if the tag is not 'release', and a version
                  is given, a ValueError will be raised.

        Example:
        --------
        run_app('MegaHit/run_megahit',
                {
                    'read_library_name' : 'My_PE_Library',
                    'output_contigset_name' : 'My_Contig_Assembly'
                },
                version='>=1.0.0'
        )
        """
        if params is None:
            params = {}
        ws_id = strict_system_variable("workspace_id")
        spec = self._get_validated_app_spec(app_id, tag, True, version=version)

        job_runner_inputs = self._build_run_job_params(
            spec, tag, params, version, cell_id, run_id, ws_id
        )

        if dry_run:
            return job_runner_inputs

        # We're now almost ready to run the job. Last, we need an agent token.
        agent_token = self._get_agent_token(app_id)
        job_runner_inputs["meta"]["token_id"] = agent_token.id

        # Log that we're trying to run a job...
        log_info = {
            "app_id": app_id,
            "tag": tag,
            "version": job_runner_inputs["service_ver"],
            "username": system_variable("user_id"),
            "wsid": ws_id,
        }
        kblogging.log_event(self._log, "run_app", log_info)

        try:
            job_id = clients.get("execution_engine2", token=agent_token.token).run_job(
                job_runner_inputs
            )
        except Exception as e:
            log_info.update({"err": str(e)})
            kblogging.log_event(self._log, "run_app_error", log_info)
            raise transform_job_exception(e) from e

        new_job = Job.from_job_id(job_id)

        self._send_comm_message(
            MESSAGE_TYPE["RUN_STATUS"],
            {
                "event": "launched_job",
                "event_at": timestamp(),
                "cell_id": cell_id,
                "run_id": run_id,
                "job_id": job_id,
            },
        )
        JobManager().register_new_job(new_job, refresh=False)
        if cell_id is None:
            return new_job

    @_app_error_wrapper
    def run_app_batch(
        self: "AppManager",
        app_info: list,
        cell_id: str | None = None,
        run_id: str | None = None,
        dry_run: bool = False,
    ) -> None | dict[str, Job | list[Job]] | dict[str, dict[str, str | int] | list]:
        """Attempts to run a batch of apps in bulk using the Execution Engine's run_app_batch endpoint.
        If a cell_id is provided, this sends various job messages over the comm channel, and returns None.
        If dry_run is True, this returns the structure that would be sent to EE2.run_job_batch

        Parameters:
        -----------
        app_info: this is a list of app information dictionaries. It's broken down such that a single app
            can have multiple sets of parameters, which could create multiple runs of that app.
            Each dictionary is expected to have the following keys:
            app_id: the id of the app to run
            tag: the app tag to run, one of release, beta, or dev
            version: (optional) the specified version to run, if not provided, this will be the most recent
                for that particular tag
            shared_params: (optional) any params to be shared by all runs of the app
            params: a list of at least one dictionary. Each dict contains the set of parameters to run the
                app once.
        cell_id: if provided, this should be a unique id for the Narrative cell that's running the app.
        run_id: if provided, this should be a unique id representing a Narrative cell's knowledge of
            that job.
        dry_run: if True, this won't start the job, but return the structure that would be sent to the
            KBase execution engine.

        Example:
        --------
        run_app_batch([{
            "app_id": "Some_module/reads_to_contigset",
            "tag": "release",
            "version": "1.0.0",
            "shared_params": {
                "filter_len": 500
            },
            "params": [
                {
                    "read_library_name" : "My_PE_Library",
                    "output_contigset_name" : "My_Contig_Assembly"
                }, {
                    "read_library_name": "Another_reads_library",
                    "output_contigset_name": "Another_contig_assembly"
                }
            ]
        }, {
            "app_id": "Some_module/contigset_to_genome",
            "tag": "release",
            "version": "1.1.0",
            "shared_params": {
                "filter_len": 1000,
                "taxon_id": 121212
            },
            "params": [
                {
                    "contigset": "My_contigset",
                    "genome_name": "My_genome"
                }
            ]
        }])
        """
        if not isinstance(app_info, list) or len(app_info) == 0:
            raise ValueError("app_info must be a list with at least one set of app information")
        batch_run_inputs = []
        ws_id = strict_system_variable("workspace_id")
        batch_params = {"wsid": ws_id}  # for EE2.run_job_batch
        log_app_info = []
        for info in app_info:
            self._validate_bulk_app_info(info)
            self._reconstitute_shared_params(info)
            app_id = info["app_id"]
            tag = info.get("tag", "release")
            version = info.get("version")
            spec = self._get_validated_app_spec(app_id, tag, True, version)
            for param_set in info["params"]:
                # will raise a ValueError if anything is wrong or missing
                # otherwise, will build a set of inputs for EE2.run_job
                batch_run_inputs.append(
                    self._build_run_job_params(
                        spec,
                        tag,
                        param_set,
                        version=version,
                        cell_id=cell_id,
                        run_id=run_id,
                    )
                )
            log_app_info.append(
                {
                    "app_id": app_id,
                    "tag": tag,
                    "version": version,
                    "num_jobs": len(batch_run_inputs),
                }
            )
        log_info = {
            "app_info": log_app_info,
            "username": system_variable("user_id"),
            "wsid": ws_id,
        }
        kblogging.log_event(self._log, "run_app_batch", log_info)

        # if we're doing a dry run, stop here and return the setup
        if dry_run:
            return {"batch_run_params": batch_run_inputs, "batch_params": batch_params}

        # We're now almost ready to run the job. Last, we need an agent token.
        agent_token = self._get_agent_token(f"KBase_app_batch_{len(batch_run_inputs)}_apps")

        # add the token id to the meta for all jobs
        for job_input in batch_run_inputs:
            job_input["meta"]["token_id"] = agent_token.id

        # run the job batch and get a batch_submission record
        try:
            batch_submission = clients.get(
                "execution_engine2", token=agent_token.token
            ).run_job_batch(batch_run_inputs, batch_params)
        except Exception as e:
            log_info.update({"err": str(e)})
            kblogging.log_event(self._log, "run_job_bulk_error", log_info)
            raise transform_job_exception(e) from e

        batch_id = batch_submission["batch_id"]
        child_ids = batch_submission["child_job_ids"]

        self._send_comm_message(
            MESSAGE_TYPE["RUN_STATUS"],
            {
                "event": "launched_job_batch",
                "event_at": timestamp(),
                "cell_id": cell_id,
                "run_id": run_id,
                "batch_id": batch_id,
                "child_job_ids": child_ids,
            },
        )

        child_jobs = Job.from_job_ids(child_ids)
        parent_job = Job.from_job_id(
            batch_id,
            children=child_jobs,
        )

        # TODO make a tighter design in the job manager for submitting a family of jobs
        for new_job in child_jobs:
            JobManager().register_new_job(new_job, refresh=False)
        JobManager().register_new_job(parent_job, refresh=False)

        if cell_id is None:
            return {"parent_job": parent_job, "child_jobs": child_jobs}

    def _validate_bulk_app_info(self: "AppManager", app_info: dict):
        """Validation consists of:
        1. must have "app_id" with format xyz/abc
        2. must have "tag" with "release, beta, dev" options
        3. optionally have "version" that's a string
        4. must have "params" that's a list of at least one dict.
        """
        malformed_params_error = "params must be a list of dicts of app parameters"

        # make sure we have all required keys
        required_keys = ["app_id", "tag", "params"]
        for key in required_keys:
            if key not in app_info:
                raise ValueError(f"app info must contain keys {', '.join(required_keys)}")
        # make sure app is of the form "module/app"
        if (
            not isinstance(app_info["app_id"], str)
            or re.match(r"\S+\/\S+", app_info["app_id"]) is None
        ):
            raise ValueError("an app_id must be of the format module_name/app_name")
        # params must be a list with at least one item (even an empty dict)
        if not isinstance(app_info["params"], list) or len(app_info["params"]) == 0:
            raise ValueError(malformed_params_error)
        # each item must be a dict
        for params in app_info["params"]:
            if not isinstance(params, dict):
                raise ValueError(malformed_params_error)
        # make sure tag is an allowed item
        allowed_tags = ["release", "beta", "dev"]
        if app_info["tag"] not in allowed_tags:
            raise ValueError(f"tag must be one of {', '.join(allowed_tags)}, not {app_info['tag']}")
        # make sure version is a string, if present
        if "version" in app_info and not isinstance(app_info["version"], str):
            raise ValueError(f"an app version must be a string, not {app_info['version']}")

    def _reconstitute_shared_params(self: "AppManager", app_info_el: dict[str, Any]) -> None:
        """Mutate each params dict to include any shared_params
        app_info_el is structured like:
        {
            "app_id": "Some_module/reads_to_contigset",
            "tag": "release",
            "version": "1.0.0",
            "shared_params": {
                "filter_len": 500
            },
            "params": [
                {
                    "read_library_name" : "My_PE_Library",
                    "output_contigset_name" : "My_Contig_Assembly"
                }, {
                    "read_library_name": "Another_reads_library",
                    "output_contigset_name": "Another_contig_assembly"
                }
            ]
        }
        """
        if "shared_params" in app_info_el:
            shared_params = app_info_el.pop("shared_params")
            for param_set in app_info_el["params"]:
                for k, v in shared_params.items():
                    param_set.setdefault(k, v)

    def _build_run_job_params(
        self: "AppManager",
        spec: dict[str, Any],
        tag: str,
        param_set: dict[str, Any],
        version: str | None = None,
        cell_id: str | None = None,
        run_id: str | None = None,
        ws_id: int | None = None,
    ) -> dict:
        """Builds the set of inputs for EE2.run_job and EE2.run_job_batch (RunJobParams) given a spec
        and set of inputs/parameters.

        Parameters:
        -----------
        spec: dict, an app spec
        tag: str, one of release, beta, dev
        param_set: dict, key-value pairs for each app input and parameter
        version: str, should be either a semantic version or git hash for the app to run
        cell_id: str, the cell id to associate with the job
        run_id: str, the run id to associate with the job
        ws_id: int, the workspace id to associate with the job

        Returns:
        --------
        This returns a dict with the following keys:
            method: the function to run
            service_ver: the version of the app to run
            params: the set of inputs, mapped to what the method expects to see
            app_id: the original id of the app to run
            wsid: the workspace id associated with the new job
            source_ws_objects: the UPAs for any workspace objects involved with running the app, if any
            meta: key-value pairs, usually containing:
                cell_id (if not None),
                run_id (if not None),
                tag
        """
        # get the app id from the spec
        app_id = spec["info"]["id"]

        # Preflight check the params - all required ones are present, all
        # values are the right type, all numerical values are in given ranges
        spec_params = self.spec_manager.app_params(spec)

        spec_params_map = {spec_params[i]["id"]: spec_params[i] for i in range(len(spec_params))}
        ws_input_refs = extract_ws_refs(app_id, tag, spec_params, param_set)
        input_vals = self._map_inputs(
            spec["behavior"]["kb_service_input_mapping"], param_set, spec_params_map
        )

        service_method = spec["behavior"]["kb_service_method"]
        service_name = spec["behavior"]["kb_service_name"]
        service_ver = spec["behavior"].get("kb_service_version")

        # Let the given version override the spec's version.
        if version is not None:
            service_ver = version

        # This is what calls the function in the back end - Module.method
        # This isn't the same as the app spec id.
        function_name = service_name + "." + service_method
        job_meta = {"tag": tag}
        if cell_id is not None:
            job_meta["cell_id"] = cell_id
        if run_id is not None:
            job_meta["run_id"] = run_id

        # This is the input set for EE2.run_job. Now we need the workspace id
        # and whatever fits in the metadata.
        job_runner_inputs = {
            "method": function_name,
            "service_ver": service_ver,
            "params": input_vals,
            "app_id": app_id,
            "meta": job_meta,
        }
        if ws_id is not None:
            job_runner_inputs["wsid"] = ws_id
        if len(ws_input_refs) > 0:
            job_runner_inputs["source_ws_objects"] = ws_input_refs

        return job_runner_inputs

    @_app_error_wrapper
    def run_local_app(
        self: "AppManager",
        app_id: str,
        params: dict[str, Any],
        tag: str = "release",
        version: str | None = None,
        cell_id: str | None = None,
        run_id: str | None = None,
        widget_state=None,
    ):
        """Attempts to run a local app. These do not return a Job object, but just
        the result of the app. In most cases, this will be a Javascript display
        of the result, but could be anything.

        If the app_spec looks like it makes a service call, then this raises a
        ValueError. Otherwise, it validates each parameter in **kwargs against
        the app spec, executes it, and returns the result.

        Parameters:
        -----------
        app_id - should be from the app spec, e.g. 'view_expression_profile'
        params - the dictionary of parameters for the app. Should be key-value
                 pairs where they keys are strings. If any non-optional
                 parameters are missing, an informative string will be printed.
        tag - optional, one of [release|beta|dev] (default=release)
        version - optional, a semantic version string. Only released modules
                  have versions, so if the tag is not 'release', and a version
                  is given, a ValueError will be raised.

        Example:
        run_local_app('NarrativeViewers/view_expression_profile',
                      {
                          "input_expression_matrix": "MyMatrix",
                          "input_gene_ids": "1234"
                      },
                      version='0.0.1',
                      input_expression_matrix="MyMatrix")
        """
        spec = self._get_validated_app_spec(app_id, tag, False, version=version)

        # Here, we just deal with two behaviors:
        # 1. None of the above - it's a viewer.
        # 2. ***TODO*** python_class / python_function.
        #    Import and exec the python code.

        # for now, just map the inputs to outputs.
        # First, validate.
        # Preflight check the params - all required ones are present, all
        # values are the right type, all numerical values are in given ranges
        spec_params = self.spec_manager.app_params(spec)
        (params, ws_refs) = validate_parameters(app_id, tag, spec_params, params)

        # Log that we're trying to run a job...
        log_info = {
            "app_id": app_id,
            "tag": tag,
            "username": system_variable("user_id"),
            "ws": system_variable("workspace"),
        }
        kblogging.log_event(self._log, "run_local_app", log_info)

        self._send_comm_message(
            MESSAGE_TYPE["RUN_STATUS"],
            {
                "event": "success",
                "event_at": timestamp(),
                "cell_id": cell_id,
                "run_id": run_id,
            },
        )

        (output_widget, widget_params) = map_outputs_from_state([], params, spec)

        # All a local app does is route the inputs to outputs through the
        # spec's mapping, and then feed that into the specified output widget.
        wm = WidgetManager()
        if widget_state is not None:
            return wm.show_advanced_viewer_widget(
                output_widget, widget_params, widget_state, cell_id=cell_id, tag=tag
            )
        return wm.show_output_widget(output_widget, widget_params, cell_id=cell_id, tag=tag)

    def run_local_app_advanced(
        self: "AppManager",
        app_id: str,
        params: dict[str, Any],
        widget_state,
        tag: str = "release",
        version: str | None = None,
        cell_id: str | None = None,
        run_id: str | None = None,
    ):
        return self.run_local_app(
            app_id,
            params,
            widget_state=widget_state,
            tag=tag,
            version=version,
            cell_id=cell_id,
            run_id=run_id,
        )

    def _get_validated_app_spec(
        self: "AppManager", app_id: str, tag: str, is_long, version: str | None = None
    ):
        if (
            version is not None
            and tag != "release"
            and re.match(r"\d+\.\d+\.\d+", version) is not None
        ):
            raise ValueError(
                "Semantic versions only apply to released app modules. "
                + "You can use a Git commit hash instead to specify a "
                + "version."
            )
        self.spec_manager.check_app(app_id, tag, raise_exception=True)
        # Get the spec & params
        spec = self.spec_manager.get_spec(app_id, tag)
        if "behavior" not in spec:
            raise ValueError("This app appears invalid - it has no defined behavior")
        if "script_module" in spec["behavior"] or "script_name" in spec["behavior"]:
            # It's an old NJS script. These don't work anymore.
            raise ValueError(
                "This app relies on a service that is now obsolete. Please contact "
                + "the administrator."
            )
        if is_long and "kb_service_input_mapping" not in spec["behavior"]:
            raise ValueError(
                "This app does not appear to be a long-running "
                + "job! Please use 'run_local_app' to start this "
                + "instead."
            )
        return spec

    def _map_group_inputs(
        self: "AppManager",
        value: list | dict | None,
        spec_param: dict[str, Any],
        spec_params: dict[str, Any],
    ):
        if isinstance(value, list):
            return [self._map_group_inputs(v, spec_param, spec_params) for v in value]

        if value is None:
            return None

        mapped_value = {}
        id_map = spec_param.get("id_mapping", {})
        for param_id in id_map:
            # ensure that the param referenced in the group param list
            # exists in the spec.
            # NB: This should really never happen if the sdk registration
            # process validates them.
            if param_id not in spec_params:
                msg = "Unknown parameter id in group mapping: " + param_id
                raise ValueError(msg)
        for param_id in value:
            target_key = id_map.get(param_id, param_id)
            # Sets either the raw value, or if the parameter is an object
            # reference the full object refernce (see the method).
            if value[param_id] is None:
                target_val = None
            else:
                target_val = resolve_ref_if_typed(value[param_id], spec_params[param_id])

            mapped_value[target_key] = target_val
        return mapped_value

    def _map_inputs(
        self: "AppManager",
        input_mapping: list[dict[str, Any]],
        params: dict[str, Any],
        spec_params: dict[str, Any],
    ):
        """Maps the dictionary of parameters and inputs based on rules provided in
        the input_mapping. This iterates over the list of input_mappings, and
        uses them as a filter to apply to each parameter.

        Returns a list of inputs that can be passed directly to NJSW.run_job

        input_mapping is a list of dicts, as defined by
        NarrativeMethodStore.ServiceMethodInputMapping.
        params is a dict of key-value-pairs, each key is the input_parameter
        field of some parameter.
        """
        inputs_dict = {}
        for p in input_mapping:
            # 2 steps - figure out the proper value, then figure out the
            # proper position. value first!
            p_value = None
            input_param_id = None
            if "input_parameter" in p:
                input_param_id = p["input_parameter"]
                p_value = params.get(input_param_id)
                if spec_params[input_param_id].get("type", "") == "group":
                    p_value = self._map_group_inputs(
                        p_value, spec_params[input_param_id], spec_params
                    )
                # turn empty strings into None
                if isinstance(p_value, str) and len(p_value) == 0:
                    p_value = None
            elif "narrative_system_variable" in p:
                p_value = system_variable(p["narrative_system_variable"])
            if "constant_value" in p and p_value is None:
                p_value = p["constant_value"]
            if "generated_value" in p and p_value is None:
                p_value = self._generate_input(p["generated_value"])

            spec_param = None
            if input_param_id:
                spec_param = spec_params[input_param_id]
            p_value = transform_param_value(p.get("target_type_transform"), p_value, spec_param)

            # get position!
            arg_position = p.get("target_argument_position", 0)
            target_prop = p.get("target_property")
            if target_prop is not None:
                final_input = inputs_dict.get(arg_position, {})
                if "/" in target_prop:
                    # This is case when slashes in target_prop separate
                    # elements in nested maps. We ignore escaped slashes
                    # (separate backslashes should be escaped as well).
                    bck_slash = "\u244a"
                    fwd_slash = "\u20eb"
                    temp_string = target_prop.replace("\\\\", bck_slash)
                    temp_string = temp_string.replace("\\/", fwd_slash)
                    temp_path = []
                    for part in temp_string.split("/"):
                        part = part.replace(bck_slash, "\\")
                        part = part.replace(fwd_slash, "/")
                        temp_path.append(part.encode("ascii", "ignore").decode("ascii"))
                    temp_map = final_input
                    temp_key = None
                    # We're going along the path and creating intermediate
                    # dictionaries.
                    for temp_path_item in temp_path:
                        if temp_key:
                            if temp_key not in temp_map:
                                temp_map[temp_key] = {}
                            temp_map = temp_map[temp_key]
                        temp_key = temp_path_item
                    # temp_map points to deepest nested map now, temp_key is
                    # the last item in the path
                    temp_map[temp_key] = p_value
                else:
                    final_input[target_prop] = p_value
                inputs_dict[arg_position] = final_input
            else:
                inputs_dict[arg_position] = p_value

        inputs_list = []
        keys = sorted(inputs_dict.keys())
        for k in keys:
            inputs_list.append(inputs_dict[k])
        return inputs_list

    def _generate_input(self: "AppManager", generator: dict[str, Any] | None):
        """Generates an input value using rules given by
        NarrativeMethodStore.AutoGeneratedValue.
        generator - dict
            has 3 optional properties:
            prefix - if present, is prepended to the generated string.
            symbols - if present is the number of symbols to autogenerate (if
                      not present, default=8)
            suffix - if present, is appended to the generated string.
        So, if generator is None or an empty dict, returns an 8-symbol string.
        """
        symbols = 8
        if "symbols" in generator:
            try:
                symbols = int(generator["symbols"])
            except BaseException:
                raise ValueError(
                    'The "symbols" input to the generated value must be an ' + "integer > 0!"
                ) from None
        if symbols < 1:
            raise ValueError("Must have at least 1 symbol to randomly generate!")
        ret = "".join([chr(random.randrange(0, 26) + ord("A")) for _ in range(symbols)])
        if "prefix" in generator:
            ret = str(generator["prefix"]) + ret
        if "suffix" in generator:
            return ret + str(generator["suffix"])
        return ret

    def _send_comm_message(self: "AppManager", msg_type: str, content: dict[str, Any]):
        JobComm().send_comm_message(msg_type, content)

    def _get_agent_token(self: "AppManager", name: str) -> auth.TokenInfo:
        """Retrieves an agent token from the Auth service with a formatted name.
        This prepends "KBApp_" to the name for filtering, and trims to make sure the name
        isn't longer than it should be.
        """
        token_name = f"KBApp_{name}"
        token_name = token_name[: self.__MAX_TOKEN_NAME_LEN]
        return auth.get_agent_token(auth.get_auth_token(), token_name=token_name)
