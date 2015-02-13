## Narrative development

Last updated: Dan Gunter <dkgunter@lbl.gov> 7/31/2014

To report bugs, login using your KBase developer user/pass at: https://atlassian.kbase.us

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

### Preparing your system

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

### Installing the Narrative virtual environment

The Narrative Interface uses a virtual environment that captures the Python dependency state of your system, makes an copy of that environment (so to speak), and prevents all of the different IPython dependencies from trickling out into your system and colliding with different things once it gets installed. All this means is that a Narrative's virtual environment is protected from changes to your system environment, and vice-versa.

First, however, you'll need to get a necessary submodule initialized:

    git submodule init
    git submodule update

If there are any problems with this step, run the following commands:

    cd modules/ui-common
    git checkout hardy
    git pull

Now you're set up with the correct Narrative environment.

### New install method

The installation process takes a little time to run (the first time),
as it downloads the IPython code, builds it, and also installs all the
dependencies for biokbase. Run the script:


    ./install.sh


If you are already in a Python virtual environment, it will install into that.
If not, it will give you an error and point you to resources for creating
a virtual environment. The option to auto-create a virtual environment
has been removed because it is not a standard thing to do in Python and
therefore there were subtle ways it could fail.

#### Old install method

If you still want to use the previous method, instead run `old-install.sh` and see the notes below:

1.  `./old-install.sh`

    This creates a `narrative-venv/` directory where it's run, which contains your Narrative.

2.  `./old-install.sh -v my-narrative-venv`

    The -v tag allows you to specify the name of the narrative venv directory.

3. `./old-install.sh -p /Users/kbaseuser/ -v my-narrative-venv`

    The -p tag allows you to specify where your narrative venvs should be stored.

4. **Example**

    `./old-install.sh -p ~/.virtualenvs -v kbase-narr`

    This uses the ~/.virtualenvs directory (a common use case for virtualenv) for your environment and makes a new kbase-narr virtual environment.

### Running the KBase Narrative

Now that you have your Narrative installed, you need to run the wrapper script.

`kbase-narrative`

This will start a new local Narrative notebook in your default browser.

**Old method**: If you used the old install method, you may need to first activate your virtual environment with:
`source <my virtual environment>/bin/activate`, and instead run this command:

`profile_name=narrative run_notebook.sh notebook`

### Managing your Narrative during development

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
