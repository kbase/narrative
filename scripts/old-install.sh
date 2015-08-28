#!/usr/bin/env bash

installPath=`pwd`
venv="narrative-venv"
branch="3.x"
commit="" 
profile_name="narrative"
# set to your python
PYTHON=python2.7

while :
do
    case $1 in
        -h | --help | -\?)
            printf "usage: $0 [{-p | --install_path} root_install_path] [{-v | --virtual_env} environment_name] [{-c | commit_id} git_commit_id] [{-n | --name} profile_name]\n"
            printf "   p : this is an existing absolute path where you would like the virtualenv directory created inside, \n"
            printf "       e.g. /home/user/my_virtualenv_area\n"
            printf "       defaults to the current working directory\n"
            printf "   v : the name of the virtualenv\n"
            printf "       e.g. /home/user/my_virtualenv_area/my_venv\n"
            printf "       defaults to 'narrative-venv'\n"
            printf "   b : the name of the branch of ipython to use\n"
            printf "       e.g. master\n"
            printf "       defaults to '1.x'\n"
            printf "   c : use this git commit id to checkout code\n"
            printf "       only used if defined, defaults to empty string\n"
            printf "   n : the name of the profile, e.g. narrative_mongo\n"
            printf "       the default is ${profile_name}\n"
            exit 0
            exit 0
            ;;
        -p | --install_path)
            printf "Using $2 as the base directory for installation...\n"
            installPath=$2
            shift 2
            ;;
        -v | --virtualenv)
            printf "Virtual environment will be created under $2...\n"
            venv=$2
            shift 2
            ;;
        -b | --branch)
            printf "Using branch $2...\n"
            branch=$2
            shift 2
            ;;
        -c | --commit_id)
            printf "Using commit $2...\n"
            commit=$2
            shift 2
            ;;
        -n | --name)
            printf "Using profile name $2...\n"
            profile_name=$2
            shift 2
            ;;
        -*|--*) # Unrecognized option
            printf "WARN: Unknown option (ignored): $1\n" >&2
            shift
            ;;
        *)  # no more options. Stop while loop
            break
            ;;
    esac
done

# Make sure that the necessary dependencies for installing the notebook in a virtualenv are available
dependency_commands="python virtualenv git"

# Exit if we are missing a dependency
for dcommand in $dependency_commands; do
  if ! hash "$dcommand" >/dev/null 2>&1; then
    printf "Command not found in PATH: %s\n" "$dcommand\n" >&2
    exit 1
  fi
done


printf "Creating virtual environment $venv...\n"
virtualenv --python=$PYTHON --system-site-packages $installPath/$venv

printf "Pulling ipython branch $branch from github...\n"
git clone --recursive https://github.com/ipython/ipython.git -b $branch

# Move into the ipython git directory to run the install
cd ipython

if [ -n "$commit" ]; then
    printf "Pulling commit $commit...\n"
    git checkout $commit
fi

printf "Installing ipython into the virtual environment $venv...\n"
source $installPath/$venv/bin/activate
$PYTHON setup.py install
cd ..

# Delete "security" directory that is generated IPython at runtime, it can
# cause odd permission issues in runtime container
rm -rf "$( cd $(dirname ${BASH_SOURCE[0]}) && pwd)/src/notebook/ipython_profiles/profile_narrative/security"

#printf "Installing 'biokbase' package into the virtual environment $venv... \n"
#cd src/biokbase
#$PYTHON setup.py install
#cd ../..
cp -R "$( cd $(dirname ${BASH_SOURCE[0]}) && pwd)/src/biokbase" $installPath/$venv/lib/${PYTHON}/site-packages/

printf "Creating start script for ipython notebook...\n"

printf 'source %s/bin/activate
export NARRATIVEDIR=%s
export IPYTHONDIR=$NARRATIVEDIR/notebook/ipython_profiles

cp $NARRATIVEDIR/config.json $IPYTHONDIR/profile_narrative/kbase_templates/static/kbase/
python $NARRATIVEDIR/biokbase/narrative/common/service_root.py -f $IPYTHONDIR/profile_narrative/kbase_templates/static/kbase/services.json

ipython $* --NotebookManager.notebook_dir=~/.narrative --profile=%s
' "$installPath/$venv" "$( cd $(dirname ${BASH_SOURCE[0]}) && pwd)/src" "$profile_name" &> $installPath/$venv/bin/run_notebook.sh

chmod +x $installPath/$venv/bin/run_notebook.sh

printf "Creating start script for KBase narrative running behind reverse proxy server"

printf '#!/bin/bash
source %s/bin/activate
export NARRATIVEDIR=%s
export HOME=/tmp
export MPLCONFIGDIR=/tmp
export IPYTHONDIR=$NARRATIVEDIR/notebook/ipython_profiles

cp $NARRATIVEDIR/config.json $IPYTHONDIR/profile_narrative/kbase_templates/static/kbase
python $NARRATIVEDIR/biokbase/narrative/common/service_root.py -f $IPYTHONDIR/profile_narrative/kbase_templates/static/kbase/services.json

ipython notebook --profile=narrative --NotebookApp.base_project_url="/narrative" --NotebookApp.base_kernel_url="/narrative" --NotebookApp.open_browser="False" --ip="*"
' "$installPath/$venv" "$( cd $(dirname ${BASH_SOURCE[0]}) && pwd)/src" &> $installPath/$venv/bin/run_magellan_narrative.sh

chmod +x $installPath/$venv/bin/run_magellan_narrative.sh

printf "Cleaning up after install.sh script...\n"
rm -rf ipython

printf "Done.\n"
