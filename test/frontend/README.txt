It's rough around the edges.

Invoke it as ./puppeteer.js --config=./config.json

You can give it any config file you want-currently it's set to test widgets on CI
itself, but it can go against anything. You'll need to specify a token file or token value.
The value takes precedent and the file is the fallback.

It'll run through all of the widgets in the widgets list and do the following:
  * create a new narrative for UserA (giving UserB read access)
  * Add an object with UPA specified in publicData for that widget.
  * Copy that narrative to UserB, and remove UserA's access to it explicitly.
  * Check both the original narrative and the copy to make sure the widget exists.
    To do that, it looks at the config file's dataSelector (to see what to click
    in the data pane to add the object) and widgetSelector (which should be a selector
    that'll display when the widget actually is done loading).
  * They've got 30 seconds to show up, and man, I hope that's long enough. Puppeteer
  can be tweaked to make it longer, but it's not configurable.
  * If the config file specifies a testFile, then that is loaded up and called. The
  testFile can do any javascript you want along with the puppeteer page instance within
  which to do it. There's a sample file included.
  * Assuming that all works, it moves onto the next widget and repeats.
  * It'll clean up the created narratives at the end (or upon error).

Rough spots:
  * It basically just logs things. There are some assertions, but it's not integrated
    in with a test framework. That should be plugged up.
  * It's also not wired into a harness. So you don't have a convenient 'make test' call.
  * It calls the services directly and not via a client, for simplicity's sake in the node
    environment and for fear of creating yet another dynamic library. It might be nice
    to standardize it.
  * Jim, of course, is leaving. So you're on your own. :-)
    (Okay, that's not entirely try. Feel free to pester me about it and I'll help as I can)
