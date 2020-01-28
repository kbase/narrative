"""
Some tests for narrative exporting.
"""
__author__ = "Bill Riehl <wjriehl@lbl.gov>"

from biokbase.narrative.narrativeio import PermissionsError
from biokbase.narrative.exporter.exporter import NarrativeExporter
import os
import sys
import argparse

def main(args):
    if not args.narrative_ref:
        print("Must include a Narrative object reference in the format XXX/YYY (these are the numbers in the usual Narrative URL)")
        return 1

    if not args.outfile:
        print("Must include an output file for exporting the Narrative!")
        return 1

    outfile = args.outfile
    if not outfile.lower().endswith(".html"):
        outfile = outfile + ".html"

    exporter = NarrativeExporter()
    try:
        exporter.export_narrative(args.narrative_ref, outfile)
    except PermissionsError:
        print("The Narrative at reference " + args.narrative_ref + " does not appear to be public!")
        return 1
    except Exception as e:
        print("An error occurred while exporting your Narrative:")
        print(str(e))
        return 1

def parse_args():
    p = argparse.ArgumentParser(description="Exports a Narrative to an HTML page.")
    p.add_argument("-n", "--narrative", dest="narrative_ref", help="Narrative object reference")
    p.add_argument("-o", "--output_file", dest="outfile", help="Output HTML file (.html will be appended if necessary)")
    return p.parse_args()

if __name__ == '__main__':
    sys.exit(main(parse_args()))
