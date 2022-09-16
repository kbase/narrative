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

# source activate base

# Install Narrative requirements
# ------------------------------
# install deps one at a time so that pip gets all the dependencies correctly
console "Installing biokbase requirements from src/requirements.txt"
cat $NARRATIVE_ROOT_DIR/src/requirements.txt | sed -e '/^\s*#.*$/d' -e '/^\s*$/d' | xargs -n 1 pip install

# overwrite existing pyyaml installation (from distutils, so pip cannot uninstall it)
pip install --ignore-installed -r $NARRATIVE_ROOT_DIR/src/requirements-ignore-installed.txt

# Install Narrative code
# ----------------------
console "Installing biokbase modules"
cd $NARRATIVE_ROOT_DIR/src
console "Running local 'setup.py'"
${PYTHON} setup.py install
console "Done installing biokbase."

pip list --local

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
