## Installing the Narrative Interface

### Requirements

* Python > 2.7
* Python's virtualenv package

1. Create a virtual environment with virtualenv. This creates a directory that encapsulates a complete environment that is separate from others on your system, and protects your system from module and version conflicts.
```
virtualenv my_venv
```

2. Activate that environment
```
source my_venv/bin/activate
```

3. Run the installation script. With your virtual environment activated, any dependencies will be installed there.
```
sh scripts/install-narrative.sh
```

4. With your virtualenv still active, you can now run the Narrative. This will automatically open a browser window and run the Narrative inside of it.
```
kbase-narrative
```