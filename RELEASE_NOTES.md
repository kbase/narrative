### OVERVIEW
The Narrative Interface allows users to craft KBase Narratives using a combination of GUI-based commands, Python and R scripts, and graphical output elements.

This is built on the IPython Notebook (more notes will follow).

### Release 7/14/2014
__Changes__
- Created a service endpoint config file to toggle between dev and prod versions of various services
- Added Jnomics functions and widgets
- Added more communities functions and widgets
- Added KBase-command functions and widgets
- Authentication should work more logically with the rest of the functional site
- Updated Narrative typespec to support workspace version 0.2.1
- [NAR-169] We now have a verified SSL Certificate - Safari should work over HTTPS now.

__Known Issues__
- As in previous release
- [NAR-182], [NAR-183], [NAR-184] R support is occasionally problematic.
- [NAR-200], [NAR-201] Saved widget states occasionally disappear.
- [KBASE-834] Changing Narrative name doesn't properly update Narrative object name in Workspace Browser.


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