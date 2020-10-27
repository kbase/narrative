# Bulk Analysis UI

Date: 2020-10-26

The current UI was designed to support bioinformatic analysis by running a single App at a time. There is an early, incomplete, version of a bulk analysis UI to support running multiple Apps at a time, but that was never completed. Upcoming work will focus on design and implementation of an interface to support bulk analysis work.

## Author

@briehl

## Status

In progress

## Background

### App Cells
App Cells (and other cells) are all built using the [Jupyter front end extension framework](https://jupyter-notebook.readthedocs.io/en/stable/extending/frontend_extensions.html). On application and page load, this framework allows the overriding and customization of most FE components. Specifically, in the Narrative, this framework is only used for Cells. 

Jupyter Notebook (and thus Narrative) cells come in three types - Code, Markdown, and Raw. The App Cell is, by far, the most complicated extension cell type. It has several components that all serve different purposes:
* A finite state machine (FSM) that's used to determine cell state.
* A core system used to render the cell based on state.
* A message bus that's used to communicate with the rest of the FE application, as well as the BE (kernel) to get job state.
* An interpreter / manager for app specs - turns the app specs into sets of input form elements.
* A code translator - turns the various sets of inputs into code that can be executed to run the App.

The reason for the App cell being an extension to code cells is the last point above: in essence, the primary UI components of the App cell serve as a fancy code generator. User interactions with form elements generate the code that can be used to start apps and view their results. Thus, anything that an app cell does with the UI can be done programmatically by an advanced user.

### Alpha Bulk Analysis UI
The Batch App was envisioned as an alternative to the current single-App UI. A user would toggle an App to "batch mode" (batch is synonymous with bulk here), enter a series of inputs, then run the cell as usual. They would then see the state of any individual child job as it came in, along with outputs. Most of this was made to work except for the interface that let the user do the bulk configuration.

This interface built on the existing App Cell codebase as a toggle. When in "Batch Mode," some different code modules (and others managed by logic gates) are used to handle rendering of different components. The toggle itself is serialized in the cell metadata, so the Narrative can remember what mode the cell is using.

### Similarity to Bulk Import UI
It should be noted here that the Bulk Import UI work (see JIRA ticket [DATAUP-278](https://kbase-jira.atlassian.net/browse/DATAUP-278)) is possibly interdependent on this ADR. Both of these pieces of architecture take the App Cell and make a bulk operation version of it. The difference is scope and outcome. The outcome of the import work is multiple new data objects that come from importing files, while the outcome of the analysis work is much more varied. Analysis will result in a mix of new data objects, reports (both text and HTML), new cells that contain output, and possibly other items yet to be designed. In essence, as import apps are a subset of all possible apps, the bulk import UI is (possibly) a subset of the bulk app UI. One difference here is that the bulk imports are focused on files and may run several different apps, while the original bulk analysis work only ran a single app in bulk.

## Alternatives Considered

* Implement the UI in the existing App Cell codebase
* Implement the UI in a new Cell type

## Decision Outcome

## Consequences

## Pros and Cons of the Alternatives

### Implement the UI in the existing App Cell code base

This option would entail adding a different mode for the current App Cell, likely based on some additional metadata feature.

* `+` Reduce spread of additional, yet similar, cell types with similar code.
* `+` Reuse existing cell control mechanisms currently in place with minimal modification, including job state management, UI state management, etc.
* `+` Reuse existing wrapping UI elements - cell title, icons, tabs, etc.
* `-` Work done to the App cell needs to be made backward compatible with existing functionality.
* `-` Any "breaking" work (i.e. refactor, etc.) will need to be complete before any releases are possible, making intermediate releases possibly challenging.
* `-` Adding another mode for the App cell will increase the maintenance burden on an already complex code base - see especially the FSM. This could be compounded if we implement the bulk import UI (ADR #0003) in the existing App Cell as well.

### Implement the UI in a new Cell type

This option will create a new nbextension to serve a new cell type as an extension to the code cell.

* `+` This would mean working with a fresh codebase without existing constraints.
* `+` Intermediate, minimally functional changes, can be rapidly prototyped and released.
* `-` To stick with the DRY principle, this would mean refactoring parts of the current app cell to make various components importable (message bus responses, job state management, tab menu, etc.) instead of their integration (really we might want to consider that anyway).

## References
* [Jupyter notebook front end extensions](https://jupyter-notebook.readthedocs.io/en/stable/extending/frontend_extensions.html)
