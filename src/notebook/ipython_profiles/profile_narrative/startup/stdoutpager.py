"""Replace the IPython Notebook pager with one that simply prints to stdout.
"""

def page(strng, start=0, screen_lines=0, pager_cmd=None,
         html=None, auto_html=False):
    """Print a string, piping through a pager.

    This version ignores the screen_lines and pager_cmd arguments and uses
    IPython's payload system instead.

    Parameters
    ----------
    strng : str
      Text to page.

    start : int
      Starting line at which to place the display.
    
    html : str, optional
      If given, an html string to send as well.

    auto_html : bool, optional
      If true, the input string is assumed to be valid reStructuredText and is
      converted to HTML with docutils.  Note that if docutils is not found,
      this option is silently ignored.

    Notes
    -----
    Only one of the ``html`` and ``auto_html`` options can be given, not
    both.
    """

    # Some routines may auto-compute start offsets incorrectly and pass a
    # negative value.  Offset to 0 for robustness.
    start = max(0, start)

    if auto_html:
        try:
            from docutils.core import publish_string
            # These defaults ensure user configuration variables for docutils
            # are not loaded, only our config is used here.
            defaults = {'file_insertion_enabled': 0,
                        'raw_enabled': 0,
                        '_disable_config': 1}
            html = publish_string(strng, writer_name='html',
                                  settings_overrides=defaults)
        except ImportError:
            # docutils not available, OK
            pass
        except:
            pass
        
    if html:
        from IPython.display import HTML, display
        display(HTML(html))
    else:
        lines = strng.splitlines()[start:]
        print '\n'.join(lines)

        
# Install this modified pager into the runtime
from IPython.core import page as corepage
corepage.page = page