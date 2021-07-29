"""
Hunts for Python 2 code in all Narratives in a Workspace environment.
Needs an Administrator token.
"""
import sys
import argparse
import json
from biokbase.workspace.client import Workspace
import biokbase.workspace.baseclient as baseclient
import lib2to3
from lib2to3.refactor import RefactoringTool, get_fixers_from_package
import nbformat
from narr_info import NarrativeInfo
from typing import List


DEFAULT_OUTPUT_FILE = "code_search_results.json"


def find_all_narrative_py2_code(
    ws_url: str, token: str, min_id: int, max_id: int, outfile: str, report: str
):
    assert ws_url
    assert token
    assert min_id and min_id > 0
    assert max_id and max_id >= min_id
    assert outfile

    ws = Workspace(url=ws_url, token=token)
    all_results = {"fail": [], "no_narr": [], "no_change": [], "changes": []}

    avail_fixes = set(get_fixers_from_package("lib2to3.fixes"))
    rt = RefactoringTool(avail_fixes, options={"print_function": False})

    for ws_id in range(min_id, max_id):
        try:
            result = _find_narrative_py2_code(ws_id, ws, rt, verbose=True)
            if result is None:
                all_results["no_narr"].append({"id": ws_id})
            elif result.updated_cells == 0:
                all_results["no_change"].append(result.to_dict())
            else:
                all_results["changes"].append(result.to_dict())
        except baseclient.ServerError as e:
            if "No workspace with id" in str(e):
                print(f"WS:{ws_id} does not exist")
            all_results["fail"].append({"id": ws_id, "error": str(e.message)})
        except TypeError as e:
            print(f"WS:{ws_id} metadata doesn't link to a Narrative type!")
            all_results["fail"].append({"id": ws_id, "error": str(e)})
        except json.JSONDecodeError as e:
            print(f"WS:{ws_id} unable to unpack Narrative - not valid JSON!")
            all_results["fail"].append(
                {"id": ws_id, "error": f"Invalid JSON in Narrative object: {str(e)}"}
            )
    with open(outfile, "w") as fjson:
        fjson.write(json.dumps(all_results, indent=4))
    print(f"Done. Results in {outfile}")
    if report is not None:
        with open(report, "w") as ftsv:
            ftsv.write("user name\tnarrative id\tlast saved\n")
            for n in all_results["changes"]:
                ftsv.write(f"{n['owner']}\t{n['id']}\t{n['last_saved']}\n")


def _find_narrative_py2_code(
    ws_id: int, ws: Workspace, rt: RefactoringTool, verbose: bool = False
) -> NarrativeInfo:
    """
    ws_id - workspace id to scan for Narratives
    ws - an authenticated workspace client

    returns a NarrativeInfo object
    """
    if verbose:
        print(f"WS:{ws_id} Checking workspace {ws_id}")

    ws_info = ws.administer(
        {
            "command": "getWorkspaceInfo",
            "params": {
                "id": ws_id,
            },
        }
    )
    narr_id = ws_info[8].get("narrative")
    if narr_id is None:
        print(f"WS:{ws_id} has no linked Narrative")
        return

    narr_obj = ws.administer(
        {
            "command": "getObjects",
            "params": {"objects": [{"ref": f"{ws_id}/{narr_id}"}]},
        }
    )["data"][0]
    if not narr_obj["info"][2].startswith("KBaseNarrative.Narrative"):
        raise TypeError(f"Object {ws_id}/{narr_id} is not a Narrative!")

    return _update_narrative(narr_obj, ws_info, rt)


def _update_narrative(
    narr_obj: list, ws_info: list, rt: RefactoringTool
) -> NarrativeInfo:
    """
    Core pieces of this taken from this gist by Thomas Takluyver and Fernando Perez:
    https://gist.github.com/takluyver/c8839593c615bb2f6e80
    """

    try:
        nb = nbformat.reads(json.dumps(narr_obj["data"]), 4.0)
    except BaseException:
        nb = nbformat.reads(json.dumps(narr_obj["data"]), 3.0)
    ninfo = NarrativeInfo(narr_obj["info"], ws_info[2])

    if nb.nbformat == 4:
        nb.cells
    else:
        nb.worksheets[0].cells

    for idx, cell in enumerate(nb.cells):
        if cell.cell_type != "code":
            continue
        head = ""
        source = ""
        if hasattr(cell, "source"):
            source = cell.source
        elif hasattr(cell, "input"):
            source = cell.input
        else:
            continue
        if source.startswith("%%"):
            split_source = cell.source.split("\n", 1)
            if len(split_source) == 2:
                head, source = split_source
        try:
            tree = rt.refactor_string(source + "\n", f"{ws_info[0]}-cell{idx}")
            result = str(tree)[:-1]
        except (lib2to3.pgen2.parse.ParseError, lib2to3.pgen2.tokenize.TokenError):
            result = source
        if head:
            source = head + "\n" + source
            result = head + "\n" + result
        ninfo.add_updated_cell(idx, source, result)
    return ninfo


def parse_args(args: List[str]):
    p = argparse.ArgumentParser(description=__doc__.strip())
    p.add_argument(
        "-t",
        "--token",
        dest="token",
        default=None,
        help="Auth token for workspace admin",
    )
    p.add_argument(
        "-w", "--ws_url", dest="ws_url", default=None, help="Workspace service endpoint"
    )
    p.add_argument(
        "-n",
        "--min_id",
        dest="min_id",
        default=1,
        help="Lowest workspace id to scan for code",
    )
    p.add_argument(
        "-m",
        "--max_id",
        dest="max_id",
        default=40000,
        help="Highest workspace id to scan for code",
    )
    p.add_argument(
        "-j",
        "--json_outfile",
        dest="outfile",
        default=DEFAULT_OUTPUT_FILE,
        help="Output file for results of the search",
    )
    p.add_argument(
        "-r",
        "--report_outfile",
        dest="report",
        default=None,
        help="Output file for a TSV-formatted report",
    )
    args = p.parse_args(args)
    if args.ws_url is None:
        raise ValueError("ws_url - the Workspace service endpoint - is required!")
    if args.token is None:
        raise ValueError("token - a valid Workspace admin auth token - is required!")
    return args


def main(args: List[str]):
    args = parse_args(args)
    return find_all_narrative_py2_code(
        args.ws_url,
        args.token,
        int(args.min_id),
        int(args.max_id),
        args.outfile,
        args.report,
    )


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
