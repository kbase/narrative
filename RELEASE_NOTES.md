### OVERVIEW
The Narrative Interface allows users to craft KBase Narratives using a combination of GUI-based commands, Python and R scripts, and graphical output elements.

This is built on the IPython Notebook (more notes will follow).

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