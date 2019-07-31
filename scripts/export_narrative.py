"""
Some tests for narrative exporting.
"""
__author__ = "Bill Riehl <wjriehl@lbl.gov>"

from biokbase.narrative.common.exceptions import PermissionsError
from biokbase.narrative.exporter.exporter import NarrativeExporter
from biokbase.narrative.common.narrative_ref import NarrativeRef
import os
import argparse
import sys

def main(args: dict) -> int:
    if not args.workspace_id:
        raise ValueError("A workspace id is required for exporting a Narrative")

    if not args.outfile:
        raise ValueError("Must include an output file for exporting the Narrative!")

    outfile = args.outfile
    if not outfile.lower().endswith(".html"):
        outfile = outfile + ".html"

    exporter = NarrativeExporter()
    try:
        exporter.export_narrative(NarrativeRef({'wsid': args.workspace_id}), outfile)
    except PermissionsError:
        print("The Narrative at reference " + args.workspace_id + " does not appear to be public!")
        return 1
    except Exception as e:
        print("An error occurred while exporting your Narrative:")
        print(e)
        raise

def parse_args() -> dict:
    p = argparse.ArgumentParser(description="Exports a Narrative to an HTML page.")
    p.add_argument("-w", "--workspace_id", dest="workspace_id", help="Narrative workspace id")
    p.add_argument("-o", "--output_file", dest="outfile", help="Output HTML file (.html will be appended if necessary)")
    return p.parse_args()

if __name__ == '__main__':
    sys.exit(main(parse_args()))
