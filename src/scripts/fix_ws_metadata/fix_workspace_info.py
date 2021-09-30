"""
Fixes workspace info to do the following.
1. Make sure the "narrative" metadata field contains an int that points to the narrative.
2. Make sure the "narrative_nice_name" metadata field is correct.
3. Make sure the "is_temporary" metadata field exists and is correct.
4. Adds a count of the number of narrative cells.
5. Does nothing at all if there's > 1 narrative in the workspace.
Note that while this fetches the Narrative object, it doesn't modify it in any way.
"""
import sys
import requests
import argparse
import json
from biokbase.workspace.client import Workspace
import biokbase.workspace.baseclient as baseclient

DEFAULT_OUTPUT_FILE = "update_results.json"


def fix_all_workspace_info(
    ws_url, auth_url, token, max_id, outfile=DEFAULT_OUTPUT_FILE
):
    """
    Iterates over all workspaces available at the ws_url endpoint, using the given admin token,
    and applies _fix_single_workspace_info to each.
    ws_url = endpoint for the workspace service to modify
    auth_url = endpoint for the auth service that the workspace talks to
    token = an active auth token for a workspace administrator
    max_id = the max workspace id to fix - should be fairly large, any that are missing up to that point are just ignored.
    """
    assert ws_url
    assert auth_url
    assert token

    user_id = _get_user_id(auth_url, token)
    ws = Workspace(url=ws_url, token=token)
    all_results = {
        "multiple": [],  # more than 1 narrative, not updated
        "update": [],  # list of updated narratives
        "skip": [],  # skipped - likely has 0 narratives
        "fail": [],  # failed because either that id doesn't exist, or it was deleted. maybe locked.
    }
    for ws_id in range(1, max_id):
        try:
            result = _fix_single_workspace_info(ws_id, user_id, ws, verbose=True)
            if result.get("multiple") is not None:
                all_results["multiple"].append(result["multiple"])
            if result.get("update") is not None:
                all_results["update"].append(result["update"])
            if result.get("skip") is not None:
                all_results["skip"].append(result["skip"])
        except baseclient.ServerError as e:
            if "No workspace with id" in str(e):
                print("WS:{} does not exist".format(ws_id))
            all_results["fail"].append({"id": ws_id, "error": str(e.message)})
    print("Done. Results in update_results.json")
    with open("update_results.json", "w") as f:
        f.write(json.dumps(all_results, indent=4))


def _fix_single_workspace_info(ws_id, admin_id, ws, verbose=False):
    """
    ws_id = id of the workspace to update.
    ws = an authenticated workspace client.
    """
    assert ws is not None
    assert str(ws_id).isdigit()

    result = dict()
    new_meta = dict()

    if verbose:
        print("WS:{} Checking workspace {}".format(ws_id, ws_id))

    # test if there's exactly 1 Narrative object in the workspace
    narr_obj_list = ws.administer(
        {
            "command": "listObjects",
            "params": {"ids": [ws_id], "type": "KBaseNarrative.Narrative"},
        }
    )
    # fetch the workspace info and narrative object (with metadata)
    ws_info = ws.administer(
        {"command": "getWorkspaceInfo", "params": {"id": int(ws_id)}}
    )
    ws_meta = ws_info[8]
    if len(narr_obj_list) != 1:
        if "narrative" not in ws_meta:
            if verbose:
                print(
                    "WS:{} Found {} Narratives and metadata isn't initialized! Skipping this workspace".format(
                        ws_id, len(narr_obj_list)
                    )
                )
            result["skip"] = {
                "id": ws_id,
                "num_narr": len(narr_obj_list),
                "moddate": ws_info[3],
            }
            return result
        else:
            if verbose:
                print(
                    "WS:{} Found {} Narratives, metadata configured to point to Narrative with obj id {}. Skipping, but do this manually.".format(
                        ws_id, len(narr_obj_list), ws_meta["narrative"]
                    )
                )
            result["multiple"] = {
                "id": ws_id,
                "num_narr": len(narr_obj_list),
                "moddate": ws_info[3],
            }
            return result

    narr_info = narr_obj_list[0]
    narr_obj_id = narr_info[0]
    narr_obj = ws.administer(
        {
            "command": "getObjects",
            "params": {"objects": [{"ref": "{}/{}".format(ws_id, narr_obj_id)}]},
        }
    )["data"][0]
    narr_name = narr_obj["data"]["metadata"]["name"]

    # 1. Test "narrative" key of ws_meta
    if str(narr_obj_id) != ws_meta.get("narrative"):
        new_meta["narrative"] = str(narr_obj_id)
        if verbose:
            print(
                "WS:{} Updating id from {} -> {}".format(
                    ws_id, ws_meta.get("narrative"), narr_obj_id
                )
            )

    # get list of cells
    # if it's really REALLY old, it has a 'worksheets' field. Removed in Jupyter notebook format 4.
    if "worksheets" in narr_obj["data"]:
        cells = narr_obj["data"]["worksheets"][0]["cells"]
    else:
        cells = narr_obj["data"]["cells"]

    # 2. Test "is_temporary" key.
    # Should be true if there's only a single narrative version, and it's name is Untitled, and it only has a single markdown cell.
    # Should never reset to be temporary if it's not.
    # Really, this is here to add the field if it's not there, and to set things as non-temporary
    # if it looks like they should be.
    # So, if the marked 'is_temporary' is already false, do nothing.

    current_temp = ws_meta.get("is_temporary")
    if current_temp == "true":
        # make sure it should be temporary.
        if narr_info[4] > 1 or narr_name != "Untitled":
            if verbose:
                print(
                    "WS:{} Narrative is named {} and has {} versions - marking not temporary".format(
                        ws_id, narr_name, narr_info[4]
                    )
                )
            new_meta["is_temporary"] = "false"
        if len(cells) > 1 or cells[0]["cell_type"] != "markdown":
            if verbose:
                print(
                    "WS:{} Narrative has {} cells and the first is type {} - marking not temporary".format(
                        ws_id, len(cells), cells[0]["cell_type"]
                    )
                )
            new_meta["is_temporary"] = "false"
    elif current_temp is None:
        if (
            len(cells) == 1
            and cells[0]["cell_type"] == "markdown"
            and narr_name == "Untitled"
            and narr_info[4] == 1
        ):
            if verbose:
                print(
                    "WS:{} Narrative has no 'is_temporary' key - it appears temporary, so marking it that way".format(
                        ws_id
                    )
                )
            new_meta["is_temporary"] = "true"
        else:
            if verbose:
                print(
                    "WS:{} Narrative has no 'is_temporary' key - it doesn't appear temporary, so marking it that way".format(
                        ws_id
                    )
                )
            new_meta["is_temporary"] = "false"

    # 3. Test "narrative_nice_name" key
    current_name = ws_meta.get("narrative_nice_name")
    if (current_name is None and current_temp == "false") or current_name != narr_name:
        new_meta["narrative_nice_name"] = narr_name
        if verbose:
            print(
                "WS:{} Updating 'narrative_nice_name' from {} -> {}".format(
                    ws_id, current_name, narr_name
                )
            )

    # 4. Add the total cell count while we're at it.
    new_meta["cell_count"] = str(len(cells))
    if verbose:
        print("WS:{} Adding cell_count of {}".format(ws_id, str(len(cells))))

    # 5. Finally, add the searchtags field to metadata.
    new_meta["searchtags"] = "narrative"

    # ...and update the metadata
    _admin_update_metadata(ws, admin_id, ws_id, new_meta)
    result["update"] = {"id": ws_id, "moddate": ws_info[3]}
    return result


def _admin_update_metadata(ws, admin_id, ws_id, new_meta):
    """
    ws = workspace client with admin rights
    admin_id = username of the admin who's token was used to set up the ws client.
    ws_id = the workspace to tweak
    new_meta = the new metadata to set
    """

    # Now we can update the metadata. This is a little tricky from
    # If we don't have permission to write to the workspace, grab it.
    perms = ws.administer(
        {"command": "getPermissionsMass", "params": {"workspaces": [{"id": ws_id}]}}
    )["perms"][0]
    current_admin_perm = perms.get(admin_id, "n")
    if current_admin_perm != "a":
        # add the admin_id as an admin on that workspace.
        ws.administer(
            {
                "command": "setPermissions",
                "params": {"id": ws_id, "new_permission": "a", "users": [admin_id]},
            }
        )
    # Now that we added ourself as an admin on that workspace, we can just use
    # the usual call to update the metadata
    ws.alter_workspace_metadata({"wsi": {"id": ws_id}, "new": new_meta})

    # Now, reset our permission on that workspace.
    if current_admin_perm != "a":
        ws.administer(
            {
                "command": "setPermissions",
                "params": {
                    "id": ws_id,
                    "new_permission": current_admin_perm,
                    "users": [admin_id],
                },
            }
        )


def _get_user_id(auth_url, token):
    """
    This uses the given token to query the authentication service for information
    about the user who created the token.
    """
    token_api_url = auth_url + "/api/V2/token"
    headers = {"Authorization": token}
    r = requests.get(token_api_url, headers=headers)
    if r.status_code != requests.codes.ok:
        r.raise_for_status()
    auth_info = json.loads(r.content)
    return auth_info["user"]


def parse_args(args):
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
        "-a", "--auth_url", dest="auth_url", default=None, help="Auth service endpoint"
    )
    p.add_argument(
        "-m",
        "--max_id",
        dest="max_id",
        default=40000,
        help="Highest workspace id to fix (will ignore any others in the way)",
    )
    p.add_argument(
        "-o",
        "--outfile",
        dest="outfile",
        default=DEFAULT_OUTPUT_FILE,
        help="Output JSON file for results of the fix",
    )
    args = p.parse_args(args)
    if args.ws_url is None:
        raise ValueError("ws_url - the Workspace service endpoint - is required!")
    if args.auth_url is None:
        raise ValueError("auth_url - the Auth service endpoint - is required!")
    if args.token is None:
        raise ValueError("token - a valid Workspace admin auth token - is required!")
    return args


def main(args):
    args = parse_args(args)
    return fix_all_workspace_info(
        args.ws_url, args.auth_url, args.token, args.max_id, args.outfile
    )


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
