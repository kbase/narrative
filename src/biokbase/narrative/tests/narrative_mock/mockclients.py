from ..util import ConfigTests
from biokbase.workspace.baseclient import ServerError
from biokbase.narrative.jobs.appmanager import BATCH_ID_KEY
import copy

RANDOM_DATE = "2018-08-10T16:47:36+0000"
RANDOM_TYPE = "ModuleA.TypeA-1.0"


class MockClients:
    """
    Mock KBase service clients as needed for Narrative backend tests.
    Use this with the Python mock library to mock the biokbase.narrative.clients.get call
    as a test function decorator, like this:

    <top of file>
    from mockclients import get_mock_client

    class MyTestCase(unittest.TestCase):
        @mock.patch('biokbase.narrative.jobs.appmanager.clients.get', get_mock_client)
        def test_my_function(self):
            ... test code that calls out to AppManager ...

    This case will monkeypatch the clients.get call that the appmanager uses to return
    an instance of get_mock_client, which is, in turn, this class. Any client call that
    the appmanager uses will go through here, so be sure that it's mocked in this class.
    This really only works because each client has different function names to call, so
    these all return different things. If you have something that overlaps, you might need
    to make another class. That'll mean either changing get_mock_client to return a new
    client in some cases, or doing interesting things with your duplicate function.

    These are specially put together to handle common use cases, and in some cases, expected test
    inputs (e.g. special workspace names)

    Will likely be removed (or modified, at least), when a minified KBase deploy becomes available.
    Then we don't need to mock as much.
    """
    config = ConfigTests()
    _ee2_job_info = config.load_json_file(
        config.get("jobs", "ee2_job_info_file")
    )

    def __init__(self, token=None):
        if token is not None:
            assert isinstance(token, str)
        self.job_info = self.config.load_json_file(
            self.config.get("jobs", "job_info_file")
        )
        self.test_job_id = self.config.get("app_tests", "test_job_id")

    @property
    def ee2_job_info(self):
        return copy.deepcopy(self._ee2_job_info)

    # ----- User and Job State functions -----

    def list_jobs2(self, params):
        return self.job_info.get("job_info")

    def delete_job(self, job):
        return "bar"

    def check_workspace_jobs(self, params):
        return self.ee2_job_info

    # ----- Narrative Method Store functions ------

    def list_methods_spec(self, params):
        return self.config.load_json_file(self.config.get("specs", "app_specs_file"))

    def list_categories(self, params):
        return self.config.load_json_file(self.config.get("specs", "type_specs_file"))

    def get_method_full_info(self, params):
        return self.config.load_json_file(self.config.get("specs", "app_infos_file"))

    # ----- Workspace functions -----

    def ver(self):
        return "0.0.0"

    def get_workspace_info(self, params):
        """
        Some magic workspace ids.
        12345 - the standard one.
        678 - doesn't have useful narrative info in its metadata
        789 - raises a permissions error
        890 - raises a deleted workspace error
        otherwise, returns workspace info with narrative = 1, and narrative name = 'Fake'
        """
        wsid = params.get("id", 12345)
        name = params.get("workspace", "some_workspace")
        if wsid == 678:
            return [
                wsid,
                name,
                "owner",
                "moddate",
                "largestid",
                "a",
                "n",
                "unlocked",
                {},
            ]
        elif wsid == 789:
            raise ServerError(
                "JSONRPCError", -32500, "User you may not read workspace 789"
            )
        elif wsid == 890:
            raise ServerError("JSONRPCError", -32500, "Workspace 890 is deleted")
        elif name != "invalid_workspace":
            return [
                wsid,
                name,
                "owner",
                "moddate",
                "largestid",
                "a",
                "n",
                "unlocked",
                {
                    "is_temporary": "false",
                    "narrative": "1",
                    "narrative_nice_name": "Fake",
                },
            ]
        else:
            raise Exception("not found")

    def get_object_info_new(self, params):
        """
        Returns a (more or less) random object.
        But we introspect the params a little bit to return something crafted to the test.
        Add more to this if it's helpful.
        """
        random_obj_info = [
            5,
            "Sbicolor2",
            "KBaseGenomes.Genome-12.3",
            "2017-03-31T23:42:59+0000",
            1,
            "wjriehl",
            18836,
            "wjriehl:1490995018528",
            "278abf8f0dbf8ab5ce349598a8674a6e",
            109180038,
            None,
        ]

        infos = []
        for obj_ident in params.get(
            "objects", [{"name": "Sbicolor2", "workspace": "whatever"}]
        ):
            if obj_ident.get("name") == "rhodobacterium.art.q20.int.PE.reads":
                infos.append(
                    [
                        7,
                        "rhodobacterium.art.q20.int.PE.reads",
                        "KBaseFile.PairedEndLibrary-2.1",
                        "2018-06-26T19:31:41+0000",
                        1,
                        "wjriehl",
                        12345,
                        "random_workspace",
                        "a20f2df66f973de41b84164f2c2bedd3",
                        765,
                        None,
                    ]
                )
            elif obj_ident.get("name") == "rhodobacterium.art.q10.PE.reads":
                infos.append(
                    [
                        8,
                        "rhodobacterium.art.q10.PE.reads",
                        "KBaseFile.PairedEndLibrary-2.1",
                        "2018-08-13T23:13:09+0000",
                        1,
                        "wjriehl",
                        12345,
                        "random_workspace",
                        "9f014a3c08368537a40fa2e4b90f9cab",
                        757,
                        None,
                    ]
                )
            else:
                infos.append(random_obj_info)
        return infos

    def get_object_info3(self, params):
        infos = [
            [
                5,
                "Sbicolor2",
                "KBaseGenomes.Genome-12.3",
                "2017-03-31T23:42:59+0000",
                1,
                "wjriehl",
                18836,
                "wjriehl:1490995018528",
                "278abf8f0dbf8ab5ce349598a8674a6e",
                109180038,
                None,
            ]
        ]
        paths = [["18836/5/1"]]
        num_objects = len(params.get("objects", [0]))
        return {"infos": infos * num_objects, "paths": paths * num_objects}

    # ----- Narrative Job Service functions -----

    def run_job(self, params):
        return self.test_job_id

    def run_job_batch(self, batch_job_inputs, batch_params):
        child_job_ids = [self.test_job_id for i in range(len(batch_job_inputs))]
        return {BATCH_ID_KEY: self.test_job_id, "child_job_ids": child_job_ids}

    def cancel_job(self, job_id):
        return {}

    def retry_job(self, params):
        job_id = params["job_id"]
        return {"job_id": job_id, "retry_id": job_id[::-1]}

    def retry_jobs(self, params):
        job_ids = params["job_ids"]
        results = list()
        for job_id in job_ids:
            results.append({"job_id": job_id, "retry_id": job_id[::-1]})
        return results

    def get_job_params(self, job_id):
        return self.ee2_job_info.get(job_id, {}).get("job_input", {})

    def check_job(self, params):
        job_id = params.get("job_id")
        if not job_id:
            return {}
        info = self.ee2_job_info.get(job_id, {"job_id": job_id, "status": "unmocked"})
        if "exclude_fields" in params:
            for f in params["exclude_fields"]:
                if f in info:
                    del info[f]
        return info

    def check_jobs(self, params):
        job_ids = params.get("job_ids")
        infos = dict()
        for job in job_ids:
            infos[job] = self.check_job(
                {"job_id": job, "exclude_fields": params.get("exclude_fields", [])}
            )
        return infos

    def get_job_logs(self, params):
        """
        params: job_id, skip_lines
        skip_lines = number of lines to skip, get all the rest

        single line: {
            is_error 0,1
            line: string
        }
        there are only 100 "log lines" in total.
        """
        total_lines = 100
        skip = params.get("skip_lines", 0)
        lines = list()
        if skip < total_lines:
            for i in range(total_lines - skip):
                lines.append(
                    {"is_error": 0, "line": "This is line {}".format(i + skip)}
                )
        return {"last_line_number": max(total_lines, skip), "lines": lines}

    # ----- Service Wizard functions -----
    def sync_call(self, call, params):
        if call == "NarrativeService.list_objects_with_sets":
            return self._mock_ns_list_objects_with_sets(params)

    def _mock_ns_list_objects_with_sets(self, params):
        """
        Always returns the same several objects. Should be enough to
        cover all data cases.
        """
        params = params[0]
        user_id = "some_user"
        ws_name = "some_workspace"
        ws_id = 1
        types = params.get("types", [])
        with_meta = True if params.get("includeMetadata") else False
        if params.get("ws_name"):
            ws_name = params["ws_name"]
        if params.get("ws_id"):
            ws_id = params["ws_id"]
        if params.get("workspaces"):
            ws_name = params["workspaces"][0]
        dp_id = 999
        dp_ref = "{}/{}".format(ws_id, dp_id)

        data = {
            "data": [
                {
                    "object_info": [
                        6,
                        "NarrativeObj",
                        "KBaseNarrative.Narrative-4.0",
                        "2018-08-10T16:45:12+0000",
                        1,
                        user_id,
                        ws_id,
                        ws_name,
                        "checksum",
                        12345,
                        None,
                    ]
                },
                {
                    "object_info": [
                        1,
                        "obj1",
                        RANDOM_TYPE,
                        RANDOM_DATE,
                        2,
                        user_id,
                        ws_id,
                        ws_name,
                        "checksum",
                        12345,
                        None,
                    ]
                },
                {
                    "object_info": [
                        7,
                        "obj7",
                        RANDOM_TYPE,
                        RANDOM_DATE,
                        2,
                        user_id,
                        ws_id,
                        ws_name,
                        "checksum",
                        12345,
                        None,
                    ]
                },
                {
                    "object_info": [
                        8,
                        "obj8",
                        RANDOM_TYPE,
                        RANDOM_DATE,
                        2,
                        user_id,
                        ws_id,
                        ws_name,
                        "checksum",
                        12345,
                        None,
                    ]
                },
                {
                    "object_info": [
                        9,
                        "obj9",
                        "ModuleB.TypeB-1.0",
                        RANDOM_DATE,
                        3,
                        user_id,
                        ws_id,
                        ws_name,
                        "checksum",
                        12345,
                        None,
                    ]
                },
                {
                    "object_info": [
                        3,
                        "obj3",
                        "ModuleC.TypeC-1.0",
                        RANDOM_DATE,
                        4,
                        user_id,
                        ws_id,
                        ws_name,
                        "checksum",
                        12345,
                        None,
                    ]
                },
                {
                    "object_info": [
                        4,
                        "obj4",
                        "ModuleD.TypeD-1.0",
                        RANDOM_DATE,
                        5,
                        user_id,
                        ws_id,
                        ws_name,
                        "checksum",
                        12345,
                        None,
                    ],
                    "dp_info": {"ref": dp_ref, "refs": [dp_ref]},
                },
                {
                    "object_info": [
                        5,
                        "obj5",
                        "Module5.Type5-1.0",
                        RANDOM_DATE,
                        6,
                        user_id,
                        ws_id,
                        ws_name,
                        "checksum",
                        12345,
                        None,
                    ],
                    "dp_info": {"ref": dp_ref, "refs": [dp_ref]},
                },
            ],
            "data_palette_refs": {str(ws_id): dp_ref},
        }
        # filter on type
        if types:
            # kinda ew, but kinda pretty, too.
            # check if any member of types is the start of any object_info type, pass
            # the filter if so
            data["data"] = list(
                filter(
                    lambda x: any(
                        [
                            x["object_info"][2].lower().startswith(t.lower())
                            for t in types
                        ]
                    ),
                    data["data"],
                )
            )
        if with_meta:
            # fake, uniform metadata. fun!
            for d in data["data"]:
                d["object_info"][10] = {"key1": "value1", "key2": "value2"}
        return [data]


def get_mock_client(client_name, token=None):
    return MockClients(token=token)


def get_failing_mock_client(client_name, token=None):
    return FailingMockClient(token=token)


class FailingMockClient:
    def __init__(self, token=None):
        pass

    def check_workspace_jobs(self, params):
        raise ServerError("JSONRPCError", -32000, "Job lookup failed.")

    def cancel_job(self, params):
        raise ServerError("JSONRPCError", -32000, "Can't cancel job")

    def retry_job(self, params):
        raise ServerError("JSONRPCError", -32000, "Job retry failed")

    def retry_jobs(self, params):
        raise ServerError("JSONRPCError", -32000, "Jobs retry failed")

    def check_job_canceled(self, params):
        raise ServerError("JSONRPCError", 1, "Can't cancel job")

    def get_job_logs(self, params):
        raise ServerError("JSONRPCError", 2, "Can't get job logs")


class MockStagingHelper:
    def list(self):
        """
        Mock the call to the staging service to get the "user's" files.
        This returns a total of 7 files, 6 of while have "file" in the name,
        and 3 are paths.
        """
        return [
            "file1",
            "file2",
            "file3",
            "path1/file1",
            "path2/file2",
            "omg/this/is/a/long/path/to/a/file",
            "filterme",
        ]


class assert_obj_method_called(object):
    def __init__(self, obj, method, call_status=True):
        self.obj = obj
        self.method = method
        self.call_status = call_status

    def called(self, *args, **kwargs):
        self.method_called = True
        self.orig_method(*args, **kwargs)

    def __enter__(self):
        self.orig_method = getattr(self.obj, self.method)
        setattr(self.obj, self.method, self.called)
        self.method_called = False

    def __exit__(self, exc_type, exc_value, traceback):
        assert getattr(self.obj, self.method) == self.called, (
            "method %s was modified during assertMethodIsCalled" % self.method
        )

        setattr(self.obj, self.method, self.orig_method)

        # If an exception was thrown within the block, we've already failed.
        if traceback is None:
            assert (
                self.method_called is self.call_status
            ), "method %s of %s was not %s" % (self.method, self.obj, self.call_status)
