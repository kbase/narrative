#!/bin/bash
# Script to build/install narrative
# in a current, existing virtual environment.

ipython_branch=1.x
PYTHON=python2.7

# clear log
logfile=install.log
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
    printf "usage: $0 [optons]\n"
    printf "options:\n"
    printf "  --ipython: force install of IPython even if ipython/ dir exists\n"
    printf "  --no-venv: If we are not in a virtualenv, do not create one, just exit\n"
    exit 0
}

# Arg parsing
# -----------

force_ipython=''
no_venv=''
while [ $# -gt 0 ]; do
    case $1 in
        -h) usage;;
        --help) usage;;
        --ipython) force_ipython=1;;
        --no-venv) no_venv=1;
    esac
    shift
done

console "Install: complete log in '$logfile'"

# Setup virtualenv
# ----------------

if [ "x$VIRTUAL_ENV" = x ]; then
    if [ $no_venv ]; then
        console "You are not in a virtualenv and --no-venv indicated not to create one. Exiting."
        exit 1
    fi
    venv="narrative-venv"
    installpath=`pwd`
    venvpath="$installpath/$venv"
    if [ -e "$venvpath" ]; then
        console "Found existing virtualenv in ${venvpath}"
        source $venvpath/bin/activate
    else
        console "Creating new virtualenv $venv in $venvpath"
        virtualenv --python=$PYTHON --system-site-packages "$venvpath" >> ${logfile} 2>&1
        log "Created and activated new virtualenv $venvpath"
    fi
    console "Switched to virtualenv '$venv'"
fi

# Setup IPython inside virtualenv
# -------------------------------

if [ "$force_ipython" -o ! -e ipython ]
then
    console "Installing IPython branch $ipython_branch"
    if [ -e ipython ]; then
        console "Option --ipython given, replacing existing ipython/ dir"
        /bin/rm -rf ipython
        log "Removed old ipython/ dir"
    fi
    log "Cloning IPython branch ${ipython_branch}"
    git clone https://github.com/ipython/ipython.git -b ${ipython_branch}
    cd ipython
    python setup.py install >> ${logfile} 2>&1
    cd ..
fi

# Install narrative code
# ----------------------

console "Installing biokbase"
log "Installing requirements from src/requirements.txt with 'pip'"
pip install -r src/requirements.txt >> ${logfile} 2>&1
log "Running local 'setup.py'"
cd src
python setup.py install >> ${logfile} 2>&1
log "Done installing biokbase."
cd ..

# Set up the run_notebook script
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
done < run_notebook.tmpl > run_notebook
d=$(dirname `which python`)
chmod 0755 run_notebook
log "Putting new run_notebook under $d"
/bin/mv run_notebook $d
log "Done installing scripts"

console "Done"
