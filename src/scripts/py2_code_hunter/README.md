# Python2 Code Hunter

Hunts and tags Python 2 code among all Narratives in a Workspace environment.

## Usage
```
python py2_code_hunter -w https://something.kbase.us/services/ws -n 1 -m 40000 -t ADMIN_TOKEN -j hunt_results.json
```

```
usage: py2_code_hunter.py [-h] [-t TOKEN] [-w WS_URL] [-n MIN_ID] [-m MAX_ID] [-j OUTFILE] [-r REPORT]

Hunts for Python 2 code in all Narratives in a Workspace environment. Needs an
Administrator token.

optional arguments:
  -h, --help
        Show this help message and exit
  -t TOKEN, --token TOKEN
        Auth token for workspace admin
  -w WS_URL, --ws_url WS_URL
        Workspace service endpoint
  -n MIN_ID, --min_id MIN_ID
        Lowest workspace id to scan for code
  -m MAX_ID, --max_id MAX_ID
        Highest workspace id to scan for code
  -j OUTFILE, --json_outfile OUTFILE
        Output file for results of the search
  -r REPORT, --report_outfile REPORT
        Output file for a TSV-formatted report
```

## Details
This scans every Workspace from 1->MAX_ID for a Narrative (using the Workspace metadata, so any non-tagged Narratives won't show up). It then fetches that Narrative, and skims each code cell for anything that looks like Python 2 code. Finally, it uses `lib2to3` to update that code, and produces a report of what lines should be updated in each cell.

## Output files
### 1. JSON output file.

The main outfile is a JSON file with the following keys:
* `fail` - list of workspaces that couldn't get scanned for any reason. Common ones are that they're either deleted or don't exist.
    * list of objects with keys `id` and `error`.
* `no_narr` - list of workspaces that don't appear to have a Narrative that can be scanned.
    * list of objects with key `id`
* `no_change` - list of Narrative structures (see below) that don't need to be updated. Either they have no code cells, or no code was found that needs changing.
* `changes` - list of Narrative structures (see below) that need to be updated. Includes all suggested changes.


**Narrative structure**
```json
{
    "id": workspace id,
    "last_saved": timestamp of last save,
    "saved_by": username who did the last save,
    "updates": code update stucture (see below),
    "owner": workspace owner (probably POC for that Narrative?)
}
```

**Code update stucture**
```json
{
    "cell_index <int>": {
        "line number <int>": {
            "o": original line,
            "u": updated line
        }
    }
}
```

eg:
```json
{
    "4": {
        "0": {
            "o": "print \"foo\"",
            "u": "print(\"foo\")"
        }
    },
    "5": {
        "1": {
            "o": "len(some_dict.keys())",
            "u": "len(list(some_dict.keys()))"
        },
        "4": {
            "o": "for key,val in some_dict.iteritems():",
            "u": "for key,val in some_dict.items():"
        },
        "7": {
            "o": "except ValueError, e:",
            "u": "except ValueError as e:"
        }
    }
}
```

You can optionally create a tab-delimited file with a report summary for the JSON output. This has a row for each narrative with the user id, narrative id, and last time the narrative was saved. One row is generated for each Narrative that has a suggested change.
