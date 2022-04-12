# Bulk Import Output Cells

Date: 2021-10-05

One of the features of the App Cell is that it can produce Output Cells after a run. These typically contain views of the data that was transformed via the app, including new calculations being made or new data being created. However, in the Bulk Import cell, this could result in dozens or more new cells all being created at once, which could overwhelm a user or lead to other confusion from what should be an easy upload process.

This ADR details the decision to not provide output cells for those apps run by the Bulk Import cell.

## Author

@briehl, @ialarmedalien

## Status

Accepted

## Alternatives Considered

* Include Output Cells when Apps finish
* Don't include Output Cells when Apps finish
* Group Output Cells in a single, tabbed Output

## Decision Outcome and Consequences

The Bulk Import cell will not produce new Output Cells on app completion. It will, instead, ensure that there is a report view available for each imported object. This carries the consequence that users may expect an output cell for one or two uploaded object types based on the single uploader. Extra documentation should help with that.

Bulk Import cell importer apps that employ an output cell:

| Importer | Output cell |
|---|---|
| Import GenBank as genome from staging | Genome viewer |
| Import GFF+FASTA as genome from staging | Genome viewer |

Other importer apps with output cells:

| Importer | Output cell |
|---|---|
| Load paired end reads from file | Reads viewer |
| Load single end reads from file | Reads viewer |

Workaround: users can click on the object name in the "Objects" section of the result panel or click on the object in the data panel on the left side of the narrative. Either action will create the appropriate viewer in their narrative.

## Pros and Cons of Alternatives

### Include Output Cells when Apps finish

* `+` Keeps same behavior as the current App Cell.
* `+` Shows the expected output from the newly created upload object.
* `-` Will likely create a ton of Output Cells at once.
* `-` Could clog a Narrative with lots of extra cells.
* `-` Order of outputs would be semi-random (whenever a job finishes).
* `-` Retrying jobs would further confuse the output order.

### Don't include Output Cells when Apps finish

* `+` Prevents spamming the Narrative with Output Cells.
* `+` Consolidates outputs under the Results tab.
* `+` Results of retried jobs will be handled more efficiently.
* `-` Users could miss their expected outputs, and might need guidance to see their data as expected.

### Group Output Cells in a single, tabbed Output

* `+` Maintains expected flow of outputs produced from Bulk Import apps
* `-` New, unscoped, undesigned work.
* `-` Creates output view that the user may or may not want and may be difficult to navigate, given there could be hundreds or thousands of items in the view.
