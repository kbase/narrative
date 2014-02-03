Last updated: Dan Gunter <dkgunter@lbl.gov> 2/2/2014

Introduction
============

This is the new IPython based Narrative Interface repo.
The previous version has been branched into the pre-sprint branch for archival purposes.
All relevant code has been migrated under the src/ directory. A virtualenv based installer
and standard KBase makefile targets are in the works.

Running
-------

The ipython narrative is a "profile" of the ipython notebook. The setup and instructions are run using the Python [virtualenv](https://pypi.python.org/pypi/virtualenv) module. If you haven't ever used this module, you should take some time to go familiarize yourself with it now.

An important caveat for your python environment is that you have Python 2.7 installed and that the version of pip that is run is matched to that python 2.7 installation. Because pip is not installed by default, it is possible to upgrade python, while still having a version of pip that only updates the libraries for a previous version of python. If you do not have a 2.7 version of pip, you an usually use something like easy_install-2.7 to update pip.

Most of the python dependencies for the notebook are in the bootstrap module under bootstrap/kb_python_runtime/python-pip-list-narrative.
There are some dependencies that are better installed as packages, scipy and numpy. They can either be installed using dpkg, or for MacOS
users they can be downloaded from http://sourceforge.net/projects/numpy/files/NumPy/ and
http://sourceforge.net/projects/scipy/files/scipy/

Download those files and then checkout the bootstrap repo and run this command:

pip install -r bootstrap/kb_python_runtime/python-pip-list-narrative

it should install all the necessary python module dependencies to run the notebook.

Install and Run
---------------

(See also the Alternate Installation Procedure section, below.)

For the impatient, the following commands should work to start the KBase notebook.

    ./install.sh
    source narrative-venv/bin/activate
    profile_name=narrative run_notebook.sh notebook

That will run the KBase narrative version of the notebook (via the profile_name variable). If you do not set profile_name, then a base IPython Notebook will be started up with no KBase specific code - all KBase code is contained in the narrative profile so that we do not need to fork/branch the base IPython.

Now we will describe these commands step-by-step, and show how you can integrate with an existing set of Python virtual environments.

**Step 1**

    ./install.sh

This script creates a new Python virtual environment (see virtualenv). It takes command-line options controlling the destination of that virtual environment and the name of the environment itself. For example, to put the virtual environment under `~/.virtualenvs` (a common place to keep them) and to call it `kbase-narr`, you would instead run this variation on the `install.sh` command:

    ./install.sh -p ~/.virtualenvs -v kbase-narr 

**Step 2**

    source narrative-venv/bin/activate

This line activates the virtual environment. If you use the [virtualenvwrapper](http://virtualenvwrapper.readthedocs.org/en/latest/) module, and have installed the notebook under your usual virtual environment location, you can also simply use `workon <name>`, where `<name>` is whatever you chose to call the environment.

**Step 3**

    profile_name=narrative run_notebook.sh notebook

Finally, `run_notebook.sh` sets up some environment variables and runs ipython in "notebook" mode with the profile specified in profile_name ("narrative"). The notebooks themselves (i.e. files ending in `.ipynb`) are stored in `~/.narrative`. 

Alternate Installation Procedure
--------------------------------

This is an EXPERIMENTAL way to install, which assumes you have the virtualenv
already set up and active.

    make -f Makefile.narrative

That is it -- the script file generated is called "run_notebook" instead of
"run_notebook.sh", and does not require the extra "notebook" argument, so:

    run_notebook

