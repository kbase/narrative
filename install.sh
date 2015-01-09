#!/bin/bash
# Script to build/install narrative
# in a current, existing virtual environment.

ipython_branch=1.x
PYTHON=python2.7

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
    printf "usage: $0 [optons]\n"
    printf "options:\n"
    printf "  --ipython: force install of IPython even if ipython/ dir exists\n"
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

console "Install: complete log in: $logfile"

# Setup virtualenv
# ----------------
if [ "x$VIRTUAL_ENV" = x ]; then
  console 'ERROR: No Python virtual environment detected! Please activate one first.
  The easiest way to use virtual environments is with the virtualenvwrapper package. See:
  https://virtualenvwrapper.readthedocs.org/en/latest/install.html#basic-installation'
  exit 1
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
fi
# Always install
log "Installing IPython using $PYTHON"
console "Installing IPython from directory 'ipython'"
cd ipython
${PYTHON} setup.py install >> ${logfile} 2>&1
cd ..
hash -r
maj_ver=`ipython -V | cut -f1 -d'.'`
if [ $maj_ver != 1 ]; then
  ip_ver=`ipython -V`
  console "IPython version ($ip_ver) is wrong: Abort"
  log "IPython version ($ip_ver) is wrong! Abort."
  exit 1
fi

# Install narrative code
# ----------------------
console "Installing biokbase"
log "Installing requirements from src/requirements.txt with 'pip'"
pip install -r src/requirements.txt >> ${logfile} 2>&1
if [ $? -ne 0 ]; then
  console "pip install failed: please examine install.log"
  exit 1
fi
log "Running local 'setup.py'"
cd src
${PYTHON} setup.py install >> ${logfile} 2>&1
log "Done installing biokbase."
cd ..

# Install IPython again (!)
log "Installing IPython no. 2"
cd ipython
${PYTHON} setup.py install >> ${logfile} 2>&1
cd ..

# Set up the run_notebook script
# ------------------------------
console "Installing scripts"
tgt="kbase-narrative"
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
done < run_notebook.tmpl > $tgt
d=$(dirname `which python`)
chmod 0755 $tgt
log "Putting new $tgt command under $d"
/bin/mv $tgt $d
log "Done installing scripts"

if [ $created_venv = 1 ]; then
  console "You MUST activate the new virtual environment before running the Narrative"
  console "Run: source $venv/bin/activate"
fi
console "Done. Run the narrative with the command: $tgt"
