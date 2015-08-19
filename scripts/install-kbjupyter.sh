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
# > get clone https://github.com/ipython/ipywidgets
# > cd ipywidgets
# > git checkout tags/4.0.2
# > pip install -e .
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

JUPYTER_NOTEBOOK_INSTALL_DIR=jupyter-notebook
JUPYTER_NOTEBOOK_TAG=4.0.1

IPYWIDGETS_INSTALL_DIR=ipywidgets
IPYWIDGETS_TAG=4.0.2

PYTHON=python2.7

CUR_DIR=$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )
SCRIPT_TEMPLATE=$CUR_DIR/jupyter_notebook.tmpl

# clear log
logfile=`pwd`/install.log
cat /dev/null > $logfile

function log () {
    now=`date '+%Y-%m-%d %H:%M:%S'`
    echo "$now [install_narrative] $1" >> $logfile
}

function console () {
    now=`date '+%Y-%m-%d %H:%M:%S'`
    echo "$now [install_narrative] $1"
}

function usage () {
    printf "usage: $0 [options]\n"
    printf "options:\n"
    printf "  {-h | --help} \n\tShow these help options.\n"
    printf "  {-v | --virtualenv} install_path\n\tSelect a virtualenv path to use if one is not activated.\n\t"
    printf "If the virtualenv does not yet exist, the script will attempt\n\tto make one for you with default options.\n"
}

function make_activate_venv () {
    VENV_DIR=$1

    if [ -z $VENV_DIR ]; then
        printf "A path is needed to create a virtual environment\n"
        usage
        exit 1
    fi

    # if the path $1 doesn't exist, use virtualenv to make that venv
    if [ ! -d $VENV_DIR ]; then
        virtualenv $VENV_DIR
    fi

    # if it does, assume we can activate with $1/bin/activate
    source $VENV_DIR/bin/activate
    echo $VIRTUAL_ENV
}

# Arg parsing
# -----------

force_ipython=''
no_venv=''
while [ $# -gt 0 ]; do
    case $1 in
        -h | --help | -\?)
            usage
            exit 0
            ;;
        --ipython) 
            force_ipython=1
            shift
            ;;
        --no-venv)
            no_venv=1
            shift
            ;;
        -v | --virtualenv)
            make_activate_venv $2
            shift 2
            ;;
    esac
done

console "Install: complete log in: $logfile"

# Setup virtualenv
# ----------------
if [ "x$VIRTUAL_ENV" = x ]; then
  console 'ERROR: No Python virtual environment detected! Please activate one first.
  The easiest way to use virtual environments is with the virtualenvwrapper package. See:
  https://virtualenvwrapper.readthedocs.org/en/latest/install.html#basic-installation'
  console 'You can also run this with the -v {some name} to create a virtual envirnoment'
  exit 1
fi

cd $VIRTUAL_ENV

# Install Jupyter code
# --------------------
# 1. Setup Jupyter Notebook inside virtualenv
log "Installing Jupyter notebook using $PYTHON"
console "Installing Jupyter notebook from directory 'jupyter-notebook'"
git clone https://github.com/jupyter/notebook jupyter-notebook
cd jupyter-notebook
git checkout tags/$JUPYTER_NOTEBOOK_TAG
pip install --pre -e . >> ${logfile} 2>&1
cd ..

# Setup ipywidgets addon
log "Installing ipywidgets using $PYTHON"
console "Installing ipywidgets from directory 'ipywidgets'"
git clone https://github.com/ipython/ipywidgets
cd ipywidgets
git checkout tags/$IPYWIDGETS_TAG
pip install -e . >> ${logfile} 2>&1
cd ../..

# Install Narrative code
# ----------------------
console "Installing biokbase modules"
log "Installing requirements from src/requirements.txt with 'pip'"
cd src 
pip install -r requirements.txt >> ${logfile} 2>&1
if [ $? -ne 0 ]; then
    console "pip install for biokbase requirements failed: please examine $logfile"
    exit 1
fi
log "Running local 'setup.py'"
${PYTHON} setup.py install >> ${logfile} 2>&1
log "Done installing biokbase."
cd ..

# Setup jupyter_narrative script
# ------------------------------
console "Installing scripts"
TGT="kbase-narrative"
i=0
while read s
    do
        echo $s
        if [ $i = 0 ]
            then
            echo d=`pwd`
            echo e=$(dirname `which python`)
            i=1
        fi
done < $SCRIPT_TEMPLATE > $TGT
d=$(dirname `which python`)
chmod 0755 $TGT
log "Putting new $TGT command under $d"
/bin/mv $TGT $d
log "Done installing scripts"

console "Done. Run the narrative with the command: $TGT"