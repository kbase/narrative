## Installing and Running the Narrative Interface
(Updated 8/12/2020)

### Requirements

* Python > 3.6+
* NodeJS and NPM >= v10.0.0 (available here: https://nodejs.org/en/, LTS recommended)
* Bower (install with `npm install -g bower` or instructions here https://bower.io/)
* Highly recommended - a Python environment manager. Conda is mostly used here, but venv, Poetry, or Pipenv should work as well.

### Install - Short version

From the root of the narrative repo:
```
./scripts/install_narrative.sh
```

This will create a virtual environment and install the Narrative in to it. You can also leave off the `-v` and install it globally, though that might cause problems with other installed Python packages (especially other versions of the Jupyter Notebook, or Jupyter extensions).

If you've never used virtual environments before, read this: https://packaging.python.org/guides/installing-using-pip-and-virtual-environments/#creating-a-virtual-environment


### Install - Detailed version - read this if you have any problems with the above

It's highly recommended to create a Python virtual environment with one of the many tools around. This encapsulates a complete environment that is separate from others on your system, and protects your system from module and version conflicts. E.g. with conda installed, the command to create a new environment would be
```
conda create -n narrative-env
```
Then activate it with
```
conda activate narrative-env
```

2. Run the installation script. With your virtual environment activated, any dependencies will be installed there.
```
sh scripts/install_narrative.sh
```

### Running the Narrative Interface
Just run:
```
kbase-narrative
```
This will automatically open a browser window and run the Narrative inside of it. It will open the Jupyter-based 'tree' page that lists all available Narratives. If you get prompted for a "dev" authentication token, you'll need one from CI.

By default, this will be open on port 8888. If port 8888 is in use, it'll go to the next available one. You can set an optional port with `kbase-narrative -port ####`
