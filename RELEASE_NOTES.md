### OVERVIEW
The Narrative Interface allows users to craft KBase Narratives using a combination of GUI-based commands, Python and R scripts, and graphical output elements.

This is built on the IPython Notebook (more notes will follow).

### Version 0.3.17 - 1/22/2015
__Bugfixes__
- Repaired link to FBA model visualization widgets

### Version 0.3.16 - 1/21/2015
__Changes__
- Added link to KBase internal status page.
- Added programmatic access to workspace id.
- KBase cells can now be collapsed and restored.
- App and Method cells now have a spinning icon while running.
- A traceback should now appear (where applicable) in the Jobs panel.

### Version 0.3.15 - 1/21/2015
__Changes__
- Updated type name for Assembly File transform method
- Added reset button to App cells (method cells still need fixing)
- Added widgets for metagenome sets

__Bugfixes__
- JIRA NAR-418 - fixed issue where job error was cleared on panel refresh.
- Fixed issue where method panel error state wasn't being activated properly.

### Version 0.3.14 - 1/21/2015
__Changes__
- Updated server-side Narrative management code to always keep a queue of unattached Narrative containers present. When a user logs on, they already have one ready to connect to.
- Added visualization widget for microbial community abundance and boxplots.
- Method details and documentation are visible in a new window now.
- Added app and method icons for the method panel.
- Added minimize to app & method panels

### Version 0.3.13 - 1/20/2015
__Changes__
- Added Transform service client code
- Exposed transform service as a method
- Added assembly view widget
- Added icons for Apps and Methods in panel

__Bugfixes__
- Now inserts a cell instead of freezing when DnD of data onto empty narrative
- JIRA NAR-388 - fixed a problem where errors on service invocation weren't being stringified properly before logging
- Github issue #162 fixed - drag and drop data onto an empty Narrative now doesn't lock up
- JIRA NAR-402 - saving a Narrative updates the Manage panel
- JIRA KBASE-1199 - newly registered jobs should show a timestamp
- KBASE-1210 - (not totally fixed) - debug info for launched methods should show up on the console now.
- NAR-400, KBASE-1202, KBASE-1192, KBASE-1191 - these were all related to the apps not properly catching errors when an output widget fails to render
- fixed a case where a typespec references a non-existent viewer

### Version 0.3.12 - 1/20/2015
__Changes__
- Fixes issue where the Method Gallery overlay panel wouldn't be populated if there were any problematic method/app specs.
- Added a link to directly submit a JIRA ticket from the pulldown menu.

### Version 0.3.11 - 1/16/2015
__Changes__
- Running Apps and Methods have a "Cancel" button associated with them. Clicking that will restore the cell to its input state, and cancel (and delete) the running job
- Deleting App/Method cells now prompts to delete, warning the user that it'll kill any running job (if they've been run before)
- Deleting jobs now triggers the call to the right back end services to delete the running job itself.
- Deleting a job from a running cell now unlocks that cell so its inputs can be used again.
- A dangling job with no associated cell should properly error.
- A dangling job on the front end that's been deleted on the back should properly error.
- A job in an error state (not the above, but a runtime error) should now reflect an error on its associated cell (if present)
- Fixed an error where running a method automatically made an output cell connected to incomplete data.
- Refactored Jobs panel to only look up jobs that are incomplete (e.g. not 'error', 'completed', 'done', or 'deleted')
- Toolbars should only appear over IPython cells now (KBase cells have their own menus)
- Styled app/method control buttons to be closer to the style guide / mockup.
- Logging of apps and methods is substantially less ugly and made from fewer backslashes.

### Version 0.3.10 - 1/16/2015
__Changes__
- Narrative panel supports copy/delete/history/revert of narratives.
- Narrative panel shows apps/methods/description (if exists) for each narrative.
- Links to LP for genomes and genes were added in Proteome Comparison widget.
- 'Download as JSON' button was added for objects in narrative data list.
- Links to LP were added for genes in genome viewer.
- ContigSet viewer was added.
- Plant genomes were added into public data tab (and GWAS types were removed).
- Fixed problem where error cells were not being shown properly.
- Added several widgets to support communities apps and methods.

### Version 0.3.9 - 1/14/2015
__Changes__
- Restyled menu bar buttons - 'about' button is now under the dropdown menu on the upper left of the screen, removed the global 'delete cell' button (for now!)
- Restyled code and markdown cell buttons in the lower right corner of the page
- Added a debug message that appears in the browser's Javascript console whenever an app/method object is sent to the NJS
- App and Method specs should be globally available to all elements on the page from the method panel
- Various styling adjustments on the data panel overlay
- The 'more' button under each app and method in the methods panel should now link to an external manual page

### Version 0.3.8 - 1/13/2015
__Changes__
- Drag and drop data and data viewer bug fixes.
- Position of a queued job should now be tracked in the job panel.
- The Narrative object metadata now tracks the number of each type of cell in that Narrative. Method and App cells are further tracked by their id.

### Version 0.3.7 - 1/12/2015
__Changes__
- Fix for int, float and array types of input sending to NJS
- Fix for empty parameter values in import tab
- Support was added into public data for meta-genomes and 6 types of GWAS
- Fixed 'Add Data' button in a new Narrative - should properly open the data overlay now
- Updated layout and styling of Method Gallery overlay to be closer to the mockup

### Version 0.3.6 - 1/9/2015
__Changes__
- Changed install.sh - now it requires an existing Python virtual environment for installation
- Removed text/code cell buttons from method panel - they've now migrated to the lower right side of the page.
- Started restyling various elements to match the new style guide (colors, shadows, etc.)
- Inserted (better) icons than just letters for data objects
- Public data tab on side panel was redesigned. Genome mode using search API is now the only supported mode there.
- Method cell changes
    - Fixed problem where starting a long-running method would immediately show an output cell with broken results
    - Fixed problem when submitting a method with numerical value inputs
    - Fixed problem when submitting a method with multiple possible output types for a single parameter
    - Fixed problem where method cell parameters were not being properly validated before sending the job
- Added document that details app failure points
- Data list supports deleting, renaming, reverting objects

### Version 0.3.5 - 1/7/2015
__Changes__
- Added link to release notes in 'About' dialog.
- Removed old links from the Navbar menu.
- Added separate 'Jobs' tab to side panel.
- Fixed problem with Job errors overflowing the error modal.
- Method panel changes
    - The magnifying glass button should now toggle the search input.
    - Added a 'type:_objecttype_' filter on methods and apps. This filters by their parameters. E.g. putting 'type:genome' or 'type:KBaseGenomes.Genome' in there will only show methods/apps that have a genome as a parameter.
    - Added an event that can be fired to auto-filter the methods and apps.
    - Updated the style to a more 'material' look.
    - All specs are now fetched at Narrative startup. This will speed up some of the in-page population, but any apps with errors in their specs are no longer displayed in the list.
    - Removed the '+/-' buttons for expanding the tooltip, replaced with '...'
- Data list changes
    - Added a big red '+' button to add more data.
    - Updated the style to a more 'material' look.
    - Removed the '+/-' buttons for showing metadata info, replaced with '...'
- Import tab on GetData side panel allows now to upload genome from GBK file, transcriptomes from Fasta and short reads from Fasta and Fastq
- Viewers can be open for main data types by drag-n-drop objects from Data panel to narrative
- States of long running methods calling services are now shown on Job panel and Job panel waits for 'Done' state before show output widget
- Added a 'debug' viewer to the apps. After starting an app's run, click on the gear menu in the app cell and select 'View Job Submission'. This will both emit the returned kernel messages from that app run into your browser's Javascript console, and it will create and run a code cell that will show you the object that gets set to the Job Service.

### Version 0.3.4
__Changes__
- Redesign of the Method Gallery panel
- Adjusted Data Panel slideout to maintain its size across each internal tab
- Added buttons to the footer in the Data Panel slideout
- Adjustment to data upload panel behavior.

### Version 0.3.3
__Changes__
- Long running method calls that produce job ids should now be tracked properly
- Method cells behave closer to App cells now - once they start running, they're 'locked' if they're a long running job
  - Long running method cells get a red ring, similar to steps inside an app
  - The next step is to merge their code bases
- When a long running method cell finishes (the job gets output and is marked 'done' or something similar), an output cell is generated beneath it
- Method and app jobs should be properly deleteable again.
- Added global 'delete cell' button back to the menu bar.
- Made major styling and functionality changes to the 'import' panel attached to 'data'

### Version 0.3.2
__Changes__
- Steps toward getting long-running methods (not just apps) working.
- Modified job panel to consume method jobs
- Method jobs still do not correctly populate their end results.

### Version 0.3.1
__Changes__
- Changed some text in the data panel, and what appears in the introductory markdown cell in a new Narrative
- Fixed an issue with infinite scrolling under the "My Data" and "Public" data tabs

### Version 0.3.0
__Changes__
- Added Method Gallery for browing methods and apps and viewing information
- Added a manual Narrative Shutdown button (under the 'about' button)
- Integrated code cells and IPython kernel management
- Added prototype Narrative Management panel

### Version 0.2.2
__Changes__
- Restyled Jobs panel, added better management controls, added ability to see Job error statuses
- Added first pass at data importer

### Version 0.2.1
__Changes__
- More improvements to logging - includes more details like user's IP address, Narrative machine, etc.
- Changed data panel to be able to draw data from all other Narratives and Workspaces
- Stubs in place for importing data into your Narrative
- Changed paradigm to one narrative/one workspace for simplicity

### Version 0.2.0
__Changes__
- Switched to semantic versioning - www.semver.org
- Began massive changes to the UI
- Improved logging of events and method/app running
- Introduced App interface
- Added a Job management panel for tracking App status
- Switched to fetching lists of Methods and Apps from a centralized method store

### Release 9/25/2014
__Changes__
- Fixed a bug that prevented a few Narrative functions from working if the
user's workspace was empty.

### Release 9/24/2014
__Changes__
- Updated workspace URL from the Narrative Interface

### Release 8/14/2014
__Changes__
- Added functionality to Communities services

### Release 8/8/2014
__Changes__
- Fixed problems with loading page in Safari
- Added genome comparison widget

__Known Issues__
- R support is problematic
- Sharing a Narrative with a running job might break
- Loading a Narrative with a large amount of data in it might be slow
- Mathjax support is currently out of sync due to version drift


### Release 8/7/2014
__Changes__
- Fixed links to landing pages linked to from the Narrative
- Fixed problem with KBCacheClient not loading properly
- Adjusted names of some functions (existing widgets might break!)
- Fixed 502 Bad Gateway error on Narrative provisioning

__Known Issues__
- Loading page on Narrative provisioning sometimes loops too much in Safari
- R support is problematic
- Sharing a Narrative with a running job might break
- Loading a Narrative with a large amount of data in it might be slow
- Mathjax support is currently out of sync due to version drift


### Release 8/6/2014
__Changes__
- Services panel is sorted by service name now
- Removed old Microbes Service panel
- Updated Microbes service methods
- Updates to picrust
- Added ability to make deprecated services invisible
- Updates to RNASeq and Jnomics services
- Updates to plants widget code
- Visual fixes to how long function names are handed in the Services panel

__Known Issues__
- R support is problematic
- Many links to landing pages within the Narrative are broken
- Sharing a Narrative with a running job might break
- Loading a Narrative with a large amount of data in it might be slow
- Mathjax support is currently out of sync due to version drift


### Release 8/5/2014
__Changes__
- Added a better fix to the "NoneType object has no attribute get_method" error
- Updated Microbes services code, split services into 4 separate groups
- Updates to Jnomics
- Split picrust widget into qiime and picrust
- Fixes to plant gene table size and heatmap rendering

__Known Issues__
- Changing Narrative name in the workspace doesn't propagate inside of the Narrative itself (likely won't fix)
- R support is problematic
- Many links to landing pages within the Narrative are broken
- Sharing a Narrative with a running job might break
- Loading a Narrative with a large amount of data in it might be slow
- Services panel should be sorted/sortable
- Narrative creator and current workspace should be visible in the top panel
- Mathjax support is currently out of sync due to version drift

### Release 8/4/2014
__Changes__
- Added MathJax.js directly into the repo to combat problems on the back end (this is a temporary fix - we need to install the backend MathJax locally somehow, or update the version)
- Added a fix where if a call to globusonline fails, the Narrative doesn't initialize properly, leading to broken service panels.
- Fixed a bug that caused some graphical widgets to time out while loading their script files.
- Various updates to plants_gwas.py and jnomics.py

### Release 8/1/2014
__Changes__
- Addressed issue with auth information getting overridden (leading to the 400 HTTP error)
- Addressed problems that cause the 502 Bad Gateway error
- Revised names and descriptions on some widgets
- Added widget to build a genome set from a tree
- Revised gapfilling and phenotype view widgets
- Numerous widgets to GWAS and Plant-specific widgets and functionality

__Known Issues__
- Current version of jquery.datatables is finicky and can create popup errors. These can be safely ignored.
- Changing Narrative name doesn't properly update Narrative object name in Workspace Browser and vice-versa.
- R support is occasionally problematic.

### Release 7/30/2014
__Changes__
- Updated config to make landing page links relative to deployment site
- Modified provisioning code to address a potential timeout issue (the 502 Bad Gateway error)
- Adjusted RAST genome loading widget to ignore browser's credentials
- Updated NCBI genome importer
- Updated GWAS services endpoints

__Known Issues__
- Cookie with auth information occasionally gets overwritten with a useless one - logging out and back in will fix this
- Changing Narrative name doesn't properly update Narrative object name in Workspace Browser and vice-versa.
- R support is occasionally problematic.


### Release 7/29/2014
__Changes__
- Updated nav bar to match changes to functional site
- Updated many KBase functions from all domains (Microbes, Communities, and Plants)
- Added widgets and functions for viewing SEED functional categories
- Added a version date-stamp
- Updated look and feel of many elements
- Updated authentication and token management to behave better
- Changed Narrative containers to all be named kbase/narrative:datestamp
- Updated config.json to reference more deployed services
- Added an input widget type that includes a hidden, untracked, password field
- Updated references to registered typed objects from the Workspace
- Fixed a problem where Services panel might get stuck and hang while loading a large Narrative
- Updated more HTTP errors to have a sensible error page

__Known Issues__
- Cookie with auth information occasionally gets overwritten with a useless one - logging out and back in will fix this
- Unaddressed issues from previous release


### Release 7/22/2014
__Changes__
- Added widgets and functions for viewing phylogenies


### Release 7/21/2014
__Changes__
- Updates to Jnomics functions and widgets
- Updates to Microbes functions and widgets
- Most errors that were dumped to the browser as ugly stacktraces are now KBase-styled stacktraces that should be slightly more legible.
- Errors that occur when Narrative saving fails now creates an error modal that communicates the error, instead of just "Autosave Failed!"
- Deployment of Narrative Docker containers has changed. A base container is built containing most static dependencies (all the apt-get directives, Python and R packages). This container is then updated with the Narrative itself. After building the base container, deployment of subsequent releases should take ~2 minutes.
- Updated workspace type registry (the kbtypes class) to be up-to-date with the current state of the Workspace.
- The Narrative should now report unsupported browsers

__Known Issues__
- Unaddressed issues from previous release

### Release 7/15/2014
__Changes__
- Created a service endpoint config file to toggle between dev and prod versions of various services
- Added Jnomics functions and widgets
- Added more communities functions and widgets
- Added KBase-command functions and widgets
- Authentication should work more logically with the rest of the functional site
- Updated Narrative typespec to support workspace version 0.2.1
- Updated Narrative to properly access search
- Addressed a race condition where saving a Narrative before it completely loads might wipe exiting parameter info out of input fields
- Added directions on how to deploy the entire Narrative/Nginx provisioning stack.
- We now have a verified SSL Certificate - Safari should work over HTTPS now.
- Did some CSS adjustment to GUI cells.

__Known Issues__
- Unaddressed issues remain from previous release
- R support is occasionally problematic.
- Changing Narrative name doesn't properly update Narrative object name in Workspace Browser and vice-versa.


### Release 6/20/2014
__Changes__

- %%inv\_run cell magic should now work properly
- %inv\_run magic (line and cell) now translate some convenience commands
    - %inv\_run ls == %inv\_ls
    - %inv\_run cwd (or pwd) == %inv\_cwd
    - %inv\_run mkdir == %inv\_make\_directory
    - %inv\_run rmdir == %inv\_remove_directory
    - %inv\_run cd == %inv\_cd
    - %inv\_run rm == %inv\_remove\_files
    - %inv\_run mv == %inv\_rename\_files
- The menu bar should remain at the top of the page now, instead of being positioned inline with the rest of the narrative document.

__Known Issues__
- %inv\_ls to a directory that doesn't exist will create a generic, not-very-informative error.
- [NAR-153], [NAR-177] A generic "Autosave failed!" message appears when the narrative fails to save for any reason.
- [NAR-169] Using Safari through HTTPS will not work with an uncertified SSL credential (which we currently have)
- [NAR-173] If problems external to the Narrative prevent loading (authentication, Shock or WS downtime), an ugly stacktrace is dumped into the browser instead of a nicely rendered error page.
- [NAR-180] Copying narratives in the newsfeed can cause errors.
- [NAR-179] There's a problem that occurs when logged into a narrative for a long time.
