Last updated 2/17/2016, 9:00pm PST

  * ~~Markdown cells render a little different. Previously headers could be made by "###text" on its own line, now a space is needed: "### text" on that line.~~
  * ~~The "view only" mode has a gigantic margin on the left side. [KBASE-3370](https://atlassian.kbase.us/browse/KBASE-3370)~~
  * ~~All cells sit in a container that makes it easier to see what's selected or not, which brings up issues.~~
  * ~~KBase cells (method, app, output, data viewer) appear as boxes in boxes with duplicated minimization. [KBASE-3335](https://atlassian.kbase.us/browse/KBASE-3335)~~
  * ~~Markdown cells don't have any placeholder text (Jupyter feature) and their input boxes appear shrunken when inactive.~~
  * ~~The data panel can still, occasionally, spin nonstop at page load. [KBASE-3338](https://atlassian.kbase.us/browse/KBASE-3338)~~
  * ~~The 'About Jupyter' dialog in the Kernel menu is non-functional~~
  * Missing Jupyter menu bar [KBASE-3371](https://atlassian.kbase.us/browse/KBASE-3371)
  * Opening new narrative and clicking "share" on top-right results in two "Rename Narrative" dialogs on top of one another. Share tooltip doesn't dismiss when clicking outside of tooltip.
  * Missing the 'narrative_version' file that should be available at *.kbase.us/narrative_version
  * ~~Missing the same hash file that should be inside the Narrative image.~~
  * ~~Entering a narrative can be started with multiple cells already selected (should be just the first one or none. probably none.)~~
  * Select2 input boxes don't have a cursor or other context clue that you can type in them
  * ~~Method panel: search area's X button has no border~~
  * ~~Narrative panel: buttons in "corrupted" narratives still exist on mouseover, but have no function or icon~~
  * Narrative panel: clicking the "link" button doesn't dismiss tooltip.
  * Narrative panel: "My Narratives" and "Shared with Me" headings should be collapsible.
  * ~~404 on Safari's "Click to enter narrative" space in the loading page.~~
  * .ver.## in URL seems to be ignored (probably for the best right now)
  * ~~Data Panel: Shared With Me refresh button has bad offset~~
  * ~~Method outputs can be inserted in seemingly random places~~
  * Data viewer with unknown type needs some TLC.
  * ~~Inserting new cells on click has changed due to cell selection changes / cell multi-select [NAR-835](https://atlassian.kbase.us/browse/NAR-835)~~
  * Method/app cells should be drag/droppable like data cells.
  * Name change doesn't seem to change temporary state (should actually use temporary state instead of "Untitled" name)
  * Extra copy of workspace client - needs to migrate to the right repo.