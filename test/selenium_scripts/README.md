##Scripts for testing App and Method running in the KBase Narrative in a browser with Selenium.
Author: Jared Bischof <jbischof@mcs.anl.gov>

This directory contains scripts for running automated end-to-end tests of various apps in the Narrative using the Selenium test harness and Firefox.

It's a little empty right now, but will accumulate more tests over time.


###Requirements
---
* A KBase development environment (complete with dev_container, runtime, etc.)
  - Scripts for the workspace and authentication commands
* An installed Selenium instance and its Python bindings
* The Firefox web browser

###Running tests
---
Pre-execution: source user-env.sh, provide a config file like the ones attached with a kbase username and password, a workspace id, an app/method name, and a list of parameters.  In the parameters "name" is just a decorative field, "type" is the type of input field, and "value" is the name of an object in the workspace that goes in that field.

1. Script logs into narrative website.
2. It then clones (via the command line) the configured workspace (which should contain all input workspace objects and an empty narrative)
3. It then retrieves the empty narrative in the cloned workspace.
4. It then clicks the app/method in the data panel.
5. Then, it fills in the input fields and clicks submit.
6. Next, it waits for the app/method to complete.
7. Finally it takes a screenshot of the narrative and saves it to a file.

I implemented the "text" and "dropdown" fields as I was able to parse them from the narrative html but I gave up after that because some of the other fields were more difficult to parse.  I think to move forward with this it would help to somehow tag all the input fields in the html code to make parsing input fields easier.

The main difference between the app and method scripts is that the app script checks the job panel to test for job completion whereas the method script just looks at the output window to see if it's done.

There's also a timeout for deciding when to stop waiting for a job to complete.
```