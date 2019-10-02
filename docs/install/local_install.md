## Installing and Running the Narrative Interface

### Requirements

* Python > 2.7 and < 3.0  (for now, a Python 3.6+ version is upcoming)
* Python's virtualenv package
* NodeJS and NPM >= v8.0.0 (available here: https://nodejs.org/en/)
* Bower (install with `npm install -g bower` or instructions here https://bower.io/)

### Install - Short version

From the root of the narrative repo:
```
./scripts/install_narrative.sh -v narrative_venv
```
or, for another directory target
```
./scripts/install_narrative.sh -v /path/to/my_venv
```

This will create a virtual environment and install the Narrative in to it. You can also leave off the `-v` and install it globally, though that might cause problems with other installed Python packages (especially other versions of the Jupyter Notebook, or Jupyter extensions).

If you've never used virtual environments before, read this: https://packaging.python.org/guides/installing-using-pip-and-virtual-environments/#creating-a-virtual-environment


### Install - Detailed version - read this if you have any problems with the above

1. Create a virtual environment with virtualenv. This creates a directory that encapsulates a complete environment that is separate from others on your system, and protects your system from module and version conflicts. This needs to have a Python2 executable. So do the following to make sure the right version is there. This document will use the directory/environment name "narrative_venv" throughout, but you can call it whatever you want.

First, we're going to find the path to a Python 2 executable.
```
python --version
```
Will give a line like `Python 2.7.15` or `Python 3.6.7 :: Anaconda custom (64-bit)`. If the version is 2.7, then you can use this one. Find the path with 
```
which python
```
(will probably return something like `/usr/bin/python`)
If the version is Python 3, then you'll have to find the path to a Python 2 executable. You can do this with
```
which python2
```
(which may return soething like `/usr/local/bin/python2`)

With whatever path you get, keep it in mind.

Next, make sure you have `virtualenv` installed. If the `virtualenv` command works, then you're set. If not, do the following:
```
pip install virtualenv --upgrade   # vanilla Ubuntu 14.04 images come with a very old version of virtualenv that might be problematic
```

Now, we can make that environment. With the path to your Python 2 executable, do:
```
virtualenv --python=/path/to/python narrative_venv
```

2. Activate that environment
```
source narrative_venv/bin/activate
```

3. Install a few pre-requisite pip packages. There's drift between the local installer and the deployed environments, and this is a patch while things get put back in line (will be fixed on release of the Python 3 Narrative, hopefully before January 1, 2020).
```
pip install scikit-learn pandas clustergrammer_widget
```

4. Run the installation script. With your virtual environment activated, any dependencies will be installed there. This'll take ~450MB in your virtualenv.
```
sh scripts/install_narrative.sh
```

### Running the Narrative Interface
With your virtualenv active (or not, if you didn't use one), just run:
```
kbase-narrative
```
This will automatically open a browser window and run the Narrative inside of it. It will open the Jupyter-based 'tree' page that lists all available Narratives. If you get prompted for a "dev" authentication token, you'll need one from CI.
