Last updated 1/14/2016, 2:36pm

  * Markdown cells render a little different. Previously headers could be made by "###text" on its own line, now a space is needed: "### text" on that line.
  * The "view only" mode has a gigantic margin on the left side. [KBASE-3370](https://atlassian.kbase.us/browse/KBASE-3370)
  * All cells sit in a container that makes it easier to see what's selected or not, which brings up issues.
  * KBase cells (method, app, output, data viewer) appear as boxes in boxes with duplicated minimization. [KBASE-3335](https://atlassian.kbase.us/browse/KBASE-3335)
  * Markdown cells don't have any placeholder text and their input boxes appear shrunken when inactive.
  * The data panel can still, occasionally, spin nonstop at page load. [KBASE-3338](https://atlassian.kbase.us/browse/KBASE-3338)
  * ~~The 'About Jupyter' dialog in the Kernel menu is non-functional~~
  * Missing Jupyter menu bar [KBASE-3371](https://atlassian.kbase.us/browse/KBASE-3371)
  * Opening new narrative and clicking "share" on top-right results in two "Rename Narrative" dialogs on top of one another. Share tooltip doesn't dismiss when clicking outside of tooltip.
  * Missing the 'narrative_version' file that should be available at *.kbase.us/narrative_version
  * ~~Missing the same hash file that should be inside the Narrative image.~~
  * Entering a narrative can be started with multiple cells already selected (should be just the first one or none. probably none.)
