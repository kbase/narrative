#!/usr/bin/env bash

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
    printf "  {-u | --update} \n\tOnly install the biokbase module, don't install all prereqs or Jupyter packages.\n"
}

# Arg parsing
# -----------

update_only=0
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
    esac
done

console "Install: complete log in: $logfile"

if [ ! $update_only -eq 1 ]
then
    # Install external JavaScript code
    # --------------------
    log "Installing front end build components with npm"
    cd $NARRATIVE_ROOT_DIR
    npm install 2>&1 | tee -a ${logfile}
    npm run install-npm

    # Install Narrative requirements
    # ------------------------------
    log "Installing biokbase requirements from src/requirements.txt"
    cd "$NARRATIVE_ROOT_DIR/src"
    cat requirements.txt | sed -e '/^\s*#.*$/d' -e '/^\s*$/d' | xargs -n 1 pip --no-cache-dir install 2>&1 | tee -a "${logfile}"
    if [ $? -ne 0 ]; then
        console "pip install for biokbase requirements failed: please examine $logfile"
        exit 1
    fi

    # Install development requirements
    # --------------------------------
    log "Installing Narrative developer requirements from src/requirements-dev.txt"
    cat requirements-dev.txt | sed -e '/^\s*#.*$/d' -e '/^\s*$/d' | xargs -n 1 pip --no-cache-dir install 2>&1 | tee -a "${logfile}"
    if [ $? -ne 0 ]; then
        console "pip install for Narrative development requirements failed: please examine $logfile"
        exit 1
    fi
fi

# Install Narrative code
# ----------------------
log "Installing biokbase modules"
cd "$NARRATIVE_ROOT_DIR/src"
log "Running local 'setup.py'"
python setup.py install 2>&1 | tee -a "${logfile}"
log "Done installing biokbase."
cd "$NARRATIVE_ROOT_DIR"

if [ ! $update_only -eq 1 ]
then
    # Setup jupyter_narrative script
    # ------------------------------
    console "Installing scripts"
    i=0
    while read s
        do
            echo "$s"
            if [ $i = 0 ]
                then
                echo d=`pwd`
                echo e=$(dirname `which python`)
                i=1
            fi
    done < "$SCRIPT_TEMPLATE" > "$SCRIPT_TGT"
    d=$(dirname `which python`)
    chmod 0755 "$SCRIPT_TGT"
    log "Putting new $SCRIPT_TGT command under $d"
    /bin/mv "$SCRIPT_TGT" "$d"
    log "Done installing scripts"

    log "Installing nbextensions"
    cd nbextensions
    sh install.sh
    cd ../..
    jupyter nbextension enable --py --sys-prefix widgetsnbextension
    log "Done installing nbextensions"
fi

log "Done. Run the narrative with the command: $SCRIPT_TGT"
