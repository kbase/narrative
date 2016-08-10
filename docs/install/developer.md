## Narrative developer installation

Last updated: Bill Riehl <wjriehl@lbl.gov> 12/21/2015

To report bugs, login using your KBase developer user/pass at: https://atlassian.kbase.us

This is the Jupyter based Narrative Interface repository.
This document will go over the installation and instantiation process of a local
version of the Narrative Interface for development purposes. It's divided into
four parts:

1. Preparing your system
2. Installing the Narrative virtual environment
3. Starting your Narrative
4. Managing your Narrative during development

### Preparing your system

The first stage involves the local installation of the packages needed to make
the Narrative work.

1.  **Python 2.7**

    You must have Python 2.7 and a matching version of pip. Pip is not installed by default, so it is possible to upgrade Python and keep a version of pip that only updates the libraries for a previous version. If you do not have a 2.7 version of pip installed, you can upgrade with easy_install (which comes with Python):

    `> easy_install-2.7 pip`

2.  **Python virtualenv**

    If you want to use a virtual environment when installing your local narrative, you'll need virtualenv. You can get that pretty easily with

    `> pip install virtualenv --upgrade`

    More details on WHY you'd want to do this below.

3.  **Install SciPy and NumPy** (optional)

    These are better to install as packages on their own. Linux users can use the usual frameworks (dpkg, apt-get, yum, and so on). Or you can fetch them from SourceForge:

    SciPy: [http://sourceforge.net/projects/scipy/files/scipy/](http://sourceforge.net/projects/scipy/files/scipy/)  
    NumPy: [http://sourceforge.net/projects/numpy/files/NumPy/](http://sourceforge.net/projects/numpy/files/NumPy/)

4.  **NodeJS and Bower**
    
    NodeJS (especially npm) and Bower are used to manage installation and testing of front-end JavaScript code. These are critical to have installed, since they manage JavaScript dependencies. Start with Node - instructions available here https://nodejs.org/en/download/

    Then, use npm (comes with node) to install bower  

    `> npm install -g bower`


Once this is all done successfully, you can move on to installing the Narrative itself.

### Installing the Narrative

The Narrative Interface generally works best when installed inside a virtual environment. Why would you do this? Simple - using a virtualenv protects your system from being filled with dependencies that may or may not conflict with what you currently have installed, or want to install. All this means is that a Narrative's virtual environment is protected from changes to your system environment, and vice-versa.

You have two options here - either instantiate a venv yourself (Here's a great guide with some examples: http://docs.python-guide.org/en/latest/dev/virtualenvs/), or use the -v flag of the installer (below).

Then, simply run the installer.

From the root of the narrative repo, the command is:

`> scripts/install_narrative.sh`

The installer can be run in three ways.

**1. Automatically build a virtualenv**

`> scripts/install_narrative.sh -v /path/to/my_virtual_env`

This builds up a venv, installs all requirements into it, and builds the Narrative there. You'll need that venv activated to run.

**2. Install into an existing virtualenv**

Activate your virtualenv, then just run the script with no flags.
```
> source /path/to/my_virtual_env/bin/activate
> scripts/install_narrative.sh
```

That's it, you get the same result as above.

**3. Install into your system without a venv.**

Not recommended, but you can install the Narrative natively. Note that this also installs the Jupyter Notebook (4.0.6) and IPywidgets (4.1.1) (versions as of 12/21/2015) onto your system as well. This might cause all kinds of conflicts, so be careful!
```
> scripts/install_narrative.sh --no-venv
```

This takes care of all dependency management, and also installs the KBase data API.


### Running the narrative

Activate your virtualenv if you used one, then just run kbase-narrative.
```
> source /path/to/my_virtualenv/bin/activate
> kbase-narrative
```

And that's it! You should be up and running. This script configures the Jupyter Notebook environment with the KBase extensions and fires up the application. Any command line flags given to this script are passed straight through to Jupyter. For example:

```
> kbase-narrative --NotebookApp.open_browser=False
```

Will start the server without starting a browser session.

Note that when run locally, the Narrative is configured to use ci.kbase.us for its services and workspaces, and not all methods will (currently) run.


### Managing your Narrative during development

This section covers how and when to reset your Narrative during development.

1.  **Modifying Python service code**

    If any of the Python code in src/biokbase is modified, you'll need to do the following steps to update your virtual environment.

    A.  Exit the Narrative (Ctrl-c a couple times on your running narrative console)  
    B.  (Option 1, the clean but slow way) Remove and reinstall the virtual environment  
    C.  (Option 2, the slightly-less-clean but much faster way) Run the part of the installer that compiles the src/biokbase directory  

        With your virtual environment still active:  
        `> python src/setup.py install || abort`  
    D.  Restart your Narrative with the `kbase-narrative` command.

2.  **Modifying KBase widget code (or any other front-end Javascript/HTML code)**

    If you're just tweaking visualization or widget code, you only need to do whatever compilation process you use for your personal code, then do a cache-clearing refresh of your page (shift-F5 on most browsers). You don't need to reset the entire virtual environment.
