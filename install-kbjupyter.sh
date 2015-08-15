# given a virtual environment, install jupyter notebook, and the KBase goodies on top
# 1. source into virtualenv
# > virtualenv narrative-jupyter
# > source narrative-jupyter/bin/activate
# 
# 2. fetch the right tag of jupyter notebook
# > git clone https://github.com/jupyter/notebook jupyter-notebook
# > cd jupyter-notebook
# > git checkout tags/4.0.1
#
# 3. do the install
# > pip install --pre -e .
#
# 4. setup configs to be in kbase-config, not in /home/users/.jupyter
# > SOME ENV VAR setup
# 
# 5. go into src and grab requirements
# > cd src
# > pip install -r requirements.txt
#
# 6. install kbase stuff
# > python setup.py install
#
# 7. build run script. (see jupyter-narrative.sh)
# > cp jupyter-narrative.sh narrative-jupyter/bin
# 
# 8. Done!