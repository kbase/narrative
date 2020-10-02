def sanitize_state(state):
    """
    There's too many places where there's "cancelled" or "canceled" or other weird variants
    in both narrative, UJS, and NJS. This is the central spot that attempts to deal with them.
    It does this by ONLY returning "canceled" as the state string for use by the front end.

    This takes a state structure (as returned by NJS.check_jobs or NJS.check_job) and returns
    it with some keys changed.
    """
    if "cancelled" in state:
        state["canceled"] = state.get("cancelled", 0)
        del state["cancelled"]
    if state.get("job_state", "") == "cancelled":
        state["job_state"] = "canceled"
    ujs_status = state.get("status", [])
    if (
        isinstance(ujs_status, list)
        and len(ujs_status) >= 2
        and ujs_status[1] == "cancelled"
    ):
        state["status"][1] = "canceled"
    return state


def sanitize_all_states(states):
    """
    Like sanitize_state above, but meant to be applied to the result of NJS.check_jobs. This maintains
    the plural structure provided by that function while changing the names around.
    """
    for job_id in states.get("job_states", {}):
        states["job_states"][job_id] = sanitize_state(states["job_states"][job_id])
    return states
