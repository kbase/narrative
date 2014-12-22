#!/bin/bash
# Script to build/install narrative
# in a current, existing virtual environment.

ipython_branch=1.x

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
    exit 0
}

force_ipython=''
case $1 in
    -h) usage;;
    --help) usage;;
    --ipython) force_ipython=1;;
esac

console "Install: complete log in $logfile"

if [ "$force_ipython" -o ! -e ipython ]
then
    console "Installing IPython branch $ipython_branch"
    log "Cloning IPython branch ${ipython_branch}"
    git clone https://github.com/ipython/ipython.git -b ${ipython_branch}
    cd ipython
    python setup.py install >> ${logfile} 2>&1
    cd ..
fi

console "Installing biokbase"
log "Installing requirements from src/requirements.txt with 'pip'"
pip install -r src/requirements.txt >> ${logfile} 2>&1
log "Running local 'setup.py'"
cd src
python setup.py install >> ${logfile} 2>&1
log "Done installing biokbase."
cd ..

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
