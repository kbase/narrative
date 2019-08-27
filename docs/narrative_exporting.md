# Static Narrative Exporting

Narratives are much like Jupyter Notebooks and can be exported using [nbconvert](https://nbconvert.readthedocs.io/en/latest/). However, with the heavy modifications we have to numerous cells through nbextensions, there needs some dramatic changes to the nbconvert processor.

Narrative exporting is done using the `biokbase.narrative.exporter` package. Future work will include a GUI and a path toward official KBase Narrative Publishing. But for now, this is all done via command line.

Option 1 - probably the most common for now - run the `export_narrative.py` script in `src/scripts`.

This requires both the `NARRATIVE_DIR` and `KB_AUTH_TOKEN` environment variables be set to absolute path to the narrative repo root, and a valid auth token, respectively.

For example, from root of this repo, this would look like:

```
> export NARRATIVE_DIR=$(pwd)
> export KB_AUTH_TOKEN=<some_auth_token>
> python scripts/export_narrative.py -w 12345 -o exported_narrative.html
```

Option 2 - use the API directly.

This is pretty straightforward. Just pass a `NarrativeRef` and output file path to the `biokbase.narrative.exporter.exporter.NarrativeExporter` class from within a running Narrative (or something with this codebase on the `PYTHONPATH` and the `NARRATIVE_DIR` and `KB_AUTH_TOKEN` environment variables set up properly.)

```
from biokbase.narrative.exporter.exporter import NarrativeExporter
from biokbase.narrative.common.narrative_ref import NarrativeRef

ref = NarrativeRef({"wsid": 12345})
output_file = "exported.html"
exporter = NarrativeExporter()
exporter.export_narrative(ref, output_file)
```

And that's it. The exported narrative will be linked to whatever environment is configured by the `"env"` key in the Narrative's main config file (`src/config.json`) (if the value = `"dev"`, then `"ci"` is used).
