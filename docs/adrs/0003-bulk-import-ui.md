# Bulk Import UI

Date: 2020-10-26

A primary goal of the current data upload refactoring project includes enabling users to upload data in bulk and producing multiple new data objects with only a few user-side operations. That means introducing an interface that can handle the following steps:
* Selecting several data files to concurrently import into new data objects.
* Launching what would amount to several import jobs at once (i.e. a bulk import operation).
* Monitoring the state of those jobs and restarting if necessary.
* Viewing the results of those jobs.

Currently, this work is done by users using one cell at a time. An App Cell is generated for each desired data file upload, which can be time-consuming and cluttering for Narratives. The new design supports bulk operations.

## Author

@briehl

## Status

Accepted

## Background

App Cells (and other cells) are all built using the [Jupyter front end extension framework](https://jupyter-notebook.readthedocs.io/en/stable/extending/frontend_extensions.html). On application and page load, this framework allows the overriding and customization of most FE components. Specifically, in the Narrative, this framework is only used for Cells. 

Jupyter Notebook (and thus Narrative) cells come in three types - Code, Markdown, and Raw. All KBase cell extensions operate on Jupyter Code cells. It's easiest to think of them as subclassing - an App Cell is a Code Cell specialized for running Narrative Apps. Each of these extensions is activated by creating a cell with a specific metadata component that describes how the cell should be treated. For example, adding the following block to code cell metadata tells the extension machinery to treat it as a KBase App Cell:
```
{
    kbase: {
        type: 'app'
    }
}
```

The App Cell is, by far, the most complicated extension cell type. It has several components that all serve different purposes:
* A finite state machine (FSM) that's used to determine cell state.
* A core system used to render the cell based on state.
* A message bus that's used to communicate with the rest of the FE application, as well as the BE (kernel) to get job state.
* An interpreter / manager for app specs - turns the app specs into sets of input form elements.
* A code translator - turns the various sets of inputs into code that can be executed to run the App.

The reason for the App cell being an extension to code cells is the last point above: in essence, the primary UI components of the App cell serve as a fancy code generator. User interactions with form elements generate the code that can be used to start apps and view their results. Thus, anything that an app cell does with the UI can be done programmatically by an advanced user.

> It should also be noted here that, regardless of the choice made, we may need to alter how app specs are made, interpreted, and rendered. The bulk import design has various inputs and outputs listed in horizontal rows while the existing app specs are rendered vertically. There's no notion of rows/columns in the app spec right now or how to visually display various inputs along a grid pattern. In order to effectively match the design we may need to do one of the following:
> 1. Alter the app specs to support multiple in-line parameters while retaining backward compatibility (including documentation, etc.).
> 2. Use a distinct app spec for importers that can include these options.
> 3. Hard-code how all import apps look and feel in the Narrative interface itself.
>
> If we decide to update how app specs work, that means working in the `narrative_method_store` and `catalog` repos as well as internal documentation.

## Alternatives Considered

* Implement the UI in the existing App Cell codebase
* Implement the UI in a new Cell type
* Don't use a cell, but some other interface

## Decision Outcome

The Bulk import UI will be developed in a new cell type, based on the existing app cell.

Other points discussed:
* We considered using a different interface than a cell, but decided that changing that entire paradigm right now would be too heavy of a burden on the design and product teams and would push back development efforts further. There was also no clear consensus on whether that's a desired result.
* We discussed the implementation impacts of the importer app parameter layouts and decided to do something internal to the Narrative repo, as opposed to modifying the app specs in general. What the final implementation will be is left for later discussion.


## Consequences

The team will need to develop a new cell type, which means building a new Jupyter notebook extension. We can mostly use the same startup code (from the `load_ipython_extension` function that's common among the other extensions). The team will also be spending time extracting components from the app cell that are embedded and making them more easily shareable with the new cell type.

## Pros and Cons of the Alternatives

### Implement the UI in the existing App Cell code base

This option would entail adding a different mode for the current App Cell, likely based on some additional metadata feature.

* `+` Reduce spread of additional, yet similar, cell types with similar code.
* `+` Reuse existing cell control mechanisms currently in place with minimal modification.
* `+` Reuse existing wrapping UI elements - cell title, icons, tabs, etc.
* `-` Work done to the App cell needs to be made backward compatible with existing functionality.
* `-` Any "breaking" work (i.e. refactor, etc.) will need to be complete before any releases are possible, making intermediate releases possibly challenging.
* `-` Adding yet another mode for the App cell will increase the maintenance burden on an already complex code base - see especially the FSM.
* `-` The draft UI is very complex and may turn the existing code into a deep series of nested logic.

### Implement the UI in a new Cell type

This option will create a new nbextension to serve a new cell type as an extension to the code cell.

* `+` This would mean working with a fresh codebase without existing constraints.
* `+` Intermediate, minimally functional changes, can be rapidly prototyped and released.
* `-` To stick with the DRY principle, this would mean refactoring parts of the current app cell to make various components importable (message bus responses, job state management, tab menu, etc.) instead of their integration (really we might want to consider that anyway).
* `-` Much of the structure of the mockup already functions similar to the existing App Cell and might become duplicated work with additional maintenance burden.
* `-` This would mean updating other components that make use of Narratives - the Static Narrative interface, Search, and the Dashboard, for example, all introspect Narratives and handle cells based on their type.

### Don't use a Cell, use some other interface

The bulk importer UI work has been mocked up as a cell that becomes a part of the Narrative workflow, but that could change. This option would mean using some other interface rather than a cell to implement bulk import work. 

This has been discussed before, especially in the context of how Narratives are intended to work as a repeatable record of analysis and discussion. Generally, importing files to data objects isn't very useful in trying to repeat work, especially if you don't have access to those files. This will also happen when those files expire on the server and are no longer available. In that case, including one or more import cells is misleading - those cells cannot be run again, implying that the analysis that the Narrative performs cannot be completely reproduced.

* `+` Unimpeded by the constraints around the cell architecture as imposed by both the Jupyter Notebook and KBase codebases.
* `+` Keeping all import jobs consolidated in one place, outside of cells, would reduce Narrative length and Narrative object size.
* `+` Removing import cells into a separate interface would have a positive impact on load time.
* `-` Entrypoint to the interface would be something entirely new.
* `-` New work would need to be done to make use of the app state management systems and kernel communication.

## References
* JIRA ticket with the draft design: [DATAUP-268](https://kbase-jira.atlassian.net/browse/DATAUP-268)
* [Jupyter notebook front end extensions](https://jupyter-notebook.readthedocs.io/en/stable/extending/frontend_extensions.html)
