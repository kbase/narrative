## Installing the Narrative Interface

### Requirements

* Python > 2.7
* Python's virtualenv package
* NodeJS
* Bower

1. Set up the submodules
```
git submodule init
git submodule update
```

2. Install the JavaScript dependencies with Bower, from the root of this repo.
```
bower install
```

3. Create a virtual environment with virtualenv. This creates a directory that encapsulates a complete environment that is separate from others on your system, and protects your system from module and version conflicts.
```
pip install virtualenv --upgrade   # vanilla Ubuntu 14.04 images come with a very old version of virtualenv that might be problematic
virtualenv my_narrative_venv
```

4. Activate that environment
```
source my_narrative_venv/bin/activate
```

5. Run the installation script. With your virtual environment activated, any dependencies will be installed there. This'll take ~450MB in your virtualenv.
```
sh scripts/install_narrative.sh
```

6. With your virtualenv still active, you can now run the Narrative. This will automatically open a browser window and run the Narrative inside of it.
```
kbase-narrative
```
