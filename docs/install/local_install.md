## Installing and Running the Narrative Interface

### Requirements

* Python > 2.7
* Python's virtualenv package
* NodeJS
* Bower

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


### Install - Detailed version

1. Create a virtual environment with virtualenv. This creates a directory that encapsulates a complete environment that is separate from others on your system, and protects your system from module and version conflicts.
```
pip install virtualenv --upgrade   # vanilla Ubuntu 14.04 images come with a very old version of virtualenv that might be problematic
virtualenv my_narrative_venv
```

2. Activate that environment
```
source my_narrative_venv/bin/activate
```

3. Run the installation script. With your virtual environment activated, any dependencies will be installed there. This'll take ~450MB in your virtualenv.
```
sh scripts/install_narrative.sh
```

### Running the Narrative Interface
With your virtualenv active (or not, if you didn't use one), just run:
```
kbase-narrative
```
This will automatically open a browser window and run the Narrative inside of it. It will open the Jupyter-based 'tree' page that lists all available Narratives.
