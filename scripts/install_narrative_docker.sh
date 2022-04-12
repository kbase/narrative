# The Docker build script is based on a few assumptions
# 1. We're in the kbase/narrbase container (which has all biokbase requirements
#    as well as Jupyter Notebook and IPywidgets)
# 2. We're not using a virtualenv.
# 3. Git submodules are up to date.
# 4. Javascript requirements are already installed (the Dockerfile handles this)

PYTHON=python

SCRIPT_TGT="kbase-narrative"
SCRIPT_TGT2="headless-narrative"

CUR_DIR=$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )
NARRATIVE_ROOT_DIR=$CUR_DIR/..
SCRIPT_TEMPLATE=$CUR_DIR/start_docker_narrative.tmpl
SCRIPT_TEMPLATE2=$CUR_DIR/run_headless.tmpl

function console () {
    now=`date '+%Y-%m-%d %H:%M:%S'`
    echo "$now [install_narrative] $1"
}

source activate base

# Install Narrative requirements
# ------------------------------
console "Installing biokbase requirements from src/requirements.txt"
pip install -r $NARRATIVE_ROOT_DIR/src/requirements.txt

# Install sklearn and clustergrammer
# ------------------------------
# We install clustergrammer_widget and sklearn specially here so that it does not
# clobber dependencies in the base conda image
console "installing sklearn & clustergrammer_widget'"
pip install --no-dependencies semantic_version sklearn clustergrammer_widget

# Install Narrative code
# ----------------------
console "Installing biokbase modules"
cd $NARRATIVE_ROOT_DIR/src
console "Running local 'setup.py'"
${PYTHON} setup.py install
console "Done installing biokbase."
cd $NARRATIVE_ROOT_DIR

# Setup jupyter_narrative script
# and headless narrative runner
# ------------------------------
console "Installing scripts"
i=0
while read s
    do
        echo $s
        if [ $i = 0 ]
            then
            echo d=`pwd`
            i=1
        fi
done < $SCRIPT_TEMPLATE > $SCRIPT_TGT

i=0
while read s
    do
        echo $s
        if [ $i = 0 ]
            then
            echo d=`pwd`
            i=1
        fi
done < $SCRIPT_TEMPLATE2 > $SCRIPT_TGT2

d=$(dirname `which python`)
chmod 0755 $SCRIPT_TGT $SCRIPT_TGT2
console "Putting new $SCRIPT_TGT command under $d"
/bin/mv $SCRIPT_TGT $d
/bin/mv $SCRIPT_TGT2 $d


console "Done installing scripts"

NARRATIVE_DIR=$(pwd)
JUPYTER_CONFIG_DIR=$NARRATIVE_DIR/kbase-extension
JUPYTER_RUNTIME_DIR=/tmp/jupyter_runtime
JUPYTER_DATA_DIR=/tmp/jupyter_data
JUPYTER_PATH=$NARRATIVE_DIR/kbase-extension
IPYTHONDIR=$NARRATIVE_DIR/kbase-extension/ipython
HOME=/tmp

console "Installing nbextensions"
cp -r nbextensions kbase-extension/static
cd kbase-extension/static/nbextensions
sh install.sh
console "Done installing nbextensions"
