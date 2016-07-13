# Narrative Job API

Last update - July 12, 2016
Bill Riehl <wjriehl@lbl.gov>

The Narrative Job API is the Narrative's interface with the KBase job execution environment. It abstracts away the various KBase components and lets you use small pieces of code to start and manage jobs. It's also the apparatus that the various pieces of the Narrative Interface uses, including the App cells and Jobs panel.

This is a Python API that makes use of the different components of the IPython kernel that the Narrative uses by default. It is currently unavailable in other kernels, or through the various cell magics. (e.g. `%%Perl run_app()` won't work yet).

### Getting started

There are 3 managers used to run jobs, as well as the Job class itself. These are:
* AppManager - this is the main thing you'll be interacting with. It has access to all apps, gives information on how to run them, and does the running, producing a Job object.
* JobManager - when you start an app, the AppManager gives you a Job object, and also registers it with the JobManager. This manager then keeps track of the running Jobs and periodically sends their status to the Jobs panel.
* SpecManager - you probably won't deal with this directly too often, but it's a piece of the AppManager. The SpecManager keeps track of all available app specs, along with their usage and their required variables.
* Job - a single Job object represents a single running Job. It can report on its running state, status, generate an output viewer, and generate a current status viewer with the console log available.

```Python
