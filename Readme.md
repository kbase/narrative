Last updated: Dan Gunter <dkgunter@lbl.gov> 7/31/2014

To report bugs, login using your KBase developer user/pass at: https://atlassian.kbase.us

Introduction
============

This is the IPython based Narrative Interface repository.
All relevant code lives under the src/directory. A virtualenv based installer
and standard KBase Makefile targets are in the works (still!). But a Docker-based
provisioning system exists and has been deployed.

This document will go over the installation and instantiation process of a local
version of the Narrative Interface for development purposes. It's divided into 
four parts:

1. Preparing your system
2. Installing the Narrative virtual environment
3. Starting your Narrative
4. Managing your Narrative during development

Preparing your system
---------------------

The first stage involves the local installation of the packages needed to make
the Narrative work. These are all Python based.

1.  **Python 2.7**

    You must have Python 2.7 and a matching version of pip. Pip is not installed by default, so it is possible to upgrade Python and keep a version of pip that only updates the libraries for a previous version. If you do not have a 2.7 version of pip installed, you can upgrade with easy_install (which comes with Python):

    `> easy_install-2.7 pip`

2.  **Install Python dependencies**
    
    The set of Python dependencies you'll need to install are located in the KBase Bootstrap git repo. Grab that and use pip to install the list of dependencies.

        > git clone kbase@git.kbase.us:bootstrap
        > pip install -r bootstrap/kb_python_runtime/python-pip-list-narrative

    If you have any problems at this stage, make sure that your Python and pip versions are up to date and in sync with each other.

3.  **Install SciPy and NumPy**

    These are better to install as packages on their own. Linux users can use the usual frameworks (dpkg, apt-get, yum, and so on). Or you can fetch them from SourceForge:

    SciPy: [http://sourceforge.net/projects/scipy/files/scipy/](http://sourceforge.net/projects/scipy/files/scipy/)  
    NumPy: [http://sourceforge.net/projects/numpy/files/NumPy/](http://sourceforge.net/projects/numpy/files/NumPy/)

Once this is all done successfully, you can move on to installing the Narrative itself.

Installing the Narrative virtual environment
--------------------------------------------

The Narrative Interface uses a virtual environment that captures the Python dependency state of your system, makes an copy of that environment (so to speak), and prevents all of the different IPython dependencies from trickling out into your system and colliding with different things once it gets installed. All this means is that a Narrative's virtual environment is protected from changes to your system environment, and vice-versa.

The installation process takes a little time to run, as it downloads the IPython core code, builds a virtual environment to encapsulate it in, and puts that in a specified directory.

The `install.sh` script in the root of this repo does all the work. There are a few options of how to use it.

1.  **`> ./install.sh`**

    This creates a `narrative-venv/` directory where it's run, which contains your Narrative.

2.  **`> ./install.sh -v my-narrative-venv`**

    The -v tag allows you to specify the name of the narrative venv directory.

3. **`> ./install.sh -p /Users/kbaseuser/ -v my-narrative-venv`**

    The -p tag allows you to specify where your narrative venvs should be stored.

4. **Example**

    `> ./install.sh -p ~/.virtualenvs -v kbase-narr`

    This uses the ~/.virtualenvs directory (a common use case for virtualenv) for your environment and makes a new kbase-narr virtual environment.

Running the KBase Narrative
---------------------------

Now that you have your Narrative installed, you need to route your system path to use the virtual environment you created, then fire up the system.

1.  **Activate the virtual environment**

    `> source <my virtual environment>/bin/activate`

    (Optional) If you use the [virtualenvwrapper](http://virtualenvwrapper.readthedocs.org/en/latest/) module, and have installed the notebook under your usual virtual environment location, you can also simply use `workon <name>`, where `<name>` is whatever you chose to call the environment.

2.  **Fire up the Narrative**

    `> profile_name=narrative run_notebook.sh notebook`

    This will start the Narrative server and open a browser window for you with the heavily modified IPython Notebook running in it.

    (Optional) Leaving off the last 'notebook' part and just running `> run_notebook.sh` will open a command-line only version of the Narrative. This doesn't have very strong support, but can be useful for testing small things or debugging.

Managing your Narrative during development
------------------------------------------

A developer's guide to building Narrative content can be found here: [KBase Narrative Documentation](http://matgen6.lbl.gov:8080/) (todo: move this to kbase.us/docs)

This section covers how and when to reset your Narrative during development.

1.  **Modifying Python service code**

    Much of the Narrative involves writing service wrappers that invoke KBase services. If any of these (or any other part of the Python code in src/biokbase) is modified, you'll need to do the following steps to update your virtual environment.

    A.  Exit the Narrative (Ctrl-c a couple times on your running narrative console)  
    B.  (Option 1, the clean but slow way) Remove and reinstall the virtual environment  
    C.  (Option 2, the slightly-less-clean but much faster way) Run the part of the installer that compiles the src/biokbase directory  
        
        With your virtual environment still active:  
        `> python src/setup.py install || abort`  
    D.  Restart your Narrative as above.

2.  **Modifying KBase widget code (or any other front-end Javascript/HTML code)**

    If you're just tweaking visualization or widget code, you only need to do whatever compilation process you use for your personal code, then do a cache-clearing refresh of your page (shift-F5 on most browsers). You don't need to reset the entire virtual environment.

---


Older version of this Readme follows:
=====================================

Last updated: Dan Gunter <dkgunter@lbl.gov> 2/2/2014

Introduction
============

This is the new IPython based Narrative Interface repo.
The previous version has been branched into the pre-sprint branch for archival purposes.
All relevant code has been migrated under the src/ directory. A virtualenv based installer
and standard KBase makefile targets are in the works (still!).

Running
-------

The ipython narrative is a "profile" of the ipython notebook. The setup and instructions are run using the Python [virtualenv](https://pypi.python.org/pypi/virtualenv) module. If you haven't ever used this module, you should take some time to go familiarize yourself with it now.

An important caveat for your python environment is that you have Python 2.7 installed and that the version of pip that is run is matched to that python 2.7 installation. Because pip is not installed by default, it is possible to upgrade python, while still having a version of pip that only updates the libraries for a previous version of python. If you do not have a 2.7 version of pip, you can usually use something like easy_install-2.7 to update pip.

Most of the python dependencies for the notebook are in the bootstrap module under bootstrap/kb_python_runtime/python-pip-list-narrative.
There are some dependencies that are better installed as packages, scipy and numpy. They can either be installed using dpkg, or for MacOS
users they can be downloaded from http://sourceforge.net/projects/numpy/files/NumPy/ and
http://sourceforge.net/projects/scipy/files/scipy/

Download those files and then checkout the bootstrap repo and run this command:

pip install -r bootstrap/kb_python_runtime/python-pip-list-narrative

it should install all the necessary python module dependencies to run the notebook.

It's been reported that additional dependencies don't always get installed with this script, especially on Ubuntu. Namely, zmq and tornado. You can install these manually by running:

> pip install pyzmq
> pip install tornado

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
  
