# The Docker build script is based on a few assumptions
# 1. We're in the kbase/narrbase container (which has all biokbase requirements
#    as well as Jupyter Notebook and IPywidgets)
# 2. We're not using a virtualenv.
# 3. Git submodules are up to date.
# 4. Javascript requirements are already installed (the Dockerfile handles this)

PYTHON=python2.7

SCRIPT_TGT="kbase-narrative"

CUR_DIR=$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )
NARRATIVE_ROOT_DIR=$CUR_DIR/..
SCRIPT_TEMPLATE=$CUR_DIR/jupyter_notebook.tmpl

function console () {
    now=`date '+%Y-%m-%d %H:%M:%S'`
    echo "$now [install_narrative] $1"
}

# Install Narrative code
# ----------------------
console "Installing biokbase modules"
cd $NARRATIVE_ROOT_DIR/src 
console "Running local 'setup.py'"
${PYTHON} setup.py install 
console "Done installing biokbase."
cd $NARRATIVE_ROOT_DIR

# Install KBase data_api package
# ------------------------------
git clone https://github.com/kbase/data_api -b develop
cd data_api
pip install -r requirements.txt
$PYTHON setup.py install
cd ..
rm -rf data_api

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
console "Putting new $SCRIPT_TGT command under $d"
/bin/mv $SCRIPT_TGT $d
console "Done installing scripts"