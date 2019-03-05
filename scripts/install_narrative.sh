#!/usr/bin/env bash

# installer steps
# 0. prereqs = npm, bower, conda, pip, Python 3+


# given a virtual environment, install jupyter notebook, and the KBase goodies on top
# 1. source into virtualenv
# > virtualenv narrative-jupyter
# > source narrative-jupyter/bin/activate
#
# 2. fetch the right tag of jupyter notebook
# > git clone https://github.com/jupyter/notebook jupyter-notebook
# > cd jupyter-notebook
# > git checkout tags/4.0.5
#
# 3. do the install
# > pip install --pre -e .
#
# > get clone https://github.com/ipython/ipywidgets
# > cd ipywidgets
# > git checkout tags/4.0.3
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

IPYTHON_VERSION=7.3.0
NOTEBOOK_VERSION=5.7.4
IPYWIDGETS_VERSION=7.4.2

SCRIPT_TGT="kbase-narrative"

CUR_DIR=$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )
NARRATIVE_ROOT_DIR=$CUR_DIR/..
SCRIPT_TEMPLATE=$CUR_DIR/start_local_narrative.tmpl

# clear log
logfile=`pwd`/install.log
cat /dev/null > $logfile

function log () {
    now=`date '+%Y-%m-%d %H:%M:%S'`
    echo "$now [install_narrative] $1" | tee -a $logfile
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

# Arg parsing
# -----------

update_only=0
travis=0
while [ $# -gt 0 ]; do
    case $1 in
        -h | --help | -\?)
            usage
            exit 0
            ;;
        -u | --update)
            update_only=1
            shift
            ;;
        --travis)
            travis=1
            shift
            ;;
    esac
done

console "Install: complete log in: $logfile"

# TODO -
# Test for conda, fail otherwise
# Test for Python >= 3.5 or so (not sure which)

if [ ! $update_only -eq 1 ]
then
    # Install external JavaScript code
    # --------------------
    cd $NARRATIVE_ROOT_DIR
    log "Installing front end build components with npm"
    npm install 2>&1 | tee -a ${logfile}
    log "Installing front end components with bower"
    bower install -V --allow-root --config.interactive=false 2>&1 | tee -a ${logfile}

    # Install IPython
    # ---------------
    log "Installing IPython version $IPYTHON_VERSION"
    conda install -y ipython==$IPYTHON_VERSION 2>&1 | tee -a ${logfile}

    # Install Jupyter Notebook
    # ------------------------
    log "Installing Jupyter notebook version $NOTEBOOK_VERSION"
    conda install -y notebook==$NOTEBOOK_VERSION 2>&1 | tee -a ${logfile}

    # Setup ipywidgets addon
    log "Installing ipywidgets using $PYTHON"
    conda install -y ipywidgets==$IPYWIDGETS_VERSION 2>&1 | tee -a ${logfile}

    # Install Narrative requirements
    # ------------------------------
    log "Installing biokbase requirements from src/requirements.txt"
    cd $NARRATIVE_ROOT_DIR/src
    pip install -r requirements.txt 2>&1 | tee -a ${logfile}
    if [ $? -ne 0 ]; then
        console "pip install for biokbase requirements failed: please examine $logfile"
        exit 1
    fi

    pip install pandas sklearn clustergrammer_widget | tee -a ${logfile}
    if [ $? -ne 0 ]; then
        console "pip install for biokbase requirements failed: please examine $logfile"
        exit 1
    fi
    cd $NARRATIVE_ROOT_DIR
fi

# Install Narrative code
# ----------------------
log "Installing biokbase modules"
cd $NARRATIVE_ROOT_DIR/src
log "Running local 'setup.py'"
python setup.py install 2>&1 | tee -a ${logfile}
log "Done installing biokbase."
cd $NARRATIVE_ROOT_DIR

if [ ! $update_only -eq 1 ]
then
    # Setup jupyter_narrative script
    # ------------------------------
    console "Installing scripts"
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
    done < $SCRIPT_TEMPLATE > $SCRIPT_TGT
    d=$(dirname `which python`)
    chmod 0755 $SCRIPT_TGT
    log "Putting new $SCRIPT_TGT command under $d"
    /bin/mv $SCRIPT_TGT $d
    log "Done installing scripts"

    log "Installing nbextensions"
    cd nbextensions
    sh install.sh
    cd ../..
    jupyter nbextension enable --py --sys-prefix widgetsnbextension
    log "Done installing nbextensions"
fi

log "Done. Run the narrative with the command: $SCRIPT_TGT"
