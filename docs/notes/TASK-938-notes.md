# Summary of Changes

## Read Only Mode

The original call-to-action was to ensure that app cell parameters were not editable in view-only or read-only Narrative mode. That occupied the first day of work, but it quickly became apparent during testing that there were many other issues.

### Comments about and changes to the internal logic

First, it was a little confusing to sort out the writable state of a Narrative from the view-only ui switching. This was partly due to the fact that there were several identifiers in the code with the term "read only", but used for different purposes.


A Narratives writability, or read/write status (more fully, the permissions which is read/write/admin), is a reflection of the workspace permissions for the Narrative. The core functionality affected by this is the the ability to save a Narrative, but it an implication is that the Narrative _should_ not be editable. Therere a Narrative which is not writable also should not be editable.

The editability is a reflection of whether, for whatever reason, the Narrative or some component may be modified. It is implemented as uiMode attribute of the Narrative (Jupyter.narrative.narrController as well as Jupyter.narrative), but is accessed via the "canEdit" method of Jupyter.narrative.narrController as well as an instance of utils/jupyter. 

### Setting read-only and ui view mode

The only time the writability of the Narrative is currently registered is during Narrative loading. There is existing code for reflecting changes in the writability of the Narrative but as far as I can tell, it was never utilized -- the event to trigger it was never emitted. In discussions with Bill, there is no appetite for adding yet-another-poller to monitor the Narrative workspace.

On the other hand, the ui view mode in a writable narative can be enabled via the view-only pencil/eye button in the narrative header.

The following situations lead to read-only and ui view mode in a Narrative

- The narrative is not owned by the current user but shared with the current user with read-only permissions

- The narrative is not owned by the current user and is shared publicly.

- The narrative is owned by the current user, or shared with write or admin permission and the user has switched the ui into view mode via the view-mode button

- In addition, the "Configure" panel of an app cell is switched to ui view mode when the app cell is running or has completed.

### Ease of testing

It is also notable that the view-mode toggle button made testing ui view mode much much easier than testing against a read-only narrative.

### Paramters in app and related cells

Parameter input controls come in pairs -- an input control and a view control. Improvements consisted generally in ensuring that view controls were displayed in view mode, and that view controls both honored the spirit of view mode by not allowing changes, and that their internal code also made changes in parameters impossible.

There were several adjustments to view-mode parameters to make them more view-mode friendly. This involved ensuring that the view-mode widgets would not let the user change their state, yet continue to show the original information plus context (e.g. dropdowns still have the options available, but they are not selectable.)

The sequence parameter view control was creating input controls not view controls.

The view cells did not utilize view mode at all, so this was added to view cells.


### Data Panel 


#### Prevent inserting data objects

I believe it was possible to attempt to add data objects to the narrative from the Data panel, and that the attempt was simply ignored. I may be wrong about that.

In any case, the response now is a warning dialog.


#### Prevent renaming or deleting data objects

If the data panel options buttons are displayed in edit mode and then view mode is entered, the delete, rename, and histor buttons are buttons are still enabled.

Conversely if they are first displayed in view mode, when returning to edit mode they are missing.

This is because the logic of the data panel is to show/not-show these buttons depending on the read-only status of the narrative upon first rendering. If the ui mode changes due to using the toggle button (or in the future, when the write permissions of the narrative change), the data panel is not manipulated to reflect this state. 

Since this functionality is only manifested via the view-mode toggle, it is something of a fringe issue. The utilty of the view-mode toggle is to allow a Narrative author to preview a narrative for view-only users, e.g. prior to sharing or makeing public. The worst problem would be for an author to inspect a data object in view-only mode, and then need to access those three edit buttons later, and find they are missing.

Certainly a bug to fix, but not in this round.


#### Apps Panel Enabled

The disabling of the apps panel was not necessary, and made usage of the data panel confusing. For instance the input and output parameter filters served no obvious purpopse.

After enabling the panel, the only change was to disable adding of apps to the narrative.

This was accomplished at the lowest level, and generates an error if a user attempts it.

It is perhaps debatable that the ability to attempt to add an app to a narrative should be disabled. However, other than being yet more work on an already-stretched-out task, it is arguable that allowing the user to attempt it and then informing that that it is not possible exposes the user to functionality that is available for editable narratives. 




## Other UI Improvements

### Title Editing Disabled

Although there was code to prevent editing the narrative title, the id used for the element had apparently changed and was not longer effective. (Blame Jupyter upgrade?) In any case, since the title change also forced a narrative save, it generated a big error message. The change was simply to disable the click event on the title.

### Remove "Narrative Settings"

The cog in the main narrative menu was originally designed to enabling advanced and developer features in the Narrative, especially for the new app cell design. However, as those features were removed, the presence of this ui component is just confusing -- it did nothing but promised much!



## Cell Toolbar Improvements

### Cell Toolbar Layout

The layout, especially padding between the collapse button and the top of the cell and the bottom of the title icon in the collapsed cell, were uneven. CHnages were required to 

### Show Toolbar in View-only mode

In view-only mode, the cell toolbar was hidden. This made it impossible to expand closed cells, or less importantly to collpase cells. (It does make navigation of large narratives easier when many cells are closed and just the ones of interest are open.)

This implies that...

### Cell Toolbar Buttons honor view-only mode

The cell movement and cell deletion buttons are removed from view-only mode, making the toolbar save to use.


### Cell Toolbar Buttons

Moved the collapse button from inside the ellipse menu to the top level, right hand side.

Changed style from orange to black when for expanded mode, orange when collapsed. This helps signal that the cell is collapsed - otherwise when looking at a narrative with little collapsed cells it may not be obvious. There are probably other better clues to add.

### Optimize Ellipse Menu

When there are no options above the delete item, the separator line is not displayed

### Double clicking toolar expands/collapses cell

I found myself constantly wanting to double click the title area of a cell to expand collapse it. This was implemented.

### Message Area below buttons

On the right hand side of the cell toolbar a new message area was added. It is enabled via metadata.kbase.cellState.message. This message area was added in response to the need to display to the user a reminder that double-clicking the markdown content will make it editable. Without a clue, it is not obvious to new users.


## Markdown Cell Improvements

The double clicking toolbar changes led to a change in markdown cell edit mode switching. The existing method detected double-clicking anywhere in the cell to enable edit mode. This always felt a little off, it was easy to accidentally trigger by selecting a cell and then clicking again.

With double-click expand/collapse, there was a conflict anyway.

The new behavior is double clicking on the markdown content itself. This is very natural, and in my experience with it, leads to more predictable behavior. It also makes closing edit mode symmetric, since clicking anywhere outside of the edit area would render the content and exit edit mode.

There is more that can be done to improve this experience, such as a hover effect over editable content which might enable single click editing.

The new message area of the toolbar also provides a message to user to remind then that double clicking the content will allow them to edit it.

## Code Cell Improvements

### Inoperative in view-only mode

Code area editing is disabled in view-only mode. This required a trick in the readOnly setting for code mirror -- the boolean value did not appear to work, but the 'nocursor' value did.

### Loading Spinner for title icon

Since sometimes, and during the last few days of development particularly, high latency can cause long delays (on the order of several seconds) in cell rendering, the behavior of the cells can be quite confusing when a narrative first loads. Particularly, all code cells show the code cell "terminal" icon, which is then replaced with their own app cell when the app cell extension runs. This behavior is disconcerting. It is due to the fact that code cells initially utilize their default behavior (the terminal icon, showing code (addressed below)), which is then overriden, some time later, by the extension. 

The solution is to show a spinner icon rather than the terminal icon, to indicate that the cell is loading (which it is.)

This did not initially work for pure code cells, due to issues discussed below.

### Code areas are not displayed initially

After the migration to code cells for app cells, the code area would be displayed initially when an app cell was rendered, and then removed as the app cell extension was executed. During high latency with kbase service calls, the delay between narrative notebook startup and cell extension startup could be on the order of seconds, leaving the code cells sitting there. And generally, it led to thrashing of the user interface as the code cells popped in, and then out again.

The fix was realatively simple -- hide the code area initially and add a -show class after the app cell (and all other code-cell based kbase cells) loads.

However, in the case of raw code cells, the problem was not as simple. The core of the problem is that there is no reliable signal within Jupyter when a cell has finished loading and the metadata is available (after which the extensions load).

So to solve this...

### Added KBase code cell extension

An extension was added to handle cells which are code cells but not kbase app cells. This allows the scheduling of code to run after the code cells are fully set up. This is the stage at which the code area is opened for pure code cells.

The extension also allows the replacement of the spinner icon with the code cell terminal icon.

## Code cell / Import cell improvements

Although on its way out, there is still support in the narrative for the old style of importing data. This method spawns an import job, and then inserts a job-monitoring cell into the narrative. This poor cell has been the subject of much tweaking over the months. When making the code cell changes and testing, it was apparent that it needed some adjustements to play well with the new code cell extension. Specifically, the cell metadata was created in two different forms. First, it was populated in a way to simulate an output cell, but was not formed correctly and might actually trigger an error if left in that form (I had actually run across some of these and wondered where the funny cells came from.) However, as soon as the job monitoring widget begins operating, it would overwrite the existing metadata with a different structure, removing the title and other metadata structure.

The improvement is to add code to the job manager widget to create a metadata structure which is compatible with the new code cell extension, and fixup code to both the new code cell extension and the job manager widget to detect old instances of these cells and convert them.


## Future Work

The Data Panel needs a fix to dynamically adjust to ui mode changes.

Some functionality such as inserting data objects or apps into the narrative are left in place, but warning dialogs issued if the user attempts them. We may want to just disable the ability to attempt the action.

Import cell accomodation should be removed once the data import situation is sorted out.

Additional information needs to be added to all warning dialogs.

We should generally integrate ui mode switching in a more methodical way. One of the reasons to change the ui mode to an arbitrary string from a boolean is to enable more than two ui modes (view and edit). For instance,  presentation modes could be useful, developer mode, design mode, etc. although this implies that they are mutually exclusive (which makes things simpler, but may exclude useful modes like editing in a presentation mode.)