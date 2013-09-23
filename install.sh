#!/usr/bin/env bash

installPath=`pwd`
venv="narrative-venv"
branch="1.x"
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
git clone https://github.com/ipython/ipython.git -b $branch
# pull this fork until an issue is resolved
#git clone https://github.com/mlhenderson/ipython.git

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

#printf "Installing 'biokbase' package into the virtual environment $venv... \n"
#cd src/biokbase
#$PYTHON setup.py install
#cd ../..
cp -R "$( cd $(dirname ${BASH_SOURCE[0]}) && pwd)/src/biokbase" $installPath/$venv/lib/${PYTHON}/site-packages/

printf "Creating start script for ipython notebook...\n"

printf 'source %s/bin/activate
export NARRATIVEDIR=%s
export IPYTHONDIR=$NARRATIVEDIR/notebook/ipython_profiles

ipython $* --NotebookManager.notebook_dir=~/.narrative --profile=%s
' "$installPath/$venv" "$( cd $(dirname ${BASH_SOURCE[0]}) && pwd)/src" "$profile_name" &> $installPath/$venv/bin/run_notebook.sh

chmod +x $installPath/$venv/bin/run_notebook.sh

printf "Creating start script for KBase narrative running behind reverse proxy server"

printf '#!/bin/bash
source %s/bin/activate
export NARRATIVEDIR=%s
export IPYTHONDIR=$NARRATIVEDIR/notebook/ipython_profiles

ipython notebook --NotebookManager.notebook_dir=~/.narrative --profile=narrative_mongo --NotebookApp.base_project_url="/narrative/$1" --NotebookApp.base_kernel_url="/narrative/$1" --NotebookApp.password="sha1:89e8b3c3b94f:34c04b4f82d4f5442094cbf73204333176be148a" --NotebookApp.open_browser="False" --ip="*"
' "$installPath/$venv" "$( cd $(dirname ${BASH_SOURCE[0]}) && pwd)/src" &> $installPath/$venv/bin/run_magellan_narrative.sh

chmod +x $installPath/$venv/bin/run_magellan_narrative.sh

printf "Cleaning up after install.sh script...\n"
rm -rf ipython

printf "Done.\n"
